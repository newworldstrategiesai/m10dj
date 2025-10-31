# 💰 Advanced Payment Features - Implementation Guide

## 🎉 What's Included

This guide covers the implementation of 7 advanced payment features for M10 DJ Company:

1. ✅ **Partial Payments** (Deposit + Balance)
2. ✅ **Payment Plans** (Installments)
3. ✅ **Automatic Reminders** (Scheduled emails/SMS)
4. ✅ **Late Fees** (Automatic calculation)
5. ✅ **Discount Codes** (Promo system)
6. ✅ **ACH/Bank Transfers** (Lower fees via Stripe)
7. ✅ **QR Code Payments** (Mobile-first)

---

## 📊 Database Schema

**Already Created:** `20250128000007_add_advanced_payments.sql`

### New Tables:
- `payment_plans` - Payment plan configurations
- `payment_installments` - Individual installment payments
- `discount_codes` - Promo codes and discounts
- `discount_usage` - Discount tracking
- `late_fees` - Late fee records
- `payment_reminders` - Reminder history

### Views:
- `overdue_installments` - Quick lookup of overdue payments
- `upcoming_payments` - Payments due in next 7 days

---

## 1️⃣ Partial Payments (Deposit + Balance)

### Use Case:
Customer pays 50% deposit now, 50% balance before event

### Implementation:

**API Created:** `/api/payment-plans/create`

**Example Usage:**
```javascript
await fetch('/api/payment-plans/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoiceId: 'invoice-uuid',
    planType: 'partial',
    installments: [
      {
        name: 'Deposit (50%)',
        amount: 750.00,
        dueDate: '2025-02-01'
      },
      {
        name: 'Balance (50%)',
        amount: 750.00,
        dueDate: '2025-03-01' // Before event
      }
    ]
  })
});
```

**Customer Experience:**
1. Receives invoice with "Pay Deposit" option
2. Pays 50% to secure booking
3. Gets reminder before balance is due
4. Pays final 50% before event

---

## 2️⃣ Payment Plans (Installments)

### Use Case:
Customer pays in 3-4 monthly installments

### Implementation:

**API:** `/api/payment-plans/create`

**Example - 3 Monthly Payments:**
```javascript
await fetch('/api/payment-plans/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoiceId: 'invoice-uuid',
    planType: 'installment',
    installments: [
      {
        name: 'Payment 1 of 3',
        amount: 500.00,
        dueDate: '2025-02-01'
      },
      {
        name: 'Payment 2 of 3',
        amount: 500.00,
        dueDate: '2025-03-01'
      },
      {
        name: 'Payment 3 of 3',
        amount: 500.00,
        dueDate: '2025-04-01'
      }
    ]
  })
});
```

**Customer Experience:**
1. Sees payment schedule upfront
2. Gets link for each installment
3. Pays on their schedule
4. Tracks progress in portal (future)

---

## 3️⃣ Automatic Reminders

### Types of Reminders:
- **7 days before due:** "Payment coming up"
- **3 days before due:** "Payment due soon"
- **On due date:** "Payment due today"
- **1 day overdue:** "Payment overdue"
- **7 days overdue:** "Final notice"

### Implementation:

**Cron Job:** `/api/cron/send-payment-reminders`

```javascript
// Run daily at 9am
export default async function handler(req, res) {
  // Check authorization
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get upcoming payments (due in 7 days)
  const { data: upcoming } = await supabase
    .from('upcoming_payments')
    .select('*');

  // Get overdue payments
  const { data: overdue } = await supabase
    .from('overdue_installments')
    .select('*');

  // Send reminders
  for (const payment of upcoming) {
    if (payment.days_until_due === 7) {
      await sendReminder(payment, 'due_soon');
    }
    // ... more reminder logic
  }

  res.status(200).json({ sent: upcoming.length + overdue.length });
}
```

**Email Template:**
```html
<h2>Payment Reminder</h2>
<p>Hi {firstName}!</p>
<p>This is a friendly reminder that your payment of <strong>${amount}</strong> is due on <strong>{dueDate}</strong>.</p>
<a href="{paymentLink}">Pay Now</a>
```

---

## 4️⃣ Late Fees

### Configuration:
- **5% per month** or **$25 flat fee**
- Applied after grace period (e.g., 3 days)
- Can be waived by admin

### Implementation:

**Function:** `calculate_late_fee()` (SQL)

```sql
SELECT calculate_late_fee(
  750.00,  -- amount
  10,      -- days overdue
  'percentage',
  5.0      -- 5% per month
);
-- Returns: 12.50 (for 10 days)
```

**Auto-Apply Late Fees:**
```javascript
// Run daily
const { data: overdue } = await supabase
  .from('overdue_installments')
  .select('*')
  .filter('days_overdue', 'gte', 3);

for (const payment of overdue) {
  const lateFee = await calculateLateFee(payment);
  
  await supabase.from('late_fees').insert({
    installment_id: payment.id,
    fee_amount: lateFee,
    days_overdue: payment.days_overdue,
    status: 'applied'
  });
}
```

