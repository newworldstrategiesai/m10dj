/**
 * Supabase Auth Hook - Custom Email Handler
 * 
 * This endpoint receives auth events from Supabase and sends branded emails
 * via Resend with the correct sender address based on product context.
 * 
 * Supported events:
 * - signup: Email confirmation for new signups
 * - recovery: Password reset emails
 * - magiclink: Magic link sign-in emails
 * - email_change: Email change confirmation
 * - invite: User invitation emails
 * 
 * Setup in Supabase:
 * 1. Go to Authentication > Hooks
 * 2. Add a new hook with type "Send Email"
 * 3. Set the URL to: https://yourdomain.com/api/auth/hook
 * 4. Set the secret key (SUPABASE_AUTH_HOOK_SECRET)
 * 5. Disable built-in email sending in Auth settings
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getProductFromEmail, getProductName, getProductBaseUrl, ProductContext } from '@/lib/email/product-email-config';

// Verify the webhook signature from Supabase
function verifySupabaseSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    console.warn('[Auth Hook] Missing signature or secret');
    return process.env.NODE_ENV === 'development'; // Allow in dev without signature
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Supabase may send signature with or without prefix
    const providedSignature = signature.replace(/^sha256=/, '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    );
  } catch (error) {
    console.error('[Auth Hook] Signature verification error:', error);
    return false;
  }
}

// Email templates
function generateSignupConfirmationEmail(
  productName: string,
  productDomain: string,
  confirmationUrl: string,
  accentColor: string
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your ${productName} account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Welcome to ${productName}! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Thanks for signing up! Please confirm your email address to get started.
              </p>
              
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">
                Click the button below to verify your account:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="${confirmationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${accentColor}40;">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: ${accentColor}; font-size: 12px; word-break: break-all;">
                ${confirmationUrl}
              </p>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} ${productName}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                ${productDomain}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to ${productName}!

Thanks for signing up! Please confirm your email address to get started.

Click this link to verify your account:
${confirmationUrl}

This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} ${productName}
${productDomain}`;

  return { html, text };
}

function generatePasswordResetEmail(
  productName: string,
  productDomain: string,
  resetUrl: string,
  accentColor: string
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your ${productName} password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Reset Your Password 🔐
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                We received a request to reset your ${productName} password.
              </p>
              
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">
                Click the button below to choose a new password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${accentColor}40;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: ${accentColor}; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} ${productName}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                ${productDomain}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Reset Your ${productName} Password

We received a request to reset your password.

Click this link to choose a new password:
${resetUrl}

This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} ${productName}
${productDomain}`;

  return { html, text };
}

function generateMagicLinkEmail(
  productName: string,
  productDomain: string,
  magicLinkUrl: string,
  accentColor: string
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${productName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Sign In to ${productName} ✨
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Click the button below to sign in to your ${productName} account:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="${magicLinkUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${accentColor}40;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: ${accentColor}; font-size: 12px; word-break: break-all;">
                ${magicLinkUrl}
              </p>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                This link expires in 1 hour. If you didn't request this sign-in link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} ${productName}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                ${productDomain}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Sign In to ${productName}

Click this link to sign in:
${magicLinkUrl}

This link expires in 1 hour. If you didn't request this sign-in link, you can safely ignore this email.

© ${new Date().getFullYear()} ${productName}
${productDomain}`;

  return { html, text };
}

// Get accent color based on product
function getProductAccentColor(productContext: ProductContext): string {
  switch (productContext) {
    case 'tipjar':
      return '#10b981'; // Emerald green
    case 'djdash':
      return '#3b82f6'; // Blue
    case 'm10dj':
      return '#fcba00'; // Gold/Yellow
    default:
      return '#10b981';
  }
}

// Detect product context from redirect URL or user metadata
function detectProductContext(redirectTo?: string, userMetadata?: any): ProductContext {
  // Check redirect URL first
  if (redirectTo) {
    if (redirectTo.includes('tipjar.live') || redirectTo.includes('/tipjar/')) {
      return 'tipjar';
    }
    if (redirectTo.includes('djdash.net') || redirectTo.includes('/djdash/')) {
      return 'djdash';
    }
    if (redirectTo.includes('m10djcompany.com') || redirectTo.includes('/m10dj/')) {
      return 'm10dj';
    }
  }

  // Check user metadata
  if (userMetadata?.product_context) {
    return userMetadata.product_context as ProductContext;
  }

  // Default to tipjar
  return 'tipjar';
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Verify webhook signature
    const signature = request.headers.get('x-supabase-signature') || 
                     request.headers.get('authorization')?.replace('Bearer ', '');
    const secret = process.env.SUPABASE_AUTH_HOOK_SECRET || '';

    if (!verifySupabaseSignature(bodyText, signature, secret)) {
      console.error('[Auth Hook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the hook payload
    // Supabase sends different formats depending on hook type
    const {
      type,
      email,
      email_data,
      user,
      redirect_to,
      token,
      token_hash,
      confirmation_url,
      recovery_url,
      email_change_url,
    } = body;

    console.log('[Auth Hook] Received event:', { type, email, redirect_to });

    // Detect product context
    const productContext = detectProductContext(redirect_to, user?.user_metadata);
    const fromEmail = getProductFromEmail(productContext);
    const productName = getProductName(productContext);
    const productDomain = getProductBaseUrl(productContext).replace('https://', '');
    const accentColor = getProductAccentColor(productContext);

    // Import Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('[Auth Hook] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    let emailContent: { html: string; text: string };
    let subject: string;
    let actionUrl: string;

    // Handle different event types
    switch (type) {
      case 'signup':
      case 'email_confirmation':
        actionUrl = confirmation_url || email_data?.confirmation_url || '';
        emailContent = generateSignupConfirmationEmail(productName, productDomain, actionUrl, accentColor);
        subject = `Confirm your ${productName} account`;
        break;

      case 'recovery':
      case 'password_recovery':
        actionUrl = recovery_url || email_data?.recovery_url || '';
        emailContent = generatePasswordResetEmail(productName, productDomain, actionUrl, accentColor);
        subject = `Reset your ${productName} password`;
        break;

      case 'magiclink':
      case 'magic_link':
        actionUrl = confirmation_url || email_data?.confirmation_url || '';
        emailContent = generateMagicLinkEmail(productName, productDomain, actionUrl, accentColor);
        subject = `Sign in to ${productName}`;
        break;

      case 'email_change':
        actionUrl = email_change_url || email_data?.email_change_url || '';
        emailContent = generateSignupConfirmationEmail(productName, productDomain, actionUrl, accentColor);
        subject = `Confirm your new email for ${productName}`;
        break;

      case 'invite':
        actionUrl = confirmation_url || email_data?.confirmation_url || '';
        emailContent = generateSignupConfirmationEmail(productName, productDomain, actionUrl, accentColor);
        subject = `You've been invited to ${productName}`;
        break;

      default:
        console.log('[Auth Hook] Unknown event type:', type);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Get recipient email
    const recipientEmail = email || email_data?.email || user?.email;
    if (!recipientEmail) {
      console.error('[Auth Hook] No recipient email found');
      return NextResponse.json({ error: 'No recipient email' }, { status: 400 });
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (result.error) {
      console.error('[Auth Hook] Error sending email:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log(`[Auth Hook] Email sent successfully: ${result.data?.id}`);
    console.log(`  Type: ${type}`);
    console.log(`  To: ${recipientEmail}`);
    console.log(`  From: ${fromEmail}`);
    console.log(`  Product: ${productContext}`);

    return NextResponse.json({ success: true, email_id: result.data?.id });

  } catch (error: any) {
    console.error('[Auth Hook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Supabase Auth Hook',
    supportedEvents: ['signup', 'recovery', 'magiclink', 'email_change', 'invite']
  });
}

