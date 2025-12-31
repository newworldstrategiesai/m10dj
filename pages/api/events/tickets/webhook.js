/**
 * Stripe webhook handler for ticket purchases
 * Handles checkout.session.completed event
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { updateTicketPayment } from '../../../../utils/event-tickets';
import { getEventDetails, getFullAddress } from '../../../../utils/event-details';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2025-07-30.preview',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_LIVE;

// Helper to get raw body for Stripe webhook verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data, 'utf8'));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing stripe-signature or webhook secret' });
  }

  let event;
  let rawBody;

  try {
    // Get raw body for signature verification
    rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const ticketId = session.metadata?.ticket_id;
      
      if (!ticketId) {
        console.error('No ticket_id in session metadata');
        // Log error but return 200 to Stripe to prevent webhook disable
        // Missing metadata is a data issue, not a webhook delivery issue
        return res.status(200).json({ 
          received: true,
          error: 'Missing ticket_id in metadata',
          warning: 'Event received but could not process due to missing metadata'
        });
      }

      // Update ticket payment status
      const updateResult = await updateTicketPayment(
        ticketId,
        'paid',
        session.id,
        session.payment_intent,
        'stripe'
      );

      if (!updateResult.success) {
        console.error('Error updating ticket payment:', updateResult.error);
        // Log error but still return 200 to Stripe to prevent webhook disable
        // The error is logged for investigation, but we acknowledge receipt
      }

      // Send confirmation email with QR code
      await sendTicketConfirmationEmail(session);

      console.log('Ticket payment confirmed:', ticketId);
    } catch (error) {
      console.error('Error processing webhook:', error);
      // CRITICAL: Always return 200 to Stripe, even on errors
      // Stripe requires 200-299 status codes. Returning 500 causes Stripe to retry and eventually disable the webhook
      // Log the error but acknowledge receipt to prevent webhook disable
      return res.status(200).json({ 
        received: true,
        error: 'Webhook processing encountered an error but event was received',
        error_message: error.message 
      });
    }
  }

  // Always return 200 to Stripe to acknowledge receipt of the event
  res.status(200).json({ received: true });
}

/**
 * Send ticket confirmation email with QR code
 */
async function sendTicketConfirmationEmail(session) {
  if (!resend) {
    console.warn('Resend not configured, skipping email');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const ticketId = session.metadata?.ticket_id;

    if (!ticketId) {
      console.error('No ticket_id in session metadata for email');
      return;
    }

    // Get ticket details
    const { data: ticket, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      console.error('Error fetching ticket for email:', error);
      return;
    }

    // Generate QR code image URL or data
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com'}/api/events/tickets/qr/${ticket.qr_code_short || ticket.qr_code}`;

    // Get event details using the comprehensive utility
    const eventDetails = getEventDetails(ticket.event_id);
    const fullAddress = getFullAddress(eventDetails);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fcba00 0%, #d99f00 100%); padding: 30px; text-align: center;">
      <h1 style="color: #000; margin: 0; font-size: 28px;">🎫 Your Tickets Are Confirmed!</h1>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-top: 0;">Hi ${ticket.purchaser_name},</p>
      
      <p style="font-size: 16px;">
        Thank you for your purchase! Your tickets for <strong>${eventDetails.name}</strong> are confirmed.
      </p>
      
      <!-- Event Details -->
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #fcba00;">
        <h2 style="color: #000; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Event Details</h2>
        <p style="margin: 8px 0;"><strong>Event:</strong> ${eventDetails.name}</p>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${eventDetails.date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${eventDetails.time}</p>
        <p style="margin: 8px 0;"><strong>Venue:</strong> ${eventDetails.venue}</p>
        <p style="margin: 8px 0;"><strong>Address:</strong> ${fullAddress}</p>
      </div>

      <!-- Ticket Details -->
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <h2 style="color: #000; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Your Tickets</h2>
        <p style="margin: 8px 0;"><strong>Quantity:</strong> ${ticket.quantity} ${ticket.quantity === 1 ? 'Ticket' : 'Tickets'}</p>
        <p style="margin: 8px 0;"><strong>Total:</strong> $${ticket.total_amount.toFixed(2)}</p>
        <p style="margin: 8px 0;"><strong>Order #:</strong> ${ticket.qr_code_short || ticket.qr_code}</p>
        <p style="margin: 8px 0;"><strong>Purchaser:</strong> ${ticket.purchaser_name}</p>
      </div>

      <!-- QR Code -->
      <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #fcba00;">
        <h3 style="color: #000; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Your Entry QR Code</h3>
        <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
          Present this QR code at the door for entry. Each ticket holder needs to show this code.
        </p>
        <div style="background: #ffffff; padding: 20px; display: inline-block; border: 2px solid #e5e7eb; border-radius: 8px;">
          <img src="${qrCodeUrl}" alt="Ticket QR Code" style="max-width: 300px; height: auto;" />
        </div>
        <p style="color: #666; margin-top: 15px; font-size: 12px;">
          Code: <strong>${ticket.qr_code_short || ticket.qr_code}</strong>
        </p>
      </div>

      <!-- Instructions -->
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">What's Next?</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #047857;">
          <li style="margin: 8px 0;">Save this email or take a screenshot of your QR code</li>
          <li style="margin: 8px 0;">Arrive at the venue on <strong>${eventDetails.date}</strong> at <strong>${eventDetails.time}</strong></li>
          <li style="margin: 8px 0;">Present your QR code at the door for entry</li>
          <li style="margin: 8px 0;">Each ticket holder needs to show the QR code</li>
          <li style="margin: 8px 0;">Keep this email for your records</li>
        </ul>
      </div>
      
      ${eventDetails.parking ? `
      <!-- Parking Information -->
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">🚗 Parking Information</h3>
        <p style="margin: 8px 0; color: #78350f;">${eventDetails.parking.info}</p>
        ${eventDetails.parking.cost ? `<p style="margin: 8px 0; color: #78350f;"><strong>Cost:</strong> ${eventDetails.parking.cost}</p>` : ''}
      </div>
      ` : ''}
      
      ${eventDetails.policies && eventDetails.policies.length > 0 ? `
      <!-- Venue Policies -->
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin-top: 0; font-size: 18px;">Venue Policies</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #1e3a8a;">
          ${eventDetails.policies.map(policy => `<li style="margin: 8px 0;">${policy.replace(/\$/g, '\\$')}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- View Tickets Link -->
      <div style="text-align: center; margin: 25px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com'}/events/tickets/${ticket.id}" 
           style="display: inline-block; background: #fcba00; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          View Your Tickets Online
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        If you have any questions, please contact us at <a href="mailto:info@m10djcompany.com" style="color: #fcba00;">info@m10djcompany.com</a> or call <a href="tel:+19014102020" style="color: #fcba00;">(901) 410-2020</a>.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        M10 DJ Company | Professional Event Entertainment in Memphis, TN<br>
        <a href="https://www.m10djcompany.com" style="color: #fcba00; text-decoration: none;">www.m10djcompany.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await resend.emails.send({
      from: 'M10 DJ Company <info@m10djcompany.com>',
      to: ticket.purchaser_email,
      subject: `🎫 Your Tickets for ${eventDetails.name}`,
      html: emailHtml,
    });

    console.log('Ticket confirmation email sent to:', ticket.purchaser_email);
  } catch (error) {
    console.error('Error sending ticket confirmation email:', error);
  }
}


