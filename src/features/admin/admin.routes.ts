import { Router } from "express";
import * as adminController from "./admin.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../../middleware/validate.middleware";

const reviewReportSchema = z.object({
  body: z.object({
    status: z.enum(["reviewed", "actioned", "dismissed"]),
    adminNote: z.string().max(1000).optional(),
  }),
});

const addFeaturedSchema = z.object({
  body: z.object({
    profileId: z.string().min(1),
    order: z.number().int().min(0).optional(),
  }),
});

const suspendSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/reports", asyncHandler(adminController.getReports));
adminRouter.patch("/reports/:id", validate(reviewReportSchema), asyncHandler(adminController.reviewReport));

adminRouter.get("/featured", asyncHandler(adminController.getFeaturedList));
adminRouter.post("/featured", validate(addFeaturedSchema), asyncHandler(adminController.addFeatured));
adminRouter.delete("/featured/:profileId", asyncHandler(adminController.removeFeatured));

adminRouter.get("/users", asyncHandler(adminController.getUsers));
adminRouter.patch("/users/:id/suspend", validate(suspendSchema), asyncHandler(adminController.suspendUser));
adminRouter.patch("/users/:id/unsuspend", asyncHandler(adminController.unsuspendUser));
