import { Router } from "express";
import multer from "multer";
import * as adminController from "./admin.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../../middleware/validate.middleware";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const reviewReportSchema = z.object({
  body: z.object({
    status: z.enum(["reviewed", "actioned", "dismissed"]),
    adminNote: z.string().max(1000).optional(),
  }),
});

const addFeaturedSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    order: z.number().int().min(0).optional(),
  }),
});

const reorderFeaturedSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    isSuspended: z.boolean().optional(),
    suspendedReason: z.string().max(500).optional(),
    role: z.enum(["user", "admin"]).optional(),
  }),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

// Stats
adminRouter.get("/stats", asyncHandler(adminController.getStats));

// Reports
adminRouter.get("/reports", asyncHandler(adminController.getReports));
adminRouter.patch("/reports/:id", validate(reviewReportSchema), asyncHandler(adminController.reviewReport));

// Featured
adminRouter.get("/featured", asyncHandler(adminController.getFeaturedList));
adminRouter.post("/featured", validate(addFeaturedSchema), asyncHandler(adminController.addFeatured));
adminRouter.patch("/featured/reorder", validate(reorderFeaturedSchema), asyncHandler(adminController.reorderFeatured));
adminRouter.delete("/featured/:userId", asyncHandler(adminController.removeFeatured));

// Users
adminRouter.get("/users", asyncHandler(adminController.getUsers));
adminRouter.post("/users/import", upload.single("file"), asyncHandler(adminController.bulkImport));
adminRouter.patch("/users/:id", validate(updateUserSchema), asyncHandler(adminController.updateUser));
adminRouter.delete("/users/:id", asyncHandler(adminController.deleteUser));
