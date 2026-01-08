/**
 * Tip Jar Batch Creation Email Templates
 * Email templates for batch-created Tip Jar pages
 * 
 * Uses Mailgun for Tip Jar emails (tipjar.live domain)
 */

import { Resend } from 'resend';
import { getProductFromEmail, getProductName, getProductBaseUrl } from './product-email-config';

interface ProspectWelcomeEmailData {
  prospectEmail: string;
  prospectName?: string;
  businessName: string;
  pageUrl: string;
  claimLink: string;
  qrCodeUrl: string;
  productContext?: 'tipjar' | 'djdash' | 'm10dj';
}

interface ClaimReminderEmailData {
  prospectEmail: string;
  prospectName?: string;
  businessName: string;
  pageUrl: string;
  claimLink: string;
  pendingTipsCents?: number;
  tipCount?: number;
  productContext?: 'tipjar' | 'djdash' | 'm10dj';
}

interface AccountClaimedEmailData {
  prospectEmail: string;
  prospectName?: string;
  businessName: string;
  dashboardUrl: string;
  pendingTipsCents?: number;
  productContext?: 'tipjar' | 'djdash' | 'm10dj';
}

/**
 * Generate prospect welcome email HTML
 */
function generateProspectWelcomeEmail(data: ProspectWelcomeEmailData): { html: string; text: string } {
  const productName = getProductName(data.productContext);
  const productDomain = getProductBaseUrl(data.productContext);
  const fromEmail = getProductFromEmail(data.productContext);
  
  const displayName = data.prospectName || data.businessName;
  const pendingTips = data.pendingTipsCents ? (data.pendingTipsCents / 100).toFixed(2) : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${productName}!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Your ${productName} Page is Ready! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Hi ${displayName},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Great news! Your ${productName} page has been set up and is ready to use. You can start accepting tips immediately!
              </p>
              
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">
                Share your page link or QR code with your audience, and they can tip you right away—no account needed on their end.
              </p>
              
              <!-- QR Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0 0 15px; color: #374151; font-size: 14px; font-weight: 600;">
                      Your QR Code
                    </p>
                    <img src="${data.qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 4px solid #ffffff; border-radius: 8px; display: block; margin: 0 auto;" />
                    <p style="margin: 15px 0 0; color: #6b7280; font-size: 12px;">
                      Share this QR code at your events
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Page Link -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #374151; font-size: 14px; font-weight: 600;">
                  Your Page URL:
                </p>
                <p style="margin: 0; color: #10b981; font-size: 16px; word-break: break-all;">
                  <a href="${data.pageUrl}" style="color: #10b981; text-decoration: none;">${data.pageUrl}</a>
                </p>
              </div>
              
              <!-- CTA Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="text-align: center; padding: 10px 0;">
                    <a href="${data.pageUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 5px;">
                      View Your Page
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 10px 0;">
                    <a href="${data.claimLink}" 
                       style="display: inline-block; background-color: #ffffff; color: #10b981; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #10b981; margin: 5px;">
                      Claim Your Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #374151; font-size: 14px; font-weight: 600;">
                  💡 Next Steps:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li>Share your page link or QR code with your audience</li>
                  <li>Start receiving tips immediately—no account needed yet!</li>
                  <li>When ready, claim your account to access your dashboard and add banking info</li>
                  <li>All tips received before claiming will be transferred to your account</li>
                </ul>
              </div>
              
              <!-- Support -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Need help? Reply to this email or visit <a href="${productDomain}" style="color: #10b981;">${productDomain}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} ${productName}. All rights reserved.
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

  const text = `
Welcome to ${productName}!

Hi ${displayName},

Your ${productName} page is ready! You can start accepting tips immediately.

Your Page URL: ${data.pageUrl}
QR Code: ${data.qrCodeUrl}

Claim Your Account: ${data.claimLink}

Next Steps:
- Share your page link or QR code with your audience
- Start receiving tips immediately—no account needed yet!
- When ready, claim your account to access your dashboard and add banking info
- All tips received before claiming will be transferred to your account

Need help? Reply to this email or visit ${productDomain}

© ${new Date().getFullYear()} ${productName}. All rights reserved.
  `.trim();

  return { html, text };
}

/**
 * Generate claim reminder email HTML
 */
