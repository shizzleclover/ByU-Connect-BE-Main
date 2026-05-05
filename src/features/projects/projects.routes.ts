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

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List the authenticated user's projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of Project objects
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Created project
 *
 * /projects/reorder:
 *   patch:
 *     summary: Reorder projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *
 * /projects/{id}:
 *   get:
 *     summary: Get a single project (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project object
 *   patch:
 *     summary: Update project fields
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated project
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *
 * /projects/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isPublished]
 *             properties:
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated project
 *
 * /projects/{id}/cover:
 *   patch:
 *     summary: Upload project cover image (multipart/form-data, field "cover")
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *
 * /projects/{id}/gallery:
 *   post:
 *     summary: Add gallery items (array of { url, publicId })
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *
 * /projects/{id}/gallery/{itemId}:
 *   delete:
 *     summary: Remove a gallery item
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
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
