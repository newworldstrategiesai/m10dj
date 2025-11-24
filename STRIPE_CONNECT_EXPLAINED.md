# Stripe Connect Express - How It Works

## The Simple Answer

**Yes!** SaaS users are signing up with Stripe, but **through your platform**. You act as the middleman, and Stripe automatically handles taking your cut and paying out the rest to them.

## The Three-Way Relationship

```
┌─────────────────┐
│   Your Platform │  ← You (Ben Murray / M10 DJ Company)
│  (Your Stripe   │     - You have YOUR Stripe account
│   Account)      │     - You collect ALL payments
└────────┬────────┘     - You take your platform fee
         │
         │ Creates "Express Account" for each SaaS user
         │
         ▼
┌─────────────────┐
│  Stripe Connect │  ← Stripe's System
│  Express Account │     - Manages the relationship
│  (For Each DJ)   │     - Handles payouts automatically
└────────┬────────┘     - Generates tax forms (1099-K)
         │
         │ Automatically pays out to DJ's bank
         │
         ▼
┌─────────────────┐
│   SaaS User     │  ← DJ (Your Customer)
│   (DJ)          │     - Gets their own "Express Account"
│   Bank Account  │     - Receives automatic payouts
└─────────────────┘     - No direct Stripe account needed
```

## Step-by-Step Flow

### 1. **SaaS User Signs Up** (DJ)
- DJ creates account on your platform
- DJ does NOT need to create their own Stripe account
- This is your competitive advantage!

### 2. **You Create Express Account for Them**
```javascript
// Your code calls Stripe API
const account = await stripe.accounts.create({
  type: 'express',
  email: dj.email,
  // Stripe creates a "sub-account" under YOUR Stripe account
});
```

**What happens:**
- Stripe creates a "sub-account" linked to YOUR Stripe account
- It's like a "child account" - they don't have their own full Stripe account
- They get a simplified "Express" account that you manage

### 3. **DJ Completes Quick Onboarding** (2-3 minutes)
- DJ clicks "Set Up Payments" on your platform
- Stripe opens a secure onboarding page
- DJ enters:
  - Bank account info (where they want to receive money)
  - Basic business info
  - Tax info (SSN or EIN)
- **They never see your Stripe dashboard** - it's all through your platform

### 4. **Customer Pays for Song Request**
```
Customer pays $100 for song request
    ↓
Payment goes to YOUR Stripe account
    ↓
Stripe automatically:
  - Takes YOUR platform fee: $3.80 (3.5% + $0.30)
  - Transfers remaining: $96.20 to DJ's bank account
    ↓
DJ receives $96.20 in 2-7 days
```

### 5. **Money Flow**
```
$100 Payment
├─ Stripe's fee: ~$2.90 (2.9% + $0.30) ← Stripe keeps this
├─ Your platform fee: ~$0.90 (your margin) ← YOU keep this
└─ DJ receives: $96.20 ← Automatically sent to their bank
```

## Key Points

### ✅ What DJs Get
- **No Stripe account needed** - major selling point!
- **Automatic payouts** - money goes straight to their bank
- **Tax forms** - Stripe generates 1099-K forms for them
- **Simplified** - they just enter bank info, you handle the rest

### ✅ What You Get
- **Platform fee on every transaction** - your revenue stream
- **Full control** - you manage all payments
- **Better UX** - "No Stripe setup required" is a huge advantage
- **Data insights** - you see all payment patterns

### ✅ What Stripe Gets
- **Their standard fee** - 2.9% + $0.30 (same as if DJ had their own account)
- **You pay Stripe** - Stripe's fee comes out of YOUR cut
- **They handle compliance** - Stripe deals with tax forms, regulations

## The Technical Details

### Express Account vs Full Account

**Express Account (What DJs Get):**
- Created through YOUR platform
- Limited dashboard access (they can see their payouts)
- You control most settings
- Perfect for simple use cases

**Full Stripe Account (What You Have):**
- Full dashboard access
- Can create Express accounts
- See all transactions
- Manage platform fees

### How Platform Fees Work

```javascript
// When processing a $100 payment:

const amount = 10000; // $100.00 in cents
const platformFeePercentage = 3.5; // 3.5%
const platformFeeFixed = 30; // $0.30 in cents

// Calculate your fee
const percentageFee = (amount * platformFeePercentage) / 100; // $3.50
const totalPlatformFee = percentageFee + platformFeeFixed; // $3.80

// Stripe automatically:
// 1. Charges customer $100
// 2. Takes their fee: ~$2.90
// 3. Takes your platform fee: $3.80
// 4. Pays out to DJ: $96.20
```

### The Code That Makes It Happen

```javascript
// In your payment processing code:
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  application_fee_amount: 380, // YOUR platform fee: $3.80
  transfer_data: {
    destination: djStripeAccountId, // DJ's Express account ID
  },
});

// Stripe handles everything else automatically!
```

## Real-World Example

### Scenario: DJ "John's Events" processes a payment

1. **Customer pays $50** for a song request at a wedding
2. **Payment hits YOUR Stripe account**
3. **Stripe automatically:**
   - Deducts Stripe fee: ~$1.75 (2.9% + $0.30)
   - Deducts your platform fee: ~$2.05 (3.5% + $0.30)
   - Transfers to John: $46.20
4. **John receives $46.20** in his bank account in 2-7 days
5. **You keep $2.05** as platform revenue

### At Scale

If John processes 50 payments/month at $50 average:
- Total payments: $2,500/month
- Your platform fees: ~$102.50/month
- John receives: ~$2,310/month
- **You make $1,230/year from just one DJ!**

## Why This Is Better Than Direct Stripe

### ❌ If DJs Used Their Own Stripe Accounts:
- DJ has to create Stripe account
- DJ has to complete full Stripe onboarding
- DJ has to manage their own Stripe dashboard
- You can't take platform fees easily
- More friction = fewer signups

### ✅ With Stripe Connect Express:
- DJ clicks one button on your platform
- 2-minute onboarding (just bank info)
- You handle everything
- You automatically get platform fees
- **"No Stripe setup required" = competitive advantage**

## Compliance & Legal

### Who Handles What?

**Stripe Handles:**
- PCI compliance (payment security)
- Tax form generation (1099-K for DJs)
- Bank account verification
- Fraud detection
- Regulatory compliance

**You Handle:**
- Platform fee collection
- Customer support
- Account management
- Business logic

**DJ Handles:**
- Just enters bank account info
- Receives money automatically
- Gets tax forms from Stripe

### Money Transmitter License

**Good News:** With Stripe Connect Express, you typically DON'T need a money transmitter license because:
- Stripe is the actual money transmitter
- You're just a platform facilitating payments
- Stripe handles all the regulatory stuff

**But:** Check your state laws to be sure. Most states exempt platforms using Stripe Connect.

## Summary

**Yes, they're signing up with Stripe through you, and yes, you take your cut automatically!**

- ✅ DJs get Express accounts (simplified Stripe accounts)
- ✅ All payments go through YOUR Stripe account first
- ✅ Stripe automatically deducts your platform fee
- ✅ Stripe automatically pays out the rest to DJs
- ✅ You make money on every transaction
- ✅ DJs don't need their own Stripe account
- ✅ It's all automatic - no manual work needed

**This is exactly how platforms like Uber, Airbnb, and DoorDash make money!**

