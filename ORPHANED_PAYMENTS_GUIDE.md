# Orphaned Payments - Guide

## What Are Orphaned Payments?

Orphaned payments are payments that exist in Stripe but aren't properly linked to records in your database. This can happen due to:

1. **Webhook failures** - Stripe webhook didn't fire or failed to update the database
2. **Race conditions** - Payment succeeded before the request was fully created
3. **Missing metadata** - Payment was created without `request_id` in metadata
4. **Database errors** - Update query failed silently

## Types of Orphaned Payments

### 1. Payments with `request_id` but not linked
- Payment exists in Stripe with `request_id` in metadata
- Request exists in database
- But `payment_intent_id` is not set on the request OR `payment_status` is not 'paid'

**Impact:** Request shows as unpaid even though payment succeeded

### 2. Sessions with `request_id` but not linked
- Stripe checkout session exists with `request_id` in metadata
- Request exists in database
- But `stripe_session_id` is not set on the request OR `payment_status` is not 'paid'

**Impact:** Similar to above - payment succeeded but not recorded

### 3. Payments without `request_id`
- Payment exists in Stripe
- No `request_id` in metadata
- Cannot be automatically linked to a request

**Impact:** Payment exists but can't be matched to a request (may need manual investigation)

## How to Find Orphaned Payments

1. Go to **Admin → Crowd Requests** page
2. Click the **"Find Orphaned"** button (search icon)
3. A dialog will show:
   - Total count of orphaned payments
   - Breakdown by type
   - Details of each orphaned payment
   - Option to sync them

## How to Fix Orphaned Payments

### Automatic Sync (Recommended)

1. Click **"Find Orphaned"** button
2. Review the orphaned payments in the dialog
3. Click **"Sync Orphaned Payments"** button
4. The system will:
   - Search Stripe for payments matching request IDs
   - Update database records with payment information
   - Mark requests as paid
   - Link `payment_intent_id` and `stripe_session_id`

### Manual Fix (For payments without request_id)

For payments without `request_id`, you'll need to manually investigate:

1. Check the payment details in Stripe dashboard
2. Look at customer email, description, or other metadata
3. Find the corresponding request in your database
4. Manually update the request with:
   - `payment_intent_id`
   - `payment_status = 'paid'`
   - `amount_paid`
   - `paid_at` timestamp

## Prevention

### 1. Webhook Reliability
- Ensure Stripe webhooks are properly configured
- Monitor webhook delivery in Stripe dashboard
- Set up retry logic for failed webhooks

### 2. Database Transactions
- Use transactions when creating requests and payments
- Ensure atomic operations (all or nothing)

### 3. Error Handling
- Log all payment creation attempts
- Alert on webhook failures
- Monitor for orphaned payments regularly

### 4. Background Sync Job
Consider setting up a cron job to automatically sync orphaned payments:
- File: `pages/api/cron/sync-orphaned-payments.js`
- Run daily or hourly
- Prevents accumulation of orphaned payments

## Cross-Product Impact

### Affected Products
- **DJDash.net** - Crowd requests/payments
- **M10DJCompany.com** - Crowd requests/payments
- **TipJar.live** - Tip payments (if using same payment flow)

### Risk Assessment
- **Medium Risk** - Revenue tracking issues
- **Data Integrity** - Payments exist but not recorded
- **Customer Impact** - Requests may show as unpaid even though payment succeeded

## Technical Details

### API Endpoints

**Find Orphaned Payments:**
```
GET /api/crowd-request/find-orphaned-payments
```

**Sync Orphaned Payments:**
```
POST /api/crowd-request/sync-orphaned-payments
```

### Database Fields

Key fields that should be linked:
- `crowd_requests.payment_intent_id` → Stripe PaymentIntent ID
- `crowd_requests.stripe_session_id` → Stripe CheckoutSession ID
- `crowd_requests.payment_status` → Should be 'paid' for succeeded payments
- `crowd_requests.amount_paid` → Amount from Stripe
- `crowd_requests.paid_at` → Timestamp from Stripe

### Stripe Metadata

Payments should have:
```json
{
  "request_id": "uuid-of-crowd-request",
  "organization_id": "uuid-of-organization"
}
```

## Monitoring

### Regular Checks
- Run "Find Orphaned" weekly
- Review orphaned payment counts
- Investigate patterns (e.g., all from same time period)

### Alerts
Consider setting up alerts for:
- High orphaned payment count (> 10)
- Orphaned payments older than 7 days
- Webhook failure rate > 5%

## Troubleshooting

### If sync fails:
1. Check Stripe API status
2. Verify database connection
3. Check RLS policies (may need service role key)
4. Review console logs for errors

### If payments can't be matched:
1. Check Stripe metadata
2. Verify request IDs exist in database
3. Check for organization_id mismatches
4. Review payment timestamps vs request creation times

---

## Summary

Orphaned payments are a data integrity issue that can be automatically fixed in most cases. The improved UI now shows a proper dialog instead of an alert, making it easier to:
- See what's orphaned
- Understand why
- Fix it with one click

Regular monitoring and automatic sync jobs can prevent accumulation of orphaned payments.

