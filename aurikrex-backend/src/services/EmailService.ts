import nodemailer, { Transporter } from 'nodemailer';
import { config } from 'dotenv';
import crypto from 'crypto';
import { getErrorMessage } from '../utils/errors.js';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

config();

interface OTPData {
  otp: string;
  email: string;
  firstName: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * EmailService - Handles email sending via Gmail SMTP using Nodemailer
 * 
 * Required environment variables:
 * - GMAIL_EMAIL: Gmail address used for sending emails
 * - GMAIL_APP_PASSWORD: Gmail App Password (not regular password)
 * - GMAIL_HOST: SMTP host (default: smtp.gmail.com)
 * - GMAIL_PORT: SMTP port (default: 465)
 * - GMAIL_SECURE: Whether to use SSL/TLS (default: true)
 */
export default class EmailService {
  private transporter: Transporter | null = null;
  private senderEmail: string;
  private senderName: string;
  private appName: string;
  private isConfigured: boolean = false;

  constructor() {
    // Initialize Gmail SMTP from environment variables
    this.senderEmail = process.env.GMAIL_EMAIL || '';
    this.senderName = 'Aurikrex Academy';
    this.appName = 'Aurikrex Academy';

    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || '';
    const gmailHost = process.env.GMAIL_HOST || 'smtp.gmail.com';
    const gmailPort = parseInt(process.env.GMAIL_PORT || '465', 10);
    // Default to true for security (SSL/TLS). Only 'false' explicitly disables it.
    const gmailSecure = process.env.GMAIL_SECURE !== 'false';

    if (!this.senderEmail || !gmailAppPassword) {
      log.warn('⚠️ GMAIL_EMAIL or GMAIL_APP_PASSWORD is not configured. Email sending will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      // Configure Nodemailer transport with Gmail SMTP using host, port, secure
      this.transporter = nodemailer.createTransport({
        host: gmailHost,
        port: gmailPort,
        secure: gmailSecure,
        auth: {
          user: this.senderEmail,
          pass: gmailAppPassword,
        },
      });
      this.isConfigured = true;
      log.info('✅ Gmail email service initialized', { host: gmailHost, port: gmailPort, secure: gmailSecure });
    } catch (error) {
      log.error('❌ Failed to initialize Gmail SMTP', { error: getErrorMessage(error) });
      this.isConfigured = false;
    }
  }

  /**
   * Generate a cryptographically secure 6-digit OTP
   * Uses crypto.randomInt for secure random number generation
   */
  generateOTP(): string {
    // Generate a cryptographically secure random number between 100000 and 999999
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Extract a display name from email address
   * Falls back to 'User' if extraction fails
   * @param email - Email address
   * @returns Display name extracted from email or 'User'
   */
  private extractNameFromEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return 'User';
    }
    const localPart = email.split('@')[0];
    // Return 'User' if local part is empty or too short
    return localPart && localPart.length > 0 ? localPart : 'User';
  }

  /**
   * Store OTP in MongoDB with 10-minute expiry
   */
  async storeOTP(email: string, otp: string, firstName: string): Promise<void> {
    try {
      const db = getDB();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 minutes

      const otpData: OTPData = {
        otp,
        email,
        firstName,
        createdAt,
        expiresAt,
      };

      await db.collection('otpVerifications').updateOne(
        { email },
        { $set: otpData },
        { upsert: true }
      );
      log.info('✅ OTP stored', { email, expiresAt: expiresAt.toISOString() });
    } catch (error) {
      log.error('Error storing OTP', { error: getErrorMessage(error) });
      throw new Error('Failed to store OTP');
    }
  }

  /**
   * Verify OTP from MongoDB
   */
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const db = getDB();
      const doc = await db.collection('otpVerifications').findOne({ email });

      if (!doc) {
        return false;
      }

      const data = doc as unknown as OTPData;
      const now = new Date();

      // Check if OTP has expired
      const expiresAt = data.expiresAt instanceof Date 
        ? data.expiresAt 
        : new Date(data.expiresAt);
      
      if (now > expiresAt) {
        // Delete expired OTP
        await db.collection('otpVerifications').deleteOne({ email });
        return false;
      }

      // Check if OTP matches
      if (data.otp !== otp) {
        return false;
      }

