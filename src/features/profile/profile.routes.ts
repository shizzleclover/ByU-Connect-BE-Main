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
