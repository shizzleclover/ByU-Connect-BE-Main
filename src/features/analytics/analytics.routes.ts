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

export const analyticsRouter = Router();

analyticsRouter.post("/view", optionalAuth, validate(viewSchema), asyncHandler(analyticsController.logView));
analyticsRouter.post("/outreach", optionalAuth, validate(outreachSchema), asyncHandler(analyticsController.logOutreach));
analyticsRouter.get("/me/overview", requireAuth, asyncHandler(analyticsController.getOverview));
