// Enhanced notification system with redundancy and monitoring
import { sendAdminSMS, formatContactSubmissionSMS } from './sms-helper.js';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Enhanced notification system with multiple fallback methods
 * @param {Object} submissionData - Contact form submission data
 * @param {Object} dbSubmission - Database submission record
 * @returns {Object} Notification results
 */
export async function sendEnhancedNotifications(submissionData, dbSubmission) {
  const results = {
    sms: { success: false, error: null, attempts: 0 },
    email: { success: false, error: null },
    database: { success: false, error: null },
    summary: { totalAttempts: 0, successfulMethods: 0 }
  };

  // 1. SMS Notification with retry logic
  await sendSMSWithRetry(submissionData, results);

  // 2. Email Notification (existing)
  await sendEmailNotification(submissionData, dbSubmission, results);

  // 3. Database logging
  await logNotificationAttempt(submissionData, dbSubmission, results);

  // 4. Critical lead alert if all methods fail
  await handleCriticalNotificationFailure(submissionData, results);

  return results;
}

/**
 * SMS notification with retry logic and multiple phone numbers
 */
async function sendSMSWithRetry(submissionData, results) {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  // Multiple admin phone numbers for redundancy
  const adminPhones = [
    process.env.ADMIN_PHONE_NUMBER,
    process.env.BACKUP_ADMIN_PHONE,
    process.env.EMERGENCY_CONTACT_PHONE
  ].filter(phone => phone && phone.trim());

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    results.sms.attempts = attempt;
    results.summary.totalAttempts++;

    try {
      const smsMessage = formatContactSubmissionSMS(submissionData);
      
      // Try primary phone first, then backups
      for (const phoneNumber of adminPhones) {
        try {
          console.log(`SMS attempt ${attempt} to ${phoneNumber}`);
          const smsResult = await sendAdminSMS(smsMessage, phoneNumber);
          
          if (smsResult.success) {
            results.sms.success = true;
            results.sms.phoneUsed = phoneNumber;
            results.sms.smsId = smsResult.smsId;
            results.summary.successfulMethods++;
            console.log(`✅ SMS sent successfully on attempt ${attempt} to ${phoneNumber}`);
            return; // Success, exit retry loop
          } else {
            console.log(`❌ SMS failed to ${phoneNumber}: ${smsResult.error}`);
          }
        } catch (phoneError) {
          console.log(`❌ SMS error for ${phoneNumber}:`, phoneError.message);
        }
      }

      // If we get here, all phones failed for this attempt
      if (attempt < maxRetries) {
        console.log(`SMS attempt ${attempt} failed for all phones, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

    } catch (error) {
      console.error(`SMS attempt ${attempt} error:`, error);
      results.sms.error = error.message;
    }
  }

  // All attempts failed
  results.sms.success = false;
  results.sms.error = `All ${maxRetries} SMS attempts failed to ${adminPhones.length} phone numbers`;
  console.error(`🚨 CRITICAL: All SMS notification attempts failed!`);
}

/**
 * Enhanced email notification
 */
async function sendEmailNotification(submissionData, dbSubmission, results) {
  if (!resend || !process.env.RESEND_API_KEY) {
    results.email.error = 'Email service not configured';
    return;
  }

  try {
    const { name, email, phone, eventType, eventDate, location, message } = submissionData;

    // High-priority email for admin notification
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">🚨 URGENT: New Contact Form Submission</h2>
          <p style="margin: 5px 0 0 0; color: #fecaca;">
            ${results.sms.success ? 'SMS notification sent successfully' : '⚠️ SMS NOTIFICATION FAILED - Check immediately!'}
          </p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Client Information</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
          
          <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Event Details</h3>
          <p><strong>Event Type:</strong> ${eventType}</p>
          ${eventDate ? `<p><strong>Event Date:</strong> ${eventDate}</p>` : ''}
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
          
          ${message ? `
            <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Message</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #fcba00;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          ` : ''}
          
          ${!results.sms.success ? `
            <div style="margin-top: 30px; padding: 20px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 6px;">
              <h4 style="color: #dc2626; margin-top: 0;">⚠️ SMS Notification Failed</h4>
              <p style="color: #991b1b; margin-bottom: 0;">
                SMS notification could not be delivered. Please check this lead immediately to avoid missing the opportunity.
                <br><strong>SMS Error:</strong> ${results.sms.error || 'Unknown error'}
              </p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background: #fcba00; border-radius: 6px; text-align: center;">
            <p style="margin: 0; color: #000; font-weight: bold;">
              Database ID: ${dbSubmission.id}
            </p>
            <p style="margin: 5px 0 15px 0; color: #000; font-size: 14px;">
              Submitted: ${new Date().toLocaleString()}
            </p>
            
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/leads/${dbSubmission.id}" 
               style="display: inline-block; background: #000; color: #fcba00; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0;">
              📋 View Lead Details
            </a>
          </div>
        </div>
      </div>
    `;

    // Send to multiple admin emails for redundancy
    const adminEmails = [
      'm10djcompany@gmail.com',
      process.env.BACKUP_ADMIN_EMAIL,
      process.env.EMERGENCY_CONTACT_EMAIL
    ].filter(email => email && email.trim());

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: adminEmails,
      subject: `🚨 URGENT: New ${eventType} Inquiry from ${name} ${!results.sms.success ? '- SMS FAILED' : ''}`,
      html: adminEmailHtml,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    results.email.success = true;
    results.summary.successfulMethods++;
    console.log('✅ Enhanced email notification sent successfully');

  } catch (emailError) {
    console.error('❌ Email notification failed:', emailError);
    results.email.error = emailError.message;
  }
}

/**
 * Log notification attempt to database for monitoring
 */
async function logNotificationAttempt(submissionData, dbSubmission, results) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const logData = {
      contact_submission_id: dbSubmission?.id || null,
      notification_type: 'lead_alert',
      sms_success: results.sms.success,
      sms_attempts: results.sms.attempts,
      sms_error: results.sms.error,
      email_success: results.email.success,
      email_error: results.email.error,
      total_attempts: results.summary.totalAttempts,
      successful_methods: results.summary.successfulMethods,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notification_log')
      .insert([logData]);

    if (error) {
      // Don't fail the entire notification system if logging fails
      console.warn('⚠️ Failed to log notification attempt (this is not critical):', error.message);
      results.database.error = error.message;
    } else {
      results.database.success = true;
      console.log('✅ Notification attempt logged to database');
    }

  } catch (error) {
    // Don't fail the entire notification system if logging fails
    console.warn('⚠️ Database logging error (this is not critical):', error.message);
    results.database.error = error.message;
  }
}

/**
 * Handle critical notification failure - last resort measures
 */
async function handleCriticalNotificationFailure(submissionData, results) {
  // If both SMS and email failed, this is critical
  if (!results.sms.success && !results.email.success) {
    console.error('🚨 CRITICAL ALERT: ALL NOTIFICATION METHODS FAILED!');
    
    try {
      // Try alternative email service or webhook
      await sendCriticalAlert(submissionData, results);
    } catch (error) {
      console.error('Critical alert failed:', error);
    }
  }
}

/**
 * Send critical alert through alternative channels
 */
async function sendCriticalAlert(submissionData, results) {
  // This could integrate with services like:
  // - PagerDuty
  // - Slack webhook
  // - Discord webhook
  // - Alternative email service
  
  const webhookUrl = process.env.CRITICAL_ALERT_WEBHOOK;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 CRITICAL: M10 DJ Company missed lead notification!\n\nClient: ${submissionData.name}\nEmail: ${submissionData.email}\nPhone: ${submissionData.phone || 'Not provided'}\nEvent: ${submissionData.eventType}\n\nBoth SMS and email notifications failed. Check admin dashboard immediately!`,
          username: 'M10 DJ Alert System'
        })
      });

      if (response.ok) {
        console.log('✅ Critical alert sent via webhook');
      }
    } catch (error) {
      console.error('Webhook alert failed:', error);
    }
  }
}

/**
 * Test notification system health
 */
export async function testNotificationSystem() {
  const testData = {
    name: 'System Health Check',
    email: 'test@m10djcompany.com',
    phone: process.env.ADMIN_PHONE_NUMBER,
    eventType: 'System Test',
    eventDate: new Date().toISOString().split('T')[0],
    location: 'System Test',
    message: 'This is an automated health check of the notification system.'
  };

  const fakeDbSubmission = { id: 'health-check-' + Date.now() };
  
  console.log('🔍 Running notification system health check...');
  const results = await sendEnhancedNotifications(testData, fakeDbSubmission);
  
  console.log('📊 Health check results:', {
    smsSuccess: results.sms.success,
    emailSuccess: results.email.success,
    totalMethods: results.summary.successfulMethods,
    overallHealth: results.summary.successfulMethods > 0 ? 'HEALTHY' : 'CRITICAL'
  });

  return results;
}
