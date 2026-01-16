# Stripe Multi-Account Setup Checklist

## ✅ Code Changes Completed

All code changes have been implemented to support product-specific Stripe accounts:

1. ✅ **`utils/stripe/config.ts`** - Updated to support multiple Stripe instances
   - Added `getStripeInstance()` function to route based on product context
   - Added `getStripeInstanceByAccountId()` for account lookups
   - Backward compatible - existing code using `stripe` still works

2. ✅ **`utils/stripe/connect.ts`** - Updated all functions to use product-specific instances
   - `createConnectAccount()` - Uses product context
   - `createAccountLink()` - Uses product context
   - `getAccountStatus()` - Uses product context
   - `createPaymentWithPlatformFee()` - Uses product context
   - `createCheckoutSessionWithPlatformFee()` - Uses product context

3. ✅ **API Endpoints Updated**
   - `pages/api/stripe-connect/create-account.js` - Validates product-specific Stripe config
   - `pages/api/stripe-connect/onboarding-link.js` - Passes product context
   - `pages/api/stripe-connect/status.js` - Uses product-specific instance

---

## 📋 Manual Steps Required

### Step 1: Create TipJar.live Stripe Account ⚡ REQUIRED

1. **Go to Stripe.com**
   - Visit [https://stripe.com](https://stripe.com)
   - Click "Sign up" or "Start now"
   - **Use a different email** than your M10 DJ Company Stripe account
   - Or use the same email with a "+" variant (e.g., `ben+tipjar@example.com`)

2. **Complete Business Registration**
   - Business name: **"TipJar Live"** or **"TipJar.live"**
   - Business type: Choose appropriate (Individual, LLC, etc.)
   - Business address
   - Tax ID (if applicable)

3. **Complete Stripe Verification**
   - Personal information
   - Identity verification
   - Bank account (for payouts) - can use test account for test mode

4. **Enable Stripe Connect**
   - Go to [Stripe Dashboard → Settings → Connect](https://dashboard.stripe.com/settings/connect)
   - Enable **"Express accounts"**
   - Complete platform verification if prompted

5. **Configure Express Account Branding** ⚡ CRITICAL
   - Go to [Stripe Dashboard → Settings → Connect → Express accounts](https://dashboard.stripe.com/settings/connect/express)
   - Click **"Branding"** or **"Express Dashboard Settings"**
   - Upload **TipJar logo** (at least 128x128px)
   - Set **Platform name**: `TipJar.live`
   - Set **Brand colors** (TipJar brand colors):
     - Primary: `#8b5cf6` (Purple) or your TipJar brand color
     - Secondary: `#ec4899` (Pink) or your TipJar brand color
   - Save changes

   **This is what users will see in their Express dashboards!**

---

### Step 2: Get API Keys

1. **Test Mode Keys** (for development/testing)
   - Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
   - Make sure you're in **Test Mode** (toggle in top right)
   - Copy:
     - **Secret key**: `sk_test_...`
     - **Publishable key**: `pk_test_...`

2. **Live Mode Keys** (for production)
   - Toggle to **Live Mode** in Stripe Dashboard
   - Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
   - Copy:
     - **Secret key**: `sk_live_...`
     - **Publishable key**: `pk_live_...`

3. **Webhook Secret** (optional, but recommended)
   - Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
   - Click **"Add endpoint"** or use existing
   - Endpoint URL: `https://yourdomain.com/api/stripe-connect/webhook`
   - Select events:
     - `account.updated`
     - `payment_intent.succeeded`
     - `transfer.created`
   - Copy **Signing secret**: `whsec_...`

---

### Step 3: Set Environment Variables

Add these to your `.env.local` file (for local development) and **Vercel** (for production):

#### For Test Mode:
```bash
# M10 DJ Company (existing - keep these)
STRIPE_SECRET_KEY=sk_test_...your_m10dj_test_key...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_m10dj_test_key...

# TipJar.live (new - add these)
STRIPE_SECRET_KEY_TIPJAR=sk_test_...your_tipjar_test_key...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TIPJAR=pk_test_...your_tipjar_test_key...
```

#### For Live Mode:
```bash
# M10 DJ Company (existing - keep these)
STRIPE_SECRET_KEY_LIVE=sk_live_...your_m10dj_live_key...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...your_m10dj_live_key...

# TipJar.live (new - add these)
STRIPE_SECRET_KEY_TIPJAR_LIVE=sk_live_...your_tipjar_live_key...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TIPJAR_LIVE=pk_live_...your_tipjar_live_key...
```

#### Optional: Webhook Secrets (if using webhooks)
```bash
# M10 DJ Company webhook (if separate)
STRIPE_WEBHOOK_SECRET=whsec_...your_m10dj_webhook_secret...

# TipJar.live webhook (if separate)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...your_tipjar_webhook_secret...
```

**Note**: You can use the same webhook endpoint for both accounts if you route based on account ID (the code supports this via `getStripeInstanceByAccountId()`).

---

### Step 4: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Add Environment Variables**
   - Go to **Settings → Environment Variables**
   - Add all the TipJar keys from Step 3
   - Select environments: **Production**, **Preview**, **Development** (as appropriate)

3. **Redeploy Application**
   - After adding variables, trigger a new deployment
   - Or wait for next git push to auto-deploy

---

### Step 5: Test in Test Mode ⚡ IMPORTANT

1. **Verify TipJar Account Creation**
   - Create a test TipJar organization/user
   - Complete Stripe Connect onboarding
   - Check that the Express dashboard shows **"TipJar.live"** branding (not "M10 DJ Company")

2. **Verify Payment Flow**
   - Create a test payment through TipJar
   - Verify it routes to TipJar Stripe account
   - Check that platform fees are calculated correctly

3. **Verify Account Lookups**
   - Test account status checks
   - Verify account links work correctly

---

### Step 6: Go Live (Production)

1. **Complete Live Mode Setup**
   - Ensure TipJar Stripe account is fully verified in Live Mode
   - Complete all required business verification steps
   - Set up live webhook endpoint

2. **Update Production Environment Variables**
   - Add live mode keys to Vercel (from Step 3)
   - Deploy to production

3. **Test in Production**
   - Create a real TipJar account (small test)
   - Verify Express dashboard branding
   - Test a small real payment

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] TipJar Express dashboards show "TipJar.live" branding (not "M10 DJ Company")
- [ ] M10 DJ Company Express dashboards still show "M10 DJ Company" branding
- [ ] Test TipJar account creation works
- [ ] Test TipJar payment processing works
- [ ] Platform fees are calculated correctly
- [ ] Account status checks work for both products
- [ ] No errors in logs related to Stripe configuration

---

## 🐛 Troubleshooting

### Issue: "Stripe is not configured for product: tipjar"

**Solution**: 
- Check that `STRIPE_SECRET_KEY_TIPJAR` (test) or `STRIPE_SECRET_KEY_TIPJAR_LIVE` (live) is set in environment variables
- Verify the key starts with `sk_test_` or `sk_live_`
- Restart your development server after adding environment variables

### Issue: TipJar Express dashboard still shows "M10 DJ Company"

**Solution**:
- Check that Express account branding is configured in TipJar Stripe Dashboard → Settings → Connect → Express accounts → Branding
- Verify platform name is set to "TipJar.live"
- New accounts created after branding is set will show correct branding
- **Note**: Existing accounts created before branding was set may need to be recreated or will show old branding

### Issue: Payments failing or routing to wrong account

**Solution**:
- Check that `product_context` is set correctly on organizations (`'tipjar'`, `'djdash'`, or `'m10dj'`)
- Verify the organization's `stripe_connect_account_id` exists in the correct Stripe account
- Check logs for which Stripe instance is being used

### Issue: Webhooks not working

**Solution**:
- Verify webhook secret is set correctly in environment variables
- Check webhook endpoint URL is accessible
- Verify webhook events are selected in Stripe Dashboard
- For multi-account webhooks, the code uses `getStripeInstanceByAccountId()` to route correctly

---

## 📝 Additional Notes

### Existing TipJar Accounts

**Option A: Keep Existing Accounts** (Recommended for test mode)
- Existing TipJar Connect accounts created under M10 DJ Stripe account will remain there
- New TipJar accounts will be created under TipJar Stripe account
- Old accounts will still show "M10 DJ Company" branding in Express dashboard
- This is fine for test accounts

**Option B: Migrate Existing Accounts** (For live mode if needed)
- Stripe does NOT support transferring accounts between platform accounts
- You would need to:
  1. Export account data
  2. Have users create new accounts under TipJar Stripe account
  3. Update `stripe_connect_account_id` in database
  4. Transfer any accumulated funds manually
- **Recommendation**: Only migrate if absolutely necessary (e.g., legal/accounting requirements)

### DJ Dash

- DJ Dash currently shares M10 DJ Company Stripe account
- To give DJ Dash its own Stripe account later:
  1. Create DJ Dash Stripe account (same process as TipJar)
  2. Add `STRIPE_SECRET_KEY_DJDASH` and `STRIPE_SECRET_KEY_DJDASH_LIVE` environment variables
  3. No code changes needed - already supports it!

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ New TipJar users see "TipJar.live" branding in their Stripe Express dashboard
2. ✅ M10 DJ Company users still see "M10 DJ Company" branding
3. ✅ Payments process correctly for both products
4. ✅ No brand confusion between products
5. ✅ Separate financial reporting per product (via separate Stripe dashboards)

---

## 📞 Next Steps

After completing setup:

1. Monitor first few TipJar account creations
2. Verify branding appears correctly
3. Test payment flows end-to-end
4. Update any documentation that references Stripe setup
5. Consider setting up separate accounting/bookkeeping for each Stripe account

---

## 🎯 Summary

**What's Done**: All code changes complete ✅

**What You Need to Do**:
1. Create TipJar Stripe account ⚡
2. Configure Express account branding (TipJar.live) ⚡
3. Get API keys
4. Add environment variables to `.env.local` and Vercel
5. Test in test mode
6. Deploy to production

**Time Estimate**: 30-60 minutes (mostly Stripe account setup and verification)

---

## Questions?

If you encounter any issues during setup, check the troubleshooting section above or refer to the main strategy document: `STRIPE_MULTI_ACCOUNT_SEPARATION_STRATEGY.md`
