# Environment Variables Update - Product-Specific Pricing

**Date**: January 2025  
**Reason**: Support multiple SaaS products (TipJar, DJDash) with different pricing

---

## 🔄 Change Summary

Environment variables for Stripe price IDs have been updated to be **product-specific** to support multiple SaaS products on the same codebase.

### Old Variable Names (Deprecated)
```bash
STRIPE_STARTER_PRICE_ID
STRIPE_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
```

### New Variable Names (TipJar)
```bash
TIPJAR_STARTER_PRICE_ID
TIPJAR_PROFESSIONAL_PRICE_ID
TIPJAR_ENTERPRISE_PRICE_ID
NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID
NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID
NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID
```

### Future Variable Names (DJDash - when needed)
```bash
DJDASH_STARTER_PRICE_ID
DJDASH_PROFESSIONAL_PRICE_ID
DJDASH_ENTERPRISE_PRICE_ID
NEXT_PUBLIC_DJDASH_STARTER_PRICE_ID
NEXT_PUBLIC_DJDASH_PROFESSIONAL_PRICE_ID
NEXT_PUBLIC_DJDASH_ENTERPRISE_PRICE_ID
```

---

## 📋 What Changed

### Code Updates

1. **Created Helper Utility** (`utils/subscription-pricing.ts`)
   - `getPriceIdsForProduct()` - Gets price IDs based on product context
   - `getClientPriceIdsForProduct()` - Gets client-side price IDs
   - `getTierFromPriceId()` - Maps price ID to tier for a product

2. **Updated Files**:
   - `pages/api/subscriptions/create-checkout.js` - Uses product-specific pricing
   - `pages/onboarding/select-plan.tsx` - Updated to use `TIPJAR_*` variables
   - `pages/onboarding/wizard.tsx` - Updated to use `TIPJAR_*` variables

---

## ✅ Action Required

### Step 1: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
2. **Add new variables** (keep old ones for now):
   ```bash
   # TipJar Price IDs (Server-side)
   TIPJAR_STARTER_PRICE_ID=price_xxxxx
   TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
   TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
   
   # TipJar Price IDs (Client-side)
   NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
   ```
3. **Copy values from old variables** (if they exist):
   - `STRIPE_STARTER_PRICE_ID` → `TIPJAR_STARTER_PRICE_ID`
   - `STRIPE_PROFESSIONAL_PRICE_ID` → `TIPJAR_PROFESSIONAL_PRICE_ID`
   - `STRIPE_ENTERPRISE_PRICE_ID` → `TIPJAR_ENTERPRISE_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` → `NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID` → `NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID` → `NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID`
4. **After testing, remove old variables** (optional, for cleanup)

### Step 2: Update Local Environment Variables (`.env.local`)

1. Open `.env.local` in your project root
2. Update or add:
   ```bash
   # TipJar Price IDs (Server-side)
   TIPJAR_STARTER_PRICE_ID=price_xxxxx
   TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
   TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
   
   # TipJar Price IDs (Client-side)
   NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
   ```
3. **Restart your development server**

---

## 🎯 Benefits

1. **Multi-Product Support**: Can now have different pricing for TipJar vs DJDash
2. **Clearer Naming**: Variable names clearly indicate which product they belong to
3. **Future-Proof**: Easy to add more SaaS products with their own pricing
4. **No Conflicts**: Different products can have completely different price structures

---

## 📝 Notes

- **Backward Compatibility**: Code uses product context to determine which price IDs to use
- **Default to TipJar**: If no product context is found, defaults to TipJar pricing
- **Helper Functions**: Use `utils/subscription-pricing.ts` helper functions to get price IDs based on product context
- **Stripe Products**: You'll still create products in Stripe Dashboard, just use product-specific environment variables

---

## 🔮 Future: Adding DJDash Pricing

When you're ready to add DJDash pricing:

1. Create Stripe products for DJDash (may have different prices than TipJar)
2. Add `DJDASH_*_PRICE_ID` environment variables
3. The helper functions will automatically use the correct price IDs based on product context
4. No code changes needed - the utility functions handle it!

---

**Status**: ✅ Code updated, ready for environment variable updates!

