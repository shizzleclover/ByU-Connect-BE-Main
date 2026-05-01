import { Request, Response } from "express";
import multer from "multer";
import { Profile } from "../profile/profile.model";
import * as projectsService from "./projects.service";
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

export const getProjects = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const projects = await projectsService.getProjects(profileId);
  res.status(200).json({ success: true, data: projects });
};

export const createProject = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.createProject(profileId, req.body);
  res.status(201).json({ success: true, data: project });
};

export const getProject = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.getProjectById(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: project });
};

export const updateProject = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.updateProject(String(req.params["id"]), profileId, req.body);
  res.status(200).json({ success: true, data: project });
};

export const updateSlug = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.updateSlug(String(req.params["id"]), profileId, req.body.slug);
  res.status(200).json({ success: true, data: project });
};

export const uploadCover = async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No cover file provided");
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.uploadCover(
    String(req.params["id"]), profileId, String(req.user!._id),
    req.file.buffer, req.file.mimetype,
  );
  res.status(200).json({ success: true, data: project });
};

export const addGalleryItems = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.addGalleryItems(String(req.params["id"]), profileId, req.body.items);
  res.status(200).json({ success: true, data: project });
};

export const deleteGalleryItem = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await projectsService.deleteGalleryItem(
    String(req.params["id"]), profileId, String(req.params["itemId"]),
  );
  res.status(200).json({ success: true, data: null });
};

export const reorderProjects = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await projectsService.reorderProjects(profileId, req.body.orderedIds);
  res.status(200).json({ success: true, data: null });
};

export const setPublished = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  const project = await projectsService.setPublished(String(req.params["id"]), profileId, req.body.isPublished);
  res.status(200).json({ success: true, data: project });
};

export const deleteProject = async (req: Request, res: Response) => {
  const profileId = await getProfileId(String(req.user!._id));
  await projectsService.deleteProject(String(req.params["id"]), profileId);
  res.status(200).json({ success: true, data: null });
};
