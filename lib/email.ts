import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@useyapi.com",
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function sendVerificationEmail(to: string, url: string) {
  return sendEmail({
    to,
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 48px 40px; text-align: center;">
                      <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">
                        Verify Your Email Address
                      </h1>
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #52525b;">
                        Thanks for signing up! Please click the button below to verify your email address and activate your account.
                      </p>
                      <a href="${url}" 
                         style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #18181b; text-decoration: none; border-radius: 8px;">
                        Verify Email
                      </a>
                      <p style="margin: 32px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                        If you didn't create an account, you can safely ignore this email.
                      </p>
                      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #3b82f6; word-break: break-all;">
                        ${url}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Verify your email address by clicking this link: ${url}`,
  });
}
