import { Router } from "express";
import * as canvasController from "./canvas.controller";
import { optionalAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";

/**
 * @swagger
 * /canvas/{username}:
 *   get:
 *     summary: Get a student's public canvas
 *     tags: [Canvas]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Canvas object — profile, sections in configured order, services, projects, links, stories, contacts, resume
 *       404:
 *         description: Profile not found or not public
 *
 * /canvas/{username}/projects/{slug}:
 *   get:
 *     summary: Get a single published project by slug (public canvas view)
 *     tags: [Canvas]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project object with gallery and external links
 *       404:
 *         description: Project not found or not published
 *
 * /canvas/{username}/stories/{slug}:
 *   get:
 *     summary: Get a single published story by slug (public canvas view)
 *     tags: [Canvas]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Story object with rendered body
 *       404:
 *         description: Story not found or not published
 */
export const canvasRouter = Router();

canvasRouter.use(optionalAuth);

canvasRouter.get("/:username", asyncHandler(canvasController.getCanvas));
canvasRouter.get("/:username/projects/:slug", asyncHandler(canvasController.getProject));
canvasRouter.get("/:username/stories/:slug", asyncHandler(canvasController.getStory));
