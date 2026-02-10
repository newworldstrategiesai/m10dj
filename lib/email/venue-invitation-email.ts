/**
 * Venue Invitation Email Templates
 * Sends invitation emails to performers when venues invite them
 * Product-aware: Uses correct email address based on product context
 */

import { getProductFromEmail, getProductName, getProductDomain, getProductBaseUrl, type ProductContext } from './product-email-config';

interface VenueInvitationEmailParams {
  to: string;
  venueName: string;
  performerName?: string;
  performerSlug: string;
  invitationToken: string;
  invitationUrl: string;
  productContext?: ProductContext | null; // Product context for email branding
}

/**
 * Generate HTML email template for venue invitation
 */
export function generateVenueInvitationEmailHTML(params: VenueInvitationEmailParams): string {
  const { venueName, performerName, performerSlug, invitationUrl, productContext } = params;
  const productName = getProductName(productContext);
  const productDomain = getProductDomain(productContext);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You&apos;ve been invited to join ${venueName} on TipJar</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎵 You've Been Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Hi${performerName ? ` ${performerName}` : ''},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>${venueName}</strong> has invited you to join their roster on ${productName}!
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                Once you accept, you'll get your own tip page where fans can tip you and request songs. Your page will be available at:
              </p>
              
              <!-- Tip Page URL Box -->
              <div style="background-color: #f3f4f6; border-left: 4px solid #7c3aed; padding: 16px; margin: 0 0 30px; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Your Tip Page URL
                </p>
                <p style="margin: 0; font-size: 18px; color: #7c3aed; font-weight: bold; font-family: monospace;">
                  ${productDomain}/${performerSlug}
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${invitationUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Accept Invitation & Create Tip Page
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                This invitation will expire in 30 days. If you have any questions, please contact ${venueName}.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Powered by <a href="${getProductBaseUrl(productContext)}" style="color: #7c3aed; text-decoration: none;">${productName}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invitation email
 */
export function generateVenueInvitationEmailText(params: VenueInvitationEmailParams): string {
  const { venueName, performerName, performerSlug, invitationUrl, productContext } = params;
  const productName = getProductName(productContext);
  const productDomain = getProductDomain(productContext);
  
  return `
You've Been Invited to Join ${venueName} on ${productName}!

Hi${performerName ? ` ${performerName}` : ''},

${venueName} has invited you to join their roster on ${productName}!

Once you accept, you'll get your own tip page where fans can tip you and request songs. Your page will be available at:

${productDomain}/${performerSlug}

Accept your invitation here:
${invitationUrl}

This invitation will expire in 30 days. If you have any questions, please contact ${venueName}.

If you didn't expect this invitation, you can safely ignore this email.

Powered by ${productName}
  `.trim();
}

/**
 * Send venue invitation email via Resend
 */
export async function sendVenueInvitationEmail(
  params: VenueInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const html = generateVenueInvitationEmailHTML(params);
    const text = generateVenueInvitationEmailText(params);
    const productName = getProductName(params.productContext);
    const fromEmail = getProductFromEmail(params.productContext);

    const result = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: `You've been invited to join ${params.venueName} on ${productName}`,
      html,
      text,
    });

    if (result.error) {
      console.error('Error sending venue invitation email:', result.error);
      return { success: false, error: JSON.stringify(result.error) };
    }

    console.log('✅ Venue invitation email sent:', result.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending venue invitation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to venue when performer accepts invitation
 */
export async function sendVenueInvitationAcceptedEmail(
  venueEmail: string,
  venueName: string,
  performerName: string,
  performerSlug: string,
  tipPageUrl: string,
  productContext?: ProductContext | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ✅ Invitation Accepted!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Great news! <strong>${performerName}</strong> has accepted your invitation to join ${venueName} on ${getProductName(productContext)}.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Their tip page is now live and ready to collect tips and song requests:
              </p>
              <div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 30px; border-radius: 8px;">
                <p style="margin: 0; font-size: 18px; color: #10b981; font-weight: bold; font-family: monospace;">
                  ${tipPageUrl}
                </p>
              </div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                You can manage all your performers from your venue dashboard.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const productName = getProductName(productContext);
    const fromEmail = getProductFromEmail(productContext);

    const text = `
Invitation Accepted!

Great news! ${performerName} has accepted your invitation to join ${venueName} on ${productName}.

Their tip page is now live:
${tipPageUrl}

You can manage all your performers from your venue dashboard.
    `.trim();

    const result = await resend.emails.send({
      from: fromEmail,
      to: venueEmail,
      subject: `${performerName} has joined ${venueName} on ${productName}`,
      html,
      text,
    });

    if (result.error) {
      console.error('Error sending acceptance confirmation email:', result.error);
      return { success: false, error: JSON.stringify(result.error) };
    }

    console.log('✅ Venue acceptance confirmation email sent:', result.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending acceptance confirmation email:', error);
    return { success: false, error: error.message };
  }
}

