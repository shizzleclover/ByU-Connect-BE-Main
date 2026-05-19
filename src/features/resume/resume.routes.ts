import { Router } from "express";
import * as resumeController from "./resume.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";

/**
 * @swagger
 * /resume:
 *   get:
 *     summary: Get the authenticated user's resume file info
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ url, filename, uploadedAt } or null if no resume"
 *   post:
 *     summary: Upload a resume PDF (multipart/form-data, field "resume")
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: PDF file, max 5 MB
 *     responses:
 *       200:
 *         description: Resume uploaded — returns file URL
 *       400:
 *         description: File too large or wrong type
 *   delete:
 *     summary: Delete the uploaded resume
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resume removed
 */
export const resumeRouter = Router();

resumeRouter.use(requireAuth);

resumeRouter.get("/", asyncHandler(resumeController.getResume));
resumeRouter.post(
  "/",
  resumeController.resumeUploadMiddleware,
  asyncHandler(resumeController.uploadResume),
);
resumeRouter.delete("/", asyncHandler(resumeController.deleteResume));
