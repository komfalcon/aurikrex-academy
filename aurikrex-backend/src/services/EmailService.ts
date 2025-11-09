import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { getErrorMessage } from '../utils/errors';
import { db } from '../config/firebase';

config();

interface OTPData {
  otp: string;
  email: string;
  firstName: string;
  createdAt: Date;
  expiresAt: Date;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure Titan Mail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.titan.email',
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP in Firestore with 10-minute expiry
   */
  async storeOTP(email: string, otp: string, firstName: string): Promise<void> {
    try {
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 minutes

      const otpData: OTPData = {
        otp,
        email,
        firstName,
        createdAt,
        expiresAt,
      };

      await db.collection('otpVerifications').doc(email).set(otpData);
      console.log(`OTP stored for ${email}, expires at ${expiresAt.toISOString()}`);
    } catch (error) {
      console.error('Error storing OTP:', getErrorMessage(error));
      throw new Error('Failed to store OTP');
    }
  }

  /**
   * Verify OTP from Firestore
   */
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const doc = await db.collection('otpVerifications').doc(email).get();

      if (!doc.exists) {
        return false;
      }

      const data = doc.data() as OTPData;
      const now = new Date();

      // Check if OTP has expired
      // Handle both Firestore Timestamp and Date objects
      const expiresAt = data.expiresAt instanceof Date 
        ? data.expiresAt 
        : new Date((data.expiresAt as any).toDate());
      
      if (now > expiresAt) {
        // Delete expired OTP
        await db.collection('otpVerifications').doc(email).delete();
        return false;
      }

      // Check if OTP matches
      if (data.otp !== otp) {
        return false;
      }

      // OTP is valid, delete it (one-time use)
      await db.collection('otpVerifications').doc(email).delete();
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', getErrorMessage(error));
      return false;
    }
  }

  /**
   * Send OTP email using Nodemailer
   */
  async sendOTPEmail(email: string, firstName: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"Aurikrex Academy" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - Aurikrex Academy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 40px;
                color: white;
              }
              .logo {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
              }
              .content {
                background: white;
                border-radius: 12px;
                padding: 30px;
                color: #333;
                margin: 20px 0;
              }
              .otp-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 32px;
                font-weight: bold;
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
                color: rgba(255, 255, 255, 0.8);
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
              <div class="logo">
                <h1>🎓 Aurikrex Academy</h1>
                <p style="margin: 5px 0; opacity: 0.9;">The Future of Learning</p>
              </div>
              
              <div class="content">
                <h2 style="color: #667eea; margin-top: 0;">Welcome, ${firstName}! 👋</h2>
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
        `,
        text: `Welcome to Aurikrex Academy, ${firstName}!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', getErrorMessage(error));
      throw new Error('Failed to send verification email');
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
   * Verify the SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', getErrorMessage(error));
      return false;
    }
  }
}

export const emailService = new EmailService();
