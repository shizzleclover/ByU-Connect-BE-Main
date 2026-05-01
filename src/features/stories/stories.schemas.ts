import { z } from "zod";

export const createStorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).trim(),
    body: z.string().min(1).max(20000),
    excerpt: z.string().max(200).trim().nullable().optional(),
    isPublished: z.boolean().default(false),
  }),
});

export const updateStorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).trim().optional(),
    body: z.string().min(1).max(20000).optional(),
    excerpt: z.string().max(200).trim().nullable().optional(),
  }),
});

export const publishSchema = z.object({
  body: z.object({
    isPublished: z.boolean(),
  }),
});
