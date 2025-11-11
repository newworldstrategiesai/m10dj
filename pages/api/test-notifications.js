// Test notification systems (SMS and Email)
import { sendAdminSMS, formatContactSubmissionSMS } from '../../utils/sms-helper.js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    environment: {},
    sms: {},
    email: {}
  };

  // 1. Check environment variables
  console.log('🔍 Checking environment variables...');
  results.environment = {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    ADMIN_PHONE_NUMBER: !!process.env.ADMIN_PHONE_NUMBER,
    ADMIN_PHONE_VALUE: process.env.ADMIN_PHONE_NUMBER ? 
      `${process.env.ADMIN_PHONE_NUMBER.substring(0, 5)}...` : 'NOT SET',
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
    TWILIO_PHONE_VALUE: process.env.TWILIO_PHONE_NUMBER || 'NOT SET'
  };

  // 2. Test SMS notification
  try {
    console.log('📱 Testing SMS notification...');
    
    const testSubmission = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12345678900',
      eventType: 'Wedding',
      eventDate: '2025-12-31',
      location: 'Test Venue',
      message: 'This is a test notification from the diagnostic tool'
    };

    const smsMessage = formatContactSubmissionSMS(testSubmission);
    console.log('📝 SMS Message:', smsMessage);

    // Try direct Twilio approach
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const adminPhone = process.env.ADMIN_PHONE_NUMBER;
      
      if (!adminPhone) {
        throw new Error('ADMIN_PHONE_NUMBER not configured');
      }

      const smsResult = await twilioClient.messages.create({
        body: `🧪 TEST NOTIFICATION\n\n${smsMessage}\n\n✅ If you received this, SMS notifications are working!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: adminPhone
      });

      results.sms = {
        success: true,
        method: 'direct_twilio',
        sid: smsResult.sid,
        status: smsResult.status,
        to: adminPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      };

      console.log('✅ SMS test successful:', smsResult.sid);
    } else {
      results.sms = {
        success: false,
        error: 'Twilio credentials not configured'
      };
    }

  } catch (smsError) {
    console.error('❌ SMS test failed:', smsError);
    results.sms = {
      success: false,
      error: smsError.message,
      stack: smsError.stack
    };
  }

  // 3. Test Email notification
  try {
    console.log('📧 Testing email notification...');
    
    if (!resend || !process.env.RESEND_API_KEY) {
      results.email = {
        success: false,
        error: 'Resend API key not configured'
      };
    } else {
      const emailResult = await resend.emails.send({
        from: 'M10 DJ Company <onboarding@resend.dev>',
        to: ['djbenmurray@gmail.com'],
        subject: '🧪 TEST: Contact Form Notification System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">🧪 Notification Test</h2>
              <p style="margin: 5px 0 0 0;">This is a test email from the diagnostic tool</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
              <h3 style="color: #333;">Test Results</h3>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>SMS Test:</strong> ${results.sms.success ? '✅ Passed' : '❌ Failed'}</p>
              <p><strong>Email Test:</strong> ✅ You're reading this!</p>
              
              ${!results.sms.success ? `
                <div style="margin-top: 20px; padding: 15px; background: #fee; border-left: 4px solid #f00; border-radius: 4px;">
                  <p style="margin: 0; color: #c00;"><strong>SMS Error:</strong> ${results.sms.error || 'Unknown'}</p>
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding: 20px; background: #fcba00; border-radius: 6px;">
                <p style="margin: 0; color: #000;">
                  <strong>✅ If you received this email, email notifications are working!</strong>
                </p>
              </div>
            </div>
          </div>
        `
      });

      results.email = {
        success: true,
        emailId: emailResult.id,
        to: 'djbenmurray@gmail.com'
      };

      console.log('✅ Email test successful:', emailResult.id);
    }

  } catch (emailError) {
    console.error('❌ Email test failed:', emailError);
    results.email = {
      success: false,
      error: emailError.message,
      stack: emailError.stack
    };
  }

  // Return comprehensive results
  return res.status(200).json({
    success: results.sms.success || results.email.success,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      sms: results.sms.success ? '✅ Working' : '❌ Failed',
      email: results.email.success ? '✅ Working' : '❌ Failed',
      recommendations: getRecommendations(results)
    }
  });
}

function getRecommendations(results) {
  const recommendations = [];

  if (!results.environment.RESEND_API_KEY) {
    recommendations.push('Set RESEND_API_KEY environment variable');
  }

  if (!results.environment.ADMIN_PHONE_NUMBER) {
    recommendations.push('Set ADMIN_PHONE_NUMBER environment variable (format: +1234567890)');
  }

  if (!results.environment.TWILIO_ACCOUNT_SID || !results.environment.TWILIO_AUTH_TOKEN) {
    recommendations.push('Configure Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
  }

  if (!results.sms.success && results.sms.error) {
    recommendations.push(`SMS Error: ${results.sms.error}`);
  }

  if (!results.email.success && results.email.error) {
    recommendations.push(`Email Error: ${results.email.error}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operational! ✅');
  }

  return recommendations;
}
