// API endpoint to send receipt email for crowd request
import { Resend } from 'resend';
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, email, name } = req.body;

  if (!requestId || !email) {
    return res.status(400).json({ error: 'Request ID and email are required' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the crowd request details
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Calculate total amount
    const totalAmount = (request.amount_paid || request.amount_requested || 0) + 
                       (request.fast_track_fee || 0) + 
                       (request.next_fee || 0);

    // Update email and name in request if provided
    const updateData = {};
    if (!request.requester_email) {
      updateData.requester_email = email;
    }
    if (name && name.trim() && (!request.requester_name || request.requester_name === 'Guest')) {
      updateData.requester_name = name.trim();
    }
    
    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('crowd_requests')
        .update(updateData)
        .eq('id', requestId);
    }

    // Format payment method
    const paymentMethod = request.payment_method === 'card' ? 'Credit/Debit Card (Stripe)' :
                         request.payment_method === 'cashapp' ? 'CashApp' :
                         request.payment_method === 'venmo' ? 'Venmo' :
                         request.payment_method || 'Payment';

    // Format request type
    const requestTypeLabel = request.request_type === 'song_request' ? 'Song Request' : request.request_type === 'shoutout' ? 'Shoutout' : 'Tip';
    const requestDetails = request.request_type === 'song_request'
      ? `${request.song_title || 'Unknown Song'}${request.song_artist ? ` by ${request.song_artist}` : ''}`
      : `For ${request.recipient_name || 'Recipient'}`;

    // Build receipt HTML
    const receiptHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">M10 DJ Company</h1>
          <p style="color: #000; margin: 5px 0 0 0; font-size: 14px;">Premium Event Entertainment</p>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 30px 0; font-size: 24px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">
            Payment Receipt
          </h2>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong style="color: #1f2937;">Transaction Date:</strong> ${new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong style="color: #1f2937;">Receipt Number:</strong> ${request.payment_code || request.id.substring(0, 8).toUpperCase()}</p>
            ${request.paid_at ? `<p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong style="color: #1f2937;">Payment Date:</strong> ${new Date(request.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${requestTypeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Details:</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${requestDetails}</td>
              </tr>
              ${request.requester_name && request.requester_name !== 'Guest' ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer:</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${request.requester_name}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method:</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${paymentMethod}</td>
              </tr>
              ${request.is_fast_track ? `
              <tr style="border-top: 1px solid #e5e7eb; margin-top: 10px;">
                <td style="padding: 12px 0 8px 0; color: #6b7280; font-size: 14px;">Base Amount:</td>
                <td style="padding: 12px 0 8px 0; color: #1f2937; font-size: 14px; text-align: right;">$${((request.amount_requested || 0) / 100).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">⚡ Fast-Track Fee:</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">$${((request.fast_track_fee || 0) / 100).toFixed(2)}</td>
              </tr>
              ` : ''}
              ${request.is_next ? `
              <tr style="border-top: 1px solid #e5e7eb; margin-top: 10px;">
                <td style="padding: 12px 0 8px 0; color: #6b7280; font-size: 14px;">Base Amount:</td>
                <td style="padding: 12px 0 8px 0; color: #1f2937; font-size: 14px; text-align: right;">$${((request.amount_requested || 0) / 100).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🚀 Next Fee:</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">$${((request.next_fee || 0) / 100).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #fcba00; margin-top: 15px;">
                <td style="padding: 15px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">Total Paid:</td>
                <td style="padding: 15px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold; text-align: right;">$${(totalAmount / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #fcba00; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
              <strong>📋 Tax Information:</strong> This receipt can be used for tax purposes. Keep this email for your records.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #fcba00; text-align: center;">
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong style="color: #fcba00;">Phone:</strong> (901) 410-2020</p>
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong style="color: #fcba00;">Email:</strong> djbenmurray@gmail.com</p>
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong style="color: #fcba00;">Website:</strong> m10djcompany.com</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">
              M10 DJ Company - Memphis, TN & Surrounding Areas<br>
              Thank you for your business!
            </p>
          </div>
        </div>
      </div>
    `;

    // Send receipt email
    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: email,
      subject: `Payment Receipt - ${requestTypeLabel} - M10 DJ Company`,
      html: receiptHtml,
    });

    console.log(`✅ Receipt sent to ${email} for request ${requestId}`);

    return res.status(200).json({
      success: true,
      message: 'Receipt sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending receipt:', error);
    return res.status(500).json({
      error: 'Failed to send receipt',
      message: error.message
    });
  }
}

