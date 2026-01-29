# Song Request Invoices Fix

## Problem

1. **Song requests were creating invoices** – Every time a song request payment was made, an invoice appeared at `/admin/invoices`. Song requests are tips/requests, not billable invoices, so they should not create invoices.

2. **One invoice had wrong amounts** – Invoice `bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a` showed $2,500 total and $0 received. It should be $2,150 total with $1,075 (50%) received.

## Fixes Applied

### 1. Prevention: No new invoices for song requests

**File:** `utils/create-invoice-from-crowd-request.js`

- If `request_type === 'song_request'`, the function now returns immediately without creating or linking an invoice.
- Shoutouts and other crowd request types can still create invoices if you want; only song requests are skipped.

**Callers:** `pages/api/crowd-request/process-payment-success.js` (and any future callers) will get `success: true, created: false, skip_reason: 'song_request'` for song requests, so no invoice is created.

### 2. Retroactive: Clean up existing data

**File:** `scripts/song_request_invoices_and_fix_bdcda9ea.sql`

Run this in the **Supabase SQL Editor** (review each section before running):

1. **Identify song-request invoices** – SELECT invoices linked to song requests or with title like "Song Request:%".
2. **Cancel those invoices** – Set `invoice_status = 'Cancelled'`, zero out `amount_paid` and `balance_due`, clear `paid_date`.
3. **Unlink crowd_requests** – Set `invoice_id = NULL` on `crowd_requests` where `request_type = 'song_request'`.
4. **Fix invoice bdcda9ea** – Set `total_amount = 2150`, `amount_paid = 1075`, `balance_due = 1075`, `invoice_status = 'Partial'`.
5. **Optional** – The script includes a commented block to insert a payment record for the $1,075 if you use the `payments` table and want one row for this 50% payment. Uncomment and run if needed.

### 3. Optional: Payment record for the corrected invoice

If you want the $1,075 to appear in Payment History on the invoice page, uncomment and run the `INSERT INTO payments` block in the SQL script (it only runs when no paid payment exists for that invoice). Otherwise you can add the payment manually from the admin invoice page.

## Making sure it never happens again

- **Code:** Song requests no longer create invoices; the change is in `create-invoice-from-crowd-request.js`.
- **Data:** After running the SQL script, existing song-request invoices are cancelled and unlinked, and invoice `bdcda9ea` is corrected.
- **Admin list:** Cancelled invoices may still appear in the list depending on your filters. You can add a default filter (e.g. “Hide cancelled”) on the admin invoices page if desired.

## Verification

1. **Code:** Make a test song request payment (Stripe test mode). Confirm no new invoice is created.
2. **Data:** Run the SELECT in Step 1 of the SQL script; then run the script and run the verification SELECT at the end. Invoice `bdcda9ea` should show total 2150, amount_paid 1075, balance_due 1075, status Partial.
3. **Admin:** Open https://www.m10djcompany.com/admin/invoices and confirm song-request invoices are cancelled and invoice `bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a` shows the corrected amounts.
