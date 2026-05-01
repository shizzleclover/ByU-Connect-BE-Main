import { Router } from "express";
import * as contactsController from "./contacts.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createContactSchema, updateContactSchema, reorderSchema } from "./contacts.schemas";

export const contactsRouter = Router();

contactsRouter.use(requireAuth);

contactsRouter.get("/", asyncHandler(contactsController.getContacts));
contactsRouter.post("/", validate(createContactSchema), asyncHandler(contactsController.createContact));
contactsRouter.patch("/reorder", validate(reorderSchema), asyncHandler(contactsController.reorderContacts));
contactsRouter.patch("/:id", validate(updateContactSchema), asyncHandler(contactsController.updateContact));
contactsRouter.patch("/:id/primary", asyncHandler(contactsController.setPrimary));
contactsRouter.delete("/:id", asyncHandler(contactsController.deleteContact));