function generateClaimReminderEmail(data: ClaimReminderEmailData): { html: string; text: string } {
  const productName = getProductName(data.productContext);
  const productDomain = getProductBaseUrl(data.productContext);
  const fromEmail = getProductFromEmail(data.productContext);
  
  const displayName = data.prospectName || data.businessName;
  const pendingTips = data.pendingTipsCents ? (data.pendingTipsCents / 100).toFixed(2) : null;
  const hasTips = pendingTips && parseFloat(pendingTips) > 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Your ${productName} Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${hasTips ? `You Have Tips Waiting! 💰` : `Claim Your ${productName} Account`}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Hi ${displayName},
              </p>
              
              ${hasTips ? `
              <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #374151; font-size: 16px; font-weight: 600;">
                  💰 You have pending tips!
                </p>
                <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">
                  $${pendingTips}
                </p>
                <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">
                  ${data.tipCount || 0} tip${(data.tipCount || 0) !== 1 ? 's' : ''} waiting to be collected
                </p>
              </div>
              ` : `
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Your ${productName} page is set up and ready! Don't forget to claim your account to access your dashboard and manage your page settings.
              </p>
              `}
              
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">
                Claim your account now to:
              </p>
              
              <ul style="margin: 0 0 30px; padding-left: 20px; color: #374151; font-size: 16px;">
                <li>Access your dashboard and analytics</li>
                <li>Customize your page settings and branding</li>
                <li>${hasTips ? 'Collect your pending tips' : 'Set up banking to receive tips'}</li>
                <li>Manage all your tip requests and messages</li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="text-align: center; padding: 10px 0;">
                    <a href="${data.claimLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 5px;">
                      Claim Your Account Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Your page is still live at: <a href="${data.pageUrl}" style="color: #10b981;">${data.pageUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} ${productName}. All rights reserved.
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

  const text = `
${hasTips ? 'You Have Tips Waiting!' : 'Claim Your ' + productName + ' Account'}

Hi ${displayName},

${hasTips ? `
You have pending tips!
$${pendingTips}
${data.tipCount || 0} tip${(data.tipCount || 0) !== 1 ? 's' : ''} waiting to be collected
` : `
Your ${productName} page is set up and ready! Don't forget to claim your account.
`}

Claim your account now to:
- Access your dashboard and analytics
- Customize your page settings and branding
- ${hasTips ? 'Collect your pending tips' : 'Set up banking to receive tips'}
- Manage all your tip requests and messages

Claim Your Account: ${data.claimLink}

Your page: ${data.pageUrl}

© ${new Date().getFullYear()} ${productName}. All rights reserved.
  `.trim();

  return { html, text };
}

/**
 * Generate account claimed email HTML
 */
