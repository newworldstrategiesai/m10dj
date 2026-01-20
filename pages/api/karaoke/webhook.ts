/**
 * Secure Stripe webhook handler for karaoke payments
 * Processes payment events with signature verification
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhookSignature, handleStripeWebhook } from '@/utils/karaoke-payments';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook configuration error' });
    }

    if (!sig) {
      console.error('Missing Stripe signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook signature
    const signatureValid = verifyWebhookSignature(rawBody, sig, webhookSecret);

    if (!signatureValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse event
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // Rate limiting for webhooks (prevent abuse)
    const eventId = event.id;
    const eventType = event.type;

    // Basic rate limiting - only process each event once
    // In production, you might want to use Redis for this
    const processedKey = `webhook_processed_${eventId}`;
    const globalAny = global as any;
    if (globalAny[processedKey]) {
      console.log('Webhook already processed:', eventId);
      return res.status(200).json({ received: true, duplicate: true });
    }
    globalAny[processedKey] = true;

    // Set timeout to clean up processed events (prevent memory leak)
    setTimeout(() => {
      delete globalAny[processedKey];
    }, 5 * 60 * 1000); // 5 minutes

    // Log webhook reception
    console.log(`Processing webhook: ${eventType} (${eventId})`);

    // Handle the webhook
    const result = await handleStripeWebhook(event);

    if (result.success) {
      console.log(`Webhook processed successfully: ${eventType}`);
      res.status(200).json({ received: true });
    } else {
      console.error(`Webhook processing failed: ${eventType}`, result.error);
      res.status(500).json({ error: 'Webhook processing failed', details: result.error });
    }

  } catch (error: any) {
    console.error('Webhook handler error:', error);

    // Don't expose internal errors to webhook sender
    res.status(400).json({
      error: 'Webhook processing error',
      // Only include error details in development
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}

/**
 * Disable Next.js body parsing for webhook signature verification
 * Raw body is required for signature verification
 */
export const config = {
  api: {
    bodyParser: false,
  },
};