import { z } from "zod";
import { CONTACT_TYPES } from "../../config/constants";

export const createContactSchema = z.object({
  body: z.object({
    type: z.enum([...CONTACT_TYPES] as [string, ...string[]]),
    value: z.string().min(1).max(500).trim(),
    label: z.string().max(60).nullable().optional(),
    isPrimary: z.boolean().default(false),
  }),
});

export const updateContactSchema = z.object({
  body: z.object({
    value: z.string().min(1).max(500).trim().optional(),
    label: z.string().max(60).nullable().optional(),
    isPrimary: z.boolean().optional(),
  }),
});

export const reorderSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string()).min(1),
  }),
});
