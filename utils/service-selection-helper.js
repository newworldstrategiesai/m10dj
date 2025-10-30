/**
 * Service Selection Link Helper
 * 
 * Utility functions for generating and sending service selection links to leads
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Generate a secure service selection token for a contact
 * @param {Object} contact - Contact object from database
 * @returns {string} Base64URL encoded token
 */
export function generateServiceSelectionToken(contact) {
  const tokenData = {
    contactId: contact.id,
    email: contact.email_address,
    timestamp: Date.now(),
    // Add a secret hash to prevent tampering
    hash: crypto
      .createHash('sha256')
      .update(`${contact.id}${contact.email_address}${process.env.NEXTAUTH_SECRET || 'default-secret'}`)
      .digest('hex')
      .substring(0, 16)
  };

  return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
}

/**
 * Generate service selection link for a contact
 * @param {Object} contact - Contact object from database
 * @returns {string} Full URL to service selection page
 */
export function generateServiceSelectionLink(contact) {
  const token = generateServiceSelectionToken(contact);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  return `${baseUrl}/select-services/${token}`;
}

/**
 * Send service selection email to a lead
 * @param {Object} contact - Contact object with first_name, last_name, email_address
 * @param {string} serviceSelectionLink - Full URL to service selection page
 * @returns {Promise<Object>} Result of email send
 */
export async function sendServiceSelectionEmail(contact, serviceSelectionLink) {
  if (!resend) {
    console.error('⚠️ Resend API key not configured - cannot send service selection email');
    return { success: false, error: 'Email service not configured' };
  }

  const firstName = contact.first_name || 'there';
  const eventType = contact.event_type || 'event';
  const eventDate = contact.event_date 
    ? new Date(contact.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'your upcoming event';
  const venue = contact.venue_name || '';

  // Create professional HTML email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #000; margin: 0; font-size: 28px;">Select Your Perfect Package</h1>
        <p style="color: #000; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">M10 DJ Company - Premium Wedding Entertainment</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 18px; margin-bottom: 20px;">
          Hi ${firstName},
        </p>
        
        <p style="color: #555; line-height: 1.8; margin-bottom: 20px;">
          Thank you for reaching out about DJ services for ${eventDate}${venue ? ` at ${venue}` : ''}! 
          I'm excited to help make your ${eventType} unforgettable.
        </p>
        
        <p style="color: #555; line-height: 1.8; margin-bottom: 25px;">
          To help me prepare the perfect proposal for you, I've created a personalized service selection page where you can:
        </p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #fcba00; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
          <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 2;">
            <li>✨ Compare our 3 wedding packages side-by-side</li>
            <li>🎵 Choose premium add-ons (uplighting, monogram projection, special effects)</li>
            <li>💰 See your total investment in real-time</li>
            <li>📝 Add any special requests or questions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${serviceSelectionLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #fcba00, #e6a800); color: #000; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;">
            🎯 Select Your Services Now
          </a>
        </div>
        
        <p style="color: #777; font-size: 14px; text-align: center; margin-bottom: 25px;">
          This will only take 2-3 minutes • All prices shown • No signup required
        </p>
        
        <div style="background: #fff5e6; border: 2px solid #fcba00; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="color: #333; margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">
            ⚡ What Happens Next?
          </p>
          <p style="color: #555; margin: 0; line-height: 1.8;">
            Once you submit your selections, I'll review your choices and prepare a detailed custom proposal. 
            You'll hear back from me within <strong>24 hours</strong> with pricing, next steps, and answers to any questions you have.
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.8; margin-top: 25px;">
          Have questions right now? Feel free to call or text me anytime at <strong style="color: #fcba00;">(901) 410-2020</strong>.
          I'm here to help!
        </p>
        
        <p style="color: #555; margin-top: 25px;">
          Looking forward to making your celebration unforgettable! 🎉
        </p>
        
        <p style="color: #333; margin-top: 20px;">
          Best,<br>
          <strong>Ben Murray</strong><br>
          <span style="color: #888;">M10 DJ Company</span>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #fcba00; text-align: center;">
          <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">📞 Phone:</strong> (901) 410-2020</p>
          <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">📧 Email:</strong> djbenmurray@gmail.com</p>
          <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">🌐 Website:</strong> m10djcompany.com</p>
          <p style="color: #999; font-size: 12px; margin-top: 15px;">
            M10 DJ Company - Memphis, TN & Surrounding Areas<br>
            Premium Wedding & Event Entertainment
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">
          You're receiving this email because you contacted us about DJ services.<br>
          If you have any questions, just reply to this email or give us a call.
        </p>
      </div>
    </div>
  `;

  // Plain text version
  const emailText = `
Hi ${firstName},

Thank you for reaching out about DJ services for ${eventDate}${venue ? ` at ${venue}` : ''}! I'm excited to help make your ${eventType} unforgettable.

To help me prepare the perfect proposal for you, I've created a personalized service selection page where you can:

✨ Compare our 3 wedding packages side-by-side
🎵 Choose premium add-ons (uplighting, monogram projection, special effects)
💰 See your total investment in real-time
📝 Add any special requests or questions

SELECT YOUR SERVICES NOW:
${serviceSelectionLink}

This will only take 2-3 minutes. All prices are shown upfront, and no signup is required.

⚡ WHAT HAPPENS NEXT?
Once you submit your selections, I'll review your choices and prepare a detailed custom proposal. You'll hear back from me within 24 hours with pricing, next steps, and answers to any questions you have.

Have questions right now? Feel free to call or text me anytime at (901) 410-2020. I'm here to help!

Looking forward to making your celebration unforgettable! 🎉

Best,
Ben Murray
M10 DJ Company
(901) 410-2020
www.m10djcompany.com

---
You're receiving this email because you contacted us about DJ services.
If you have any questions, just reply to this email or give us a call.
  `;

  try {
    const result = await resend.emails.send({
      from: 'M10 DJ Company <onboarding@resend.dev>',
      to: [contact.email_address],
      subject: `🎵 Select Your ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} DJ Package - M10 DJ Company`,
      html: emailHtml,
      text: emailText
    });

    console.log(`✅ Service selection email sent to ${contact.email_address}`);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send service selection email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete flow: Generate link, save to database, and send email
 * @param {Object} contact - Contact object from database
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<Object>} Result with link and email status
 */
export async function sendServiceSelectionToLead(contact, supabase) {
  try {
    // Generate the link
    const token = generateServiceSelectionToken(contact);
    const link = generateServiceSelectionLink(contact);

    // Save token to contact's custom_fields
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        custom_fields: {
          ...contact.custom_fields,
          service_selection_token: token,
          service_selection_link: link,
          token_generated_at: new Date().toISOString(),
          link_sent_at: new Date().toISOString()
        },
        lead_status: 'Service Selection Sent'
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('Error saving token to contact:', updateError);
    }

    // Send the email
    const emailResult = await sendServiceSelectionEmail(contact, link);

    return {
      success: true,
      link,
      emailSent: emailResult.success,
      emailError: emailResult.error
    };
  } catch (error) {
    console.error('Error in sendServiceSelectionToLead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

