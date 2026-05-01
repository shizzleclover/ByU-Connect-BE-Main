import { Request, Response } from "express";
import { Profile } from "../profile/profile.model";
import { Project } from "../projects/projects.model";
import { Story } from "../stories/stories.model";
import { User } from "../../models/user.model";
import { ApiError } from "../../lib/apiError";
import type { ReportStatus } from "../moderation/report.model";

// OG image generation requires a rendering library (e.g. @vercel/og / satori + sharp).
// These routes return JSON metadata that a separate OG service or the frontend can use.
// Swap the JSON response with actual PNG generation once a renderer is set up.

export const canvasOg = async (req: Request, res: Response) => {
  const username = String(req.params["username"]).replace(/\.png$/, "");

  const profile = await Profile.findOne({ username }).lean();
  if (!profile) throw new ApiError(404, "Not found");

  const user = await User.findById(profile.userId).lean();
  if (!user || user.isSuspended || !profile.isPublic) throw new ApiError(404, "Not found");

  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).json({
    title: profile.fullName,
    description: profile.bio ?? "",
    image: profile.avatarUrl ?? "",
    url: `https://byu-connect.com/${profile.username}`,
  });
};

export const projectOg = async (req: Request, res: Response) => {
  const username = String(req.params["username"]);
  const slug = String(req.params["slug"]).replace(/\.png$/, "");

  const profile = await Profile.findOne({ username }).lean();
  if (!profile) throw new ApiError(404, "Not found");

  const project = await Project.findOne({ profileId: profile._id, slug, isPublished: true }).lean();
  if (!project) throw new ApiError(404, "Not found");

  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).json({
    title: project.title,
    description: project.tagline ?? "",
    image: project.coverUrl ?? "",
    url: `https://byu-connect.com/${username}/projects/${slug}`,
  });
};

export const storyOg = async (req: Request, res: Response) => {
  const username = String(req.params["username"]);
  const slug = String(req.params["slug"]).replace(/\.png$/, "");

  const profile = await Profile.findOne({ username }).lean();
  if (!profile) throw new ApiError(404, "Not found");

  const story = await Story.findOne({ profileId: profile._id, slug, isPublished: true }).lean();
  if (!story) throw new ApiError(404, "Not found");

  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).json({
    title: story.title,
    description: story.excerpt ?? "",
    image: story.coverUrl ?? "",
    author: profile.fullName,
    readingTimeMinutes: story.readingTimeMinutes,
    url: `https://byu-connect.com/${username}/stories/${slug}`,
  });
};
