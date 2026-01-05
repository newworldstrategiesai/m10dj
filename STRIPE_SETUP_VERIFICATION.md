# Stripe Setup Verification Checklist

## Purpose
Verify that Stripe products and prices are properly configured before implementing subscription billing.

---

## Required Stripe Products & Prices

Based on the TipJar pricing page, we need:

### 1. Free Forever Plan
- **Name**: Free Forever
- **Price**: $0/month
- **Billing**: Recurring, Monthly
- **Price ID Variable**: `STRIPE_STARTER_PRICE_ID` / `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`

### 2. Pro Plan
- **Name**: Pro
- **Price**: $29/month
- **Billing**: Recurring, Monthly
- **Price ID Variable**: `STRIPE_PROFESSIONAL_PRICE_ID` / `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID`

### 3. Embed Pro Plan
- **Name**: Embed Pro
- **Price**: $49/month
- **Billing**: Recurring, Monthly
- **Price ID Variable**: `STRIPE_ENTERPRISE_PRICE_ID` / `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`

**Note**: The code uses "ENTERPRISE" for the $49 plan, but the pricing page calls it "Embed Pro".

---

## Environment Variables Required

### Server-Side (Private)
```bash
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

### Client-Side (Public)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

---

## Verification Steps

### Step 1: Check Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products**
3. Verify all 3 products exist:
   - Free Forever / Starter ($0/month)
   - Pro / Professional ($29/month)
   - Embed Pro / Enterprise ($49/month)
4. Copy the **Price IDs** (they start with `price_...`)

### Step 2: Check Environment Variables

**Local (.env.local):**
```bash
# Check if variables exist
cat .env.local | grep STRIPE.*PRICE_ID
```

**Vercel (Production):**
1. Go to Vercel Dashboard
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**
4. Verify all Stripe Price ID variables are set

### Step 3: Verify Code References

Check that code references these variables:
- `pages/api/subscriptions/create-checkout.js` - Uses price IDs
- `pages/onboarding/select-plan.tsx` - Uses `NEXT_PUBLIC_STRIPE_*_PRICE_ID`
- Pricing pages - Should display correct pricing

---

## Code Locations Using Price IDs

1. **`pages/api/subscriptions/create-checkout.js`** (lines 82-88):
   ```javascript
   const priceIdToTier = {
     [process.env.STRIPE_STARTER_PRICE_ID]: 'starter',
     [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
     [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
   };
   ```

2. **`pages/onboarding/select-plan.tsx`** (lines 20, 38, 58):
   ```javascript
   priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
   priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
   priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
   ```

---

## Verification Checklist

- [ ] Stripe products created in Stripe Dashboard (Test Mode)
- [ ] Price IDs copied from Stripe Dashboard
- [ ] Environment variables set in `.env.local` (development)
- [ ] Environment variables set in Vercel (production)
- [ ] All 6 variables set (3 server-side, 3 client-side)
- [ ] Price IDs match Stripe Dashboard (verify `price_...` format)
- [ ] Test mode keys used for development
- [ ] Code references correct variable names

---

## Potential Issues

### Issue 1: Missing Environment Variables
**Symptom**: Code uses fallback values or errors occur
**Solution**: Set all environment variables in both local and Vercel

### Issue 2: Wrong Stripe Mode
**Symptom**: Test products exist but code uses live mode
**Solution**: Ensure `STRIPE_SECRET_KEY` matches mode (test vs live)

### Issue 3: Price ID Mismatch
**Symptom**: Wrong prices shown or checkout fails
**Solution**: Verify Price IDs in Stripe Dashboard match environment variables

### Issue 4: Tier Name Mismatch
**Symptom**: Code uses "enterprise" but pricing shows "Embed Pro"
**Solution**: Either update code or Stripe product name (code uses tier names internally)

---

## Next Steps After Verification

1. ✅ Document findings
2. ✅ If missing, guide user to create products in Stripe
3. ✅ If exists, proceed with webhook handler implementation
4. ✅ Test subscription creation flow

---

**Status**: Pending verification
**Last Updated**: January 2025

