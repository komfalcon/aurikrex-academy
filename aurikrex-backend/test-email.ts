import { TransactionalEmailsApi, SendSmtpEmail, AccountApi } from '@getbrevo/brevo';
import { config } from 'dotenv';

config();

async function testBrevoEmail() {
  try {
    console.log('🔧 Testing Brevo API connection...');
    console.log('API Key:', process.env.BREVO_API_KEY ? '***' + process.env.BREVO_API_KEY.slice(-4) : 'NOT SET');
    console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL);
    console.log('Sender Name:', process.env.BREVO_SENDER_NAME || 'Aurikrex Academy');

    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY is not set in environment variables');
      process.exit(1);
    }

    // Test API connection
    const accountApi = new AccountApi();
    (accountApi as any).authentications.apiKey.apiKey = process.env.BREVO_API_KEY;
    const accountInfo = await accountApi.getAccount();
    console.log('✅ Brevo API connection verified');
    console.log('Account:', accountInfo.body.email);

    // Send test email
    const apiInstance = new TransactionalEmailsApi();
    (apiInstance as any).authentications.apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.sender = { 
      email: process.env.BREVO_SENDER_EMAIL || 'info@aurikrex.tech',
      name: process.env.BREVO_SENDER_NAME || 'Aurikrex Academy'
    };
    sendSmtpEmail.to = [{ 
      email: process.env.BREVO_SENDER_EMAIL || 'info@aurikrex.tech',
      name: 'Test Recipient'
    }];
    sendSmtpEmail.subject = 'Test Email - Aurikrex Academy (Brevo)';
    sendSmtpEmail.htmlContent = '<h1>Test Email</h1><p>If you see this, Brevo email integration is working! 🎉</p>';
    sendSmtpEmail.textContent = 'If you see this, Brevo email integration is working!';

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Test email sent successfully via Brevo');
    console.log('Message ID:', result.body?.messageId || 'N/A');
    console.log('\n🎉 Brevo integration is working correctly!');
  } catch (error) {
    console.error('❌ Brevo email test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

testBrevoEmail();
