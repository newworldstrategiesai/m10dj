# DJ Dash Entity Relationships

## Overview

This document describes the core entity relationships in the DJ Dash platform, how data flows between tables, and the synchronization mechanisms in place.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIPS                                │
└─────────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   CONTACTS      │  ◄── SOURCE OF TRUTH for:
                         │                 │      • Client info (name, email, phone)
                         │  • first_name   │      • Event details (date, venue)
                         │  • last_name    │      • Lead status
                         │  • email        │      • Payment status
                         │  • event_date   │
                         │  • venue_name   │
                         │  • quoted_price │
                         │  • lead_status  │
                         │  • payment_status│
                         └────────┬────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     EVENTS      │     │  QUOTE_SELECTIONS│     │   CONTRACTS     │
│                 │     │                 │     │                 │
│  • contact_id ──┼─────│  • lead_id ─────┼─────│  • contact_id ──┤
│  • event_date   │     │  • invoice_id ──┼──┐  │  • invoice_id ──┤
│  • venue_name   │     │  • contract_id ─┼──┼──│  • quote_sel_id │
│  • total_amount │     │  • total_price  │  │  │  • event_date   │
│  • client_name  │     │  • status       │  │  │  • total_amount │
│  • status       │     │  • payment_stat │  │  │  • status       │
└─────────────────┘     └─────────────────┘  │  └─────────────────┘
                                  │          │
                                  ▼          │
                        ┌─────────────────┐  │
                        │    INVOICES     │◄─┘
                        │                 │
                        │  • contact_id ──┤
                        │  • project_id ──┼──► events.id (optional)
                        │  • total_amount │
                        │  • amount_paid  │
                        │  • status       │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    PAYMENTS     │
                        │                 │
                        │  • contact_id ──┤
                        │  • invoice_id ──┤
                        │  • project_id ──┼──► events.id (optional)
                        │  • total_amount │
                        │  • status       │
                        └─────────────────┘
```

---

## Table Purposes

### `contacts` - The CRM Hub
**Purpose:** Single source of truth for client and event information.

| Column | Description | Syncs To |
|--------|-------------|----------|
| `first_name`, `last_name` | Client name | → events.client_name, contracts.event_name |
| `email_address` | Client email | → events.client_email |
| `phone` | Client phone | → events.client_phone |
| `event_date` | When the event is | → events.event_date, contracts.event_date |
| `event_type` | Wedding, corporate, etc | → events.event_type, contracts.event_type |
| `venue_name`, `venue_address` | Location | → events.venue_*, contracts.venue_* |
| `guest_count` | Number of guests | → events.number_of_guests, contracts.guest_count |
| `quoted_price` | Proposed price | → invoices.total_amount, contracts.total_amount |
| `deposit_amount` | Deposit required | → contracts.deposit_amount |
| `lead_status` | Lead pipeline stage | ← contracts.status (when signed) |
| `payment_status` | Payment state | ← invoices.invoice_status |

### `events` - Event Execution
**Purpose:** Tracks booked events for calendar/operations.

| Column | Description | Source |
|--------|-------------|--------|
| `contact_id` | Link to contact | Set on creation or via backfill |
| `submission_id` | Legacy: link to contact_submissions | Migration artifact |
| `event_date` | Event date | ← contacts.event_date |
| `venue_name` | Venue | ← contacts.venue_name |
| `total_amount` | Event value | → contacts.quoted_price |
| `status` | confirmed/completed/cancelled | Operations |

### `quote_selections` - Client Quote Choices
**Purpose:** Records what packages/addons the client selected.

| Column | Description | Syncs |
|--------|-------------|-------|
| `lead_id` | Link to contacts.id | FK (now enforced) |
| `invoice_id` | Link to invoices | Created together |
| `contract_id` | Link to contracts | Created together |
| `package_name` | Selected package | → invoices.line_items |
| `addons` | Selected add-ons (JSON) | → invoices.line_items |
| `total_price` | Final quoted price | → invoices.total_amount |
| `status` | pending/confirmed/invoiced/paid | ← invoices.invoice_status |

### `invoices` - Financial Records
**Purpose:** Formal invoices for billing and accounting.

| Column | Description | Syncs |
|--------|-------------|-------|
| `contact_id` | Client | FK |
| `project_id` | Link to events | Optional |
| `total_amount` | Invoice total | ← quote_selections.total_price |
| `amount_paid` | Sum of payments | ← payments (aggregated) |
| `balance_due` | Remaining balance | Calculated |
| `invoice_status` | Draft/Sent/Paid/Overdue | → contacts.payment_status |

### `contracts` - Legal Agreements
**Purpose:** Service agreements with signatures.

| Column | Description | Syncs |
|--------|-------------|-------|
| `contact_id` | Client | FK |
| `invoice_id` | Related invoice | FK |
| `quote_selection_id` | Related quote | FK |
| `event_date` | Event date | ← contacts.event_date |
| `venue_name` | Venue | ← contacts.venue_name |
| `total_amount` | Contract value | ← contacts.quoted_price |
| `status` | draft/sent/signed/completed | → contacts.lead_status |

### `payments` - Financial Transactions
**Purpose:** Individual payment records.

| Column | Description | Syncs |
|--------|-------------|-------|
| `contact_id` | Client | FK |
| `invoice_id` | Related invoice | FK |
| `total_amount` | Payment amount | → invoices.amount_paid (sum) |
| `payment_status` | Paid/Pending/Refunded | → invoices.invoice_status |

---

## Sync Triggers

### contacts → events
**Trigger:** `trigger_sync_contact_to_events`

When contact's event details change:
- Updates linked events (via `contact_id`)
- Does NOT update completed or cancelled events

```sql
-- Syncs these fields:
event_type, event_date, venue_name, venue_address, 
number_of_guests, client_name, client_email, client_phone
```

### events → contacts
**Trigger:** `trigger_sync_event_to_contact`

When event details change:
- Updates linked contact (if `contact_id` is set)
- Syncs pricing if event has a higher total_amount

### contacts → contracts
**Trigger:** `trigger_sync_contact_to_contracts`

When contact event details change:
- Updates draft/sent contracts only
- Does NOT update signed contracts (legal document!)

### contracts → contacts
**Trigger:** `trigger_sync_contract_status_to_contact`

When contract is signed:
- Sets `lead_status = 'Booked'`
- Sets `lead_stage = 'Contract Signed'`
- Records `contract_signed_date`

When contract is completed:
- Sets `lead_status = 'Completed'`

### payments → invoices
**Trigger:** `trigger_sync_payments_to_invoice`

When a payment is made:
- Recalculates `amount_paid` (sum of all Paid payments)
- Updates `balance_due`
- Updates `invoice_status` (Paid/Partial/Overdue)
- Sets `paid_date` when fully paid

### invoices → contacts
**Trigger:** `trigger_sync_invoice_to_contact`

When invoice payment status changes:
- Updates `payment_status` on contact
- Sets `deposit_paid = true` when any payment received
- Sets `final_price` when fully paid

### contacts → pricing cascade
**Trigger:** `trigger_sync_contact_pricing`

When `quoted_price` changes:
- Updates pending quote_selections
- Updates draft invoices
- Updates draft contracts
- Sets deposit_amount = 50% of quoted_price

---

## Consistency Check Functions

### Find Orphaned Contacts
```sql
SELECT * FROM find_orphaned_contacts() 
WHERE NOT has_quote OR NOT has_invoice OR NOT has_contract 
LIMIT 20;
```

Returns contacts missing linked records.

### Find Pricing Mismatches
```sql
SELECT * FROM find_pricing_mismatches();
```

Returns records where pricing differs between contact/invoice/contract/quote.

### Find Status Inconsistencies
```sql
SELECT * FROM find_status_inconsistencies();
```

Returns records where:
- Contract signed but lead not "Booked"
- Invoice paid but contact shows unpaid
- Lead "Booked" but no contract exists

### Find Unlinked Events
```sql
SELECT * FROM find_unlinked_events();
```

Returns events without `contact_id` and suggests matching contacts.

---

## Backfill Functions

### Link Events to Contacts
```sql
SELECT * FROM backfill_event_contact_links();
```

Matches events to contacts by email or name and sets `contact_id`.

### Create Missing Records
```sql
SELECT * FROM backfill_missing_records();
```

For booked contacts, creates missing quote/invoice/contract.

### Force Sync All
```sql
SELECT * FROM force_sync_all_contacts();
```

Re-syncs ALL contacts to their related records. Use carefully.

---

## Data Flow: New Contact → Booked Client

```
1. Contact Form Submitted
   └── Creates contact_submissions record
   └── API creates contact in contacts table
   └── autoCreateQuoteInvoiceContract() creates:
       ├── quote_selections (pending)
       ├── invoices (draft)
       └── contracts (draft)

