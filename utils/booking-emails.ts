import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface BookingEmailData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  meetingType: string;
  meetingDate: string;
  meetingTime: string;
  durationMinutes: number;
  eventType?: string | null;
  eventDate?: string | null;
  notes?: string | null;
  meetingDescription?: string | null;
}

/**
 * Send booking confirmation email to client
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const meetingDate = new Date(`${data.meetingDate}T${data.meetingTime}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fcba00 0%, #d99f00 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">Booking Confirmed! 🎉</h1>
            <p style="color: #000; margin: 10px 0 0 0; font-size: 16px;">Your consultation is scheduled</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-top: 0;">Hi ${data.clientName},</p>
            
            <p style="font-size: 16px;">Great news! Your ${data.meetingType.toLowerCase()} with M10 DJ Company has been confirmed.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #fcba00;">
              <h2 style="color: #000; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Meeting Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Date:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Duration:</td>
                  <td style="padding: 8px 0;">${data.durationMinutes} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Type:</td>
                  <td style="padding: 8px 0;">${data.meetingType}</td>
                </tr>
                ${data.eventType ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Your Event:</td>
                  <td style="padding: 8px 0;">${data.eventType}${data.eventDate ? ` on ${new Date(data.eventDate).toLocaleDateString()}` : ''}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${data.notes ? `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; font-weight: bold; color: #1e40af;">Your Notes:</p>
              <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">What's Next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #047857;">
                <li style="margin: 8px 0;">You'll receive a reminder 24 hours before your meeting</li>
                <li style="margin: 8px 0;">We'll call you at the scheduled time</li>
                <li style="margin: 8px 0;">If you need to reschedule, just reply to this email or call us at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a></li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://m10djcompany.com/schedule/confirm/${data.bookingId}" style="display: inline-block; background: #fcba00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Booking Details</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Questions? Contact us at <a href="mailto:info@m10djcompany.com" style="color: #fcba00;">info@m10djcompany.com</a> or call <a href="tel:+19014102020" style="color: #fcba00;">(901) 410-2020</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
            <p>M10 DJ Company | Memphis's Premier Wedding & Event DJ Service</p>
            <p><a href="https://m10djcompany.com" style="color: #fcba00;">m10djcompany.com</a></p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: data.clientEmail,
      subject: `✅ Booking Confirmed: ${data.meetingType} on ${formattedDate}`,
      html: emailHtml,
    });

    console.log('✅ Booking confirmation email sent to:', data.clientEmail);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send booking confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send booking notification email to admin
 */
export async function sendAdminBookingNotification(data: BookingEmailData) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const meetingDate = new Date(`${data.meetingDate}T${data.meetingTime}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: white;">📅 New Booking Scheduled</h2>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Client Information</h3>
            <p><strong>Name:</strong> ${data.clientName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.clientEmail}">${data.clientEmail}</a></p>
            ${data.clientPhone ? `<p><strong>Phone:</strong> <a href="tel:${data.clientPhone}">${data.clientPhone}</a></p>` : ''}
            
            <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Meeting Details</h3>
            <p><strong>Type:</strong> ${data.meetingType}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
            
            ${data.eventType ? `
            <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Event Information</h3>
            <p><strong>Event Type:</strong> ${data.eventType}</p>
            ${data.eventDate ? `<p><strong>Event Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>` : ''}
            ` : ''}
            
            ${data.notes ? `
            <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Client Notes</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #fcba00;">
              <p style="margin: 0; white-space: pre-wrap;">${data.notes}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0;"><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p style="margin: 5px 0 0 0;"><a href="https://m10djcompany.com/admin/bookings" style="color: #fcba00; font-weight: bold;">View in Admin Dashboard →</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const adminEmails: string[] = [
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_PHONE_EMAIL,
      process.env.EMERGENCY_CONTACT_EMAIL
    ].filter((email): email is string => Boolean(email && email.trim()));

    if (adminEmails.length === 0) {
      console.warn('No admin emails configured');
      return { success: false, error: 'No admin emails configured' };
    }

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: adminEmails,
      subject: `📅 New Booking: ${data.meetingType} - ${data.clientName} on ${formattedDate}`,
      html: emailHtml,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    console.log('✅ Admin booking notification sent');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send admin booking notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reminder email 24 hours before meeting
 */
export async function sendBookingReminderEmail(data: BookingEmailData) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const meetingDate = new Date(`${data.meetingDate}T${data.meetingTime}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Reminder: Meeting Tomorrow</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-top: 0;">Hi ${data.clientName},</p>
            
            <p style="font-size: 16px;">This is a friendly reminder that your ${data.meetingType.toLowerCase()} with M10 DJ Company is scheduled for <strong>tomorrow</strong>.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h2 style="color: #000; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Meeting Details</h2>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">Need to reschedule?</p>
              <p style="margin: 5px 0 0 0;">No problem! Just reply to this email or call us at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a></p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              We look forward to speaking with you!
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: data.clientEmail,
      subject: `⏰ Reminder: ${data.meetingType} Tomorrow at ${formattedTime}`,
      html: emailHtml,
    });

    console.log('✅ Booking reminder email sent to:', data.clientEmail);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send booking reminder email:', error);
    return { success: false, error: error.message };
  }
}

