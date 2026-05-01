import { z } from "zod";

export const startStudentVerificationSchema = z.object({
  body: z.object({
    studentEmail: z.string().min(1).transform((v) => v.trim().toLowerCase()),
  }),
});

export const confirmStudentVerificationSchema = z.object({
  body: z.object({
    code: z.string().length(6, "Code must be 6 digits"),
  }),
});
