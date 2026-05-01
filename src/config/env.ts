import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Normalize variable-name aliases so either naming convention works
(function normalizeEnvAliases() {
  const e = process.env;
  if (!e.MONGODB_URI && e.DATABASE_URL)           e.MONGODB_URI           = e.DATABASE_URL;
  if (!e.WEB_URL && e.CLIENT_URL)                 e.WEB_URL               = e.CLIENT_URL;
  if (!e.JWT_ACCESS_TTL && e.JWT_ACCESS_EXPIRY)   e.JWT_ACCESS_TTL        = e.JWT_ACCESS_EXPIRY;
  if (!e.JWT_REFRESH_TTL && e.JWT_REFRESH_EXPIRY) e.JWT_REFRESH_TTL       = e.JWT_REFRESH_EXPIRY;
  if (!e.EMAIL_FROM && e.RESEND_FROM_EMAIL)        e.EMAIL_FROM            = e.RESEND_FROM_EMAIL;
})();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().default("http://localhost:4000"),
  WEB_URL: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI (or DATABASE_URL) is required"),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("ByU Connect <hello@byu-connect.com>"),

  STUDENT_EMAIL_DOMAIN: z.string().min(1, "STUDENT_EMAIL_DOMAIN is required"),

  ADMIN_BOOTSTRAP_EMAIL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.issues, null, 2));
  process.exit(1);
}

export const env = _env.data;
