// Notification utilities for bidding system
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Send email notification to bid winner
 */
export async function notifyBidWinner(bidderEmail, bidderName, songTitle, songArtist, bidAmount, roundNumber) {
  if (!bidderEmail || !resend) {
    console.warn('Cannot send winner notification: missing email or Resend API key');
    return { success: false, error: 'Missing email or API key' };
  }

  try {
    const subject = `🎉 You Won! Your bid for "${songTitle}" was successful!`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>You Won the Bidding Round!</p>
            </div>
            <div class="content">
              <p>Hi ${bidderName || 'there'},</p>
              <p>Great news! Your bid for <strong>"${songTitle}"</strong> by <strong>${songArtist}</strong> was the winning bid in Round #${roundNumber}!</p>
              <div class="amount">$${(bidAmount / 100).toFixed(2)}</div>
              <p>Your payment has been processed and your song request is now at the top of the queue!</p>
              <p>We'll play your song as soon as possible. Thank you for your support!</p>
              <p>Best regards,<br>The M10 DJ Company Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: bidderEmail,
      subject,
      html
    });

    console.log(`✅ Winner notification sent to ${bidderEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send winner notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification to losing bidders
 */
export async function notifyBidLoser(bidderEmail, bidderName, songTitle, songArtist, theirBidAmount, winningBidAmount) {
  if (!bidderEmail || !resend) {
    console.warn('Cannot send loser notification: missing email or Resend API key');
    return { success: false, error: 'Missing email or API key' };
  }

  try {
    const subject = `Your bid for "${songTitle}" was outbid`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; }
            .info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Bidding Round Ended</h2>
            </div>
            <div class="content">
              <p>Hi ${bidderName || 'there'},</p>
              <p>The bidding round for <strong>"${songTitle}"</strong> by <strong>${songArtist}</strong> has ended.</p>
              <div class="info">
                <p><strong>Your bid:</strong> $${(theirBidAmount / 100).toFixed(2)}</p>
                <p><strong>Winning bid:</strong> $${(winningBidAmount / 100).toFixed(2)}</p>
              </div>
              <p>Your payment authorization has been released - no charges were made to your card.</p>
              <p>Don't worry! You can place a new bid in the next round if you'd like to try again.</p>
              <p>Thank you for participating!</p>
              <p>Best regards,<br>The M10 DJ Company Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: bidderEmail,
      subject,
      html
    });

    console.log(`✅ Loser notification sent to ${bidderEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send loser notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send admin alert for bidding round failures
 */
export async function notifyAdminBiddingFailure(roundId, organizationId, errorMessage, details = {}) {
  const adminEmails = [
    process.env.ADMIN_EMAIL,
    process.env.EMERGENCY_CONTACT_EMAIL
  ].filter(email => email && email.trim());

  if (adminEmails.length === 0 || !resend) {
    console.warn('Cannot send admin alert: missing admin emails or Resend API key');
    return { success: false, error: 'Missing admin emails or API key' };
  }

  try {
    const subject = `🚨 URGENT: Bidding Round Processing Failed - Round ${roundId}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background: #fee; border-left: 4px solid #f00; padding: 20px; margin: 20px 0; }
            .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert">
              <h2>🚨 Bidding Round Processing Failed</h2>
              <p><strong>Round ID:</strong> ${roundId}</p>
              <p><strong>Organization ID:</strong> ${organizationId}</p>
              <p><strong>Error:</strong> ${errorMessage}</p>
            </div>
            <div class="details">
              <h3>Details:</h3>
              <pre>${JSON.stringify(details, null, 2)}</pre>
            </div>
            <p><strong>Action Required:</strong> Please review the bidding round and process manually if needed.</p>
            <p>Check the admin dashboard for more information.</p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: adminEmails,
      subject,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    console.log(`✅ Admin alert sent for round ${roundId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send admin alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS notification (optional, if Twilio is configured)
 */
export async function sendBidSMSNotification(phoneNumber, message) {
  if (!phoneNumber || !process.env.TWILIO_ACCOUNT_SID) {
    return { success: false, error: 'Missing phone number or Twilio config' };
  }

  try {
    const twilio = require('twilio');
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`✅ SMS notification sent to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send SMS notification:', error);
    return { success: false, error: error.message };
  }
}

