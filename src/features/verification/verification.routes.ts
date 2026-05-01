import { Router } from "express";
import * as verificationController from "./verification.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import {
  startStudentVerificationSchema,
  confirmStudentVerificationSchema,
} from "./verification.schemas";

export const verificationRouter = Router();

verificationRouter.use(requireAuth);

verificationRouter.post(
  "/student-email/start",
  rateLimits.otpSend,
  validate(startStudentVerificationSchema),
  asyncHandler(verificationController.startStudentVerification),
);
verificationRouter.post(
  "/student-email/confirm",
  validate(confirmStudentVerificationSchema),
  asyncHandler(verificationController.confirmStudentVerification),
);
