/**
 * Resend Webhook Handler
 * 
 * Receives webhook events from Resend for incoming emails
 * Stores emails in Supabase and triggers real-time notifications
 * 
 * Note: Resend may not support webhooks for incoming emails directly.
 * This endpoint can also be used with email forwarding services
 * or IMAP polling that POSTs to this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify webhook signature (if Resend provides one)
 * TODO: Implement Resend signature verification when available
 */
function verifyWebhookSignature(signature: string | null, body: string): boolean {
  // For now, we'll use a simple API key check
  // In production, implement proper signature verification
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('RESEND_WEBHOOK_SECRET not set - webhook verification disabled');
    return true; // Allow for development
  }

  // TODO: Implement actual signature verification
  // This is a placeholder
  return true;
}

/**
 * Parse incoming email from webhook payload
 * Supports multiple formats:
 * - Resend webhook format (if available)
 * - Email forwarding format
 * - Generic email format
 */
function parseIncomingEmail(body: any): {
  to: string;
  from: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: string;
  metadata: Record<string, any>;
} | null {
  try {
    // Try Resend webhook format first
    if (body.type === 'email.received' && body.data) {
      const email = body.data;
      return {
        to: email.to?.[0]?.email || email.to,
        from: email.from?.email || email.from,
        subject: email.subject || '(No Subject)',
        bodyText: email.text || email.body || '',
        bodyHtml: email.html,
        receivedAt: email.created_at || new Date().toISOString(),
        metadata: {
          resend_id: email.id,
          headers: email.headers,
          webhook_type: 'resend',
        },
      };
    }

    // Try generic email format
    if (body.to && body.from) {
      return {
        to: body.to,
        from: body.from,
        subject: body.subject || '(No Subject)',
        bodyText: body.text || body.body || body.bodyText || '',
        bodyHtml: body.html || body.bodyHtml,
        receivedAt: body.receivedAt || body.created_at || new Date().toISOString(),
        metadata: {
          webhook_type: 'generic',
          ...body.metadata,
        },
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing incoming email:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature (if provided)
    const signature = request.headers.get('resend-signature') || 
                     request.headers.get('x-webhook-signature') ||
                     request.headers.get('authorization');

    // Get request body
    const body = await request.json();

    // Verify webhook signature
    const bodyString = JSON.stringify(body);
    if (!verifyWebhookSignature(signature, bodyString)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse incoming email
    const emailData = parseIncomingEmail(body);
    if (!emailData) {
      console.error('Could not parse incoming email from webhook');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`📧 Incoming email webhook: ${emailData.subject} from ${emailData.from} to ${emailData.to}`);

    // Find inbox for this email address
    const { data: inbox, error: inboxError } = await supabase
      .from('email_inboxes')
      .select('id, organization_id, product_id, contact_id')
      .eq('email_address', emailData.to)
      .eq('is_active', true)
      .single();

    if (inboxError || !inbox) {
      // Try to find by domain (catch-all)
      const domain = emailData.to.split('@')[1];
      const { data: catchAllInbox } = await supabase
        .from('email_inboxes')
        .select('id, organization_id, product_id, contact_id')
        .ilike('email_address', `%@${domain}`)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!catchAllInbox) {
        console.warn(`No inbox found for ${emailData.to} - email not stored`);
        // Still return 200 to prevent webhook retries
        return NextResponse.json({
          success: true,
          message: 'Email received but no inbox found',
        });
      }

      // Use catch-all inbox
      const inboxId = catchAllInbox.id;
      const organizationId = catchAllInbox.organization_id;
      const productId = catchAllInbox.product_id;

      // Store email
      const { data: email, error: emailError } = await supabase
        .from('emails')
        .insert({
          inbox_email: emailData.to, // Store actual recipient
          from_address: emailData.from,
          to_address: emailData.to,
          subject: emailData.subject,
          body_text: emailData.bodyText,
          body_html: emailData.bodyHtml,
          received_at: emailData.receivedAt,
          is_read: false,
          metadata: {
            ...emailData.metadata,
            inbox_id: inboxId,
            organization_id: organizationId,
            product_id: productId,
          },
        })
        .select()
        .single();

      if (emailError) {
        console.error('Error storing email:', emailError);
        return NextResponse.json(
          { error: 'Failed to store email' },
          { status: 500 }
        );
      }

      // Trigger real-time notification
      await supabase
        .channel(`email-notifications:${organizationId}`)
        .send({
          type: 'broadcast',
          event: 'email.received',
          payload: {
            emailId: email.id,
            inboxEmail: emailData.to,
            from: emailData.from,
            subject: emailData.subject,
            timestamp: new Date().toISOString(),
          },
        });

      return NextResponse.json({
        success: true,
        emailId: email.id,
        message: 'Email stored successfully',
      });
    }

    // Store email with found inbox
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .insert({
        inbox_email: emailData.to,
        from_address: emailData.from,
        to_address: emailData.to,
        subject: emailData.subject,
        body_text: emailData.bodyText,
        body_html: emailData.bodyHtml,
        received_at: emailData.receivedAt,
        is_read: false,
        metadata: {
          ...emailData.metadata,
          inbox_id: inbox.id,
          organization_id: inbox.organization_id,
          product_id: inbox.product_id,
        },
      })
      .select()
      .single();

    if (emailError) {
      console.error('Error storing email:', emailError);
      return NextResponse.json(
        { error: 'Failed to store email' },
        { status: 500 }
      );
    }

    // Trigger real-time notification via Supabase Realtime
    await supabase
      .channel(`email-notifications:${inbox.organization_id}`)
      .send({
        type: 'broadcast',
        event: 'email.received',
        payload: {
          emailId: email.id,
          inboxEmail: emailData.to,
          from: emailData.from,
          subject: emailData.subject,
          timestamp: new Date().toISOString(),
        },
      });

    console.log(`✅ Email stored and notification sent: ${email.id}`);

    return NextResponse.json({
      success: true,
      emailId: email.id,
      message: 'Email stored successfully',
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Resend webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

