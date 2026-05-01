import { Router } from "express";
import * as resumeController from "./resume.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";

export const resumeRouter = Router();

resumeRouter.use(requireAuth);

resumeRouter.get("/", asyncHandler(resumeController.getResume));
resumeRouter.post(
  "/",
  resumeController.resumeUploadMiddleware,
  asyncHandler(resumeController.uploadResume),
);
resumeRouter.delete("/", asyncHandler(resumeController.deleteResume));
