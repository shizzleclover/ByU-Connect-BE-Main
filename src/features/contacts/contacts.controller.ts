import { Request, Response } from "express";
import { Profile } from "../profile/profile.model";
import { Contact } from "./contacts.model";
import * as contactsService from "./contacts.service";
import { ApiError } from "../../lib/apiError";

async function getProfileId(userId: string): Promise<string> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) throw new ApiError(404, "Profile not found");
  return String(profile._id);
}

export const getContacts = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const contacts = await contactsService.getContacts(profileId);
  res.status(200).json({ success: true, data: contacts });
};

export const createContact = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const contact = await contactsService.createContact(profileId, req.body);
  res.status(201).json({ success: true, data: contact });
};

export const updateContact = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const contactId = String(req.params["id"]);
  const existing = await Contact.findOne({ _id: contactId, profileId }).lean();
  if (!existing) throw new ApiError(404, "Contact not found");

  const contact = await contactsService.updateContact(contactId, profileId, req.body, existing.type);
  res.status(200).json({ success: true, data: contact });
};

export const setPrimary = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const contact = await contactsService.setPrimary(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: contact });
};

export const reorderContacts = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await contactsService.reorderContacts(profileId, req.body.orderedIds);
  res.status(200).json({ success: true, data: null });
};

export const deleteContact = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await contactsService.deleteContact(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: null });
};
