import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    console.log('Testing SMTP connection...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass:', process.env.EMAIL_PASS ? '***' : 'NOT SET');
    
    const result = await transporter.verify();
    console.log('✅ SMTP Connection verified:', result);
    
    // Try sending a test email
    const info = await transporter.sendMail({
      from: `"Aurikrex Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email - Aurikrex Academy',
      html: '<h1>Test Email</h1><p>If you see this, email is working!</p>',
      text: 'If you see this, email is working!',
    });
    
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

testEmail();
