# DJ Payment Flow - How DJs Get Paid

## Current Situation

When a new DJ onboards and starts receiving requests, here's how payments work:

### For DJs WITH Stripe Connect Set Up ✅

1. **Customer pays** → Payment goes directly to DJ's Stripe Connect account
2. **Platform fee deducted** → 3.5% + $0.30 automatically deducted
3. **DJ receives payout** → Money goes to DJ's bank account automatically (standard payouts: 2-7 days, instant payouts: available with 1% fee)

**Example:**
- Customer pays $10.00 for a song request
- Platform fee: $0.35 (3.5%) + $0.30 = $0.65
- DJ receives: $9.35

### For DJs WITHOUT Stripe Connect Set Up ⚠️

1. **Customer pays** → Payment goes to platform Stripe account
2. **DJ doesn't get paid automatically** → Money stays in platform account
3. **Manual payout required** → Platform admin must manually transfer funds

## What DJs Need to Do

### Step 1: Complete Stripe Connect Onboarding

1. Go to their admin dashboard
2. Navigate to Settings or Payment Setup
3. Click "Set Up Payments" or "Connect Stripe Account"
4. Complete Stripe's onboarding process:
   - Provide business/personal information
   - Add bank account for payouts
   - Verify identity (if required)

### Step 2: Verify Account Status

Once onboarding is complete, DJs should see:
- ✅ Charges enabled
- ✅ Payouts enabled
- Connected account ID in their settings

### Step 3: Start Receiving Payments

Once connected:
- All future payments automatically route to their account
- Platform fees are automatically deducted
- Money appears in their Stripe dashboard
- Standard payouts: 2-7 business days
- Instant payouts: Available (1% fee, minimum $0.50)

## Technical Implementation

### Payment Routing Logic

The system checks if a DJ has Stripe Connect set up:

```javascript
// In pages/api/crowd-request/create-checkout.js
const hasConnectAccount = organization?.stripe_connect_account_id && 
                          organization?.stripe_connect_charges_enabled && 
                          organization?.stripe_connect_payouts_enabled;
```

**If YES (has Connect):**
- Uses `createCheckoutSessionWithPlatformFee()` 
- Payment goes to DJ's connected account
- Platform fee automatically deducted
- DJ gets paid automatically

**If NO (no Connect):**
- Uses regular Stripe Checkout
- Payment goes to platform account
- DJ must wait for manual payout

### Platform Fees

Default platform fees:
- **Percentage**: 3.5%
- **Fixed**: $0.30 per transaction

These can be customized per organization in the database:
- `platform_fee_percentage` column
- `platform_fee_fixed` column

### Payout Options

1. **Standard Payouts** (Default)
   - 2-7 business days
   - No additional fee
   - Automatic

2. **Instant Payouts** (Optional)
   - Available immediately
   - 1% fee (minimum $0.50)
   - Requires debit card on file
   - Can be enabled via API: `/api/stripe-connect/instant-payout`

## For New DJs (Starter Tier)

When a DJ signs up for the free request page:

1. They can start receiving requests immediately
2. **BUT** they won't get paid until they:
   - Complete Stripe Connect onboarding
   - Verify their account

### Recommended Flow

1. **Onboarding**: Guide DJs to set up Stripe Connect during onboarding
2. **First Request**: Show a prompt if they receive a request but don't have Connect set up
3. **Dashboard**: Display connection status prominently
4. **Notifications**: Alert them when they have pending payouts

## Manual Payout Process (Fallback)

If a DJ receives payments before setting up Connect:

1. Payments accumulate in platform account
2. Platform admin can:
   - View pending payouts in admin dashboard
   - Manually transfer funds via Stripe dashboard
   - Or use the instant payout API if DJ sets up Connect later

## Next Steps to Improve

1. **Add onboarding prompt** for Stripe Connect during DJ signup
2. **Show payment status** in DJ dashboard (pending, paid, payout date)
3. **Add payout history** showing all transactions
4. **Create payout dashboard** showing:
   - Available balance
   - Pending payouts
   - Payout history
   - Instant payout option
5. **Email notifications** when:
   - Payment received
   - Payout initiated
   - Payout completed

## API Endpoints Available

- `/api/stripe-connect/create-account` - Create Connect account
- `/api/stripe-connect/onboarding-link` - Get onboarding URL
- `/api/stripe-connect/status` - Check account status
- `/api/stripe-connect/instant-payout` - Request instant payout
- `/api/stripe-connect/create-payment` - Create payment with platform fee

