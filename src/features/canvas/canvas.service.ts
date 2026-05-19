import crypto from "crypto";
import { Request } from "express";
import { Profile } from "../profile/profile.model";
import { User } from "../../models/user.model";
import { Service } from "../services/services.model";
import { Project } from "../projects/projects.model";
import { Link } from "../links/links.model";
import { Story } from "../stories/stories.model";
import { Contact } from "../contacts/contacts.model";
import { Resume } from "../resume/resume.model";
import { ProfileView } from "../analytics/profileView.model";
import { ApiError } from "../../lib/apiError";
import type { ViewSource } from "../analytics/profileView.model";

function viewerKey(req: Request): string {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

async function logView(
  profileId: string,
  req: Request,
  source: ViewSource = "direct",
) {
  const viewerId = req.user ? String(req.user._id) : null;
  const key = viewerKey(req);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await ProfileView.findOne({
    profileId,
    viewerKey: key,
    createdAt: { $gte: since },
  });

  if (!recent) {
    await ProfileView.create({ profileId, viewerId, viewerKey: key, source });
    await Profile.findByIdAndUpdate(profileId, { $inc: { viewCount: 1 } });
  }
}

export async function getCanvas(username: string, req: Request) {
  const profile = await Profile.findOne({ username: username.toLowerCase() }).lean();
  if (!profile) throw new ApiError(404, "Canvas not found");

  const user = await User.findById(profile.userId).lean();
  if (!user || user.isSuspended || user.role === "admin" || !profile.isPublic) {
    throw new ApiError(404, "Canvas not found");
  }

  // Fetch all sections in parallel
  const [services, projects, links, stories, contacts, resume] =
    await Promise.all([
      Service.find({ profileId: profile._id }).sort({ order: 1 }).lean(),
      Project.find({ profileId: profile._id, isPublished: true })
        .sort({ order: 1 })
        .select("slug title tagline coverUrl techStack order")
        .lean(),
      Link.find({ profileId: profile._id, isActive: true })
        .sort({ order: 1 })
        .lean(),
      Story.find({ profileId: profile._id, isPublished: true })
        .sort({ publishedAt: -1 })
        .select("slug title excerpt coverUrl publishedAt readingTimeMinutes")
        .lean(),
      Contact.find({ profileId: profile._id }).sort({ order: 1 }).lean(),
      Resume.findOne({ profileId: profile._id })
        .select("fileUrl fileName")
        .lean(),
    ]);

  await logView(String(profile._id), req);

  return {
    profile: {
      _id: String(profile._id),
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      department: profile.department,
      year: profile.year,
      isVerified: user.studentEmailVerifiedAt != null,
      isFeatured: !!profile.isFeatured,
      accentColor: profile.accentColor,
      completenessScore: profile.completenessScore,
      viewCount: profile.viewCount,
      canvasLayout: profile.canvasLayout,
    },
    services,
    projects,
    links,
    stories,
    resume: resume ?? null,
    contacts,
  };
}

export async function getProject(username: string, slug: string, req: Request) {
  const profile = await Profile.findOne({ username: username.toLowerCase() }).lean();
  if (!profile) throw new ApiError(404, "Not found");

  const user = await User.findById(profile.userId).lean();
  if (!user || user.isSuspended || user.role === "admin" || !profile.isPublic) throw new ApiError(404, "Not found");

  const project = await Project.findOne({
    profileId: profile._id,
    slug,
    isPublished: true,
  }).lean();

  if (!project) throw new ApiError(404, "Project not found");

  await logView(String(profile._id), req, "direct");

  return { profile: { username: profile.username, fullName: profile.fullName }, project };
}

export async function getStory(username: string, slug: string, req: Request) {
  const profile = await Profile.findOne({ username: username.toLowerCase() }).lean();
  if (!profile) throw new ApiError(404, "Not found");

  const user = await User.findById(profile.userId).lean();
  if (!user || user.isSuspended || user.role === "admin" || !profile.isPublic) throw new ApiError(404, "Not found");

  const story = await Story.findOne({
    profileId: profile._id,
    slug,
    isPublished: true,
  }).lean();

  if (!story) throw new ApiError(404, "Story not found");

  await Promise.all([
    Story.findByIdAndUpdate(story._id, { $inc: { viewCount: 1 } }),
    logView(String(profile._id), req, "direct"),
  ]);

  return { profile: { username: profile.username, fullName: profile.fullName }, story };
}
