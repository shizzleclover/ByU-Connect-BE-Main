import { z } from "zod";

export const discoverQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    verified: z.enum(["true", "false"]).optional(),
    sort: z.enum(["newest", "alphabetical", "popular"]).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});
