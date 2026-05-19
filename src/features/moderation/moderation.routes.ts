import { Router } from "express";
import * as moderationController from "./moderation.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import { createReportSchema } from "./moderation.schemas";

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Submit a report against a student profile
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetProfileId, reason]
 *             properties:
 *               targetProfileId:
 *                 type: string
 *                 description: Profile _id of the reported user
 *               reason:
 *                 type: string
 *                 description: Short reason for the report
 *               description:
 *                 type: string
 *                 description: Optional longer description
 *     responses:
 *       201:
 *         description: Report submitted — enters pending queue for admin review
 *       429:
 *         description: Rate limited
 */
export const moderationRouter = Router();

moderationRouter.post(
  "/",
  requireAuth,
  rateLimits.report,
  validate(createReportSchema),
  asyncHandler(moderationController.createReport),
);
