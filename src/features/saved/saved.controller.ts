import { Request, Response } from "express";
import { SavedProfile } from "./saved.model";
import { Profile } from "../profile/profile.model";
import { ApiError } from "../../lib/apiError";

export const getSaved = async (req: Request, res: Response) => {
  const saved = await SavedProfile.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .populate("profileId", "username fullName avatarUrl bio department serviceCategories")
    .lean();
  res.status(200).json({ success: true, data: saved });
};

export const saveProfile = async (req: Request, res: Response) => {
  const { profileId } = req.body;

  const profile = await Profile.findById(profileId).lean();
  if (!profile) throw new ApiError(404, "Profile not found");

  await SavedProfile.findOneAndUpdate(
    { userId: req.user!._id, profileId },
    {},
    { upsert: true, new: true },
  );

  res.status(200).json({ success: true, data: null });
};

export const unsaveProfile = async (req: Request, res: Response) => {
  await SavedProfile.findOneAndDelete({
    userId: req.user!._id,
    profileId: req.params.profileId,
  });
  res.status(200).json({ success: true, data: null });
};
