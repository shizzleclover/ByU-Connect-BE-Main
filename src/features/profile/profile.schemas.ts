import { z } from "zod";
import { CANVAS_SECTIONS, RESERVED_USERNAMES } from "../../config/constants";

export const usernameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9_-]+$/, "Username may only contain lowercase letters, numbers, _ and -")
  .refine((v) => !v.startsWith("-") && !v.endsWith("-"), {
    message: "Username may not start or end with a hyphen",
  })
  .refine((v) => !RESERVED_USERNAMES.includes(v), {
    message: "This username is reserved",
  });

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(100).trim().optional(),
    bio: z.string().max(280).trim().nullable().optional(),
    department: z.string().max(100).trim().nullable().optional(),
    year: z.enum(["100", "200", "300", "400", "500", "600", "700", "800", "PG"]).nullable().optional(),
    isPublic: z.boolean().optional(),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
      .nullable()
      .optional(),
  }),
});

export const updateUsernameSchema = z.object({
  body: z.object({
    username: usernameSchema,
  }),
});

export const updateLayoutSchema = z.object({
  body: z.object({
    canvasLayout: z
      .array(z.enum([...CANVAS_SECTIONS] as [string, ...string[]]))
      .min(0)
      .max(5)
      .refine(
        (arr) => new Set(arr).size === arr.length,
        "canvasLayout must not have duplicate sections",
      ),
  }),
});