---

## 5️⃣ Discount Codes

### Types:
- **Percentage off:** 10%, 20%, etc.
- **Fixed amount:** $50 off, $100 off
- **First payment only**
- **Minimum order**
- **Expiry dates**
- **Usage limits**

### Implementation:

**Create Discount:**
```sql
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  max_uses,
  valid_until,
  is_active
) VALUES (
  'WEDDING2025',
  'Spring Wedding Special',
  'percentage',
  15.0,  -- 15% off
  50,    -- Max 50 uses
  '2025-06-30',
  true
);
```

**Apply Discount:**
```javascript
// At checkout
const isValid = await supabase
  .rpc('is_discount_valid', {
    p_code: 'WEDDING2025',
    p_order_amount: 1500.00
  });

if (isValid) {
  const discount = await getDiscountAmount('WEDDING2025', 1500.00);
  finalAmount = 1500.00 - discount; // 1275.00 (15% off)
}
```

**Track Usage:**
```sql
INSERT INTO discount_usage (
  discount_code_id,
  invoice_id,
  contact_id,
  original_amount,
  discount_amount,
  final_amount
) VALUES (...);

UPDATE discount_codes 
SET current_uses = current_uses + 1 
WHERE code = 'WEDDING2025';
```

---

## 6️⃣ ACH/Bank Transfers (Stripe)

### Benefits:
- **Lower fees:** 0.8% vs 2.9% for cards
- **Savings:** $21 vs $45 on $1500 invoice
- **ACH Direct Debit via Stripe**

### Implementation:

**Enable in Stripe Checkout:**
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card', 'us_bank_account'], // Add ACH
  // ... rest of config
});
```

**Customer Flow:**
1. Choose "Bank Transfer" at checkout
2. Enter routing & account number
3. Stripe micro-deposits verify (instant with Plaid)
4. Payment processed in 3-5 business days
5. Lower fees for you!

---

## 7️⃣ QR Code Payments

### Use Case:
- Print on invoices
- Display at events
- Mobile-first payments

### Implementation:

**Generate QR Code:**
```javascript
const QRCode = require('qrcode');

async function generatePaymentQR(invoice) {
  const paymentLink = `https://m10djcompany.com/pay/${invoice.payment_token}`;
  
  const qrCode = await QRCode.toDataURL(paymentLink, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000',
      light: '#fff'
    }
  });

  // Save to invoice
  await supabase
    .from('invoices')
    .update({ qr_code_data: qrCode })
    .eq('id', invoice.id);

  return qrCode;
}
```

**Display on Invoice:**
```html
<div style="text-align: center;">
  <p>Scan to Pay</p>
  <img src="{qrCodeData}" alt="Payment QR Code" />
  <p>Or visit: {paymentLink}</p>
</div>
```

**Benefits:**
- Print on contracts
- Show at events
- Quick mobile payment
- No typing needed

---

## 🎯 Admin UI Components

### Payment Plan Creator

**Location:** `/admin/invoices/[id]/payment-plan`

**Features:**
- Choose plan type (Partial/Installments)
- Set number of payments
- Customize amounts & due dates
- Preview schedule
- Create plan

**UI Example:**
```tsx
<div className="payment-plan-creator">
  <h2>Create Payment Plan</h2>
  
  <select onChange={(e) => setPlanType(e.target.value)}>
    <option value="partial">Deposit + Balance</option>
    <option value="installment">Monthly Installments</option>
  </select>

  {planType === 'partial' && (
    <>
      <input 
        type="number" 
        placeholder="Deposit %" 
        value={depositPercent}
        onChange={(e) => setDepositPercent(e.target.value)}
      />
      <input 
        type="date" 
        placeholder="Deposit Due"
        value={depositDate}
      />
      <input 
        type="date" 
        placeholder="Balance Due"
        value={balanceDate}
      />
    </>
  )}

  {planType === 'installment' && (
    <>
      <input 
        type="number" 
        placeholder="Number of Payments" 
        value={numPayments}
      />
      {/* Generate installment fields */}
    </>
  )}

  <button onClick={createPaymentPlan}>
    Create Plan
  </button>
</div>
```

### Discount Code Manager

**Location:** `/admin/settings/discount-codes`

**Features:**
- Create/edit codes
- Set restrictions
- Track usage
- Deactivate codes
- View analytics

### Reminder Settings

**Location:** `/admin/settings/payment-reminders`

**Features:**
- Enable/disable reminders
- Set reminder schedule
- Customize templates
- View reminder log
- Test reminders

---

## 📧 Email Templates

### Payment Reminder
```html
Subject: Payment Due Soon - Invoice {invoice_number}

Hi {firstName}!

This is a friendly reminder that you have a payment coming up:

