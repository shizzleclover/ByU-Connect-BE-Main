import { Router } from "express";
import * as uploadController from "./upload.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../../middleware/validate.middleware";

const signSchema = z.object({
  body: z.object({
    type: z.enum(["cover", "gallery", "avatar", "story"]),
    resourceId: z.string().optional(),
  }),
});

export const uploadRouter = Router();

uploadRouter.post("/sign", requireAuth, validate(signSchema), asyncHandler(uploadController.signUpload));
