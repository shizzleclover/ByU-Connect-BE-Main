import { Router } from "express";
import * as discoveryController from "./discovery.controller";
import { optionalAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";

export const discoveryRouter = Router();

discoveryRouter.use(optionalAuth);

discoveryRouter.get("/categories", asyncHandler(discoveryController.getCategories));
discoveryRouter.get("/featured", asyncHandler(discoveryController.getFeatured));
discoveryRouter.get("/", asyncHandler(discoveryController.discover));
