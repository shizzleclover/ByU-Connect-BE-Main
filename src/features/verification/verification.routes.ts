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

/**
 * @swagger
 * /verification/student-email/start:
 *   post:
 *     summary: Send OTP to student email address
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentEmail]
 *             properties:
 *               studentEmail:
 *                 type: string
 *                 format: email
 *                 description: Must end with the configured STUDENT_EMAIL_DOMAIN
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Invalid domain
 *
 * /verification/student-email/confirm:
 *   post:
 *     summary: Confirm OTP and earn verified badge
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 length: 6
 *     responses:
 *       200:
 *         description: Verified — studentEmailVerifiedAt is set
 *       400:
 *         description: Invalid or expired code
 */
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
