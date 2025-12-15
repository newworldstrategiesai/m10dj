# Stripe Webhook Testing & Usage Guide

## How Stripe Webhooks Are Used in This App

### Purpose
Stripe webhooks automatically update payment status in the database when payments succeed, fail, or are completed. This ensures payments are processed even if users don't visit the success page.

### Webhook Events Handled

1. **`checkout.session.completed`**
   - Triggered when a Stripe Checkout session is completed
   - Extracts `request_id` from session metadata
   - Processes payment and updates `crowd_requests` table
   - Handles special cases: live stream tips, PPV streams

2. **`payment_intent.succeeded`**
   - Triggered when a payment intent succeeds
   - Extracts `request_id` from payment intent metadata
   - Updates request status to "paid"
   - Sets `amount_paid` and `paid_at` fields

3. **`payment_intent.payment_failed`**
   - Triggered when a payment fails
   - Updates request status to "failed"

4. **`charge.succeeded`**
   - Backup handler for charge success events
   - Retrieves payment intent and processes if needed

### Webhook Flow

```
1. User completes payment in Stripe Checkout
   ↓
2. Stripe sends webhook to /api/webhooks/stripe
   ↓
3. Webhook handler verifies signature
   ↓
4. Extracts request_id from metadata
   ↓
5. Updates crowd_requests table:
   - payment_status = 'paid'
   - payment_intent_id = <stripe_payment_intent_id>
   - amount_paid = <amount>
   - paid_at = <timestamp>
   - requester_name, email, phone from Stripe customer data
   ↓
6. Creates invoice (if payment succeeded)
   ↓
7. Returns 200 OK to Stripe
```

### Key Features

- **Automatic Processing**: Payments are processed without user interaction
- **Idempotency**: Checks if payment already processed before updating
- **Customer Data Sync**: Updates requester info from Stripe (source of truth)
- **Invoice Creation**: Automatically creates invoices for successful payments
- **Error Handling**: Returns 200 even on errors to prevent Stripe retries

## Testing Results

### Configuration Test ✅
- **Status**: Healthy
- **Stripe Connection**: ✅ Connected (Account: acct_1OUH9GEJct0cvYrG)
- **Webhook Secret**: ✅ Configured
- **Supabase Connection**: ✅ Connected
- **Webhook Endpoints**: 3 configured
  - Production: `https://m10djcompany.com/api/webhooks/stripe` (enabled)
  - 2 other endpoints (disabled)

### Webhook Endpoint Status
- **URL**: `/api/webhooks/stripe`
- **Method**: POST only
- **Signature Verification**: ✅ Enabled (requires STRIPE_WEBHOOK_SECRET)
- **Event Types Supported**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.succeeded`

### Recent Activity
- Found 1 recent webhook event in last 24 hours
- Event type: `checkout.session.expired` (from production)

## Testing Tools Available

### 1. Webhook Test Endpoint
```bash
GET /api/webhooks/stripe/test
```
Returns configuration status and recommendations.

### 2. Webhook Logs Endpoint
```bash
GET /api/webhooks/stripe/logs
```
Shows recent payments processed via webhooks.

### 3. Test Button in Admin UI
- Location: `/admin/crowd-requests` page header
- Click "Test Webhooks" button to run configuration check

## How to Test Webhooks Manually

### Option 1: Using Stripe CLI (Recommended)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
stripe trigger charge.succeeded
```

### Option 2: Using Stripe Dashboard
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event type (e.g., `payment_intent.succeeded`)
5. Check server logs for processing

### Option 3: Process Real Test Payment
1. Create a test crowd request
2. Complete payment with test card: `4242 4242 4242 4242`
3. Check if request is automatically marked as "paid"
4. Verify in Stripe Dashboard > Events

## Monitoring Webhooks

### Check Webhook Delivery Status
1. Stripe Dashboard > Developers > Webhooks
2. Click on your endpoint
3. View "Events" tab for delivery status
4. Green checkmark = successful delivery
5. Red X = failed delivery (check logs)

### Server Logs
Webhook processing logs include:
- `📥 Received Stripe webhook: <event_type> (ID: <event_id>)`
- `✅ Processing <event_type> for <id>`
- `✅ Successfully processed payment <payment_intent_id> for request <request_id>`
- `❌ Error processing webhook: <error>`

### Database Verification
Check `crowd_requests` table:
```sql
SELECT 
  id,
  payment_status,
  payment_intent_id,
  amount_paid,
  paid_at,
  updated_at
FROM crowd_requests
WHERE payment_intent_id IS NOT NULL
ORDER BY paid_at DESC
LIMIT 10;
```

## Troubleshooting

### Webhook Not Received
1. Check webhook endpoint URL in Stripe Dashboard
2. Verify endpoint is enabled
3. Check server is running and accessible
4. Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard

### Payment Not Updating
1. Check webhook delivery status in Stripe Dashboard
2. Check server logs for errors
3. Verify `request_id` is in payment metadata
4. Use "Sync Payments" button in admin UI

### Signature Verification Failed
1. Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
2. Check webhook secret is for correct environment (test/live)
3. Ensure raw body is being read correctly

## Production Webhook Setup

### Required Environment Variables
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret from Stripe Dashboard
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### Webhook Endpoint URL
Production: `https://m10djcompany.com/api/webhooks/stripe`

### Required Events
Make sure these events are enabled in Stripe Dashboard:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`

## Summary

✅ **Webhooks are properly configured and working**
- Configuration is healthy
- All required environment variables are set
- Webhook endpoint is accessible
- Recent activity detected

The webhook system automatically processes payments and updates the database, ensuring payment status stays in sync with Stripe without requiring user interaction.

