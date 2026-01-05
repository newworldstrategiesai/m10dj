# 🚀 Complete Stripe Setup Guide for TipJar

Based on the error you're seeing, here's exactly what you need to do to get Stripe Connect working.

---

## ⚠️ Current Issue

The error message indicates that **Stripe Connect platform verification** needs to be completed before TipJar users can set up their payment accounts. This is a **one-time setup** that you (the platform owner) need to do in your Stripe Dashboard.

---

## 📋 Step-by-Step Setup

### **Step 1: Complete Stripe Connect Platform Verification** ⚡ CRITICAL

This is the main blocker. You need to verify your platform account in Stripe.

#### For Test Mode:
1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/connect/accounts/overview)
2. Make sure you're in **Test Mode** (toggle in top right)
3. You should see a prompt to complete platform verification
4. Click **"Complete Platform Profile"** or **"Get Started"**
5. Fill out the questionnaire:
   - Business information
   - Identity verification
   - Bank account details (for test mode, use Stripe test account numbers)
6. Complete all required steps
7. Wait for verification to complete (usually instant in test mode)

#### For Live Mode:
1. Go to [Stripe Dashboard (Live Mode)](https://dashboard.stripe.com/connect/accounts/overview)
2. Make sure you're in **Live Mode** (toggle in top right)
3. Complete the same verification process
4. **Note**: Live mode verification may take 1-2 business days

**Why this is needed:** Stripe requires platform accounts to be verified before they can create connected accounts (Express accounts) for your users.

---

### **Step 2: Enable Stripe Connect** 

1. Go to [Stripe Dashboard → Settings → Connect](https://dashboard.stripe.com/settings/connect)
2. Enable **"Express accounts"** (if not already enabled)
3. Set up your platform branding (optional but recommended):
   - Platform name: "TipJar"
   - Platform logo
   - Support email

---

### **Step 3: Set Environment Variables**

Make sure these are set in **both** Vercel (production) and `.env.local` (local):

#### Required Variables:
```bash
# Stripe API Keys (get from Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...

# Stripe Webhook Secret (see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_... (optional, can use STRIPE_WEBHOOK_SECRET)

# Site URL
NEXT_PUBLIC_SITE_URL=https://tipjar.live
```

#### Where to get Stripe keys:
1. Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
2. Copy:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

### **Step 4: Set Up Stripe Webhooks**

Webhooks are needed to receive updates when users complete their Connect account setup.

#### For Production (tipjar.live):
1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://tipjar.live/api/stripe-connect/webhook`
4. Select these events:
   - `account.updated` (when Connect account status changes)
   - `payment_intent.succeeded` (when payments succeed)
   - `transfer.created` (when payouts are created)
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add to environment variables as `STRIPE_CONNECT_WEBHOOK_SECRET`

#### For Local Development:
1. Install [ngrok](https://ngrok.com/): `brew install ngrok` or `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. In Stripe Dashboard, add webhook endpoint: `https://abc123.ngrok.io/api/stripe-connect/webhook`
6. Select the same events as above
7. Copy the signing secret to `.env.local`

---

### **Step 5: Verify Database Migration**

Make sure the Stripe Connect fields exist in your `organizations` table:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name LIKE '%stripe%';
```

You should see:
- `stripe_connect_account_id`
- `stripe_connect_onboarding_complete`
- `stripe_connect_charges_enabled`
- `stripe_connect_payouts_enabled`
- `stripe_connect_details_submitted`
- `platform_fee_percentage`
- `platform_fee_fixed`

If these don't exist, run the migration:
```sql
-- File: supabase/migrations/20250124000007_add_stripe_connect_to_organizations.sql
```

---

## ✅ Verification Checklist

After completing the steps above, verify:

- [ ] **Platform verification completed** in Stripe Dashboard
- [ ] **Stripe Connect enabled** (Express accounts)
- [ ] **Environment variables set** in Vercel (production)
- [ ] **Environment variables set** in `.env.local` (local)
- [ ] **Webhook endpoint created** and receiving events
- [ ] **Database migration run** (Stripe Connect fields exist)

---

## 🧪 Testing

Once everything is set up:

1. **Test as a TipJar user:**
   - Sign in to TipJar
   - Go to dashboard
   - Click "Set Up Payments" or "Set Up Stripe Connect"
   - You should be able to create a Connect account (no more 500 errors!)

2. **Test the flow:**
   - Complete Stripe onboarding (use test data in test mode)
   - Verify account status updates in your app
   - Test a payment (in test mode)

---

## 🔍 Troubleshooting

### Error: "Cannot create connected accounts"
- **Solution**: Complete platform verification (Step 1)
- **Check**: Go to Stripe Dashboard → Connect → Accounts overview

### Error: "Platform profile required"
- **Solution**: Complete the platform questionnaire in Stripe Dashboard
- **Location**: [Stripe Dashboard → Connect → Accounts](https://dashboard.stripe.com/connect/accounts/overview)

### Error: "Webhook verification failed"
- **Solution**: Check that webhook secret matches in environment variables
- **Check**: Stripe Dashboard → Webhooks → Your endpoint → Signing secret

### Error: 500 Internal Server Error
- **Check**: Server logs for specific Stripe error
- **Common causes**: Missing environment variables, wrong API keys, platform not verified

---

## 📚 Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Platform Verification](https://stripe.com/docs/connect/onboarding)

---

## 🎯 Quick Reference

**Most Important Step:** Complete platform verification in Stripe Dashboard:
- Test Mode: https://dashboard.stripe.com/test/connect/accounts/overview
- Live Mode: https://dashboard.stripe.com/connect/accounts/overview

Once this is done, TipJar users will be able to set up their payment accounts automatically through the app interface - no manual Stripe Dashboard login required!

