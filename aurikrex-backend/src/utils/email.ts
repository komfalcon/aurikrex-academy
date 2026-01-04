import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';
import { config } from 'dotenv';
import { log } from './logger.js';

config();

// SMTP configuration from environment
const GMAIL_HOST = process.env.GMAIL_HOST || 'smtp.gmail.com';
const GMAIL_PORT = parseInt(process.env.GMAIL_PORT || '465', 10);
const GMAIL_SECURE = process.env.GMAIL_SECURE !== 'false';
const GMAIL_EMAIL = process.env.GMAIL_EMAIL || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

const APP_NAME = 'Aurikrex Academy';

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(GMAIL_EMAIL && GMAIL_APP_PASSWORD);
}

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash OTP for secure storage (we don't store plain OTPs)
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify OTP against stored hash
 */
export function verifyOTPHash(otp: string, storedHash: string): boolean {
  const computedHash = hashOTP(otp);
  // Use timing-safe comparison to prevent timing attacks
  // Both strings are hex-encoded SHA256 hashes, so they have the same length
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    // If buffers have different lengths, comparison fails
    return false;
  }
}

/**
 * Create nodemailer transporter
 */
function createTransporter(): Transporter | null {
  if (!isEmailConfigured()) {
    log.warn('Email service not configured: GMAIL_EMAIL or GMAIL_APP_PASSWORD missing');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: GMAIL_HOST,
      port: GMAIL_PORT,
      secure: GMAIL_SECURE,
      auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    log.info('Nodemailer transporter created', { host: GMAIL_HOST, port: GMAIL_PORT });
    return transporter;
  } catch (error) {
    log.error('Failed to create email transporter', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Generate professional HTML email template for OTP
 */
function generateOTPEmailHTML(firstName: string, otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🎓 ${APP_NAME}</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">The Future of Learning</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">Welcome, ${firstName}! 👋</h2>
              <p style="margin: 0 0 25px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for joining ${APP_NAME}. To complete your registration, please use the verification code below:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8f9ff; border: 2px dashed #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
              </div>
              
              <p style="margin: 25px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <!-- Warning -->
              <div style="background-color: #fff8e6; border-left: 4px solid #f5a623; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ${APP_NAME} will never ask for your verification code.
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                This is an automated message, please do not reply.
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
}

/**
 * Generate plain text email content
 */
function generateOTPEmailText(firstName: string, otp: string): string {
  return `
Welcome to ${APP_NAME}, ${firstName}!

Your verification code is: ${otp}

This code will expire in 10 minutes.

Security Notice: Never share this code with anyone. ${APP_NAME} will never ask for your verification code.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
  `.trim();
}

/**
 * Sanitize email for logging (mask middle portion)
 */
function sanitizeEmailForLog(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 2) {
    return email.substring(0, 1) + '***@' + email.substring(atIndex + 1);
  }
  return email.substring(0, 2) + '***@' + email.substring(atIndex + 1);
}

/**
 * Send OTP verification email
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  firstName: string
): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    log.warn('Email not sent: transporter not configured', { email: sanitizeEmailForLog(email) });
    // In development, log info for testing (but never log actual OTP)
    if (process.env.NODE_ENV === 'development') {
      log.info('DEV MODE - Verification code generated', { email: sanitizeEmailForLog(email) });
    }
    return false;
  }

  try {
    const htmlContent = generateOTPEmailHTML(firstName, otp);
    const textContent = generateOTPEmailText(firstName, otp);

    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${GMAIL_EMAIL}>`,
      to: email,
      subject: `Verify Your Email - ${APP_NAME}`,
      text: textContent,
      html: htmlContent,
    });

    log.info('Verification email sent successfully', {
      email: sanitizeEmailForLog(email),
      messageId: info.messageId || 'N/A',
    });

    return true;
  } catch (error) {
    log.error('Failed to send verification email', {
      error: error instanceof Error ? error.message : String(error),
      email: sanitizeEmailForLog(email),
    });
    return false;
  }
}

/**
 * Verify SMTP connection (for health checks)
 */
export async function verifyEmailConnection(): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    log.info('Email service connection verified');
    return true;
  } catch (error) {
    log.error('Email service connection verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
