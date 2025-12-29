# Entity Relationship & Sync System Fix

## Summary

This fix addresses critical data synchronization issues between `contacts`, `events`, `quotes`, `invoices`, and `contracts` tables.

---

## What Was Wrong

1. **No `contact_id` on events** - Events were linked via legacy `submission_id` or email matching
2. **No FK on `quote_selections.lead_id`** - Could reference orphan/invalid IDs
3. **No bidirectional sync** - Updating a contact didn't update linked events/contracts
4. **Payment → Invoice disconnect** - Payments didn't aggregate to invoices properly
5. **Status drift** - Invoice paid but contact shows unpaid, contract signed but lead not "Booked"
6. **Pricing inconsistency** - Same price stored in 6 places with no sync

---

## Files Created/Modified

### New Migrations

| File | Purpose |
|------|---------|
| `supabase/migrations/20251230000100_fix_entity_relationships.sql` | Full migration with triggers, FKs, diagnostic functions |
| `FIX_ENTITY_RELATIONSHIPS_QUICK.sql` | Standalone version for Supabase SQL Editor |

### Documentation

| File | Purpose |
|------|---------|
| `ENTITY_RELATIONSHIPS.md` | Full documentation of entity relationships and data flow |
| `FIX_ENTITY_SYNC_README.md` | This file |

### Updated Utilities

| File | Changes |
|------|---------|
| `utils/auto-create-quote-invoice-contract.js` | Added organization_id support, initial pricing sync, new `ensureContactRecords()` function |

---

## How to Apply

### Option 1: Supabase Migrations (Recommended)

```bash
# Push migration to Supabase
supabase db push
```

### Option 2: Direct SQL

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `FIX_ENTITY_RELATIONSHIPS_QUICK.sql`
3. Run the SQL

---

## Post-Installation Steps

### 1. Check for Issues

Run these queries in SQL Editor:

```sql
-- Find contacts missing linked records
SELECT * FROM find_orphaned_contacts() 
WHERE NOT has_quote OR NOT has_invoice OR NOT has_contract 
LIMIT 20;

-- Find pricing mismatches
SELECT * FROM find_pricing_mismatches();

-- Find status inconsistencies
SELECT * FROM find_status_inconsistencies();

-- Find events without contact links
SELECT * FROM find_unlinked_events();
```

### 2. Backfill Historical Data

```sql
-- Link events to contacts by email/name
SELECT * FROM backfill_event_contact_links();

-- Create missing quote/invoice/contract for booked contacts
SELECT * FROM backfill_missing_records();

-- Force sync all contacts to their records (careful!)
SELECT * FROM force_sync_all_contacts();
```

---

## Sync Triggers Installed

| Trigger | Source → Target | When Fires |
|---------|-----------------|------------|
| `trigger_sync_contact_to_events` | contacts → events | Contact event details change |
| `trigger_sync_event_to_contact` | events → contacts | Event details change (if contact_id set) |
| `trigger_sync_contact_to_contracts` | contacts → contracts | Contact event details change |
| `trigger_sync_contract_status_to_contact` | contracts → contacts | Contract signed/completed |
| `trigger_sync_payments_to_invoice` | payments → invoices | Payment status = 'Paid' |
| `trigger_sync_invoice_to_contact` | invoices → contacts | Invoice payment status changes |
| `trigger_sync_contact_pricing` | contacts → all | quoted_price changes |

---

## What Gets Synced

### contacts → events
- `event_type`, `event_date`
- `venue_name`, `venue_address`
- `guest_count`
- `client_name` (from first_name + last_name)
- `client_email`, `client_phone`

**Protected:** Completed or cancelled events are NOT updated

### contacts → contracts
- Same fields as events
- `event_time`
- `total_amount` (from quoted_price)
- `deposit_amount`

**Protected:** Signed, completed, cancelled, or expired contracts are NOT updated

### payments → invoices
- Aggregates all "Paid" payments
- Updates `amount_paid`, `balance_due`
- Updates `invoice_status` (Paid/Partial/Overdue)
- Sets `paid_date` when fully paid

### invoices → contacts
- `payment_status` (paid/partial/overdue)
- `deposit_paid` (true if any payment)
- `final_price` (when fully paid)

### contracts → contacts
- `lead_status = 'Booked'` (when contract signed)
- `lead_stage = 'Contract Signed'`
- `contract_signed_date`
- `lead_status = 'Completed'` (when contract completed)

---

## Testing

After installation, test with:

```sql
-- Test contact → event sync
UPDATE contacts 
SET event_date = '2025-03-15'
WHERE id = 'your-contact-id';

-- Check event was updated
SELECT event_date FROM events WHERE contact_id = 'your-contact-id';
```

---

## Rollback

If needed, drop the triggers:

```sql
DROP TRIGGER IF EXISTS trigger_sync_contact_to_events ON contacts;
DROP TRIGGER IF EXISTS trigger_sync_event_to_contact ON events;
DROP TRIGGER IF EXISTS trigger_sync_contact_to_contracts ON contacts;
DROP TRIGGER IF EXISTS trigger_sync_contract_status_to_contact ON contracts;
DROP TRIGGER IF EXISTS trigger_sync_payments_to_invoice ON payments;
DROP TRIGGER IF EXISTS trigger_sync_invoice_to_contact ON invoices;
DROP TRIGGER IF EXISTS trigger_sync_contact_pricing ON contacts;
```

---

## Cross-Product Impact

| Product | Impact |
|---------|--------|
| **DJDash.net** | ✅ All CRM/invoice/contract features now stay in sync |
| **M10DJCompany.com** | ✅ Event bookings linked properly to contacts |
| **TipJar.live** | ⚪ No direct impact (tips use separate tables) |

---

## Questions?

See `ENTITY_RELATIONSHIPS.md` for complete documentation of all table relationships and data flow.

