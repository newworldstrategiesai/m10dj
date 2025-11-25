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

/**
 * Send SMS notification to admin
 */
async function sendAdminSMSNotification(eventType, data) {
  if (!adminPhone) {
    console.log('No admin phone configured for SMS notifications');
    return;
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
    
    default:
      return;
  }

  const result = await sendAdminSMS(message);
  if (result.success) {
    console.log(`✅ Admin SMS notification sent for ${eventType}`);
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

