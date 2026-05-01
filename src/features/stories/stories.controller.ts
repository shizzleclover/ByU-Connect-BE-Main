import { Request, Response } from "express";
import multer from "multer";
import { Profile } from "../profile/profile.model";
import * as storiesService from "./stories.service";
import { ApiError } from "../../lib/apiError";

const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
}).single("cover");

export const coverUploadMiddleware = (req: Request, res: Response, next: Function) => {
  coverUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) return next(new ApiError(400, "Cover must be under 4 MB"));
    if (err) return next(err);
    next();
  });
};

async function getProfileId(userId: string): Promise<string> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) throw new ApiError(404, "Profile not found");
  return String(profile._id);
}

export const getStories = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const stories = await storiesService.getStories(profileId);
  res.status(200).json({ success: true, data: stories });
};

export const createStory = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const story = await storiesService.createStory(profileId, req.body);
  res.status(201).json({ success: true, data: story });
};

export const getStory = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const story = await storiesService.getStoryById(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: story });
};

export const updateStory = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const story = await storiesService.updateStory(String(req.params["id"]), profileId, req.body);
  res.status(200).json({ success: true, data: story });
};

export const uploadCover = async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No cover file provided");
  const profileId = await getProfileId(String(req.user!._id));
  const story = await storiesService.uploadCover(
    String(req.params["id"]), profileId, String(req.user!._id), req.file.buffer,
  );
  res.status(200).json({ success: true, data: story });
};

export const setPublished = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const story = await storiesService.setPublished(String(req.params["id"]), profileId, req.body.isPublished);
  res.status(200).json({ success: true, data: story });
};

export const deleteStory = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await storiesService.deleteStory(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: null });
};