Amount Due: ${amount}
Due Date: {dueDate}
Invoice: {invoiceNumber}

[Pay Now Button]

Questions? Call us at (901) 410-2020
```

### Overdue Notice
```html
Subject: Overdue Payment - Invoice {invoice_number}

Hi {firstName},

Your payment of ${amount} was due on {dueDate} and is now {daysOverdue} days overdue.

Please make payment as soon as possible to avoid late fees.

[Pay Now Button]

Contact us if you need to discuss payment options.
```

### Late Fee Applied
```html
Subject: Late Fee Applied - Invoice {invoice_number}

Hi {firstName},

A late fee of ${lateFee} has been applied to your overdue payment.

Original Amount: ${originalAmount}
Late Fee: ${lateFee}
New Total: ${newTotal}

[Pay Now Button]
```

---

## 🔧 Setup Checklist

### Database
- [ ] Run migration: `20250128000007_add_advanced_payments.sql`
- [ ] Verify tables created
- [ ] Test views work
- [ ] Check indexes

### APIs
- [ ] Deploy payment plans API
- [ ] Create discount codes API
- [ ] Build late fees API
- [ ] Setup reminder cron job

### Stripe
- [ ] Enable ACH payments
- [ ] Test ACH flow
- [ ] Update checkout config
- [ ] Configure webhooks

### Cron Jobs
- [ ] Setup daily reminder check (9am)
- [ ] Setup late fee application (midnight)
- [ ] Setup payment plan updates
- [ ] Monitor cron logs

### Admin UI
- [ ] Build payment plan creator
- [ ] Create discount code manager
- [ ] Add reminder settings
- [ ] Build late fee dashboard

### Testing
- [ ] Test partial payments
- [ ] Test installments
- [ ] Test discount codes
- [ ] Test late fees
- [ ] Test reminders
- [ ] Test ACH payments
- [ ] Test QR codes

---

## 💡 Usage Examples

### Create 50/50 Payment Plan
```javascript
const plan = await createPaymentPlan({
  invoiceId: invoice.id,
  type: 'partial',
  installments: [
    { name: 'Deposit', amount: 750, dueDate: '2025-02-01' },
    { name: 'Balance', amount: 750, dueDate: '2025-05-15' }
  ]
});
```

### Apply Discount Code
```javascript
const discount = await applyDiscount({
  code: 'SPRING2025',
  invoiceId: invoice.id,
  amount: 1500
});
// Returns: { valid: true, discount: 150, final: 1350 }
```

### Check Overdue Payments
```sql
SELECT * FROM overdue_installments 
WHERE days_overdue > 7;
```

---

## 📊 Reporting & Analytics

### Payment Plan Performance
```sql
SELECT 
  plan_type,
  COUNT(*) as total_plans,
  SUM(total_amount) as total_value,
  AVG(total_amount) as avg_plan_size
FROM payment_plans
WHERE status = 'completed'
GROUP BY plan_type;
```

### Discount Code ROI
```sql
SELECT 
  dc.code,
  dc.description,
  COUNT(du.id) as uses,
  SUM(du.discount_amount) as total_discounts,
  SUM(du.final_amount) as revenue_generated
FROM discount_codes dc
LEFT JOIN discount_usage du ON dc.id = du.discount_code_id
GROUP BY dc.id
ORDER BY revenue_generated DESC;
```

### Late Fee Revenue
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(fee_amount) as total_fees,
  COUNT(*) as fee_count
FROM late_fees
WHERE status = 'applied'
GROUP BY month
ORDER BY month DESC;
```

---

## 🚀 Next Steps

1. **Run migration** - Apply database schema
2. **Create discount codes** - Add 2-3 promo codes
3. **Setup cron** - Configure reminder system
4. **Test flow** - Create test payment plan
5. **Launch** - Roll out to customers!

---

## 🎓 Best Practices

### Payment Plans
✅ Offer 50/50 for bookings 3+ months out  
✅ Limit installments to 3-4 payments  
✅ Require deposit to secure date  
✅ Balance due 7 days before event  

### Discounts
✅ Use time-limited codes (urgency)  
✅ Set minimum order amounts  
✅ Track which codes convert best  
✅ Rotate codes seasonally  

### Reminders
✅ Send 7 days, 3 days, day before  
✅ Use friendly, not threatening tone  
✅ Include easy payment link  
✅ Offer help if needed  

### Late Fees
✅ Set clear policy upfront  
✅ 3-day grace period  
✅ Reasonable fee (5% or $25)  
✅ Allow admin waiver  

---

## 📞 Support

**Questions?** Contact Ben Murray
- Phone: (901) 410-2020
- Email: djbenmurray@gmail.com

---

**Status:** 🚀 Ready to Implement  
**Complexity:** Medium  
**Timeline:** 2-3 days for full implementation  

*Your payment system is about to get seriously powerful!* 💪✨

