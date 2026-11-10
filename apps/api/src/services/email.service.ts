import nodemailer from 'nodemailer';

export type OtpPurpose = 'email-verification' | 'forget-password' | 'sign-in';

export interface EmailSendResult {
  sent: boolean;
  provider: 'smtp' | 'console-preview';
  previewOtp?: string;
}

class EmailService {
  private createTransporter() {
    const user = process.env['SMTP_USER'] ?? process.env['GMAIL_USER'];
    const pass = process.env['SMTP_PASS'] ?? process.env['GMAIL_APP_PASSWORD'];
    const rawHost = process.env['SMTP_HOST']?.trim();
    const host =
      rawHost && !rawHost.includes('@')
        ? rawHost
        : user?.endsWith('@gmail.com')
          ? 'smtp.gmail.com'
          : undefined;
    const port = Number(process.env['SMTP_PORT'] ?? 587);

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return null;
  }

  isSmtpConfigured(): boolean {
    const user = process.env['SMTP_USER'] ?? process.env['GMAIL_USER'];
    const pass = process.env['SMTP_PASS'] ?? process.env['GMAIL_APP_PASSWORD'];
    return Boolean(user && pass);
  }

  async sendOtpEmail(
    toEmail: string,
    otp: string,
    purpose: OtpPurpose = 'email-verification',
  ): Promise<EmailSendResult> {
    const subject =
      purpose === 'forget-password'
        ? 'Customization Atelier — Password Reset Verification Code'
        : 'Customization Atelier — Verify Your Email Address';

    const title =
      purpose === 'forget-password' ? 'Reset Your Password' : 'Verify Your Email Address';
    const description =
      purpose === 'forget-password'
        ? 'Use the one-time verification code below to reset your Customization Couture account password. This code expires in 10 minutes.'
        : 'Welcome to Customization Couture Atelier. Enter the 6-digit code below to verify your email address and activate your patron account.';

    const html = `
      <div style="font-family: Georgia, 'Times New Roman', serif; background-color: #FAF7F2; padding: 32px 20px; color: #1B1512;">
        <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8DFC8; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #13100E; padding: 24px; text-align: center;">
            <div style="font-size: 20px; letter-spacing: 0.25em; color: #FFFFFF; text-transform: uppercase;">CUSTOMIZATION</div>
            <div style="font-size: 10px; letter-spacing: 0.35em; color: #B8935A; text-transform: uppercase; margin-top: 4px;">Atelier · Couture</div>
          </div>
          <div style="padding: 32px 28px; text-align: center;">
            <h2 style="margin: 0 0 12px; font-weight: normal; font-size: 22px; color: #1B1512;">${title}</h2>
            <p style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; line-height: 1.6; color: #544B45; margin: 0 0 24px;">
              ${description}
            </p>
            <div style="display: inline-block; background-color: #FAF7F2; border: 1px solid #5C1A32; border-radius: 8px; padding: 14px 28px; margin-bottom: 24px;">
              <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 0.35em; color: #5C1A32;">
                ${otp}
              </span>
            </div>
            <p style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #8A7968; margin: 0;">
              If you did not request this verification code, please ignore this email safely.
            </p>
          </div>
        </div>
      </div>
    `;

    const transporter = this.createTransporter();
    if (transporter) {
      try {
        const fromAddress =
          process.env['SMTP_FROM'] ??
          process.env['SMTP_USER'] ??
          process.env['GMAIL_USER'] ??
          'atelier@customization.com';
        await transporter.sendMail({
          from: `"Customization Atelier" <${fromAddress}>`,
          to: toEmail,
          subject,
          html,
          text: `${title}: Your 6-digit verification code is ${otp}. Valid for 10 minutes.`,
        });
        console.log(`[email] OTP sent via SMTP to ${toEmail}`);
        return { sent: true, provider: 'smtp' };
      } catch (err) {
        console.error('[email] SMTP delivery failed, falling back to console preview:', err);
      }
    }

    // Development / unconfigured SMTP fallback: print clearly in server logs
    console.log(`\n================================================`);
    console.log(`[email] OTP for ${toEmail} (${purpose}): ${otp}`);
    console.log(`(Configure SMTP_USER & SMTP_PASS in apps/api/.env for real email delivery)`);
    console.log(`================================================\n`);

    return {
      sent: false,
      provider: 'console-preview',
      previewOtp: otp,
    };
  }
}

export const emailService = new EmailService();
