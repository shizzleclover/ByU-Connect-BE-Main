import { Router } from "express";
import * as servicesController from "./services.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createServiceSchema, updateServiceSchema, reorderSchema } from "./services.schemas";

/**
 * @swagger
 * /services:
 *   get:
 *     summary: List all services for the authenticated user
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of Service objects
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category]
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               priceLabel: { type: string }
 *               isPublished: { type: boolean }
 *     responses:
 *       201:
 *         description: Created service
 *
 * /services/reorder:
 *   patch:
 *     summary: Reorder services
 *     tags: [Services]
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
 *     responses:
 *       200:
 *         description: Reordered
 *
 * /services/{id}:
 *   patch:
 *     summary: Update a service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated service
 *   delete:
 *     summary: Delete a service
 *     tags: [Services]
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
 */
export const servicesRouter = Router();

servicesRouter.use(requireAuth);

servicesRouter.get("/", asyncHandler(servicesController.getServices));
servicesRouter.post("/", validate(createServiceSchema), asyncHandler(servicesController.createService));
servicesRouter.patch("/reorder", validate(reorderSchema), asyncHandler(servicesController.reorderServices));
servicesRouter.patch("/:id", validate(updateServiceSchema), asyncHandler(servicesController.updateService));
servicesRouter.delete("/:id", asyncHandler(servicesController.deleteService));
