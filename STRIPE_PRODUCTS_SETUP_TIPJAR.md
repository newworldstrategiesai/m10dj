# 💳 Stripe Products Setup for TipJar.live

**Status:** Step-by-step guide to create Stripe products  
**Time:** 15-20 minutes  
**Risk:** ✅ **ZERO** - External Stripe configuration only

---

## 📋 Required Products

Based on TipJar pricing, you need to create these 3 products in Stripe:

1. **Free Forever** - $0/month
2. **Pro** - $29/month
3. **Embed Pro** - $49/month

---

## 🚀 Step-by-Step Instructions

### **Step 1: Access Stripe Dashboard**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **IMPORTANT**: Make sure you're in **Test Mode** (toggle in top right)
   - Test mode uses test keys and won't charge real money
   - You can switch to Live Mode later
3. Navigate to **Products** in the left sidebar

---

### **Step 2: Create Free Forever Plan ($0/month)**

1. Click **"+ Add product"** button (top right)
2. Fill in the product details:
   - **Name:** `Free Forever`
   - **Description:** `Free tier for DJs trying out TipJar. Includes 10 song requests per month, basic request management, and QR code generation.`
3. Click **"Add pricing"** button
4. Configure pricing:
   - Select **"Recurring"** (not one-time)
   - **Price:** `$0.00`
   - **Billing period:** `Monthly`
   - **Currency:** `USD` (should be default)
5. Click **"Save product"**
6. **CRITICAL**: Copy the **Price ID** (it starts with `price_...`)
   - You'll see it in the product details
   - Example: `price_1ABC123xyz...`
   - Save this somewhere - you'll need it for environment variables

---

### **Step 3: Create Pro Plan ($29/month)**

1. Click **"+ Add product"** again
2. Fill in the product details:
   - **Name:** `Pro`
   - **Description:** `Most Popular - For active DJs. Unlimited song requests, full payment processing, Cash App Pay integration, basic analytics, custom branding, and priority support.`
3. Click **"Add pricing"**
4. Configure pricing:
   - Select **"Recurring"**
   - **Price:** `$29.00`
   - **Billing period:** `Monthly`
5. Click **"Save product"**
6. **Copy the Price ID** (starts with `price_...`)

---

### **Step 4: Create Embed Pro Plan ($49/month)**

1. Click **"+ Add product"** again
2. Fill in the product details:
   - **Name:** `Embed Pro`
   - **Description:** `For professional DJ businesses. Everything in Pro plus custom domain widget, white-label options, advanced analytics, API access, and dedicated support.`
3. Click **"Add pricing"**
4. Configure pricing:
   - Select **"Recurring"**
   - **Price:** `$49.00`
   - **Billing period:** `Monthly`
5. Click **"Save product"**
6. **Copy the Price ID** (starts with `price_...`)

---

## 🔑 Step 5: Set Environment Variables

### **In Vercel (Production)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (m10dj)
3. Navigate to **Settings** → **Environment Variables**
4. Add these variables (click "Add New" for each):

**Server-Side (Private) Variables:**
```bash
TIPJAR_STARTER_PRICE_ID=price_xxxxx
TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
```

**Client-Side (Public) Variables:**
```bash
NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_xxxxx
NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_xxxxx
```

**Important:**
- Replace `price_xxxxx` with the actual Price IDs you copied from Stripe
- Make sure to set these for **Production** environment
- The same Price IDs go in both server-side and client-side variables

---

### **In Local Development (.env.local)**

1. Create or edit `.env.local` file in your project root
2. Add the same variables:

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

3. **Restart your development server** after adding these variables

---

## ✅ Verification Checklist

After setting up, verify:

- [ ] All 3 products created in Stripe Dashboard
- [ ] Prices match: Free ($0), Pro ($29), Embed Pro ($49)
- [ ] All 6 environment variables set in Vercel
- [ ] All 6 environment variables set in `.env.local`
- [ ] Price IDs are correct (start with `price_...`)
- [ ] Development server restarted (if testing locally)

---

## 🧪 Testing

### **Test Subscription Creation**

1. Sign up as a test user
2. Go to `/onboarding/select-plan` (or `/tipjar/signup` → plan selection)
3. You should see:
   - Free Forever: $0/month
   - Pro: $29/month
   - Embed Pro: $49/month
4. Click "Select Plan" on Pro or Embed Pro
5. You should be redirected to Stripe Checkout
6. Use Stripe test card: `4242 4242 4242 4242`
7. Complete checkout
8. Verify webhook updates organization (we'll implement this next)

---

## 🚨 Important Notes

1. **Test Mode First**: Always test in Stripe Test Mode before going live
2. **Price IDs vs Product IDs**: Make sure you copy the **Price ID** (starts with `price_`), not the Product ID
3. **Environment Variables**: Must be set in both Vercel and `.env.local`
4. **Restart Required**: After adding env vars, restart your dev server
5. **Live Mode**: When ready for production, create the same products in Live Mode and update environment variables

---

## 📝 Quick Reference

**Products to Create:**
- Free Forever: $0/month → Maps to `starter` tier
- Pro: $29/month → Maps to `professional` tier
- Embed Pro: $49/month → Maps to `enterprise` tier

**Environment Variables Needed:**
- `TIPJAR_STARTER_PRICE_ID` (server-side)
- `TIPJAR_PROFESSIONAL_PRICE_ID` (server-side)
- `TIPJAR_ENTERPRISE_PRICE_ID` (server-side)
- `NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID` (client-side)
- `NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID` (client-side)
- `NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID` (client-side)

---

**Status:** Ready to create Stripe products! 🚀

**Next Step**: After creating products and setting environment variables, we'll implement the subscription webhook handlers.

