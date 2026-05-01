import { Link } from "./links.model";
import { ApiError } from "../../lib/apiError";
import { recomputeCompleteness } from "../../lib/completeness";

const LINK_LIMIT = 20;

export async function getLinks(profileId: string) {
  return Link.find({ profileId }).sort({ order: 1 }).lean();
}

export async function createLink(
  profileId: string,
  data: { label: string; url: string; iconKey?: string | null; isActive?: boolean },
) {
  const count = await Link.countDocuments({ profileId });
  if (count >= LINK_LIMIT) throw new ApiError(400, `Maximum ${LINK_LIMIT} links allowed`);

  const link = await Link.create({ profileId, order: count, ...data });
  await recomputeCompleteness(profileId);
  return link;
}

export async function updateLink(
  linkId: string,
  profileId: string,
  data: Partial<{ label: string; url: string; iconKey: string | null; isActive: boolean }>,
) {
  const link = await Link.findOneAndUpdate({ _id: linkId, profileId }, data, { new: true });
  if (!link) throw new ApiError(404, "Link not found");
  return link;
}

export async function toggleLink(linkId: string, profileId: string) {
  const link = await Link.findOne({ _id: linkId, profileId });
  if (!link) throw new ApiError(404, "Link not found");
  link.isActive = !link.isActive;
  await link.save();
  return link;
}

export async function reorderLinks(profileId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, i) => Link.findOneAndUpdate({ _id: id, profileId }, { order: i })),
  );
}

export async function deleteLink(linkId: string, profileId: string) {
  const link = await Link.findOneAndDelete({ _id: linkId, profileId });
  if (!link) throw new ApiError(404, "Link not found");

  const remaining = await Link.find({ profileId }).sort({ order: 1 });
  await Promise.all(remaining.map((l, i) => Link.findByIdAndUpdate(l._id, { order: i })));

  await recomputeCompleteness(profileId);
}
