/**
 * Comprehensive Client Notification System
 * Handles email and SMS notifications for all client-facing events
 */

import { Resend } from 'resend';
import { sendAdminSMS } from './sms-helper.js';
import { createClient } from '@supabase/supabase-js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Send notification for quote generated
 */
export async function notifyQuoteGenerated(contactId, quoteData) {
  try {
    // Get contact info
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email_address, phone, event_type, event_date, venue_name')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.email_address) {
      console.log('No contact or email found for quote notification');
      return { success: false, error: 'Contact not found' };
    }

    const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contactId}`;
    const contactName = contact.first_name || 'there';
    const isWedding = contact.event_type && contact.event_type.toLowerCase().includes('wedding');

    // Send email
    if (resend) {
      const emailSubject = isWedding
        ? `Your Personalized Wedding DJ Quote is Ready! 💍`
        : `Your Personalized DJ Quote is Ready!`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0;">${isWedding ? 'Your Wedding Quote is Ready! 💍' : 'Your Quote is Ready!'}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi ${contactName},</p>
            
            <p>Great news! Your personalized quote for ${isWedding ? 'your wedding' : `your ${contact.event_type || 'event'}`} is ready to review.</p>
            
            ${contact.event_date ? `<p><strong>Event Date:</strong> ${new Date(contact.event_date).toLocaleDateString()}</p>` : ''}
            ${contact.venue_name ? `<p><strong>Venue:</strong> ${contact.venue_name}</p>` : ''}
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Review your personalized package options</li>
                <li>Select the perfect package for your ${isWedding ? 'wedding' : 'event'}</li>
                <li>Add any additional services you need</li>
                <li>Secure your date with a deposit</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${quoteUrl}" 
                 style="background: #fcba00; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
                View Your Quote →
              </a>
            </div>
            
            <p>If you have any questions, feel free to reply to this email or call me directly at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a>.</p>
            
            <p>Looking forward to making your ${isWedding ? 'wedding day' : 'event'} unforgettable!</p>
            
            <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: [contact.email_address],
        subject: emailSubject,
        html: emailHtml
      });
    }

    // Send SMS if phone available
    if (contact.phone) {
      const smsMessage = `Hi ${contactName}! Your personalized ${isWedding ? 'wedding' : 'DJ'} quote is ready! View it here: ${quoteUrl} Questions? Call (901) 410-2020`;
      await sendAdminSMS(smsMessage, contact.phone).catch(err => {
        console.error('SMS notification failed:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending quote generated notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification for payment received
 */
export async function notifyPaymentReceived(contactId, paymentData) {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email_address, phone, event_type, event_date')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.email_address) {
      return { success: false, error: 'Contact not found' };
    }

    const contactName = contact.first_name || 'there';
    const amount = paymentData.amount || 0;
    const isDeposit = paymentData.payment_type === 'deposit';
    const isWedding = contact.event_type && contact.event_type.toLowerCase().includes('wedding');

    // Send email
    if (resend) {
      const emailSubject = isDeposit
        ? `Payment Received - Thank You! 🎉`
        : `Payment Confirmed - You're All Set! 🎉`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">${isDeposit ? 'Payment Received! 🎉' : 'Payment Confirmed! 🎉'}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi ${contactName},</p>
            
            <p>Thank you! We've received your ${isDeposit ? 'deposit' : 'payment'} of <strong>$${amount.toFixed(2)}</strong>.</p>
            
            ${isDeposit ? `
              <p>Your ${isWedding ? 'wedding' : 'event'} date is now secured! We're excited to be part of your special day.</p>
              <p>Next steps:</p>
              <ul>
                <li>Review and sign your contract (if not already signed)</li>
                <li>Complete your music questionnaire</li>
                <li>We'll be in touch soon to finalize all the details</li>
              </ul>
            ` : `
              <p>Your payment is complete! You're all set for your ${isWedding ? 'wedding' : 'event'}.</p>
              <p>We'll be in touch soon to finalize all the details and make sure everything is perfect for your special day.</p>
            `}
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0;"><strong>Payment Details:</strong></p>
              <p style="margin: 5px 0;">Amount: $${amount.toFixed(2)}</p>
              <p style="margin: 5px 0;">Payment Type: ${isDeposit ? 'Deposit' : 'Full Payment'}</p>
              <p style="margin: 5px 0;">Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>If you have any questions, feel free to reply to this email or call me at <a href="tel:+19014102020" style="color: #10b981; font-weight: bold;">(901) 410-2020</a>.</p>
            
            <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: [contact.email_address],
        subject: emailSubject,
        html: emailHtml
      });
    }

    // Send SMS
    if (contact.phone) {
      const smsMessage = `Hi ${contactName}! We received your ${isDeposit ? 'deposit' : 'payment'} of $${amount.toFixed(2)}. Thank you! Your ${isWedding ? 'wedding' : 'event'} date is secured. Questions? (901) 410-2020`;
      await sendAdminSMS(smsMessage, contact.phone).catch(err => {
        console.error('SMS notification failed:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification for contract signed
 */
export async function notifyContractSigned(contactId, contractData) {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email_address, phone, event_type, event_date')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.email_address) {
      return { success: false, error: 'Contact not found' };
    }

    const contactName = contact.first_name || 'there';
    const isWedding = contact.event_type && contact.event_type.toLowerCase().includes('wedding');
    const contractUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contactId}/contract`;

    // Send email
    if (resend) {
      const emailSubject = isWedding
        ? `Contract Signed - Your Wedding is Confirmed! 💍`
        : `Contract Signed - Your Event is Confirmed!`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">${isWedding ? 'Contract Signed! 💍' : 'Contract Signed!'}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi ${contactName},</p>
            
            <p>Excellent! Your contract has been signed and your ${isWedding ? 'wedding' : 'event'} is officially confirmed!</p>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Complete your music questionnaire (we'll send you a link soon)</li>
                <li>Share any special requests or timeline details</li>
                <li>We'll schedule a final planning call about 2 weeks before your ${isWedding ? 'wedding' : 'event'}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${contractUrl}" 
                 style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
                View Your Contract →
              </a>
            </div>
            
            <p>If you have any questions or need to make changes, just reply to this email or call me at <a href="tel:+19014102020" style="color: #3b82f6; font-weight: bold;">(901) 410-2020</a>.</p>
            
            <p>We're so excited to be part of your ${isWedding ? 'wedding day' : 'event'}!</p>
            
            <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: [contact.email_address],
        subject: emailSubject,
        html: emailHtml
      });
    }

    // Send SMS
    if (contact.phone) {
      const smsMessage = `Hi ${contactName}! Your contract is signed and your ${isWedding ? 'wedding' : 'event'} is confirmed! 🎉 We'll send your music questionnaire soon. Questions? (901) 410-2020`;
      await sendAdminSMS(smsMessage, contact.phone).catch(err => {
        console.error('SMS notification failed:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending contract signed notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send music questionnaire reminder
 */
export async function notifyMusicQuestionnaireReminder(contactId, daysUntilEvent) {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email_address, phone, event_type, event_date')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.email_address) {
      return { success: false, error: 'Contact not found' };
    }

    const contactName = contact.first_name || 'there';
    const isWedding = contact.event_type && contact.event_type.toLowerCase().includes('wedding');
    const questionnaireUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contactId}/music-questionnaire`;

    // Send email
    if (resend) {
      const emailSubject = daysUntilEvent <= 7
        ? `⏰ Urgent: Complete Your Music Questionnaire - ${daysUntilEvent} Days Until Your ${isWedding ? 'Wedding' : 'Event'}!`
        : `Reminder: Complete Your Music Questionnaire`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">${daysUntilEvent <= 7 ? '⏰ Time-Sensitive!' : 'Music Questionnaire Reminder'}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi ${contactName},</p>
            
            ${daysUntilEvent <= 7 ? `
              <p><strong>Your ${isWedding ? 'wedding' : 'event'} is in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}!</strong></p>
              <p>To ensure everything is perfect, please complete your music questionnaire as soon as possible.</p>
            ` : `
              <p>Just a friendly reminder to complete your music questionnaire for your ${isWedding ? 'wedding' : 'event'}.</p>
            `}
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0;"><strong>What you'll provide:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Must-play songs</li>
                <li>Do-not-play songs</li>
                <li>Special moments (first dance, parent dances, etc.)</li>
                <li>Music preferences and genres</li>
                <li>Event timeline details</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${questionnaireUrl}" 
                 style="background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
                Complete Questionnaire →
              </a>
            </div>
            
            <p>This takes just 5-10 minutes and helps us create the perfect playlist for your ${isWedding ? 'wedding' : 'event'}!</p>
            
            <p>Questions? Call me at <a href="tel:+19014102020" style="color: #f59e0b; font-weight: bold;">(901) 410-2020</a>.</p>
            
            <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: [contact.email_address],
        subject: emailSubject,
        html: emailHtml
      });
    }

    // Send SMS
    if (contact.phone) {
      const smsMessage = daysUntilEvent <= 7
        ? `Hi ${contactName}! ⏰ Your ${isWedding ? 'wedding' : 'event'} is in ${daysUntilEvent} days! Please complete your music questionnaire: ${questionnaireUrl}`
        : `Hi ${contactName}! Reminder: Complete your music questionnaire for your ${isWedding ? 'wedding' : 'event'}: ${questionnaireUrl}`;
      
      await sendAdminSMS(smsMessage, contact.phone).catch(err => {
        console.error('SMS notification failed:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending questionnaire reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send event confirmation notification (1 week before event)
 */
export async function notifyEventConfirmation(contactId, eventData) {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email_address, phone, event_type, event_date, venue_name, venue_address')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.email_address) {
      return { success: false, error: 'Contact not found' };
    }

    const contactName = contact.first_name || 'there';
    const isWedding = contact.event_type && contact.event_type.toLowerCase().includes('wedding');
    const eventDate = contact.event_date ? new Date(contact.event_date) : null;
    const daysUntilEvent = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
    const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contactId}`;

    // Send email
    if (resend) {
      const emailSubject = isWedding
        ? `Your Wedding is Almost Here! Final Confirmation & Details 💍`
        : `Your Event is Almost Here! Final Confirmation & Details`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">${isWedding ? 'Your Wedding is Almost Here! 💍' : 'Your Event is Almost Here!'}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi ${contactName},</p>
            
            <p><strong>We're just ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''} away from your ${isWedding ? 'wedding' : 'event'}!</strong></p>
            
            <p>I wanted to reach out to confirm all the final details and make sure everything is perfect for your special day.</p>
            
            <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
              <p style="margin: 0;"><strong>Event Details:</strong></p>
              ${eventDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
              ${contact.venue_name ? `<p style="margin: 5px 0;"><strong>Venue:</strong> ${contact.venue_name}</p>` : ''}
              ${contact.venue_address ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${contact.venue_address}</p>` : ''}
            </div>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0;"><strong>Final Checklist:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ Music questionnaire completed</li>
                <li>✅ Contract signed</li>
                <li>✅ Payment confirmed</li>
                <li>⏳ Final timeline review (we'll call you this week)</li>
                <li>⏳ Special requests confirmed</li>
              </ul>
            </div>
            
            <p><strong>What to Expect:</strong></p>
            <ul>
              <li>I'll call you this week to review the final timeline and any last-minute details</li>
              <li>I'll arrive ${isWedding ? '1 hour before your ceremony' : '30-60 minutes before your event'} to set up</li>
              <li>All equipment will be tested and ready to go</li>
              <li>I'll coordinate with your venue and other vendors</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${quoteUrl}" 
                 style="background: #8b5cf6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
                View Your Event Details →
              </a>
            </div>
            
            <p>If you have any questions, concerns, or last-minute changes, please don't hesitate to reach out!</p>
            
            <p>Call me anytime: <a href="tel:+19014102020" style="color: #8b5cf6; font-weight: bold;">(901) 410-2020</a></p>
            
            <p>I'm so excited to be part of your ${isWedding ? 'wedding day' : 'event'}! Let's make it absolutely perfect!</p>
            
            <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>',
        to: [contact.email_address],
        subject: emailSubject,
        html: emailHtml
      });
    }

    // Send SMS
    if (contact.phone) {
      const smsMessage = `Hi ${contactName}! Your ${isWedding ? 'wedding' : 'event'} is in ${daysUntilEvent} days! 🎉 I'll call you this week to finalize details. Questions? (901) 410-2020`;
      await sendAdminSMS(smsMessage, contact.phone).catch(err => {
        console.error('SMS notification failed:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending event confirmation notification:', error);
    return { success: false, error: error.message };
  }
}

