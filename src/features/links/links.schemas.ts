import { z } from "zod";

export const createLinkSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(60).trim(),
    url: z.string().min(1).trim(),
    iconKey: z.string().max(50).nullable().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateLinkSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(60).trim().optional(),
    url: z.string().min(1).trim().optional(),
    iconKey: z.string().max(50).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const reorderSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string()).min(1),
  }),
});
