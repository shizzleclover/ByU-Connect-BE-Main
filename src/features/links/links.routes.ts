import { Router } from "express";
import * as linksController from "./links.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createLinkSchema, updateLinkSchema, reorderSchema } from "./links.schemas";

/**
 * @swagger
 * /links:
 *   get:
 *     summary: List all links for the authenticated user
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of Link objects ordered by sortOrder
 *   post:
 *     summary: Create a new link
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, url]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SOCIAL, PORTFOLIO, OTHER]
 *               label: { type: string }
 *               url: { type: string, format: uri }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Created link
 *
 * /links/reorder:
 *   patch:
 *     summary: Reorder links
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *                 description: Ordered array of link _id values
 *     responses:
 *       200:
 *         description: Reordered
 *
 * /links/{id}:
 *   patch:
 *     summary: Update a link (label, url, type, isActive)
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated link
 *   delete:
 *     summary: Delete a link
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *
 * /links/{id}/toggle:
 *   patch:
 *     summary: Toggle a link's isActive state
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated link with flipped isActive
 */
export const linksRouter = Router();

linksRouter.use(requireAuth);

linksRouter.get("/", asyncHandler(linksController.getLinks));
linksRouter.post("/", validate(createLinkSchema), asyncHandler(linksController.createLink));
linksRouter.patch("/reorder", validate(reorderSchema), asyncHandler(linksController.reorderLinks));
linksRouter.patch("/:id", validate(updateLinkSchema), asyncHandler(linksController.updateLink));
linksRouter.patch("/:id/toggle", asyncHandler(linksController.toggleLink));
linksRouter.delete("/:id", asyncHandler(linksController.deleteLink));
