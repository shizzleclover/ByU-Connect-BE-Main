import { Resend } from "resend";
import { env } from "./env";

if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is required in production");
}

export const resend = new Resend(env.RESEND_API_KEY || "re_placeholder");
