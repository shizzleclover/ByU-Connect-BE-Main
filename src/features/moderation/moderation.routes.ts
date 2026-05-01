import { Router } from "express";
import * as moderationController from "./moderation.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import { createReportSchema } from "./moderation.schemas";

export const moderationRouter = Router();

moderationRouter.post(
  "/",
  requireAuth,
  rateLimits.report,
  validate(createReportSchema),
  asyncHandler(moderationController.createReport),
);
