import { Router } from "express";
import * as storiesController from "./stories.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import { createStorySchema, updateStorySchema, publishSchema } from "./stories.schemas";

/**
 * @swagger
 * /stories:
 *   get:
 *     summary: List the authenticated user's stories
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of Story objects
 *   post:
 *     summary: Create a new story
 *     tags: [Stories]
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
 *               body: { type: string, description: Markdown content }
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Created story
 *
 * /stories/{id}:
 *   get:
 *     summary: Get a single story (owner only)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Story object
 *   patch:
 *     summary: Update story fields (title, body, tags, slug)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated story
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
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
 * /stories/{id}/cover:
 *   patch:
 *     summary: Upload story cover image (multipart/form-data, field "cover")
 *     tags: [Stories]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated story with new coverUrl
 *
 * /stories/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish a story
 *     tags: [Stories]
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
 *         description: Updated story
 */
export const storiesRouter = Router();

storiesRouter.use(requireAuth);

storiesRouter.get("/", asyncHandler(storiesController.getStories));
storiesRouter.post("/", rateLimits.createStory, validate(createStorySchema), asyncHandler(storiesController.createStory));
storiesRouter.get("/:id", asyncHandler(storiesController.getStory));
storiesRouter.patch("/:id", validate(updateStorySchema), asyncHandler(storiesController.updateStory));
storiesRouter.patch(
  "/:id/cover",
  storiesController.coverUploadMiddleware,
  asyncHandler(storiesController.uploadCover),
);
storiesRouter.patch("/:id/publish", validate(publishSchema), asyncHandler(storiesController.setPublished));
storiesRouter.delete("/:id", asyncHandler(storiesController.deleteStory));
