import { Request, Response } from "express";
import { Profile } from "../profile/profile.model";
import * as linksService from "./links.service";
import { ApiError } from "../../lib/apiError";

async function getProfileId(userId: string): Promise<string> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) throw new ApiError(404, "Profile not found");
  return String(profile._id);
}

export const getLinks = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const links = await linksService.getLinks(profileId);
  res.status(200).json({ success: true, data: links });
};

export const createLink = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const link = await linksService.createLink(profileId, req.body);
  res.status(201).json({ success: true, data: link });
};

export const updateLink = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const link = await linksService.updateLink(String(req.params["id"]), profileId, req.body);
  res.status(200).json({ success: true, data: link });
};

export const toggleLink = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const link = await linksService.toggleLink(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: link });
};

export const reorderLinks = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await linksService.reorderLinks(profileId, req.body.orderedIds);
  res.status(200).json({ success: true, data: null });
};

export const deleteLink = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await linksService.deleteLink(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: null });
};
