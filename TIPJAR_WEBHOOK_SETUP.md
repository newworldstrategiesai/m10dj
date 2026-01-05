# 🔗 TipJar Webhook Setup Guide

## Do You Need a Separate Webhook for tipjar.live?

**Short Answer**: **It depends on your deployment setup.**

---

## Current Setup

Based on your codebase, you have webhook endpoints configured for:
- **M10 DJ Company**: `https://m10djcompany.com/api/webhooks/stripe` ✅ (already configured)
- **Stripe Connect**: `/api/stripe-connect/webhook` (for Connect-specific events)

---

## Two Scenarios

### Scenario 1: Same Deployment (Recommended) ✅

**If both domains point to the same Vercel deployment:**

- ✅ **You DON'T need a separate webhook**
- ✅ The existing webhook at `m10djcompany.com/api/webhooks/stripe` will work for both domains
- ✅ Stripe sends webhooks to the URL you configure, and your handler processes them regardless of which domain the user came from

**Why this works:**
- Same codebase = same webhook handler
- Handler processes events based on metadata (organization_id, product_context)
- No domain-specific logic needed

**Action Required:**
- ✅ **None** - Your existing webhook will work for TipJar too!

---

### Scenario 2: Separate Deployments

**If tipjar.live is a completely separate deployment:**

- ⚠️ **You DO need a separate webhook**
- ⚠️ Each deployment needs its own webhook endpoint
- ⚠️ Stripe can't send to a different domain

**Action Required:**
1. Add new webhook endpoint in Stripe Dashboard:
   - URL: `https://tipjar.live/api/stripe-connect/webhook`
   - Events: `account.updated`, `payment_intent.succeeded`, `transfer.created`
2. Get new webhook secret
3. Add to environment variables:
   - `STRIPE_CONNECT_WEBHOOK_SECRET` (for tipjar.live)
   - Keep existing `STRIPE_WEBHOOK_SECRET` (for m10djcompany.com)

---

## Recommended Setup (Same Deployment)

Since you're likely using the same Vercel deployment for both domains, here's the recommended approach:

### Option A: Use Existing Webhook (Simplest) ✅

**For Stripe Connect events:**
- Use existing webhook: `https://m10djcompany.com/api/stripe-connect/webhook`
- Or use: `https://m10djcompany.com/api/webhooks/stripe` (if it handles Connect events)

**Pros:**
- ✅ No additional configuration needed
- ✅ Single webhook to manage
- ✅ Works for both domains

**Cons:**
- ⚠️ All webhook events go to m10djcompany.com URL (but that's fine if it's the same deployment)

---

### Option B: Add tipjar.live Webhook (More Explicit)

**If you want separate webhooks for clarity:**

1. **Add new webhook endpoint in Stripe Dashboard:**
   - Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - URL: `https://tipjar.live/api/stripe-connect/webhook`
   - Select events:
     - `account.updated`
     - `payment_intent.succeeded`
     - `transfer.created`
   - Copy the signing secret

2. **Set environment variable:**
   ```bash
   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxxxx  # New secret for tipjar.live
   ```

3. **Your code already supports this:**
   ```javascript
   // pages/api/stripe-connect/webhook.js
   const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || 
                        process.env.STRIPE_WEBHOOK_SECRET;
   ```
   It will use `STRIPE_CONNECT_WEBHOOK_SECRET` if set, otherwise falls back to `STRIPE_WEBHOOK_SECRET`.

**Pros:**
- ✅ Clear separation between domains
- ✅ Can have different secrets for security
- ✅ Easier to debug domain-specific issues

**Cons:**
- ⚠️ More webhooks to manage
- ⚠️ Requires additional configuration

---

## Which Events Do You Need?

### For TipJar (Stripe Connect):

**Required Events:**
- ✅ `account.updated` - Updates organization when Connect account status changes
- ✅ `payment_intent.succeeded` - Logs successful payments
- ✅ `transfer.created` - Tracks payouts to connected accounts

**Optional Events:**
- `payment_intent.payment_failed` - Handle failed payments
- `charge.refunded` - Handle refunds

### For M10 DJ Company (General):

**Required Events:**
- ✅ `checkout.session.completed` - Process payments
- ✅ `payment_intent.succeeded` - Payment confirmations
- ✅ `payment_intent.payment_failed` - Failed payments

---

## Verification Steps

### 1. Check Current Webhook Configuration

Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)

**Check:**
- [ ] What endpoints are currently configured?
- [ ] Which events are they listening to?
- [ ] Are they enabled?

### 2. Test Webhook Delivery

**For TipJar:**
1. Create a test Connect account
2. Complete onboarding
3. Check Stripe Dashboard → Webhooks → [Your endpoint] → Recent deliveries
4. Verify `account.updated` event was received

**For Payments:**
1. Process a test payment
2. Check webhook deliveries
3. Verify `payment_intent.succeeded` event was received

### 3. Verify Handler Logic

Your webhook handlers already support both domains because they:
- Use metadata to identify organizations
- Don't have domain-specific logic
- Process events based on `organization_id` and `product_context`

---

## Recommended Action Plan

### If Same Deployment (Most Likely):

1. ✅ **Verify existing webhook works for both domains**
2. ✅ **Test with TipJar user** - Create Connect account and verify webhook receives `account.updated`
3. ✅ **No additional setup needed** - Your existing webhook will work!

### If Separate Deployments:

1. ⚠️ **Add new webhook endpoint** for tipjar.live
2. ⚠️ **Set `STRIPE_CONNECT_WEBHOOK_SECRET`** environment variable
3. ⚠️ **Test webhook delivery** from Stripe Dashboard

---

## Quick Test

To verify your webhook setup:

```bash
# Check if webhook endpoint is accessible
curl -I https://m10djcompany.com/api/stripe-connect/webhook
curl -I https://tipjar.live/api/stripe-connect/webhook

# Both should return 405 (Method Not Allowed) for GET
# This means the endpoint exists and is working
```

---

## Summary

**Most Likely Answer**: **You DON'T need a separate webhook** if both domains use the same deployment.

**Your existing webhook at `m10djcompany.com/api/stripe-connect/webhook` will work for TipJar too**, as long as:
- ✅ Both domains point to the same Vercel deployment
- ✅ The webhook handler processes events based on metadata (which it does)
- ✅ Environment variables are set correctly

**If you want explicit separation**, you can add a second webhook endpoint for tipjar.live, but it's not required.

---

## Next Steps

1. ✅ Verify your deployment setup (same or separate?)
2. ✅ Test webhook with TipJar user (create Connect account)
3. ✅ Check webhook deliveries in Stripe Dashboard
4. ✅ Add separate webhook only if needed (separate deployments)

**Ready to test!** 🚀

