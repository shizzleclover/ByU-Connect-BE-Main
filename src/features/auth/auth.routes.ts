import { Router } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth.middleware";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas";

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, username, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               username: { type: string }
 *               fullName: { type: string }
 *     responses:
 *       201:
 *         description: User created — verification email sent
 *       409:
 *         description: Email or username already taken
 *
 * /auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Access token + sets httpOnly refresh cookie
 *       401:
 *         description: Invalid credentials
 *
 * /auth/signout:
 *   post:
 *     summary: Sign out (clears refresh cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed out
 *
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using httpOnly cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token
 *       401:
 *         description: Invalid or expired refresh token
 *
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user object
 *
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, length: 6 }
 *     responses:
 *       200:
 *         description: Email verified
 *
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Code resent
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset code sent (always 200 to prevent enumeration)
 *
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, newPassword]
 *             properties:
 *               code: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Invalid or expired code
 */
export const authRouter = Router();

authRouter.post("/signup", rateLimits.signup, validate(signupSchema), asyncHandler(authController.signup));
authRouter.post("/signin", rateLimits.signin, validate(signinSchema), asyncHandler(authController.signin));
authRouter.post("/signout", asyncHandler(authController.signout));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));

authRouter.post("/verify-email", validate(verifyEmailSchema), asyncHandler(authController.verifyEmail));
authRouter.post("/resend-verification", rateLimits.otpSend, validate(resendVerificationSchema), asyncHandler(authController.resendVerification));
authRouter.post("/forgot-password", rateLimits.otpSend, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
authRouter.post("/reset-password", validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
authRouter.delete("/account", requireAuth, asyncHandler(authController.deleteAccount));
