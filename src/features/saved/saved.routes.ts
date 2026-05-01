import { Router } from "express";
import * as savedController from "./saved.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../../middleware/validate.middleware";

const saveSchema = z.object({
  body: z.object({ profileId: z.string().min(1) }),
});

export const savedRouter = Router();

savedRouter.use(requireAuth);

savedRouter.get("/", asyncHandler(savedController.getSaved));
savedRouter.post("/", validate(saveSchema), asyncHandler(savedController.saveProfile));
savedRouter.delete("/:profileId", asyncHandler(savedController.unsaveProfile));