function generateAccountClaimedEmail(data: AccountClaimedEmailData): { html: string; text: string } {
  const productName = getProductName(data.productContext);
  const productDomain = getProductBaseUrl(data.productContext);
  const fromEmail = getProductFromEmail(data.productContext);
  
  const displayName = data.prospectName || data.businessName;
  const pendingTips = data.pendingTipsCents ? (data.pendingTipsCents / 100).toFixed(2) : null;
  const hasTips = pendingTips && parseFloat(pendingTips) > 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${productName}!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Welcome to ${productName}! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Hi ${displayName},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Congratulations! You've successfully claimed your ${productName} account. You now have full access to your dashboard and can customize your page settings.
              </p>
              
              ${hasTips ? `
              <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #374151; font-size: 16px; font-weight: 600;">
                  💰 Tips Transferred!
                </p>
                <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">
                  $${pendingTips}
                </p>
                <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">
                  All tips received before claiming have been transferred to your account
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 20px 0; color: #374151; font-size: 16px;">
                Next steps:
              </p>
              
              <ol style="margin: 0 0 30px; padding-left: 20px; color: #374151; font-size: 16px;">
                <li>Complete your onboarding to customize your page</li>
                <li>Set up Stripe Connect to receive tips directly to your bank account</li>
                <li>Customize your page branding, colors, and settings</li>
                <li>Start sharing your page link with your audience!</li>
              </ol>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="text-align: center; padding: 10px 0;">
                    <a href="${data.dashboardUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 5px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} ${productName}. All rights reserved.
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

  const text = `
Welcome to ${productName}!

Hi ${displayName},

Congratulations! You've successfully claimed your ${productName} account.

${hasTips ? `
Tips Transferred!
$${pendingTips}
All tips received before claiming have been transferred to your account
` : ''}

Next steps:
1. Complete your onboarding to customize your page
2. Set up Stripe Connect to receive tips directly to your bank account
3. Customize your page branding, colors, and settings
4. Start sharing your page link with your audience!

Go to Dashboard: ${data.dashboardUrl}

© ${new Date().getFullYear()} ${productName}. All rights reserved.
  `.trim();

  return { html, text };
}

/**
 * Send email via Mailgun (for Tip Jar emails)
 */
async function sendEmailViaMailgun(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY not configured');
    }

    const mailgunDomain = process.env.MAILGUN_DOMAIN_TIPJAR || 'tipjar.live';

    const formData = new FormData();
    formData.append('from', from);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);
    formData.append('text', text);

    const mailgunResponse = await fetch(
      `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
        },
        body: formData,
      }
    );

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      console.error('Mailgun error:', errorText);
      return { success: false, error: errorText };
    }

    const mailgunResult = await mailgunResponse.json();
    return { success: true, emailId: mailgunResult.id };
  } catch (error: any) {
    console.error('Error sending email via Mailgun:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email via Resend (for M10 DJ Company emails)
 */
async function sendEmailViaResend(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: JSON.stringify(result.error) };
    }

    return { success: true, emailId: result.data?.id };
  } catch (error: any) {
    console.error('Error sending email via Resend:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send prospect welcome email
 * Uses Mailgun for Tip Jar emails (tipjar.live domain)
 */
export async function sendProspectWelcomeEmail(data: ProspectWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { html, text } = generateProspectWelcomeEmail(data);
    const fromEmail = getProductFromEmail(data.productContext);
    const productName = getProductName(data.productContext);
    const productContext = data.productContext || 'tipjar';

    // Use Mailgun for Tip Jar emails, Resend for others
    if (productContext === 'tipjar') {
      const result = await sendEmailViaMailgun(
        data.prospectEmail,
        fromEmail,
        `Your ${productName} page is ready! 🎉`,
        html,
        text
      );

      if (!result.success) {
        console.error('Error sending prospect welcome email via Mailgun:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } else {
      // Use Resend for other products (M10DJ, DJDash)
      const result = await sendEmailViaResend(
        data.prospectEmail,
        fromEmail,
        `Your ${productName} page is ready! 🎉`,
        html,
        text
      );

      if (!result.success) {
        console.error('Error sending prospect welcome email via Resend:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    }
  } catch (error: any) {
    console.error('Error sending prospect welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send claim reminder email
 * Uses Mailgun for Tip Jar emails (tipjar.live domain)
 */
export async function sendClaimReminderEmail(data: ClaimReminderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { html, text } = generateClaimReminderEmail(data);
    const fromEmail = getProductFromEmail(data.productContext);
    const productName = getProductName(data.productContext);
    const productContext = data.productContext || 'tipjar';
    const hasTips = data.pendingTipsCents && data.pendingTipsCents > 0;

    const subject = hasTips 
      ? `You have tips waiting! Claim your ${productName} account 💰`
      : `Claim your ${productName} account`;

    // Use Mailgun for Tip Jar emails, Resend for others
    if (productContext === 'tipjar') {
      const result = await sendEmailViaMailgun(
        data.prospectEmail,
        fromEmail,
        subject,
        html,
        text
      );

      if (!result.success) {
        console.error('Error sending claim reminder email via Mailgun:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } else {
      // Use Resend for other products (M10DJ, DJDash)
      const result = await sendEmailViaResend(
        data.prospectEmail,
        fromEmail,
        subject,
        html,
        text
      );

      if (!result.success) {
        console.error('Error sending claim reminder email via Resend:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    }
  } catch (error: any) {
    console.error('Error sending claim reminder email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send account claimed email
 * Uses Mailgun for Tip Jar emails (tipjar.live domain)
 */
export async function sendAccountClaimedEmail(data: AccountClaimedEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { html, text } = generateAccountClaimedEmail(data);
    const fromEmail = getProductFromEmail(data.productContext);
    const productName = getProductName(data.productContext);
    const productContext = data.productContext || 'tipjar';

    const subject = `Welcome to ${productName}! Your account is ready 🎉`;

    // Use Mailgun for Tip Jar emails, Resend for others
    if (productContext === 'tipjar') {
      const result = await sendEmailViaMailgun(
        data.prospectEmail,
        fromEmail,
        subject,
        html,
        text
      );

      if (!result.success) {
        console.error('Error sending account claimed email via Mailgun:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } else {
      // Use Resend for other products (M10DJ, DJDash)
      const result = await sendEmailViaResend(
        data.prospectEmail,
        fromEmail,
        subject,
        html,
        text
      );

      if (!result.success) {
        console.error('Error sending account claimed email via Resend:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    }
  } catch (error: any) {
    console.error('Error sending account claimed email:', error);
    return { success: false, error: error.message };
  }
}

