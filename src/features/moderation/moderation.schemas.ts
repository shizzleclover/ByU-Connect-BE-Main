import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    targetProfileId: z.string().min(1),
    reason: z.enum(["spam", "inappropriate", "impersonation", "harassment", "other"]),
    description: z.string().max(500).nullable().optional(),
  }),
});
