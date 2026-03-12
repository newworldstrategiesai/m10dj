import { sendAdminSMS } from './sms-helper.js';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const adminEmail = process.env.ADMIN_EMAIL || 'djbenmurray@gmail.com';
const adminPhone = process.env.ADMIN_PHONE_NUMBER;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Send admin notification for various lead activities
 * @param {string} eventType - Type of event (email_open, quote_page_open, service_selection, contract_signed, payment_made)
 * @param {Object} data - Event data
 */
export async function sendAdminNotification(eventType, data) {
  try {
    // Send SMS notification (non-blocking)
    sendAdminSMSNotification(eventType, data).catch(err => {
      console.error('SMS notification failed:', err);
    });

    // Send email notification (non-blocking)
    sendAdminEmailNotification(eventType, data).catch(err => {
      console.error('Email notification failed:', err);
    });

    // Log to database (non-blocking)
    logNotificationToDatabase(eventType, data).catch(err => {
      console.error('Database logging failed:', err);
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

/** Page-open event types that are throttled to 1 SMS per contact per day */
const PAGE_OPEN_EVENT_TYPES = ['quote_page_open', 'invoice_page_open'];

/**
 * Check if we already sent an admin SMS for this contact + event type today.
 * Used to throttle quote_page_open and invoice_page_open to 1 SMS per day.
 */
async function alreadySentPageOpenSMSToday(contactId, eventType) {
  if (!contactId || !PAGE_OPEN_EVENT_TYPES.includes(eventType) || !supabaseUrl || !supabaseKey) {
    return false;
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: row } = await supabase
      .from('admin_sms_daily_sent')
      .select('id')
      .eq('contact_id', String(contactId))
      .eq('event_type', eventType)
      .eq('sent_date', today)
      .maybeSingle();
    return !!row;
  } catch (err) {
    console.error('Error checking admin_sms_daily_sent:', err);
    return false; // allow send on error so we don't silence notifications
  }
}

/**
 * Record that we sent an admin SMS for this contact + event type today.
 */
async function recordPageOpenSMSSent(contactId, eventType) {
  if (!contactId || !PAGE_OPEN_EVENT_TYPES.includes(eventType) || !supabaseUrl || !supabaseKey) {
    return;
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('admin_sms_daily_sent').insert({
      contact_id: String(contactId),
      event_type: eventType,
      sent_date: today,
    });
  } catch (err) {
    console.error('Error recording admin_sms_daily_sent:', err);
  }
}

/**
 * Send SMS notification to admin
 * For quote_page_open and invoice_page_open: only one SMS per contact per day; every view is still logged via logNotificationToDatabase.
 */
async function sendAdminSMSNotification(eventType, data) {
  if (!adminPhone) {
    console.log('No admin phone configured for SMS notifications');
    return;
  }

  const contactId = data?.contactId || data?.leadId;
  if (PAGE_OPEN_EVENT_TYPES.includes(eventType) && contactId) {
    const alreadySent = await alreadySentPageOpenSMSToday(contactId, eventType);
    if (alreadySent) {
      console.log(`Admin SMS skipped for ${eventType} (already sent today for contact ${contactId})`);
      return;
    }
  }

  let message = '';

  switch (eventType) {
    case 'email_open':
      message = `📧 EMAIL OPENED\n\n${data.leadName || 'Lead'} opened your email\nSubject: ${data.emailSubject || 'N/A'}\nTime: ${new Date().toLocaleString()}`;
      break;
    
    case 'quote_page_open':
      message = `🔗 QUOTE PAGE OPENED\n\n${data.leadName || 'Lead'} opened their quote page\nEvent: ${data.eventType || 'N/A'}\nDate: ${data.eventDate || 'N/A'}\nView: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${data.leadId}`;
      break;
    
    case 'invoice_page_open':
      message = `📄 INVOICE PAGE OPENED\n\n${data.leadName || 'Client'} opened their invoice\nEvent: ${data.eventType || 'N/A'}\nDate: ${data.eventDate || 'N/A'}\nEmail: ${data.email || 'N/A'}\nView: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${data.leadId}/invoice`;
      break;
    
    case 'service_selection':
      message = `📦 SERVICE SELECTION\n\n${data.leadName || 'Lead'} made a selection\nPackage: ${data.packageName || 'N/A'}\nTotal: $${data.totalPrice || '0'}\nView: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${data.leadId}`;
      break;
    
    case 'contract_signed':
      message = `✍️ CONTRACT SIGNED\n\n${data.leadName || 'Lead'} signed the contract\nEvent: ${data.eventType || 'N/A'}\nDate: ${data.eventDate || 'N/A'}\nTotal: $${data.totalPrice || '0'}\nView: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.contactId || data.leadId}`;
      break;
    
    case 'payment_made':
      message = `💰 PAYMENT RECEIVED\n\n${data.leadName || 'Lead'} made a payment\nAmount: $${data.amount || '0'}\nTotal Paid: $${data.totalPaid || '0'}\nRemaining: $${data.remaining || '0'}\nView: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.contactId || data.leadId}`;
      break;
    
    case 'questionnaire_completed':
      message = `✅ QUESTIONNAIRE COMPLETED\n\n${data.leadName || 'Client'} completed their questionnaire\nEvent: ${data.eventType || 'N/A'}\nDate: ${data.eventDate || 'N/A'}\nView: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.leadId}`;
      break;
    
    case 'questionnaire_submission_failed':
      message = `🚨 QUESTIONNAIRE SUBMISSION FAILED\n\n${data.leadName || 'Client'} tried to submit but it failed\nError: ${data.error || 'Unknown error'}\nError Type: ${data.errorType || 'Unknown'}\nLead ID: ${data.leadId}\n⚠️ ACTION REQUIRED: Check submission log and recover data`;
      break;

    case 'crowd_request_payment':
      message = `🎵 SONG REQUEST PAID\n\n${data.requestDetail || 'Request'}\nFrom: ${data.requesterName || 'Guest'}\nAmount: $${typeof data.amount === 'number' ? data.amount.toFixed(2) : data.amount || '0'}\nEvent: ${data.eventCode || '—'}\n${data.paymentIntentId ? `Stripe: ${data.paymentIntentId}` : ''}`.trim();
      break;

    default:
      return;
  }

  const result = await sendAdminSMS(message);
  if (result.success) {
    console.log(`✅ Admin SMS notification sent for ${eventType}`);
    if (PAGE_OPEN_EVENT_TYPES.includes(eventType) && contactId) {
      recordPageOpenSMSSent(contactId, eventType).catch(err => {
        console.error('Failed to record admin_sms_daily_sent:', err);
      });
    }
  } else {
    console.error(`❌ Failed to send SMS notification for ${eventType}:`, result.error);
  }
}

/**
 * Send email notification to admin
 */
async function sendAdminEmailNotification(eventType, data) {
  if (!resend) {
    console.log('Resend not configured for email notifications');
    return;
  }

  let subject = '';
  let htmlContent = '';

  switch (eventType) {
    case 'email_open':
      subject = `📧 Email Opened: ${data.leadName || 'Lead'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0;">📧 Email Opened</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Lead:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Email Subject:</strong> ${data.emailSubject || 'N/A'}</p>
            <p><strong>Opened At:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;
    
    case 'quote_page_open':
      subject = `🔗 Quote Page Opened: ${data.leadName || 'Lead'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0;">🔗 Quote Page Opened</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Lead:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Event Type:</strong> ${data.eventType || 'N/A'}</p>
            <p><strong>Event Date:</strong> ${data.eventDate || 'N/A'}</p>
            <p><strong>Opened At:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${data.leadId}" 
                 style="background: #fcba00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Quote Page
              </a>
            </div>
          </div>
        </div>
      `;
      break;
    
    case 'invoice_page_open':
      subject = `📄 Invoice Viewed: ${data.leadName || 'Client'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0;">📄 Invoice Page Opened</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Client:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
            <p><strong>Event Type:</strong> ${data.eventType || 'N/A'}</p>
            <p><strong>Event Date:</strong> ${data.eventDate || 'N/A'}</p>
            <p><strong>Viewed At:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${data.leadId}/invoice" 
                 style="background: #3b82f6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Invoice
              </a>
            </div>
          </div>
        </div>
      `;
      break;
    
    case 'service_selection':
      subject = `📦 Service Selection: ${data.leadName || 'Lead'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0;">📦 Service Selection Made</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Lead:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Package:</strong> ${data.packageName || 'N/A'}</p>
            <p><strong>Total Price:</strong> $${data.totalPrice || '0'}</p>
            <p><strong>Selected At:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${data.leadId}" 
                 style="background: #fcba00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Selection
              </a>
            </div>
          </div>
        </div>
      `;
      break;
    
    case 'contract_signed':
      subject = `✍️ Contract Signed: ${data.leadName || 'Lead'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0;">✍️ Contract Signed!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Lead:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Event Type:</strong> ${data.eventType || 'N/A'}</p>
            <p><strong>Event Date:</strong> ${data.eventDate || 'N/A'}</p>
            <p><strong>Total Price:</strong> $${data.totalPrice || '0'}</p>
            <p><strong>Signed At:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.contactId || data.leadId}" 
                 style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Contact
              </a>
            </div>
          </div>
        </div>
      `;
      break;
    
    case 'payment_made':
      subject = `💰 Payment Received: ${data.leadName || 'Lead'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0;">💰 Payment Received!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Lead:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Payment Amount:</strong> $${data.amount || '0'}</p>
            <p><strong>Total Paid:</strong> $${data.totalPaid || '0'}</p>
            <p><strong>Remaining Balance:</strong> $${data.remaining || '0'}</p>
            <p><strong>Paid At:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.contactId || data.leadId}" 
                 style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Contact
              </a>
            </div>
          </div>
        </div>
      `;
      break;
    
    case 'questionnaire_completed':
      subject = `✅ Questionnaire Completed: ${data.leadName || 'Client'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0;">✅ Questionnaire Completed!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Client:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Event Type:</strong> ${data.eventType || 'N/A'}</p>
            <p><strong>Event Date:</strong> ${data.eventDate || 'N/A'}</p>
            <p><strong>Completed At:</strong> ${new Date(data.completedAt || Date.now()).toLocaleString()}</p>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.leadId}" 
                 style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Contact
              </a>
            </div>
          </div>
        </div>
      `;
      break;
    
    case 'questionnaire_submission_failed':
      subject = `🚨 URGENT: Questionnaire Submission Failed - ${data.leadName || 'Client'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0;">🚨 Questionnaire Submission Failed</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #dc2626; margin-top: 0;">⚠️ ACTION REQUIRED</h3>
              <p style="color: #991b1b; margin-bottom: 0;">A client tried to submit their questionnaire but it failed. The submission data may be recoverable from the audit log.</p>
            </div>
            <p><strong>Client:</strong> ${data.leadName || 'N/A'}</p>
            <p><strong>Lead ID:</strong> ${data.leadId || 'N/A'}</p>
            <p><strong>Error Type:</strong> ${data.errorType || 'Unknown'}</p>
            <p><strong>Error Message:</strong> ${data.error || 'Unknown error'}</p>
            <p><strong>Failed At:</strong> ${new Date(data.timestamp || Date.now()).toLocaleString()}</p>
            ${data.submissionData?.hasData ? '<p style="color: #059669;"><strong>✅ Data was present in submission</strong></p>' : '<p style="color: #dc2626;"><strong>❌ No data in submission</strong></p>'}
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/contacts/${data.leadId}" 
                 style="background: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">
                View Contact
              </a>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/questionnaire-recovery?leadId=${data.leadId}" 
                 style="background: #fcba00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">
                Recover Submission
              </a>
            </div>
          </div>
        </div>
      `;
      break;

    case 'crowd_request_payment':
      subject = `🎵 Song Request Paid: ${data.requestDetail || 'Request'} – $${typeof data.amount === 'number' ? data.amount.toFixed(2) : data.amount || '0'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0;">🎵 Song Request Paid</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p><strong>Request:</strong> ${data.requestDetail || 'N/A'}</p>
            <p><strong>From:</strong> ${data.requesterName || 'Guest'}</p>
            <p><strong>Amount:</strong> $${typeof data.amount === 'number' ? data.amount.toFixed(2) : data.amount || '0'}</p>
            <p><strong>Event:</strong> ${data.eventCode || '—'}</p>
            ${data.paymentIntentId ? `<p><strong>Stripe:</strong> ${data.paymentIntentId}</p>` : ''}
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/requests" 
                 style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Requests
              </a>
            </div>
          </div>
        </div>
      `;
      break;

    default:
      return;
  }

  try {
    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: [adminEmail],
      subject: subject,
      html: htmlContent
    });
    console.log(`✅ Admin email notification sent for ${eventType}`);
  } catch (error) {
    console.error(`❌ Failed to send email notification for ${eventType}:`, error);
  }
}

/**
 * Log notification to database
 */
async function logNotificationToDatabase(eventType, data) {
  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to insert into communication_log table
    const { error: insertError } = await supabase.from('communication_log').insert({
      contact_id: data.contactId || data.leadId,
      communication_type: 'admin_notification',
      subject: `${eventType}: ${data.leadName || 'Lead'}`,
      notes: JSON.stringify(data),
      created_at: new Date().toISOString()
    });
    
    if (insertError) {
      // Table might not exist, that's okay
      console.log('Could not log to communication_log:', insertError.message);
    }
  } catch (error) {
    console.error('Error logging notification to database:', error);
  }
}

