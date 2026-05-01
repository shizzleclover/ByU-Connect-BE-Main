import { Router } from "express";
import * as projectsController from "./projects.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
  updateSlugSchema,
  addGallerySchema,
  publishSchema,
  reorderSchema,
} from "./projects.schemas";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", asyncHandler(projectsController.getProjects));
projectsRouter.post("/", rateLimits.createProject, validate(createProjectSchema), asyncHandler(projectsController.createProject));
projectsRouter.patch("/reorder", validate(reorderSchema), asyncHandler(projectsController.reorderProjects));
projectsRouter.get("/:id", asyncHandler(projectsController.getProject));
projectsRouter.patch("/:id", validate(updateProjectSchema), asyncHandler(projectsController.updateProject));
projectsRouter.patch("/:id/slug", validate(updateSlugSchema), asyncHandler(projectsController.updateSlug));
projectsRouter.patch(
  "/:id/cover",
  projectsController.coverUploadMiddleware,
  asyncHandler(projectsController.uploadCover),
);
projectsRouter.post("/:id/gallery", validate(addGallerySchema), asyncHandler(projectsController.addGalleryItems));
projectsRouter.delete("/:id/gallery/:itemId", asyncHandler(projectsController.deleteGalleryItem));
projectsRouter.patch("/:id/publish", validate(publishSchema), asyncHandler(projectsController.setPublished));
projectsRouter.delete("/:id", asyncHandler(projectsController.deleteProject));
