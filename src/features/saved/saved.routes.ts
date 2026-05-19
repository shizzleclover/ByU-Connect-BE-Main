import { Router } from "express";
import * as savedController from "./saved.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../../middleware/validate.middleware";

const saveSchema = z.object({
  body: z.object({ profileId: z.string().min(1) }),
});

/**
 * @swagger
 * /saved:
 *   get:
 *     summary: List profiles saved by the authenticated user
 *     tags: [Saved]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of saved profiles (username, fullName, avatarUrl, department)
 *   post:
 *     summary: Save a profile
 *     tags: [Saved]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profileId]
 *             properties:
 *               profileId: { type: string }
 *     responses:
 *       201:
 *         description: Profile saved
 *       409:
 *         description: Already saved
 *
 * /saved/{profileId}:
 *   delete:
 *     summary: Unsave a profile
 *     tags: [Saved]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed from saved
 */
export const savedRouter = Router();

savedRouter.use(requireAuth);

savedRouter.get("/", asyncHandler(savedController.getSaved));
savedRouter.post("/", validate(saveSchema), asyncHandler(savedController.saveProfile));
savedRouter.delete("/:profileId", asyncHandler(savedController.unsaveProfile));
