import { Contact } from "./contacts.model";
import { ApiError } from "../../lib/apiError";
import { normalizeContact } from "../../lib/contactNormalizer";
import { recomputeCompleteness } from "../../lib/completeness";

const CONTACT_LIMIT = 8;

export async function getContacts(profileId: string) {
  return Contact.find({ profileId }).sort({ order: 1 }).lean();
}

export async function createContact(
  profileId: string,
  data: { type: string; value: string; label?: string | null; isPrimary?: boolean },
) {
  const count = await Contact.countDocuments({ profileId });
  if (count >= CONTACT_LIMIT) throw new ApiError(400, `Maximum ${CONTACT_LIMIT} contact methods allowed`);

  const normalizedValue = normalizeContact(data.type, data.value);

  if (data.isPrimary) {
    await Contact.updateMany({ profileId }, { isPrimary: false });
  } else if (count === 0) {
    data.isPrimary = true;
  }

  const contact = await Contact.create({
    profileId,
    order: count,
    ...data,
    value: normalizedValue,
  } as Parameters<typeof Contact.create>[0]);

  await recomputeCompleteness(profileId);
  return contact;
}

export async function updateContact(
  contactId: string,
  profileId: string,
  data: Partial<{ value: string; label: string | null; isPrimary: boolean }>,
  type: string,
) {
  const contact = await Contact.findOne({ _id: contactId, profileId });
  if (!contact) throw new ApiError(404, "Contact not found");

  if (data.value !== undefined) {
    data.value = normalizeContact(type, data.value);
  }

  if (data.isPrimary) {
    await Contact.updateMany({ profileId }, { isPrimary: false });
  }

  Object.assign(contact, data);
  await contact.save();
  return contact;
}

export async function setPrimary(contactId: string, profileId: string) {
  const contact = await Contact.findOne({ _id: contactId, profileId });
  if (!contact) throw new ApiError(404, "Contact not found");

  await Contact.updateMany({ profileId }, { isPrimary: false });
  contact.isPrimary = true;
  await contact.save();
  return contact;
}

export async function reorderContacts(profileId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, i) => Contact.findOneAndUpdate({ _id: id, profileId }, { order: i })),
  );
}

export async function deleteContact(contactId: string, profileId: string) {
  const contact = await Contact.findOneAndDelete({ _id: contactId, profileId });
  if (!contact) throw new ApiError(404, "Contact not found");

  // If deleted was primary, promote the first remaining contact
  if (contact.isPrimary) {
    const first = await Contact.findOne({ profileId }).sort({ order: 1 });
    if (first) await Contact.findByIdAndUpdate(first._id, { isPrimary: true });
  }

  const remaining = await Contact.find({ profileId }).sort({ order: 1 });
  await Promise.all(remaining.map((c, i) => Contact.findByIdAndUpdate(c._id, { order: i })));

  await recomputeCompleteness(profileId);
}