      // OTP is valid, delete it (one-time use)
      await db.collection('otpVerifications').deleteOne({ email });
      return true;
    } catch (error) {
      log.error('Error verifying OTP', { error: getErrorMessage(error) });
      return false;
    }
  }

  /**
   * Send OTP email using Nodemailer with Gmail SMTP
   * Uses inline HTML with basic styling
   */
  async sendOTPEmail(email: string, firstName: string, otp: string): Promise<void> {
    // Check if email service is configured
    if (!this.isConfigured || !this.transporter) {
      log.warn('⚠️ Email service not configured. OTP email not sent.', { email });
      // In development only, log the OTP for testing purposes
      if (process.env.NODE_ENV === 'development') {
        log.info(`🔐 DEV MODE - OTP for ${email}: ${otp}`);
      }
      return;
    }

    try {
      log.info(`📧 Preparing to send OTP email`, { email });

      // Create email content with inline HTML styling
      const htmlContent = this.generateOTPEmailHtml(firstName, otp);
      const textContent = `Welcome to ${this.appName}, ${firstName}!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

      // Send email via Nodemailer
      const info = await this.transporter.sendMail({
        from: `"${this.senderName}" <${this.senderEmail}>`,
        to: email,
        subject: 'Verify Your Email - Aurikrex Academy',
        text: textContent,
        html: htmlContent,
      });

      log.info('✅ OTP email sent successfully', { 
        messageId: info.messageId || 'N/A',
      });
    } catch (error) {
      log.error('❌ Error sending OTP email', {
        error: getErrorMessage(error),
        details: error instanceof Error ? { message: error.message } : undefined
      });
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }

  /**
   * Generate HTML content for OTP email
   * Uses inline styling for better email client compatibility
   */
  private generateOTPEmailHtml(firstName: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
          }
          .logo {
            text-align: center;
          }
          .logo h1 {
            margin: 0;
            font-size: 28px;
          }
          .logo p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 30px;
            color: #333;
          }
          .content h2 {
            color: #667eea;
            margin-top: 0;
          }
          .content p {
            line-height: 1.6;
            color: #666;
          }
          .otp-box {
            background: #f0f4ff;
            border: 2px dashed #667eea;
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            font-family: 'Courier New', monospace;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.8);
            margin-top: 20px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <h1>🎓 ${this.appName}</h1>
              <p>The Future of Learning</p>
            </div>
          </div>
          
          <div class="content">
            <h2>Welcome, ${firstName}! 👋</h2>
            <p>Thank you for joining ${this.appName}. To complete your registration, please verify your email address using the code below:</p>
            
            <div class="otp-box">${otp}</div>
            
            <p>This verification code will expire in <strong>10 minutes</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ${this.appName} will never ask for your verification code via email, phone, or any other means.
            </div>
            
            <p style="margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send OTP and store it
   */
  async sendVerificationOTP(email: string, firstName: string): Promise<string> {
    const otp = this.generateOTP();
    await this.storeOTP(email, otp, firstName);
    await this.sendOTPEmail(email, firstName, otp);
    return otp;
  }

  /**
   * Send verification email with OTP
   * Returns boolean indicating success/failure for controller consumption
   * Non-blocking: does not throw errors, only logs them
   * @param email - User's email address
   * @param otp - The OTP code to send
   * @param firstName - Optional first name for personalized email
   * @returns Promise<boolean> - true if email sent successfully, false otherwise
   */
  async sendVerificationEmail(email: string, otp: string, firstName?: string): Promise<boolean> {
    // Check if email service is configured
    if (!this.isConfigured || !this.transporter) {
      log.warn('⚠️ Email service not configured. Verification email not sent.', { email });
      // In development, log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        log.info(`🔐 DEV MODE - OTP for ${email}: ${otp}`);
      }
      return false;
    }

    try {
      log.info(`📧 Sending verification email`, { email });

      // Use provided firstName or extract from email
      const displayName = firstName || this.extractNameFromEmail(email);

      // Create email content with inline HTML styling
      const htmlContent = this.generateOTPEmailHtml(displayName, otp);
      const textContent = `Welcome to ${this.appName}, ${displayName}!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

      // Send email via Nodemailer
      const info = await this.transporter.sendMail({
        from: `"${this.senderName}" <${this.senderEmail}>`,
        to: email,
        subject: 'Verify Your Email - Aurikrex Academy',
        text: textContent,
        html: htmlContent,
      });

      log.info('✅ Verification email sent successfully', { 
        messageId: info.messageId || 'N/A',
      });
      return true;
    } catch (error) {
      log.error('❌ Error sending verification email', {
        error: getErrorMessage(error),
        details: error instanceof Error ? { message: error.message } : undefined
      });
      return false;
    }
  }

  /**
   * Verify the Gmail SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      log.warn('⚠️ Gmail email service is not configured');
      return false;
    }

    try {
      // Test SMTP connection by verifying transport configuration
      await this.transporter.verify();
      log.info('✅ Gmail email service is ready to send emails');
      return true;
    } catch (error) {
      log.error('❌ Gmail email service verification failed', { error: getErrorMessage(error) });
      return false;
    }
  }
}
