import { TransactionalEmailsApi, SendSmtpEmail, AccountApi } from '@getbrevo/brevo';
import { config } from 'dotenv';
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

export class EmailService {
  private apiInstance: TransactionalEmailsApi | null = null;
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;
  private isConfigured: boolean = false;

  constructor() {
    // Initialize Brevo API
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@aurikrex.tech';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Aurikrex Academy';

    if (!this.apiKey) {
      log.warn('⚠️ BREVO_API_KEY is not configured. Email sending will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      // Configure Brevo API client
      this.apiInstance = new TransactionalEmailsApi();
      (this.apiInstance as any).authentications.apiKey.apiKey = this.apiKey;
      this.isConfigured = true;
      log.info('✅ Brevo email service initialized');
    } catch (error) {
      log.error('❌ Failed to initialize Brevo API', { error: getErrorMessage(error) });
      this.isConfigured = false;
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
   * Send OTP email using Brevo Transactional Email API
   */
  async sendOTPEmail(email: string, firstName: string, otp: string): Promise<void> {
    // Check if email service is configured
    if (!this.isConfigured || !this.apiInstance) {
      log.warn('⚠️ Email service not configured. OTP email not sent.', { email });
      // In development only, log the OTP for testing purposes
      if (process.env.NODE_ENV === 'development') {
        log.info(`🔐 DEV MODE - OTP for ${email}: ${otp}`);
      }
      return;
    }

    try {
      log.info(`📧 Preparing to send OTP email`, { email });

      // Create email content
      const htmlContent = `
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
                <h1>🎓 Aurikrex Academy</h1>
                <p>The Future of Learning</p>
              </div>
            </div>
            
            <div class="content">
              <h2>Welcome, ${firstName}! 👋</h2>
              <p>Thank you for joining Aurikrex Academy. To complete your registration, please verify your email address using the code below:</p>
              
              <div class="otp-box">${otp}</div>
              
              <p>This verification code will expire in <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Aurikrex Academy will never ask for your verification code via email, phone, or any other means.
              </div>
              
              <p style="margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Aurikrex Academy. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `Welcome to Aurikrex Academy, ${firstName}!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

      // Create Brevo email object
      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.senderEmail, name: this.senderName };
      sendSmtpEmail.to = [{ email, name: firstName }];
      sendSmtpEmail.subject = 'Verify Your Email - Aurikrex Academy';
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.textContent = textContent;

      // Send email via Brevo
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      log.info('✅ OTP email sent successfully', { messageId: result.body?.messageId || 'N/A' });
    } catch (error) {
      log.error('❌ Error sending OTP email', {
        error: getErrorMessage(error),
        details: error instanceof Error ? { message: error.message } : undefined
      });
      
      throw new Error('Failed to send verification email. Please check your Brevo API configuration.');
    }
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
   * Verify the Brevo API connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      log.warn('⚠️ Brevo email service is not configured');
      return false;
    }

    try {
      // Test Brevo API connection by checking account info
      const accountApi = new AccountApi();
      (accountApi as any).authentications.apiKey.apiKey = this.apiKey;
      await accountApi.getAccount();
      log.info('✅ Brevo email service is ready to send emails');
      return true;
    } catch (error) {
      log.error('❌ Brevo email service verification failed', { error: getErrorMessage(error) });
      return false;
    }
  }
}

export const emailService = new EmailService();
