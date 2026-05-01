import { Router } from "express";
import * as storiesController from "./stories.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { rateLimits } from "../../middleware/rateLimit.middleware";
import { createStorySchema, updateStorySchema, publishSchema } from "./stories.schemas";

export const storiesRouter = Router();

storiesRouter.use(requireAuth);

storiesRouter.get("/", asyncHandler(storiesController.getStories));
storiesRouter.post("/", rateLimits.createStory, validate(createStorySchema), asyncHandler(storiesController.createStory));
storiesRouter.get("/:id", asyncHandler(storiesController.getStory));
storiesRouter.patch("/:id", validate(updateStorySchema), asyncHandler(storiesController.updateStory));
storiesRouter.patch(
  "/:id/cover",
  storiesController.coverUploadMiddleware,
  asyncHandler(storiesController.uploadCover),
);
storiesRouter.patch("/:id/publish", validate(publishSchema), asyncHandler(storiesController.setPublished));
storiesRouter.delete("/:id", asyncHandler(storiesController.deleteStory));
