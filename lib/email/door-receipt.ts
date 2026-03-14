/**
 * Send door ticket purchase receipt email (TipJar product)
 */
import { Resend } from 'resend';
import { getProductFromEmail } from './product-email-config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface DoorReceiptData {
  to: string;
  purchaserName: string;
  organizationName: string;
  venueDisplay?: string;
  quantity: number;
  totalAmount: number;
  qrCode: string;
  ticketId: string;
}

export async function sendDoorTicketReceipt(data: DoorReceiptData): Promise<{ success: boolean; error?: string }> {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn('[door-receipt] Resend not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
  const qrImageUrl = `${siteUrl}/api/events/tickets/qr/${encodeURIComponent(data.qrCode)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Door Ticket Confirmation</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${data.organizationName}</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-top: 0;">Hi ${data.purchaserName || 'there'},</p>
      <p style="font-size: 16px;">Thank you for your purchase! Your door ticket${data.quantity > 1 ? 's' : ''} ${data.quantity > 1 ? 'are' : 'is'} confirmed.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Quantity:</strong> ${data.quantity} ticket${data.quantity > 1 ? 's' : ''}</p>
        <p style="margin: 4px 0;"><strong>Total:</strong> $${data.totalAmount.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Order #:</strong> ${data.qrCode}</p>
        ${data.venueDisplay ? `<p style="margin: 4px 0;"><strong>Venue:</strong> ${data.venueDisplay}</p>` : ''}
      </div>
      <div style="text-align: center; padding: 20px; background: #fafafa; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">Show this QR code at the door</p>
        <img src="${qrImageUrl}" alt="Ticket QR code" style="max-width: 200px; height: auto;" />
        <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af; font-family: monospace;">${data.qrCode}</p>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Save this email or take a screenshot of your QR code for entry.</p>
    </div>
  </div>
  <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Powered by TipJar Live</p>
</body>
</html>
`;

  try {
    await resend.emails.send({
      from: getProductFromEmail('tipjar'),
      to: data.to,
      subject: `Door Ticket Confirmation - ${data.organizationName}`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[door-receipt] Failed to send:', err);
    return { success: false, error: err?.message };
  }
}
