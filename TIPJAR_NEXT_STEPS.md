# TipJar.live Next Steps - Launch Checklist

**Date**: January 2025  
**Status**: ✅ **Subscription System Complete** - Ready for Launch Prep

---

## ✅ What's Complete

1. ✅ **Subscription Billing System** (100%)
   - Stripe products configured
   - Subscription webhooks implemented
   - Feature gating in APIs
   - Subscription limits enforced
   - Payment processing restricted by tier

2. ✅ **Subscription Management UI** (100%)
   - Billing page (`/admin/billing`)
   - Usage limit indicators
   - Upgrade prompts
   - Stripe Customer Portal integration

3. ✅ **Code Quality** (100%)
   - Build errors fixed
   - TypeScript errors resolved
   - Code pushed to GitHub

---

## 🚀 Next Steps (Priority Order)

### 1. **Verify SQL Migrations** (CRITICAL - 15 min)

**Action**: Run verification queries in Supabase SQL Editor

**File**: `TIPJAR_SUBSCRIPTION_MIGRATION_REQUIRED.sql`

**Verification Queries**:
```sql
-- Check if white_label is in subscription_tier constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'organizations'::regclass
  AND conname = 'organizations_subscription_tier_check';

-- Should show: CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'white_label'))
```

**If NOT applied**:
- Copy SQL from `TIPJAR_SUBSCRIPTION_MIGRATION_REQUIRED.sql`
- Paste into Supabase SQL Editor
- Run the migration
- Re-run verification query

**Status**: ⚠️ **VERIFY THIS FIRST**

---

### 2. **Verify Environment Variables** (CRITICAL - 10 min)

**Action**: Check that all Stripe Price IDs are set in Vercel

**Required Variables** (see `STRIPE_PRICE_IDS_CONFIGURED.md`):

**Production (Vercel)**:
```bash
# Server-side
TIPJAR_STARTER_PRICE_ID=price_1Sm2NcEJct0cvYrGASesY7rC
TIPJAR_PROFESSIONAL_PRICE_ID=price_1Sm2OJEJct0cvYrGS0S66bat
TIPJAR_ENTERPRISE_PRICE_ID=price_1Sm2P9EJct0cvYrGws3YPG2o

# Client-side
NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_1Sm2NcEJct0cvYrGASesY7rC
NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_1Sm2OJEJct0cvYrGS0S66bat
NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_1Sm2P9EJct0cvYrGws3YPG2o
```

**Verify**:
- [ ] Go to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Verify all 6 variables are set
- [ ] Verify values match the Price IDs above
- [ ] Redeploy if variables were just added/updated

---

### 3. **Verify Stripe Webhook Endpoint** (CRITICAL - 10 min)

**Action**: Ensure Stripe webhook is configured

**Webhook URL**: `https://[your-domain]/api/stripe/webhook`

**Required Events**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Verify**:
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Find your webhook endpoint
- [ ] Verify all events are enabled
- [ ] Test webhook with a test event
- [ ] Check webhook logs for errors

---

### 4. **End-to-End Testing** (IMPORTANT - 30 min)

**Test Subscription Flow**:

1. **Free Tier Signup**:
   - [ ] Sign up for TipJar account
   - [ ] Verify organization created with `subscription_tier: 'starter'`
   - [ ] Verify `subscription_status: 'trial'`
   - [ ] Verify can access `/admin/crowd-requests`
   - [ ] Verify usage limit banner shows (if 8+ requests)

2. **Upgrade to Pro**:
   - [ ] Click "Upgrade to Pro" from billing page
   - [ ] Complete Stripe checkout
   - [ ] Verify webhook processes subscription
   - [ ] Verify `subscription_tier` updates to `'professional'`
   - [ ] Verify `subscription_status` updates to `'active'`
   - [ ] Verify can process payments

3. **Feature Limits**:
   - [ ] Free tier: Create 10 requests (should succeed)
   - [ ] Free tier: Try 11th request (should fail with 403)
   - [ ] Free tier: Try to create checkout (should fail with 403)
   - [ ] Pro tier: Create unlimited requests (should succeed)
   - [ ] Pro tier: Create checkout (should succeed)

4. **Billing Management**:
   - [ ] Click "Manage Billing" on billing page
   - [ ] Verify Stripe Customer Portal opens
   - [ ] Test cancel subscription
   - [ ] Test update payment method
   - [ ] Verify webhook processes cancellation

---

### 5. **Production Deployment** (IMPORTANT - 20 min)

**Pre-Deployment Checklist**:
- [ ] All environment variables set in Vercel
- [ ] SQL migrations applied to production database
- [ ] Stripe webhook configured with production URL
- [ ] Test mode verified (Stripe test mode)
- [ ] Build passes locally (`npm run build`)

**Deploy**:
- [ ] Push to main branch (already done ✅)
- [ ] Monitor Vercel deployment
- [ ] Check build logs for errors
- [ ] Verify deployment succeeds

**Post-Deployment**:
- [ ] Test signup flow on production
- [ ] Test subscription checkout on production
- [ ] Monitor Stripe webhook logs
- [ ] Check error monitoring (if configured)

---

### 6. **Launch Preparation** (NICE TO HAVE - 1 hour)

**Marketing Pages**:
- [ ] Verify pricing page shows correct prices ($0, $29, $49)
- [ ] Update marketing copy if needed
- [ ] Test signup flow from marketing page

**Documentation**:
- [ ] Create user onboarding guide
- [ ] Document subscription features
- [ ] Create FAQ for common questions

**Monitoring**:
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics (if not already)
- [ ] Monitor Stripe webhook success rate

---

## 📋 Quick Launch Checklist

**Must Do Before Launch**:
1. [ ] **Verify SQL migrations** (subscription_tier constraint includes 'white_label')
2. [ ] **Verify environment variables** (all Stripe Price IDs set in Vercel)
3. [ ] **Verify Stripe webhook** (configured with correct events)
4. [ ] **Test subscription flow** (signup → upgrade → billing)
5. [ ] **Deploy to production** (push already done, monitor deployment)

**Recommended Before Launch**:
6. [ ] Test feature limits (Free tier limits, Pro tier unlimited)
7. [ ] Test billing management (Stripe Customer Portal)
8. [ ] Verify pricing pages show correct prices
9. [ ] Set up error monitoring
10. [ ] Test end-to-end on production

---

## 🎯 Recommended Next Action

**Start with Step 1: Verify SQL Migrations**

This is the most critical step because:
- Required for subscription system to work
- Quick to verify (15 minutes)
- Easy to fix if not applied
- Blocks subscription functionality if missing

**After that**: Proceed with environment variables and webhook verification, then test the subscription flow.

---

**Status**: ✅ **Code Complete** - Focus on deployment verification and testing!

