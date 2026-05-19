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

/**
 * @swagger
 * /upload/sign:
 *   post:
 *     summary: Get a signed Cloudinary upload signature
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns a short-lived signature for a direct client → Cloudinary upload.
 *       After getting the signature, POST the file directly to Cloudinary using the
 *       returned `cloudName`, `apiKey`, `timestamp`, and `signature`.
 *       Do **not** send the file to the backend.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [cover, gallery, avatar, story]
 *                 description: Upload context — determines the Cloudinary folder and transformations
 *               resourceId:
 *                 type: string
 *                 description: Optional project/story _id to scope the upload folder
 *     responses:
 *       200:
 *         description: Signed upload params
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cloudName: { type: string }
 *                 apiKey: { type: string }
 *                 timestamp: { type: number }
 *                 signature: { type: string }
 *                 folder: { type: string }
 *                 eager: { type: string }
 */
export const uploadRouter = Router();

uploadRouter.post("/sign", requireAuth, validate(signSchema), asyncHandler(uploadController.signUpload));
