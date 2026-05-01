import { env } from "../config/env";
import { logger } from "./logger";

interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail({ to, subject, text }: MailOptions): Promise<void> {
  if (env.NODE_ENV !== "production") {
    // Print OTP directly to terminal — no Resend call needed in dev
    logger.info(
      { to, subject },
      `\n${"─".repeat(52)}\n📧  DEV MAIL\n${"─".repeat(52)}\nTO:      ${to}\nSUBJECT: ${subject}\n\n${text}\n${"─".repeat(52)}`,
    );
    return;
  }

  const { resend } = await import("../config/resend");
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}
