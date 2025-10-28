# 💳 Stripe Integration Guide

## 🎉 Savings Summary

**You'll save $1,000-1,500+ per year** compared to HoneyBook!

See `PAYMENT_FEE_ANALYSIS.md` for full breakdown.

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for free account
3. Complete business verification (required for live payments)

### Step 2: Get Your API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **API Keys**
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Step 3: Set Up Webhook

1. In Stripe Dashboard: **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing Secret** (starts with `whsec_`)

### Step 4: Add to Environment Variables

Add to `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Install Stripe Package

```bash
npm install stripe @stripe/stripe-js micro
```

### Step 6: Restart Server

```bash
npm run dev
```

---

## ✅ What's Been Integrated

### 1. **Create Checkout Session** (`/api/stripe/create-checkout`)
- Creates Stripe payment page for any invoice
- Pre-fills customer email
- Tracks session for webhook processing

### 2. **Webhook Handler** (`/api/stripe/webhook`)
- Processes payment confirmations
- Auto-marks invoices as paid
- Creates payment records
- Sends confirmation emails
- Notifies admin

### 3. **Success Screen Payment Button**
- Ready to add to service selection success page
- One-click checkout experience
- Redirects to Stripe hosted page

---

## 💻 How to Use

### For Service Selections:

After a lead submits their service selection, the success screen will show:

```
✅ Your Selections Received!
[View Summary]
[Pay Now with Stripe] ← NEW BUTTON
```

When they click "Pay Now":
1. Creates Stripe checkout session
2. Redirects to Stripe payment page
3. Customer enters card details
4. Payment processed securely
5. Webhook fires → Invoice marked paid
6. Confirmation email sent
7. Admin notified

### For Existing Invoices:

From admin panel, you can:
1. View any invoice
2. Click "Send Payment Link"
3. Email link to customer
4. They pay via Stripe
5. Invoice auto-marked as paid

---

## 🔒 Security Features

### Built-In:
- ✅ **PCI Compliance** - Stripe handles card data
- ✅ **3D Secure** - Required for large transactions
- ✅ **Fraud Detection** - Stripe Radar included
- ✅ **Webhook Verification** - Signature checking
- ✅ **Encrypted Storage** - No card numbers stored

### Best Practices:
- API keys stored in environment variables
- Webhook signatures verified
- All sensitive operations server-side
- HTTPS required for production

---

## 💰 Pricing Breakdown

### Stripe Fees:
```
Credit/Debit Cards: 2.9% + $0.30
ACH Bank Transfer: 0.8% (capped at $5)
Apple Pay/Google Pay: 2.9% + $0.30
International Cards: +1% (3.9% + $0.30)
```

### No Other Fees:
- ❌ No monthly fee
- ❌ No setup fee
- ❌ No $18 per transaction!
- ❌ No PCI compliance fee
- ❌ No hidden charges

### Optional Add-Ons:
- Instant Payouts: 1.5% (get money same day)
- Stripe Billing: $0 (for subscriptions)
- Radar for Fraud: Included free

---

## 📊 Payment Flow

```
Lead submits service selection
    ↓
Draft invoice auto-generated
    ↓
Success screen shows "Pay Now" button
    ↓
Click → Stripe checkout session created
    ↓
Redirected to Stripe payment page
    ↓
Enter card details (secure, PCI compliant)
    ↓
Payment processed
    ↓
Webhook received
    ↓
Invoice marked as paid
    ↓
Payment record created
    ↓
Confirmation email sent
    ↓
Admin notified
    ↓
Done! ✅
```

---

## 🎯 Features You Get

### 1. **Multiple Payment Methods**
- Credit/Debit cards (Visa, MC, Amex, Discover)
- Apple Pay & Google Pay
- ACH bank transfers (huge savings!)
- Buy Now Pay Later (Affirm, Klarna)
- Cash App Pay

### 2. **Instant Checkout**
- Saved payment methods
- One-click payments
- Mobile-optimized
- Auto-fill from browser

### 3. **Automatic Reconciliation**
- Payments auto-matched to invoices
- Real-time status updates
- Accounting export ready
- Tax reporting easy

### 4. **Customer Experience**
- Professional checkout
- Receipt emails automatic
- Refunds easy
- Dispute handling included

### 5. **Your Dashboard**
- Real-time payment tracking
- Analytics & reports
- Export to CSV/Excel
- Tax forms auto-generated

---

## 🔄 Webhook Events

Your system automatically handles:

| Event | What Happens |
|-------|-------------|
| `checkout.session.completed` | Invoice marked paid, confirmation sent |
| `payment_intent.succeeded` | Payment record created |
| `payment_intent.payment_failed` | Admin notified, retry options shown |
| `charge.refunded` | Invoice status updated, admin notified |

---

## 🧪 Testing

### Test Mode (Safe to experiment):

Use test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

**Test payments:**
1. Use test API keys (sk_test_...)
2. Create test invoice
3. Pay with test card
4. Verify webhook fires
5. Check invoice marked paid

### Go Live Checklist:
1. ✅ Complete Stripe verification
2. ✅ Replace test keys with live keys
3. ✅ Update webhook URL to production
4. ✅ Test with real $1 payment
5. ✅ Verify confirmation emails
6. ✅ Check admin notifications

---

## 📈 Advanced Features (Future)

### Payment Plans:
```javascript
// Split payment: 50% deposit, 50% on event day
stripe.checkout.sessions.create({
  line_items: depositItems,
  payment_intent_data: {
    setup_future_usage: 'off_session'
  }
});
```

### Subscriptions:
```javascript
// Monthly retainer for recurring clients
stripe.subscriptions.create({
  customer: customerId,
  items: [{price: 'price_monthly_retainer'}]
});
```

### Automatic Late Fees:
```javascript
// Charge late fee if not paid by due date
if (invoice.due_date < now && invoice.status !== 'paid') {
  addLateFee(invoice.id, 25);
}
```

---

## 💡 Pro Tips

1. **Enable ACH Payments**
   - Only 0.8% fee vs 2.9%!
   - Great for corporate clients
   - Offer discount for ACH

2. **Use Payment Links**
   - Send via text/email
   - No login required
   - Trackable clicks

3. **Set Up Auto-Reminders**
   - Email 3 days before due
   - Email on due date
   - Email 3 days after (with late fee)

4. **Offer Payment Plans**
   - 50% deposit
   - 25% 2 weeks before
   - 25% on event day

5. **Save Payment Methods**
   - Faster repeat payments
   - Auto-charge balance due
   - Upsells easy

---

## 🆘 Troubleshooting

### Webhook not firing:
1. Check webhook URL is correct
2. Verify signing secret
3. Check Stripe Dashboard → Webhooks → Recent attempts
4. Ensure endpoint is publicly accessible

### Payment not marking invoice as paid:
1. Check webhook fired successfully
2. Verify `invoice_id` in metadata
3. Check database for payment record
4. Review server logs for errors

### Customer card declined:
1. Stripe shows decline reason
2. Customer can try different card
3. You see notification in admin
4. Can send manual payment link

---

## 📞 Support

**Stripe Support:**
- Dashboard: Live chat available
- Docs: [stripe.com/docs](https://stripe.com/docs)
- Phone: Available for verified accounts

**Your System:**
- Check webhook logs in Stripe Dashboard
- Review server logs: `npm run dev`
- Database: Check `invoices` and `payments` tables

---

## 🎉 Ready to Go Live?

1. ✅ Stripe account created
2. ✅ API keys added
3. ✅ Webhook configured
4. ✅ Test payment successful
5. ✅ First real payment processed

**Start saving $1,000+ per year!** 💰

