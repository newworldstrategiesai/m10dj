# Complete Quote Flow Setup Guide

## Overview

This document outlines the complete customer journey from service selection through contract signing to payment.

## Flow Steps

1. **Service Selection** (`/quote/[id]`)
   - Customer selects package and add-ons
   - Total calculates automatically
   - Clicks "Continue to Next Step"

2. **Contract Review & Signature** (`/quote/[id]/contract`)
   - Reviews service agreement
   - Signs electronically using canvas signature
   - Agrees to terms checkbox
   - Proceeds to payment

3. **Secure Payment** (`/quote/[id]/payment`)
   - Pays 50% deposit via Stripe
   - Remaining 50% due 7 days before event
   - PCI-compliant payment processing

4. **Confirmation** (`/quote/[id]/confirmation`)
   - Payment confirmation
   - Event details recap
   - Next steps outlined
   - Contact information

## Installation

### 1. Install Required Packages

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Stripe Setup

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Sign up or log in
   - Get your API keys from Dashboard → Developers → API keys

2. **Set up Webhook** (for production)
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook signing secret to `.env.local`

3. **Test Mode**
   - Use test API keys (pk_test_* and sk_test_*)
   - Test card: 4242 4242 4242 4242
   - Any future expiry date
   - Any 3-digit CVC

## Database Schema Updates

### Add columns to `quote_selections` table:

```sql
-- Add signature and payment columns
ALTER TABLE quote_selections ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE quote_selections ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP;
ALTER TABLE quote_selections ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE quote_selections ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE quote_selections ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2);
ALTER TABLE quote_selections ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
```

## API Endpoints Created

### Quote Management
- `GET /api/quote/[id]` - Fetch quote details
- `POST /api/quote/save` - Save service selections
- `POST /api/quote/sign` - Save contract signature

### Stripe Integration
- `POST /api/stripe/create-payment-intent` - Initialize payment
- `GET /api/stripe/verify-payment` - Verify payment status
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Testing the Flow

### 1. Complete Service Selection
```
1. Navigate to /quote/[valid-id]
2. Select a package
3. Select optional add-ons
4. Click "Continue to Next Step"
```

### 2. Sign Contract
```
1. Review contract details
2. Check "I agree" checkbox
3. Draw signature on canvas
4. Click "Continue to Payment"
```

### 3. Process Payment
```
1. Enter test card: 4242 4242 4242 4242
2. Any future expiry (e.g., 12/25)
3. Any 3-digit CVC (e.g., 123)
4. Click "Pay $X Securely"
```

### 4. View Confirmation
```
1. See confirmation message
2. Review booking details
3. Note next steps
```

## Features

### Service Selection
- ✅ Visual package cards with features
- ✅ Animated checkmark for selected package
- ✅ Add-ons selection with click-to-toggle
- ✅ Real-time total calculation
- ✅ Price formatting with commas
- ✅ Loading states with spinner
- ✅ Error handling with fallback

### Contract Page
- ✅ Full service agreement text
- ✅ Canvas-based electronic signature
- ✅ Terms agreement checkbox
- ✅ Clear signature button
- ✅ Progress indicator (Steps 1-2-3)
- ✅ Responsive design

### Payment Page
- ✅ Stripe Elements integration
- ✅ PCI-compliant payment form
- ✅ 50/50 deposit split calculation
- ✅ Trust badges (SSL, PCI, Stripe)
- ✅ Error handling
- ✅ Loading states
- ✅ Secure payment processing

### Confirmation Page
- ✅ Success animation with checkmark
- ✅ Payment summary (deposit paid, balance due)
- ✅ Event details recap
- ✅ Package & add-ons summary
- ✅ Next steps timeline (4 steps)
- ✅ Contact information
- ✅ Email confirmation note

## Customization

### Brand Colors
Update in `tailwind.config.js`:
```js
colors: {
  brand: {
    DEFAULT: '#6366f1',
    // add other shades as needed
  }
}
```

### Contract Terms
Edit contract text in `/pages/quote/[id]/contract.js` around line 200-280

### Payment Split
Currently set to 50/50 deposit. To change:
1. Update calculation in `payment.js` (line ~100)
2. Update contract terms in `contract.js`
3. Update confirmation messaging in `confirmation.js`

### Email Notifications
Implement email sending in:
- After payment success (webhook.js)
- After contract signing (sign.js)
- Use SendGrid, AWS SES, or Resend

## Security Notes

1. **API Keys**: Never commit `.env.local` to git
2. **Webhook Secret**: Required for production to verify webhook authenticity
3. **Signature Storage**: Signatures stored as base64 data URIs
4. **Payment Intent**: Created server-side to prevent tampering
5. **Database**: Use service role key only in API routes, never client-side

## Troubleshooting

### Payment fails immediately
- Check Stripe API keys are correct
- Ensure using test card number in test mode
- Check browser console for errors

### Signature doesn't save
- Check Supabase connection
- Verify `quote_selections` table has `signature` column
- Check API route logs

### Webhook not receiving events
- Verify webhook URL is accessible
- Check webhook signing secret is correct
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```

### Quote not found error
- Ensure customer completed service selection first
- Check `quote_selections` table has entry for that lead_id
- Verify API route is returning data correctly

## Next Steps

1. **Email Integration**: Add SendGrid or similar for automated emails
2. **Admin Dashboard**: Create interface to view bookings and payments
3. **Calendar Integration**: Sync confirmed events to calendar
4. **Reminder System**: Set up automated payment reminders for balance due
5. **Invoice Generation**: Create PDF invoices for customers

## Support

For questions or issues:
- Email: info@m10djcompany.com
- Phone: (901) 410-2020

