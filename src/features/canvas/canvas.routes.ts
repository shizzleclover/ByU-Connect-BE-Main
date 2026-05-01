import { Router } from "express";
import * as canvasController from "./canvas.controller";
import { optionalAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";

export const canvasRouter = Router();

canvasRouter.use(optionalAuth);

canvasRouter.get("/:username", asyncHandler(canvasController.getCanvas));
canvasRouter.get("/:username/projects/:slug", asyncHandler(canvasController.getProject));
canvasRouter.get("/:username/stories/:slug", asyncHandler(canvasController.getStory));
