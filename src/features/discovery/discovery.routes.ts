import { Router } from "express";
import * as discoveryController from "./discovery.controller";
import { optionalAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";

/**
 * @swagger
 * /discover:
 *   get:
 *     summary: Discover / search student profiles
 *     tags: [Discovery]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Full-text search on name, bio, department
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by service category key
 *       - in: query
 *         name: verified
 *         schema: { type: boolean }
 *         description: Show only verified students
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Pagination cursor (last profile _id)
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "{ profiles: Profile[], nextCursor: string | null }"
 *
 * /discover/featured:
 *   get:
 *     summary: Get featured profiles (for landing page)
 *     tags: [Discovery]
 *     responses:
 *       200:
 *         description: List of featured profiles
 *
 * /discover/categories:
 *   get:
 *     summary: Get service category counts
 *     tags: [Discovery]
 *     responses:
 *       200:
 *         description: Array of { category, count }
 */
export const discoveryRouter = Router();

discoveryRouter.use(optionalAuth);

discoveryRouter.get("/categories", asyncHandler(discoveryController.getCategories));
discoveryRouter.get("/featured", asyncHandler(discoveryController.getFeatured));
discoveryRouter.get("/", asyncHandler(discoveryController.discover));
