import { Router } from "express";
import * as linksController from "./links.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createLinkSchema, updateLinkSchema, reorderSchema } from "./links.schemas";

export const linksRouter = Router();

linksRouter.use(requireAuth);

linksRouter.get("/", asyncHandler(linksController.getLinks));
linksRouter.post("/", validate(createLinkSchema), asyncHandler(linksController.createLink));
linksRouter.patch("/reorder", validate(reorderSchema), asyncHandler(linksController.reorderLinks));
linksRouter.patch("/:id", validate(updateLinkSchema), asyncHandler(linksController.updateLink));
linksRouter.patch("/:id/toggle", asyncHandler(linksController.toggleLink));
linksRouter.delete("/:id", asyncHandler(linksController.deleteLink));