2. Admin Sends Quote
   └── Updates contact.quoted_price
   └── TRIGGER: sync_contact_pricing
       ├── Updates quote_selections.total_price
       ├── Updates invoices.total_amount
       └── Updates contracts.total_amount

3. Client Views/Modifies Quote
   └── Updates quote_selections (package, addons)
   └── TRIGGER: sync_quote_to_invoice
       └── Updates invoices.line_items, total_amount

4. Contract Sent & Signed
   └── Updates contracts.status = 'signed'
   └── TRIGGER: sync_contract_status_to_contact
       └── Sets contact.lead_status = 'Booked'

5. Payment Made
   └── Creates payment record
   └── TRIGGER: sync_payments_to_invoice
       └── Updates invoices.amount_paid, balance_due, status
   └── TRIGGER: sync_invoice_to_contact
       └── Updates contact.payment_status

6. Event Completed
   └── Updates events.status = 'completed'
   └── Admin updates contracts.status = 'completed'
   └── TRIGGER: sync_contract_status_to_contact
       └── Sets contact.lead_status = 'Completed'
```

---

## Migration Notes

### Legacy: contact_submissions
The original `contact_submissions` table is still used by:
- `events.submission_id` (FK to contact_submissions)
- Some notification/SMS code

The `contacts` table is the modern CRM-enriched version. Events now have `contact_id` which should be preferred over `submission_id`.

### Legacy: service_selections
The `service_selections` table was an earlier version of `quote_selections`. Both exist. `quote_selections` is the current standard and has proper invoice/contract links.

---

## Best Practices

1. **Always create via autoCreateQuoteInvoiceContract()**
   - Ensures quote, invoice, contract are linked

2. **Update contacts, not downstream tables**
   - Event details should be edited on contacts
   - Triggers will cascade changes

3. **Never edit signed contracts**
   - Triggers respect this - changes won't propagate to signed status

4. **Run consistency checks weekly**
   - `find_pricing_mismatches()`
   - `find_status_inconsistencies()`

5. **Link events to contacts**
   - Always set `contact_id` on events
   - Run `backfill_event_contact_links()` for legacy data

