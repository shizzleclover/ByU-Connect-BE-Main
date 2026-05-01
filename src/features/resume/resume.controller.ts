import { Request, Response } from "express";
import multer from "multer";
import { Profile } from "../profile/profile.model";
import * as resumeService from "./resume.service";
import { ApiError } from "../../lib/apiError";

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("resume");

export const resumeUploadMiddleware = (req: Request, res: Response, next: Function) => {
  resumeUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) return next(new ApiError(400, "Resume must be under 5 MB"));
    if (err) return next(err);
    next();
  });
};

async function getProfileId(userId: string): Promise<string> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) throw new ApiError(404, "Profile not found");
  return String(profile._id);
}

export const getResume = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const resume = await resumeService.getResume(profileId);
  res.status(200).json({ success: true, data: resume });
};

export const uploadResume = async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No resume file provided");
  const profileId = await getProfileId(String(req.user!._id));

  const resume = await resumeService.uploadResume(
    profileId,
    String(req.user!._id),
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
  );

  res.status(200).json({ success: true, data: resume });
};

export const deleteResume = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await resumeService.deleteResume(profileId);
  res.status(200).json({ success: true, data: null });
};
