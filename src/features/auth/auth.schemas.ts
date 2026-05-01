import { z } from "zod";
import { RESERVED_USERNAMES } from "../../config/constants";

const usernameField = z
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

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Password must contain at least one letter and one number",
  });

export const signupSchema = z.object({
  body: z.object({
    email: z.string().min(1).email().transform((v) => v.trim().toLowerCase()),
    password: passwordField,
    username: usernameField,
    fullName: z.string().min(2).max(100).trim(),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    email: z.string().min(1).email().transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1, "Password is required"),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().min(1).email().transform((v) => v.trim().toLowerCase()),
    code: z.string().length(6, "Code must be 6 digits"),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().min(1).email().transform((v) => v.trim().toLowerCase()),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().min(1).email().transform((v) => v.trim().toLowerCase()),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().min(1).email().transform((v) => v.trim().toLowerCase()),
    code: z.string().length(6, "Code must be 6 digits"),
    newPassword: passwordField,
  }),
});
