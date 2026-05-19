import { Router } from "express";
import * as contactsController from "./contacts.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createContactSchema, updateContactSchema, reorderSchema } from "./contacts.schemas";

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: List the authenticated user's contact methods
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of Contact objects ordered by sortOrder
 *   post:
 *     summary: Add a contact method
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, value]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [whatsapp, instagram, twitter, email, phone, linkedin, tiktok, website, custom]
 *               value:
 *                 type: string
 *                 description: "Phone numbers must include country code (e.g. +2348012345678)"
 *               label: { type: string, description: "Custom label (for 'custom' type)" }
 *               isPrimary: { type: boolean }
 *     responses:
 *       201:
 *         description: Created contact method
 *       400:
 *         description: Invalid value for contact type (e.g. missing country code)
 *
 * /contacts/reorder:
 *   patch:
 *     summary: Reorder contact methods
 *     tags: [Contacts]
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
 * /contacts/{id}:
 *   patch:
 *     summary: Update a contact method
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated contact
 *   delete:
 *     summary: Delete a contact method
 *     tags: [Contacts]
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
 * /contacts/{id}/primary:
 *   patch:
 *     summary: Set a contact method as primary
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated — this contact is now primary, others are not
 */
export const contactsRouter = Router();

contactsRouter.use(requireAuth);

contactsRouter.get("/", asyncHandler(contactsController.getContacts));
contactsRouter.post("/", validate(createContactSchema), asyncHandler(contactsController.createContact));
contactsRouter.patch("/reorder", validate(reorderSchema), asyncHandler(contactsController.reorderContacts));
contactsRouter.patch("/:id", validate(updateContactSchema), asyncHandler(contactsController.updateContact));
contactsRouter.patch("/:id/primary", asyncHandler(contactsController.setPrimary));
contactsRouter.delete("/:id", asyncHandler(contactsController.deleteContact));
