# Stripe Webhook Setup Guide

This guide ensures payments are **always** processed automatically, even if users don't visit the success page.

## Why Webhooks Are Critical

Without webhooks, payment processing relies on:
- User visiting the success page ✅ (works if user completes flow)
- Manual linking ❌ (requires admin intervention)

With webhooks, payments are processed **automatically** when Stripe confirms payment, regardless of user behavior.

## Setup Steps

### 1. Configure Webhook Endpoint in Stripe

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   - **Production**: `https://your-domain.com/api/webhooks/stripe`
   - **Development**: `http://localhost:3000/api/webhooks/stripe` (use Stripe CLI for local testing)
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.succeeded` (optional, for redundancy)
5. Copy the **Signing secret** (starts with `whsec_`)

### 2. Add Environment Variable

Add to your `.env.local` (development) and Vercel environment variables (production):

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 3. Set Up Background Sync Job (Optional but Recommended)

The background sync job catches any payments that slip through. Set it up to run every 5-10 minutes.

#### Option A: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-orphaned-payments",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Option B: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com) to call:

```
POST https://your-domain.com/api/cron/sync-orphaned-payments
Authorization: Bearer YOUR_CRON_SECRET
```

Set `CRON_SECRET` environment variable for security.

### 4. Test the Webhook

#### Using Stripe CLI (Recommended for Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Using Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Verify it appears in your logs

## How It Works

### Automatic Processing Flow

1. **User completes payment** → Stripe processes payment
2. **Stripe sends webhook** → `checkout.session.completed` event
3. **Webhook handler processes** → Links payment to request, updates customer data
4. **Request appears in admin UI** → Automatically, no manual intervention needed

### Fallback Mechanisms

1. **Webhook fails** → Background sync job catches it (runs every 5 minutes)
2. **Background sync misses it** → Admin can use "Sync Orphaned Payments" button
3. **Still missing** → Admin can use "Link Stripe Payment" manually

### Multiple Safety Nets

- ✅ **Webhook** (primary - processes immediately)
- ✅ **Success page** (secondary - processes when user visits)
- ✅ **Background sync** (tertiary - catches missed payments)
- ✅ **Manual sync** (quaternary - admin can trigger)

## Monitoring

Check webhook delivery in Stripe Dashboard:
- Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
- Click on your endpoint
- View "Recent deliveries" to see success/failure rates

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` is set
3. Check Stripe Dashboard for delivery errors
4. Review server logs for webhook processing errors

### Payments Still Not Appearing

1. Check webhook is configured and receiving events
2. Run "Sync Orphaned Payments" manually
3. Use "Debug Missing Payment" tool with payment ID
4. Check if request exists but has wrong `organization_id`

## Security

- Webhook signature verification ensures events are from Stripe
- `CRON_SECRET` protects background sync endpoint
- Service role key is server-side only (never exposed to client)

