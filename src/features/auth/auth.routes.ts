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
