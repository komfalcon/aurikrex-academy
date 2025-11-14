import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { getErrorMessage } from '../utils/errors.js';
import { getDB } from '../config/mongodb.js';

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
    // Configure Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
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
      console.log(`✅ OTP stored for ${email}, expires at ${expiresAt.toISOString()}`);
    } catch (error) {
      console.error('Error storing OTP:', getErrorMessage(error));
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
        `,
        text: `Welcome to Aurikrex Academy, ${firstName}!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}`);
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
