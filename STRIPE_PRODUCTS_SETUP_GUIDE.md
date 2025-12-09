# 💳 Stripe Products Setup Guide
## Create Subscription Products for DJ Platform

**Status:** External setup (no code changes required)  
**Time:** 15-20 minutes  
**Risk:** ✅ **ZERO** - External Stripe configuration only

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Access Stripe Dashboard**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Navigate to **Products** in the left sidebar

---

### **Step 2: Create Starter Plan (Free)**

1. Click **"+ Add product"**
2. Fill in:
   - **Name:** `Starter Plan`
   - **Description:** `Free tier for DJs just getting started. Includes basic features and 5 events per month.`
3. Click **"Add pricing"**
4. Select **"Recurring"**
5. Set:
   - **Price:** `$0.00`
   - **Billing period:** `Monthly`
6. Click **"Save product"**
7. **Copy the Price ID** (starts with `price_...`) - you'll need this!

---

### **Step 3: Create Professional Plan ($49/month)**

1. Click **"+ Add product"**
2. Fill in:
   - **Name:** `Professional Plan`
   - **Description:** `For established DJs who want to grow. Unlimited events, full CRM, analytics, and more.`
3. Click **"Add pricing"**
4. Select **"Recurring"**
5. Set:
   - **Price:** `$49.00`
   - **Billing period:** `Monthly`
6. Click **"Save product"**
7. **Copy the Price ID** (starts with `price_...`)

---

### **Step 4: Create Enterprise Plan ($149/month)**

1. Click **"+ Add product"**
2. Fill in:
   - **Name:** `Enterprise Plan`
   - **Description:** `For high-volume DJ companies. White-label, API access, custom integrations, and more.`
3. Click **"Add pricing"**
4. Select **"Recurring"**
5. Set:
   - **Price:** `$149.00`
   - **Billing period:** `Monthly`
6. Click **"Save product"**
7. **Copy the Price ID** (starts with `price_...`)

---

## 🔑 STEP 5: SET ENVIRONMENT VARIABLES

### **In Vercel (Production):**

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```bash
# Stripe Price IDs (Private - Server-side)
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx

# Stripe Price IDs (Public - Client-side)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

**Replace `price_xxxxx` with your actual Price IDs from Stripe**

### **In Local Development (.env.local):**

Add the same variables to your `.env.local` file:

```bash
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx

NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

---

## ✅ VERIFICATION

### **Test the Setup:**

1. **Check Environment Variables:**
   ```bash
   # In your terminal
   echo $STRIPE_STARTER_PRICE_ID
   echo $STRIPE_PROFESSIONAL_PRICE_ID
   echo $STRIPE_ENTERPRISE_PRICE_ID
   ```

2. **Test in Code:**
   - Visit `/onboarding/select-plan`
   - You should see the plans with correct pricing
   - Clicking "Select Plan" should work (if user is logged in)

3. **Check Stripe Dashboard:**
   - Go to Products
   - Verify all 3 products exist
   - Verify prices are correct

---

## 🚨 TROUBLESHOOTING

### **Issue: Price IDs not working**

**Solution:**
- Make sure you copied the **Price ID** (starts with `price_`), not the Product ID
- Verify environment variables are set correctly
- Restart your development server after adding env vars

### **Issue: "Price not found" error**

**Solution:**
- Check you're using the correct Stripe account (test vs live)
- Verify the Price ID exists in Stripe Dashboard
- Make sure environment variables match your Stripe mode

### **Issue: Subscription checkout fails**

**Solution:**
- Verify Stripe webhook is configured
- Check Stripe API keys are correct
- Ensure webhook secret is set in environment variables

---

## 📝 NOTES

- **Test Mode First:** Always test in Stripe Test Mode before going live
- **Price IDs:** Keep these secure - they're used for billing
- **Updates:** If you change prices in Stripe, you may need to update env vars
- **Multiple Environments:** Set different Price IDs for test/production if needed

---

## 🎯 NEXT STEPS

After setting up Stripe products:

1. ✅ Test subscription checkout flow
2. ✅ Verify webhook processes payments
3. ✅ Test subscription management (upgrade/downgrade)
4. ✅ Switch to Live Mode when ready
5. ✅ Create Live Mode products (repeat steps above)

---

## ✅ CHECKLIST

- [ ] Created Starter Plan ($0/month) in Stripe
- [ ] Created Professional Plan ($49/month) in Stripe
- [ ] Created Enterprise Plan ($149/month) in Stripe
- [ ] Copied all Price IDs
- [ ] Set environment variables in Vercel
- [ ] Set environment variables in `.env.local`
- [ ] Tested subscription checkout
- [ ] Verified webhook works
- [ ] Ready for first beta DJ signup

---

**Status:** Ready to set up Stripe products! 🚀

