import { Router } from "express";
import * as ogController from "./og.controller";
import { asyncHandler } from "../../middleware/asyncHandler";

export const ogRouter = Router();

ogRouter.get("/:username.png", asyncHandler(ogController.canvasOg));
ogRouter.get("/:username/projects/:slug.png", asyncHandler(ogController.projectOg));
ogRouter.get("/:username/stories/:slug.png", asyncHandler(ogController.storyOg));
