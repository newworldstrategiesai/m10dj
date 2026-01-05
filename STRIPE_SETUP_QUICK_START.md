# 🚀 Stripe Setup Quick Start for TipJar.live

**Time Required**: 15-20 minutes  
**Difficulty**: Easy (just following steps in Stripe Dashboard)

---

## ✅ What I've Done

1. ✅ Updated code to match TipJar pricing:
   - Free Forever: $0/month
   - Pro: $29/month
   - Embed Pro: $49/month

2. ✅ Created setup guide: `STRIPE_PRODUCTS_SETUP_TIPJAR.md`

---

## 📋 What You Need to Do

### **Step 1: Create Stripe Products (10 minutes)**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Create 3 products:

**Product 1: Free Forever**
- Name: `Free Forever`
- Price: `$0.00/month` (Recurring, Monthly)
- Copy the Price ID (starts with `price_...`)

**Product 2: Pro**
- Name: `Pro`
- Price: `$29.00/month` (Recurring, Monthly)
- Copy the Price ID

**Product 3: Embed Pro**
- Name: `Embed Pro`
- Price: `$49.00/month` (Recurring, Monthly)
- Copy the Price ID

---

### **Step 2: Set Environment Variables in Vercel (5 minutes)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these 6 variables:

```bash
# TipJar Price IDs (Server-side - Private)
TIPJAR_STARTER_PRICE_ID=price_xxxxx
TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx

# TipJar Price IDs (Client-side - Public)
NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
```

**Replace `price_xxxxx` with the actual Price IDs from Stripe**

---

### **Step 3: Set Local Environment Variables (2 minutes)**

1. Create or edit `.env.local` in your project root
2. Add the same 6 variables (same values as Vercel)
3. Restart your development server

---

## ✅ Verification

After setup, verify:

- [ ] All 3 products created in Stripe
- [ ] All 6 environment variables set in Vercel
- [ ] All 6 environment variables set in `.env.local`
- [ ] Prices match: Free ($0), Pro ($29), Embed Pro ($49)

---

## 📝 Detailed Instructions

For step-by-step instructions with screenshots, see: **`STRIPE_PRODUCTS_SETUP_TIPJAR.md`**

---

## 🎯 Next Steps After Setup

Once Stripe products are created and environment variables are set:

1. ✅ Code is already updated to match TipJar pricing
2. ⏳ We'll implement subscription webhook handlers
3. ⏳ We'll test the subscription flow
4. ⏳ We'll implement feature gating

---

**Status**: Ready for you to create Stripe products! 🚀

