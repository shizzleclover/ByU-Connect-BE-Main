import { Resend } from "resend";
import { env } from "./env";

// Key is optional in dev (mailer falls back to terminal logging when absent)

export const resend = new Resend(env.RESEND_API_KEY || "re_placeholder");
