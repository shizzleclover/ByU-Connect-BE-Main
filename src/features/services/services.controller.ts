import { Request, Response } from "express";
import { Profile } from "../profile/profile.model";
import * as servicesService from "./services.service";
import { ApiError } from "../../lib/apiError";

async function getProfileId(userId: string): Promise<string> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) throw new ApiError(404, "Profile not found");
  return String(profile._id);
}

export const getServices = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const services = await servicesService.getServices(profileId);
  res.status(200).json({ success: true, data: services });
};

export const createService = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const service = await servicesService.createService(profileId, req.body);
  res.status(201).json({ success: true, data: service });
};

export const updateService = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const service = await servicesService.updateService(String(req.params["id"]), profileId, req.body);
  res.status(200).json({ success: true, data: service });
};

export const reorderServices = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await servicesService.reorderServices(profileId, req.body.orderedIds);
  res.status(200).json({ success: true, data: null });
};

export const deleteService = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await servicesService.deleteService(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: null });
};
