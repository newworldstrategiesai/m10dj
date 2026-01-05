# Stripe Setup Verification Report

**Date**: January 2025
**Status**: ⚠️ **ACTION REQUIRED**

---

## 🔍 Verification Results

### ✅ Code References (Found)
The codebase correctly references Stripe Price ID environment variables in:

1. **`pages/api/subscriptions/create-checkout.js`** (lines 82-86):
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PROFESSIONAL_PRICE_ID`
   - `STRIPE_ENTERPRISE_PRICE_ID`

2. **`pages/onboarding/select-plan.tsx`** (lines 20, 38, 58):
   - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`

3. **`pages/onboarding/wizard.tsx`** (lines 602-604):
   - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`

### ❌ Local Environment Variables (NOT FOUND)
- `.env.local` file either doesn't exist or doesn't contain STRIPE PRICE variables
- **Cannot verify local development setup**

### ⚠️ Pricing Mismatch Detected

**TipJar Pricing Page** (`app/(marketing)/tipjar/pricing/page.tsx`):
- Free Forever: **$0/month**
- Pro: **$29/month**
- Embed Pro: **$49/month**

**Code Expectations** (`pages/onboarding/select-plan.tsx`):
- Starter: **$19/month** (hardcoded in code, but uses env var for Price ID)
- Professional: **$49/month** (hardcoded in code, but uses env var for Price ID)
- Enterprise: **$149/month** (hardcoded in code, but uses env var for Price ID)

**Stripe Products Setup Guide** (`STRIPE_PRODUCTS_SETUP_GUIDE.md`):
- Starter Plan: **$0/month**
- Professional Plan: **$49/month**
- Enterprise Plan: **$149/month**

### 🔴 Critical Issue: Pricing Mismatch

**The TipJar pricing page shows different prices than the code expects!**

- **TipJar shows**: Free ($0), Pro ($29), Embed Pro ($49)
- **Code expects**: Starter ($19 shown in select-plan.tsx), Professional ($49), Enterprise ($149)
- **Setup guide suggests**: Starter ($0), Professional ($49), Enterprise ($149)

---

## 📋 Required Stripe Products (Based on TipJar Pricing Page)

For TipJar.live, you need these 3 products in Stripe:

### 1. Free Forever Plan
- **Name**: "Free Forever" or "Starter Plan"
- **Price**: $0.00/month
- **Billing**: Recurring, Monthly
- **Code maps to**: `starter` tier
- **Price ID Variable**: `STRIPE_STARTER_PRICE_ID` / `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`

### 2. Pro Plan
- **Name**: "Pro" or "Professional Plan"
- **Price**: $29.00/month ⚠️ **NOTE: Code shows $49, but TipJar page shows $29**
- **Billing**: Recurring, Monthly
- **Code maps to**: `professional` tier
- **Price ID Variable**: `STRIPE_PROFESSIONAL_PRICE_ID` / `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID`

### 3. Embed Pro Plan
- **Name**: "Embed Pro" or "Enterprise Plan"
- **Price**: $49.00/month ⚠️ **NOTE: Code shows $149, but TipJar page shows $49**
- **Billing**: Recurring, Monthly
- **Code maps to**: `enterprise` tier
- **Price ID Variable**: `STRIPE_ENTERPRISE_PRICE_ID` / `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`

---

## ✅ Verification Checklist

### Step 1: Check Stripe Dashboard ⚠️ **MUST VERIFY MANUALLY**

**Go to**: [Stripe Dashboard](https://dashboard.stripe.com/test/products) (Test Mode first!)

Check if these products exist:

- [ ] **Free Forever / Starter Plan** - $0/month
- [ ] **Pro / Professional Plan** - $29/month (or $49? - need to confirm)
- [ ] **Embed Pro / Enterprise Plan** - $49/month (or $149? - need to confirm)

**Action Required**: You need to manually check your Stripe Dashboard to see what products exist.

---

### Step 2: Check Environment Variables ⚠️ **CANNOT VERIFY AUTOMATICALLY**

**Required Variables** (6 total):

**Server-Side (Private)**:
- [ ] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- [ ] `STRIPE_STARTER_PRICE_ID` - Price ID for Free plan
- [ ] `STRIPE_PROFESSIONAL_PRICE_ID` - Price ID for Pro plan
- [ ] `STRIPE_ENTERPRISE_PRICE_ID` - Price ID for Embed Pro plan

**Client-Side (Public)**:
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` - Same as server-side
- [ ] `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID` - Same as server-side
- [ ] `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID` - Same as server-side

