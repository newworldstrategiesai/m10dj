/**
 * DJ Payment Notifications
 * 
 * Sends email notifications to DJs when they receive payments
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface PaymentNotificationData {
  organizationId: string;
  amount: number;
  requestId: string;
  requestType: 'song_request' | 'shoutout' | 'tip';
  requesterName: string;
  songTitle?: string;
  songArtist?: string;
  recipientName?: string;
  payoutAmount?: number;
  platformFee?: number;
}

/**
 * Send payment received notification to DJ
 */
export async function notifyDJOfPayment(data: PaymentNotificationData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization and owner email
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, owner_id, stripe_connect_account_id')
      .eq('id', data.organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organization not found');
    }

    // Get owner email
    const { data: owner, error: ownerError } = await supabase.auth.admin.getUserById(organization.owner_id);
    
    if (ownerError || !owner.user?.email) {
      console.warn('Could not get owner email for payment notification');
      return { success: false, error: 'Owner email not found' };
    }

    const djEmail = owner.user.email;
    const requestTypeLabel = data.requestType === 'song_request' 
      ? 'Song Request' 
      : data.requestType === 'shoutout' 
      ? 'Shoutout' 
      : 'Tip';

    const requestDetail = data.requestType === 'song_request'
      ? `${data.songTitle || 'Song'}${data.songArtist ? ` by ${data.songArtist}` : ''}`
      : data.requestType === 'shoutout'
      ? `For ${data.recipientName || 'Recipient'}`
      : 'Tip';

    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">💰 Payment Received!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You've received a new payment</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #10b981;">
              ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}
            </p>
            <p style="margin: 5px 0 0 0; color: #059669; font-size: 14px;">
              ${requestTypeLabel}
            </p>
          </div>

          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;">Request Type:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${requestTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Details:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${requestDetail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">From:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.requesterName}</td>
            </tr>
            ${data.payoutAmount !== undefined ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Your Payout:</td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.payoutAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Platform Fee:</td>
              <td style="padding: 8px 0; color: #666;">${data.platformFee ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.platformFee) : 'N/A'}</td>
            </tr>
            ` : ''}
          </table>

          ${organization.stripe_connect_account_id ? `
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 10px 0; color: #333; font-weight: 500;">💳 Payment Status</p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              This payment has been automatically deposited to your Stripe account. 
              ${data.payoutAmount !== undefined ? `After platform fees, you'll receive $${data.payoutAmount.toFixed(2)}.` : ''}
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/payouts" 
               style="display: inline-block; margin-top: 15px; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Payouts →
            </a>
          </div>
          ` : `
          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 500;">⚠️ Action Required</p>
            <p style="margin: 0; color: #78350f; font-size: 14px;">
              Set up Stripe Connect to receive payments automatically. Complete onboarding to start getting paid.
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/dashboard-starter" 
               style="display: inline-block; margin-top: 15px; background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Set Up Payments →
            </a>
          </div>
          `}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/crowd-requests" 
               style="color: #667eea; text-decoration: none; font-size: 14px;">
              View All Requests →
            </a>
          </div>
        </div>
      </div>
    `;

    // Send email
    await resend.emails.send({
      from: 'M10 DJ Platform <payments@m10djcompany.com>',
      to: djEmail,
      subject: `💰 Payment Received: $${data.amount.toFixed(2)} - ${requestTypeLabel}`,
      html: emailHtml,
    });

    console.log(`✅ Payment notification sent to DJ: ${djEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending payment notification to DJ:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payout notification when payout is initiated
 */
export async function notifyDJOfPayout(
  organizationId: string,
  payoutAmount: number,
  payoutId: string,
  arrivalDate?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization and owner email
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, owner_id')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organization not found');
    }

    // Get owner email
    const { data: owner, error: ownerError } = await supabase.auth.admin.getUserById(organization.owner_id);
    
    if (ownerError || !owner.user?.email) {
      console.warn('Could not get owner email for payout notification');
      return { success: false, error: 'Owner email not found' };
    }

    const djEmail = owner.user.email;
    const arrivalDateFormatted = arrivalDate 
      ? new Date(arrivalDate).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : '2-7 business days';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">💸 Payout Initiated</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your money is on the way</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #10b981;">
              ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payoutAmount)}
            </p>
            <p style="margin: 5px 0 0 0; color: #059669; font-size: 14px;">
              Payout ID: ${payoutId}
            </p>
          </div>

          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Payout Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;">Amount:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payoutAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Status:</td>
              <td style="padding: 8px 0; color: #10b981; font-weight: 500;">Processing</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Arrival Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${arrivalDateFormatted}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #333; font-size: 14px;">
              Your payout has been initiated and will be deposited to your bank account. 
              You can track the status in your payout dashboard.
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/payouts" 
               style="display: inline-block; margin-top: 15px; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Payout Dashboard →
            </a>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'M10 DJ Platform <payments@m10djcompany.com>',
      to: djEmail,
      subject: `💸 Payout Initiated: $${payoutAmount.toFixed(2)}`,
      html: emailHtml,
    });

    console.log(`✅ Payout notification sent to DJ: ${djEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending payout notification to DJ:', error);
    return { success: false, error: error.message };
  }
}

