import { Request, Response } from "express";
import { Report, ReportStatus } from "../moderation/report.model";
import { Profile } from "../profile/profile.model";
import { User } from "../../models/user.model";
import { ApiError } from "../../lib/apiError";

// ── Reports ──────────────────────────────────────────────────────────────────

export const getReports = async (req: Request, res: Response) => {
  const status = ((req.query.status as string) ?? "pending") as ReportStatus;
  const reports = await Report.find({ status })
    .sort({ createdAt: -1 })
    .populate("reporterId", "email")
    .populate("targetProfileId", "username fullName")
    .lean();
  res.status(200).json({ success: true, data: reports });
};

export const reviewReport = async (req: Request, res: Response) => {
  const { status, adminNote } = req.body;

  const report = await Report.findByIdAndUpdate(
    String(req.params["id"]),
    {
      status,
      adminNote: adminNote ?? null,
      reviewedBy: req.user!._id,
      reviewedAt: new Date(),
    },
    { new: true },
  );

  if (!report) throw new ApiError(404, "Report not found");
  res.status(200).json({ success: true, data: report });
};

// ── Featured ─────────────────────────────────────────────────────────────────

export const getFeaturedList = async (req: Request, res: Response) => {
  const profiles = await Profile.find({ isFeatured: true })
    .sort({ featuredOrder: 1 })
    .select("username fullName avatarUrl featuredOrder")
    .lean();
  res.status(200).json({ success: true, data: profiles });
};

export const addFeatured = async (req: Request, res: Response) => {
  const { profileId, order } = req.body;

  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { isFeatured: true, featuredAt: new Date(), featuredOrder: order ?? 0 },
    { new: true },
  );

  if (!profile) throw new ApiError(404, "Profile not found");
  res.status(200).json({ success: true, data: { profile } });
};

export const removeFeatured = async (req: Request, res: Response) => {
  await Profile.findByIdAndUpdate(String(req.params["profileId"]), {
    isFeatured: false,
    featuredAt: null,
    featuredOrder: null,
  });
  res.status(200).json({ success: true, data: null });
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUsers = async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const filter = q ? { email: { $regex: q, $options: "i" } } : {};
  const users = await User.find(filter)
    .select("-passwordHash -refreshTokenHash")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.status(200).json({ success: true, data: users });
};

export const suspendUser = async (req: Request, res: Response) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(
    String(req.params["id"]),
    { isSuspended: true, suspendedReason: reason ?? null },
    { new: true },
  ).select("-passwordHash -refreshTokenHash");

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, data: user });
};

export const unsuspendUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    String(req.params["id"]),
    { isSuspended: false, suspendedReason: null },
    { new: true },
  ).select("-passwordHash -refreshTokenHash");

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, data: user });
};
