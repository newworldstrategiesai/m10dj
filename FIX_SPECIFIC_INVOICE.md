# Fix Specific Invoice: c43b6fe2-b130-429d-aa73-775fb50f19a8

## Invoice URL
https://www.m10djcompany.com/admin/invoices/c43b6fe2-b130-429d-aa73-775fb50f19a8

## Quick Fix Options

### Option 1: Use Admin UI (Easiest)

1. **Go to the invoice page:**
   - Navigate to: https://www.m10djcompany.com/admin/invoices/c43b6fe2-b130-429d-aa73-775fb50f19a8

2. **Check the current status:**
   - Look at the "Amount Paid" section
   - Check if there are any payment records shown

3. **If invoice is marked as "Paid" but no payment records exist:**
   - Click the edit icon (pencil) next to "Amount Paid"
   - Set amount_paid to `0`
   - Click "Save"
   - The invoice status will automatically update to "Sent" or "Partial"

4. **If invoice shows incorrect amounts:**
   - Click the edit icon next to "Amount Paid"
   - Enter the correct amount (e.g., `200.00` for base invoice, excluding gratuity)
   - Click "Save"
   - The balance_due will auto-calculate

### Option 2: Use Validation Tool

1. **Go to invoices dashboard:**
   - Navigate to: https://www.m10djcompany.com/admin/invoices

2. **Click "Validate Payments" button**

3. **Find this invoice in the list:**
   - Look for invoice ID: `c43b6fe2-b130-429d-aa73-775fb50f19a8`
   - Or search by invoice number

4. **Click "Revert to Unpaid"** if it's marked as paid without payment records

### Option 3: Use SQL Script

1. **Run the SQL script:**
   ```bash
   # In Supabase SQL Editor, run:
   fix_specific_invoice_c43b6fe2.sql
   ```

2. **The script will:**
   - Check current invoice status
   - Check for payment records
   - Automatically fix the invoice based on findings
   - Show verification results

## What the Script Does

### Step 1: Diagnostic Check
- Shows current invoice status
- Shows payment records count and total
- Shows contact information

### Step 2: Payment Records Check
- Lists all payment records for this invoice
- Shows payment amounts, gratuity, and Stripe IDs

### Step 3: Automatic Fix
- **If no payment records exist:**
  - Reverts invoice status to "Sent" or "Partial" (based on amount_paid)
  - Sets amount_paid to 0
  - Sets balance_due to total_amount
  - Clears paid_date

- **If payment records exist:**
  - Updates invoice to match payment records
  - Sets correct amount_paid and balance_due
  - Updates status to "Paid" or "Partial" accordingly

### Step 4: Verification
- Shows final invoice status
- Confirms payment records match invoice amounts

## Expected Scenarios

### Scenario A: Invoice marked as Paid, but no payment received
**Before:**
- invoice_status: "Paid"
- amount_paid: 200.00 (or some amount)
- payment_count: 0

**After Fix:**
- invoice_status: "Sent" (or "Partial" if amount_paid > 0)
- amount_paid: 0
- balance_due: total_amount
- paid_date: NULL

### Scenario B: Invoice marked as Paid, payment records exist but amounts don't match
**Before:**
- invoice_status: "Paid"
- amount_paid: 230.00 (includes gratuity incorrectly)
- payment_total: 200.00 (base) + 30.00 (gratuity)

**After Fix:**
- invoice_status: "Paid"
- amount_paid: 200.00 (base payment, excluding gratuity)
- balance_due: 0
- Payment record shows: total_amount=200.00, gratuity=30.00

### Scenario C: Payment was received but invoice not updated
**Before:**
- invoice_status: "Sent"
- amount_paid: 0
- payment_total: 200.00

**After Fix:**
- invoice_status: "Paid"
- amount_paid: 200.00
- balance_due: 0

## Manual Correction via Admin UI

If you need to manually set specific values:

1. Go to the invoice detail page
2. Click edit icon next to "Amount Paid"
3. Enter the correct amount:
   - **Base invoice amount** (excluding gratuity): e.g., `200.00`
   - The system will auto-calculate balance_due
   - Status will auto-update based on amounts

4. If you also need to update the payment record:
   - Go to the payment history section
   - Or create a new payment record via the payments API

## Verification Checklist

After fixing, verify:
- [ ] Invoice status matches payment reality
- [ ] amount_paid matches sum of payment records (excluding gratuity)
- [ ] balance_due is correct (total_amount - amount_paid)
- [ ] Payment records exist if invoice is marked as "Paid"
- [ ] Gratuity is tracked separately in payment records (not in invoice amount_paid)
