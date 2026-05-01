import { Request, Response } from "express";
import multer from "multer";
import { Profile } from "./profile.model";
import * as profileService from "./profile.service";
import { ApiError } from "../../lib/apiError";
import { recomputeCompleteness } from "../../lib/completeness";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single("avatar");

export const uploadMiddleware = (req: Request, res: Response, next: Function) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "Avatar must be under 2 MB"));
    }
    if (err) return next(err);
    next();
  });
};

export const getMe = async (req: Request, res: Response) => {
  const profile = await Profile.findOne({ userId: req.user!._id }).lean();
  if (!profile) throw new ApiError(404, "Profile not found");

  res.status(200).json({ success: true, data: profile });
};

export const updateMe = async (req: Request, res: Response) => {
  const { fullName, bio, department, year, isPublic, accentColor } = req.body;

  const update: Record<string, unknown> = {};
  if (fullName !== undefined) update.fullName = fullName;
  if (bio !== undefined) update.bio = bio;
  if (department !== undefined) update.department = department;
  if (year !== undefined) update.year = year;
  if (isPublic !== undefined) update.isPublic = isPublic;
  if (accentColor !== undefined) update.accentColor = accentColor;

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user!._id },
    update,
    { new: true },
  ).lean();

  if (!profile) throw new ApiError(404, "Profile not found");

  await recomputeCompleteness(String(profile._id));

  res.status(200).json({ success: true, data: profile });
};

export const updateUsername = async (req: Request, res: Response) => {
  const { username } = req.body;

  const existing = await Profile.findOne({ username });
  if (existing && String(existing.userId) !== String(req.user!._id)) {
    throw new ApiError(409, "Username already taken");
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user!._id },
    { username },
    { new: true },
  ).lean();

  res.status(200).json({ success: true, data: profile });
};

export const updateCanvasLayout = async (req: Request, res: Response) => {
  const { canvasLayout } = req.body;

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user!._id },
    { canvasLayout },
    { new: true },
  ).lean();

  if (!profile) throw new ApiError(404, "Profile not found");

  res.status(200).json({ success: true, data: profile });
};

export const uploadAvatar = async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No avatar file provided");

  const profile = await Profile.findOne({ userId: req.user!._id });
  if (!profile) throw new ApiError(404, "Profile not found");

  const result = await profileService.uploadAvatar(
    String(profile._id),
    String(req.user!._id),
    req.file.buffer,
    req.file.mimetype,
  );

  res.status(200).json({ success: true, data: result });
};

export const deleteAvatar = async (req: Request, res: Response) => {
  const profile = await Profile.findOne({ userId: req.user!._id });
  if (!profile) throw new ApiError(404, "Profile not found");

  await profileService.deleteAvatar(String(profile._id));

  res.status(200).json({ success: true, data: null });
};

export const checkUsername = async (req: Request, res: Response) => {
  const u = ((req.query.username ?? req.query.u) as string)?.toLowerCase().trim();
  if (!u) throw new ApiError(400, "Query param 'username' is required");

  const taken = await Profile.exists({ username: u });

  res.status(200).json({
    success: true,
    data: { available: !taken },
  });
};
