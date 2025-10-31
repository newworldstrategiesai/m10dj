/**
 * Test Send Email
 * Simple endpoint to test if email sending works
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  console.log('🧪 TEST EMAIL - Starting test send...');
  console.log('   RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);
  console.log('   RESEND_API_KEY starts with re_:', process.env.RESEND_API_KEY?.startsWith('re_'));

  if (!resend) {
    console.error('❌ Resend not configured!');
    return res.status(500).json({ 
      error: 'Email service not configured',
      message: 'Please set RESEND_API_KEY in your .env.local file'
    });
  }

  try {
    const testEmail = 'djbenmurray@gmail.com'; // Your admin email
    
    console.log('📧 Sending test email to:', testEmail);

    const result = await resend.emails.send({
      from: 'M10 DJ Company <onboarding@resend.dev>',
      to: [testEmail],
      subject: '✅ Test Email - M10 DJ Admin System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
            <p style="color: #000; margin: 10px 0 0 0; font-size: 16px;">M10 DJ Company Admin System</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">🎉 Great News!</h2>
            
            <p style="color: #333; line-height: 1.6;">
              Your email configuration is working correctly! This test email confirms that:
            </p>
            
            <ul style="color: #333; line-height: 1.8;">
              <li><strong>✅ Resend API is configured</strong></li>
              <li><strong>✅ API key is valid</strong></li>
              <li><strong>✅ Emails can be sent successfully</strong></li>
              <li><strong>✅ HTML formatting works</strong></li>
            </ul>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #155724; margin: 0; font-weight: 600;">
                🚀 Your email system is now fully operational!
              </p>
            </div>
            
            <p style="color: #333; line-height: 1.6;">
              You can now:
            </p>
            
            <ul style="color: #333; line-height: 1.8;">
              <li>Send emails from Form Submissions</li>
              <li>Receive contact form auto-replies</li>
              <li>Get admin notifications</li>
              <li>Send service selection links</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Test sent at</p>
              <p style="color: #333; margin: 5px 0; font-size: 18px; font-weight: bold;">${new Date().toLocaleString()}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                M10 DJ Company - Admin System<br>
                Email Configuration Test
              </p>
            </div>
          </div>
        </div>
      `,
      text: `✅ Email Test Successful!\n\nYour M10 DJ Company email system is working correctly!\n\nTest sent at: ${new Date().toLocaleString()}`
    });

    if (result.error) {
      console.error('❌ Resend API returned error:', result.error);
      return res.status(500).json({
        error: 'Email sending failed',
        details: result.error,
        message: 'Check Resend dashboard for more details'
      });
    }

    console.log('✅ Test email sent successfully!');
    console.log('   Email ID:', result.data?.id);
    console.log('   To:', testEmail);
    console.log('   Check your inbox (and spam folder)!');

    return res.status(200).json({
      success: true,
      message: '✅ Test email sent successfully!',
      emailId: result.data?.id,
      sentTo: testEmail,
      note: 'Check your inbox at djbenmurray@gmail.com (and spam folder if not in inbox)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to send test email',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

