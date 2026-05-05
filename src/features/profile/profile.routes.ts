import { Router } from "express";
import * as profileController from "./profile.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import {
  updateProfileSchema,
  updateUsernameSchema,
  updateLayoutSchema,
} from "./profile.schemas";

/**
 * @swagger
 * /profile/check-username:
 *   get:
 *     summary: Check if a username is available
 *     tags: [Profile]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "{ available: boolean }"
 *
 * /profile/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile object
 *   patch:
 *     summary: Update profile fields (bio, department, year, accentColor, isPublic)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               bio: { type: string, maxLength: 280 }
 *               department: { type: string }
 *               year: { type: string }
 *               accentColor: { type: string }
 *               isPublic: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated profile
 *
 * /profile/me/username:
 *   patch:
 *     summary: Change username (rate-limited to once per 7 days)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               username: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 *       409:
 *         description: Username taken
 *
 * /profile/me/canvas-layout:
 *   patch:
 *     summary: Reorder canvas sections
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [layout]
 *             properties:
 *               layout:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [services, projects, links, stories, resume]
 *     responses:
 *       200:
 *         description: Updated profile
 *
 * /profile/me/avatar:
 *   post:
 *     summary: Upload avatar (multipart/form-data, field "avatar")
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated profile with new avatarUrl
 *   delete:
 *     summary: Delete avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed
 */
export const profileRouter = Router();

profileRouter.get("/check-username", asyncHandler(profileController.checkUsername));

profileRouter.use(requireAuth);

profileRouter.get("/me", asyncHandler(profileController.getMe));
profileRouter.patch("/me", validate(updateProfileSchema), asyncHandler(profileController.updateMe));
profileRouter.patch(
  "/me/username",
  rateLimits.usernameChange,
  validate(updateUsernameSchema),
  asyncHandler(profileController.updateUsername),
);
profileRouter.patch(
  "/me/canvas-layout",
  validate(updateLayoutSchema),
  asyncHandler(profileController.updateCanvasLayout),
);
profileRouter.post(
  "/me/avatar",
  profileController.uploadMiddleware,
  asyncHandler(profileController.uploadAvatar),
);
profileRouter.delete("/me/avatar", asyncHandler(profileController.deleteAvatar));
