import { Request, Response } from "express";
import { Report } from "./report.model";
import { Profile } from "../profile/profile.model";
import { ApiError } from "../../lib/apiError";

export const createReport = async (req: Request, res: Response) => {
  const { targetProfileId, reason, description } = req.body;

  const profile = await Profile.findById(targetProfileId).lean();
  if (!profile) throw new ApiError(404, "Profile not found");

  // Prevent self-report
  if (String(profile.userId) === String(req.user!._id)) {
    throw new ApiError(400, "You cannot report your own profile");
  }

  const report = await Report.create({
    reporterId: req.user!._id,
    targetProfileId,
    reason,
    description: description ?? null,
  });

  res.status(201).json({ success: true, data: { report } });
};