**Where to Check**:
1. **Local**: `.env.local` file (if it exists)
2. **Vercel**: Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Action Required**: 
- Check if these variables are set in Vercel (production)
- Set them in `.env.local` for local development (if not already set)

---

### Step 3: Fix Pricing Mismatch ⚠️ **CRITICAL**

**Problem**: TipJar pricing page shows different prices than code hardcodes.

**Options**:

**Option A: Update Code to Match TipJar Pricing** (Recommended)
- Update `pages/onboarding/select-plan.tsx` prices to: Starter ($0), Professional ($29), Enterprise ($49)
- This matches what TipJar customers see on the pricing page

**Option B: Update TipJar Pricing Page**
- Update pricing page to match code: Pro ($49), Embed Pro ($149)
- But this doesn't match what customers see on tipjar.live/pricing

**Option C: Use TipJar Pricing, Update Code**
- Use TipJar pricing: Free ($0), Pro ($29), Embed Pro ($49)
- Update code to match
- Create Stripe products with these prices

**Recommendation**: **Option A** - Update code to match TipJar pricing page (what customers see)

---

## 🚨 Action Items

### Immediate Actions Required:

1. **Check Stripe Dashboard** (5 minutes)
   - Go to https://dashboard.stripe.com/test/products
   - Verify which products exist
   - Copy Price IDs if products exist
   - Note: If products don't exist, you'll need to create them

2. **Verify Environment Variables in Vercel** (5 minutes)
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Check if all 6 Price ID variables are set
   - Copy Price IDs if they're set

3. **Resolve Pricing Mismatch** (15 minutes)
   - Decide on pricing: TipJar page ($29/$49) or Code ($49/$149)
   - Update code/pricing page to match
   - Update Stripe products if needed

4. **Set Local Environment Variables** (5 minutes)
   - If `.env.local` doesn't exist, create it
   - Add all Stripe Price ID variables
   - Match what's in Vercel

---

## 📊 Current Status Summary

| Item | Status | Notes |
|------|--------|-------|
| Code References | ✅ | Code correctly references env vars |
| Local .env.local | ❌ | Not found or missing variables |
| Vercel Env Vars | ⚠️ | Cannot verify automatically |
| Stripe Products | ⚠️ | Need manual verification |
| Pricing Consistency | ❌ | **MISMATCH DETECTED** |

---

## 🎯 Next Steps

1. **You need to manually verify**:
   - Stripe Dashboard → Check if products exist
   - Vercel → Check if environment variables are set
   
2. **Resolve pricing mismatch**:
   - Decide on correct pricing
   - Update code or pricing page to match
   
3. **If products don't exist**:
   - Create them in Stripe Dashboard (follow `STRIPE_PRODUCTS_SETUP_GUIDE.md`)
   - Copy Price IDs
   - Set environment variables
   
4. **Once verified**:
   - We can proceed with implementing subscription webhook handlers
   - Test subscription flow end-to-end

---

## ⚠️ Important Notes

1. **Stripe Products Must Match Pricing Page**: What customers see on tipjar.live/pricing should match what Stripe charges them.

2. **Price IDs Are Critical**: Without correct Price IDs in environment variables, subscription checkout will fail.

3. **Test Mode First**: Always test in Stripe Test Mode before going live.

4. **Tier Mapping**: Code uses tier names (`starter`, `professional`, `enterprise`) but TipJar marketing uses different names (`Free Forever`, `Pro`, `Embed Pro`). This is fine - the tier names are internal.

---

**Status**: ✅ **VERIFICATION COMPLETE - ACTION REQUIRED**

**User Decision**: Option A - Update code to match TipJar pricing ($29/$49)
**Stripe Status**: No products found - need to create them

**Next Steps**:
1. ✅ Code updated to match TipJar pricing
2. ⏳ Create Stripe products (follow `STRIPE_PRODUCTS_SETUP_TIPJAR.md`)
3. ⏳ Set environment variables in Vercel and `.env.local`
4. ⏳ Implement subscription webhook handlers

