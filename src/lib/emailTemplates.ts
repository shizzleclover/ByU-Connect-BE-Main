import { env } from "../config/env";

const WEB_URL = env.WEB_URL;

export function welcomeEmail(data: {
  fullName: string;
  username: string;
  email: string;
  temporaryPassword: string;
}): { subject: string; text: string; html: string } {
  const subject = "Welcome to ByU Connect — Your account is ready";
  const signinUrl = `${WEB_URL}/signin`;
  const canvasUrl = `${WEB_URL}/${data.username}`;

  const text = `
Hi ${data.fullName},

Welcome to ByU Connect! Your account has been created.

Sign in at: ${signinUrl}
Email: ${data.email}
Temporary password: ${data.temporaryPassword}

You'll be prompted to change your password after your first sign-in.

Your canvas is live at: ${canvasUrl}

Questions? Reply to this email.

The ByU Connect Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ByU Connect</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E5E2;">
          <!-- Header -->
          <tr>
            <td style="background:#0F0F0E;padding:28px 36px;">
              <p style="margin:0;color:#FAFAF7;font-size:13px;font-weight:700;letter-spacing:0.12em;">BYU CONNECT</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F0F0E;line-height:1.2;">
                Welcome, ${data.fullName}.
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6B6B67;line-height:1.6;">
                Your ByU Connect account is live. Here are your sign-in details.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F1;border-left:3px solid #0F0F0E;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#6B6B67;">YOUR CREDENTIALS</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#0F0F0E;">
                      <span style="color:#6B6B67;">Email:</span>&nbsp; ${data.email}
                    </p>
                    <p style="margin:0;font-size:13px;color:#0F0F0E;">
                      <span style="color:#6B6B67;">Temporary password:</span>&nbsp;
                      <strong style="font-size:16px;letter-spacing:0.05em;">${data.temporaryPassword}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#0F0F0E;">
                    <a href="${signinUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#FAFAF7;text-decoration:none;">
                      SIGN IN NOW →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;color:#6B6B67;line-height:1.6;">
                You'll be asked to set a new password on your first login.
              </p>
              <p style="margin:0;font-size:13px;color:#6B6B67;line-height:1.6;">
                Your canvas is already live at
                <a href="${canvasUrl}" style="color:#0F0F0E;text-decoration:underline;">${canvasUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #E5E5E2;">
              <p style="margin:0;font-size:11px;color:#ABABAB;letter-spacing:0.06em;">
                BYU CONNECT — Babcock University Student Directory
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, text, html };
}
