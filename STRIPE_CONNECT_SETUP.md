# Stripe Connect Express Implementation Guide

## Overview

This implementation enables **platform payments** where:
- SaaS users (DJs) receive payments through YOUR Stripe account
- You automatically take a platform fee (3.5% + $0.30)
- Stripe automatically pays out the remaining amount to SaaS users
- No Stripe account setup required for SaaS users (major competitive advantage!)

## What's Been Implemented

### 1. Database Migration
- ✅ Added Stripe Connect fields to `organizations` table
- Fields: `stripe_connect_account_id`, `stripe_connect_onboarding_complete`, etc.
- Platform fee configuration: `platform_fee_percentage`, `platform_fee_fixed`

### 2. Helper Functions (`utils/stripe/connect.ts`)
- ✅ `createConnectAccount()` - Creates Stripe Connect Express account
- ✅ `createAccountLink()` - Generates onboarding link
- ✅ `getAccountStatus()` - Checks account activation status
- ✅ `createPaymentWithPlatformFee()` - Processes payments with fees
- ✅ `createCheckoutSessionWithPlatformFee()` - Creates checkout sessions
- ✅ `calculatePlatformFee()` - Calculates fee amounts

### 3. API Routes
- ✅ `/api/stripe-connect/create-account` - Creates Connect account
- ✅ `/api/stripe-connect/onboarding-link` - Gets onboarding link
- ✅ `/api/stripe-connect/status` - Checks account status
- ✅ `/api/stripe-connect/create-payment` - Processes payments with fees
- ✅ `/api/stripe-connect/webhook` - Handles Connect webhooks

### 4. UI Components
- ✅ `StripeConnectSetup` component - Onboarding UI
- ✅ Integrated into `/onboarding/welcome` page
- ✅ `/onboarding/stripe-complete` - Completion page

## Setup Instructions

### Step 1: Run Database Migration

Run the migration:
```sql
-- File: supabase/migrations/20250124000007_add_stripe_connect_to_organizations.sql
```

Or use the Supabase dashboard SQL editor.

### Step 2: Configure Stripe

1. **Enable Stripe Connect** in your Stripe Dashboard:
   - Go to Settings → Connect
   - Enable "Express accounts"
   - Set up your platform branding

2. **Get Webhook Secret**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe-connect/webhook`
   - Select events:
     - `account.updated`
     - `payment_intent.succeeded`
     - `transfer.created`
   - Copy the webhook signing secret

3. **Set Environment Variables**:
```env
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_... (optional, can use STRIPE_WEBHOOK_SECRET)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Step 3: Test the Flow

1. **Create Test Account**:
   - Sign up as a new SaaS user
   - Go to onboarding page
   - Click "Set Up Payment Processing"

2. **Complete Onboarding**:
   - Stripe will open onboarding page
   - Use test data:
     - Email: test@example.com
     - Phone: +1 555-555-5555
     - SSN: 000-00-0000 (test mode)
     - Bank: Use Stripe test account numbers

3. **Verify Status**:
   - Check that account status updates
   - Verify payouts are enabled

## How It Works

### Payment Flow

```
1. Customer pays $100 for song request
   ↓
2. Payment processed through YOUR Stripe account
   ↓
3. Platform fee deducted: $3.80 (3.5% + $0.30)
   ↓
4. Remaining $96.20 automatically transferred to SaaS user's bank
   ↓
5. SaaS user receives money in 2-7 days (Stripe standard)
```

### Fee Calculation

```javascript
// Example: $100 payment
const amount = 100;
const feePercentage = 3.5; // 3.5%
const feeFixed = 0.30; // $0.30

const percentageFee = (amount * feePercentage) / 100; // $3.50
const totalFee = percentageFee + feeFixed; // $3.80
const payout = amount - totalFee; // $96.20
```

## Revenue Model

### Platform Fee Structure
- **Percentage**: 3.5% (covers Stripe's ~2.9% + your margin)
- **Fixed**: $0.30 per transaction
- **Total Example**: $100 payment → $3.80 platform fee

### Revenue Projections
```
100 SaaS customers
× 20 payments/month average
× $50 average payment
= 2,000 transactions/month

Platform fees:
2,000 × $1.75 average fee = $3,500/month
= $42,000/year (just from transaction fees!)
```

## API Usage Examples

### Create Payment

```javascript
// Frontend
const response = await fetch('/api/stripe-connect/create-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 50.00, // $50.00
    organizationId: 'org-id',
    metadata: {
      event_code: 'wedding-2024',
      request_type: 'song',
    },
  }),
});

const { clientSecret, feeCalculation } = await response.json();

// Use clientSecret with Stripe.js
```

### Check Account Status

```javascript
const response = await fetch('/api/stripe-connect/status', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { isComplete, accountStatus } = await response.json();
```

## Webhook Events

The webhook handler processes:
- `account.updated` - Updates organization when account status changes
- `payment_intent.succeeded` - Logs successful payments
- `transfer.created` - Tracks payouts to SaaS users

## Security Considerations

1. **Authentication**: All API routes require authentication
2. **Authorization**: Users can only access their own organization's data
3. **Webhook Verification**: Stripe signature verification on webhooks
4. **Platform Admin**: Platform admins can see all accounts (for support)

## Testing

### Test Mode
- Use Stripe test mode keys
- Test account numbers from Stripe docs
- No real money transferred

### Test Scenarios
1. ✅ Create Connect account
2. ✅ Complete onboarding
3. ✅ Process test payment
4. ✅ Verify fee calculation
5. ✅ Check payout status

## Troubleshooting

### Account Not Activating
- Check webhook is receiving `account.updated` events
- Verify webhook secret is correct
- Check Stripe Dashboard for account status

### Payments Failing
- Ensure account has `charges_enabled: true`
- Verify `payouts_enabled: true`
- Check Stripe Dashboard for error messages

### Webhook Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure events are selected in Stripe Dashboard

## Next Steps

1. ✅ Run database migration
2. ✅ Configure Stripe Connect
3. ✅ Set environment variables
4. ✅ Test with test account
5. ⏳ Update payment processing in crowd requests
6. ⏳ Add payment analytics dashboard
7. ⏳ Set up payout notifications

## Support

For Stripe Connect documentation:
- https://stripe.com/docs/connect
- https://stripe.com/docs/connect/express-accounts

