import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// OTP Email Sender — Zero Cost
// ---------------------------------------------------------------------------
// Uses Nodemailer with a configured SMTP account to send OTP codes.
// No third-party service needed — uses the same email infrastructure
// that SharaSpot already manages for campaigns.
//
// Configure with any SMTP account:
//   - Gmail (with App Password)
//   - Custom domain email
//   - Transactional email service (optional)
// ---------------------------------------------------------------------------

let transporter: nodemailer.Transporter | null = null;

export function getOTPTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.OTP_SMTP_HOST;
  const port = parseInt(process.env.OTP_SMTP_PORT || "465", 10);
  const user = process.env.OTP_SMTP_USER;
  const pass = process.env.OTP_SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "OTP email not configured. Set OTP_SMTP_HOST, OTP_SMTP_USER, OTP_SMTP_PASS in .env"
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
  });

  return transporter;
}

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const transport = getOTPTransporter();
  const fromName = process.env.OTP_FROM_NAME || "SharaSpot";
  const fromEmail = process.env.OTP_SMTP_USER || "";

  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Your SharaSpot Verification Code",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #059669, #0d9488); border-radius: 12px; margin-bottom: 16px;">
            <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px;">SharaSpot</h1>
        </div>

        <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Your verification code is</p>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #059669; font-family: 'Courier New', monospace; background: white; padding: 16px; border-radius: 8px; display: inline-block; border: 2px solid #d1fae5;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0;">This code expires in 10 minutes.</p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Your SharaSpot verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
  });
}
