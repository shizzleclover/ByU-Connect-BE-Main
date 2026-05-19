import { Router } from "express";
import * as analyticsController from "./analytics.controller";
import { optionalAuth, requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../../middleware/validate.middleware";

const viewSchema = z.object({
  body: z.object({
    profileId: z.string().min(1),
    source: z
      .enum(["direct", "discover", "category", "search", "shared", "featured"])
      .optional(),
  }),
});

const outreachSchema = z.object({
  body: z.object({
    profileId: z.string().min(1),
    contactType: z.string().min(1),
  }),
});

/**
 * @swagger
 * /analytics/view:
 *   post:
 *     summary: Log a canvas profile view
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profileId]
 *             properties:
 *               profileId: { type: string }
 *               source:
 *                 type: string
 *                 enum: [direct, discover, category, search, shared, featured]
 *     responses:
 *       200:
 *         description: View logged (deduped per visitor per day)
 *
 * /analytics/outreach:
 *   post:
 *     summary: Log an outreach click (contact button tap on canvas)
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profileId, contactType]
 *             properties:
 *               profileId: { type: string }
 *               contactType:
 *                 type: string
 *                 description: "e.g. whatsapp, email, instagram"
 *     responses:
 *       200:
 *         description: Outreach click logged
 *
 * /analytics/me/overview:
 *   get:
 *     summary: Get the authenticated user's analytics summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ totalViews, viewsLast30d, outreachClicksLast30d, topSources }"
 */
export const analyticsRouter = Router();

analyticsRouter.post("/view", optionalAuth, validate(viewSchema), asyncHandler(analyticsController.logView));
analyticsRouter.post("/outreach", optionalAuth, validate(outreachSchema), asyncHandler(analyticsController.logOutreach));
analyticsRouter.get("/me/overview", requireAuth, asyncHandler(analyticsController.getOverview));
