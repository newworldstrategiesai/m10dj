# Marlee Condo Invoice Fix

How to fix the Marlee Condo invoice so **totals are correct** and the **deposit payment shows on the invoice page**.

## Quick fix (Admin UI)

If the $1,075 deposit payment already exists for this contact (e.g. you ran `manual_payment_fix.sql` or Stripe webhook recorded it):

1. **Admin → Invoices** → open the **Marlee Condo** invoice.
2. Click **"Sync totals"** (outline button with refresh icon).
   - This links any contact payments that aren’t tied to an invoice to this invoice.
   - It recalculates **Amount paid**, **Balance due**, and **Status** from linked payments.
3. Reload the page if needed; the payment should appear in the **Payments** section (the page loads payments by contact/lead, so the deposit should show).

## If the payment isn’t in the system yet

**Option A – Link from Stripe (recommended)**  
Call the admin API to create the payment and link it to the lead/invoice:

```bash
# From your app (admin logged in) or with an admin API key:
curl -X POST https://your-domain.com/api/admin/link-deposit-by-lead \
  -H "Content-Type: application/json" \
  -d '{"lead_id": "c082f6bd-d63c-4c23-992d-caa68c299017"}'
```

If Stripe doesn’t have `lead_id` in metadata, pass the Payment Intent ID:

```json
{"lead_id": "c082f6bd-d63c-4c23-992d-caa68c299017", "payment_intent_id": "pi_3SXDFXEJct0cvYrG13wMabsI"}
```

Then open the Marlee Condo invoice in Admin and click **"Sync totals"** once.

**Option B – SQL (one-off fix)**  
Run the script that creates/links the payment and recalculates the invoice:

- **Script:** `scripts/fix_marlee_condo_invoice.sql`
- Run **Step 1** in Supabase SQL Editor to confirm the invoice and current totals.
- Run **Steps 2–6** to set `contact_id`, ensure the payment exists, link it to the invoice, update `quote_selections`, and recalc invoice totals.
- Run **Step 7** to verify invoice and payment rows.

## Why the payment shows on the invoice page

- The invoice detail page loads payments via **lead_id** (from `quote_selections` for this invoice) using `/api/quote/[lead_id]/payments`, which returns all payments for that **contact**.
- So any payment with `contact_id = c082f6bd-d63c-4c23-992d-caa68c299017` appears in the Payments section, whether or not it has `invoice_id` set.
- **Sync totals** sets `invoice_id` on those payments and updates the invoice’s `amount_paid`, `balance_due`, and `invoice_status` so the header totals match the list.

## Reference

- **Lead/contact ID:** `c082f6bd-d63c-4c23-992d-caa68c299017`
- **Stripe Payment Intent:** `pi_3SXDFXEJct0cvYrG13wMabsI`
- **Deposit:** $1,075.00 (2025-11-25)
