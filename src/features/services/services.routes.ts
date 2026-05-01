import { Router } from "express";
import * as servicesController from "./services.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createServiceSchema, updateServiceSchema, reorderSchema } from "./services.schemas";

export const servicesRouter = Router();

servicesRouter.use(requireAuth);

servicesRouter.get("/", asyncHandler(servicesController.getServices));
servicesRouter.post("/", validate(createServiceSchema), asyncHandler(servicesController.createService));
servicesRouter.patch("/reorder", validate(reorderSchema), asyncHandler(servicesController.reorderServices));
servicesRouter.patch("/:id", validate(updateServiceSchema), asyncHandler(servicesController.updateService));
servicesRouter.delete("/:id", asyncHandler(servicesController.deleteService));
