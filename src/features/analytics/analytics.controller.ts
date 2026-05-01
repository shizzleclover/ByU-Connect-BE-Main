import { Request, Response } from "express";
import crypto from "crypto";
import { ProfileView } from "./profileView.model";
import { OutreachClick } from "./outreachClick.model";
import { Profile } from "../profile/profile.model";
import { Story } from "../stories/stories.model";
import { Project } from "../projects/projects.model";
import { ApiError } from "../../lib/apiError";

function viewerKey(req: Request): string {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export const logView = async (req: Request, res: Response) => {
  const { profileId, source } = req.body;

  const profile = await Profile.findById(profileId).lean();
  if (!profile) throw new ApiError(404, "Profile not found");

  const viewerId = req.user ? String(req.user._id) : null;
  const key = viewerKey(req);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await ProfileView.findOne({
    profileId,
    viewerKey: key,
    createdAt: { $gte: since },
  });

  if (!recent) {
    await ProfileView.create({ profileId, viewerId, viewerKey: key, source: source ?? "direct" });
    await Profile.findByIdAndUpdate(profileId, { $inc: { viewCount: 1 } });
  }

  res.status(200).json({ success: true, data: null });
};

export const logOutreach = async (req: Request, res: Response) => {
  const { profileId, contactType } = req.body;

  await OutreachClick.create({
    profileId,
    contactType,
    viewerId: req.user?._id ?? null,
  });

  res.status(200).json({ success: true, data: null });
};

export const getOverview = async (req: Request, res: Response) => {
  const profile = await Profile.findOne({ userId: req.user!._id }).lean();
  if (!profile) throw new ApiError(404, "Profile not found");

  const profileId = profile._id;
  const now = new Date();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    viewsLast7d,
    viewsLast30d,
    outreachLast30d,
    outreachBreakdown,
    topStories,
    topProjects,
  ] = await Promise.all([
    ProfileView.countDocuments({ profileId, createdAt: { $gte: ago7d } }),
    ProfileView.countDocuments({ profileId, createdAt: { $gte: ago30d } }),
    OutreachClick.countDocuments({ profileId, createdAt: { $gte: ago30d } }),
    OutreachClick.aggregate([
      { $match: { profileId, createdAt: { $gte: ago30d } } },
      { $group: { _id: "$contactType", count: { $sum: 1 } } },
    ]),
    Story.find({ profileId, isPublished: true })
      .sort({ viewCount: -1 })
      .limit(5)
      .select("title slug viewCount publishedAt")
      .lean(),
    Project.find({ profileId, isPublished: true })
      .sort({ order: 1 })
      .limit(5)
      .select("title slug coverUrl")
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalViews: profile.viewCount,
      viewsLast7d,
      viewsLast30d,
      outreachClicksLast30d: outreachLast30d,
      outreachBreakdown: outreachBreakdown.map((b) => ({
        type: b._id,
        count: b.count,
      })),
      topStories,
      topProjects,
    },
  });
};
