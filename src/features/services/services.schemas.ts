import { z } from "zod";
import { SERVICE_CATEGORIES } from "../../config/constants";

export const createServiceSchema = z.object({
  body: z.object({
    category: z.enum([...SERVICE_CATEGORIES] as [string, ...string[]]),
    title: z.string().min(1).max(80).trim(),
    description: z.string().min(1).max(500).trim(),
    startingPrice: z.number().positive().nullable().optional(),
    currency: z.enum(["NGN", "USD"]).default("NGN"),
    isNegotiable: z.boolean().default(false),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    category: z.enum([...SERVICE_CATEGORIES] as [string, ...string[]]).optional(),
    title: z.string().min(1).max(80).trim().optional(),
    description: z.string().min(1).max(500).trim().optional(),
    startingPrice: z.number().positive().nullable().optional(),
    currency: z.enum(["NGN", "USD"]).optional(),
    isNegotiable: z.boolean().optional(),
  }),
});

export const reorderSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string()).min(1),
  }),
});
