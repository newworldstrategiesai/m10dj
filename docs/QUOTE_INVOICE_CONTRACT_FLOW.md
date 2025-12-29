# Quote, Invoice & Contract Flow

## Overview

This document explains the client-facing quote flow for M10 DJ Company bookings. The system allows clients to select services, sign contracts, and make payments **without requiring login**.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT SUBMITS CONTACT FORM                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CONTACT CREATED                                │
│  (contact_submissions → contacts table)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
        │ quote_        │  │   invoices    │  │   contracts   │
        │ selections    │──│   (Draft)     │──│   (Draft)     │
        │ (Pending)     │  │               │  │               │
        └───────────────┘  └───────────────┘  └───────────────┘
               │                   │                   │
               └───────────────────┼───────────────────┘
                                   │
                    All linked via foreign keys:
                    - quote_selections.invoice_id → invoices.id
                    - quote_selections.contract_id → contracts.id
                    - contracts.quote_selection_id → quote_selections.id
```

## Client Quote Pages

All accessible at `/quote/[contactId]/...`

| Page | URL | Purpose |
|------|-----|---------|
| Service Selection | `/quote/[id]` | Select package & add-ons |
| Invoice | `/quote/[id]/invoice` | View pricing breakdown |
| Contract | `/quote/[id]/contract` | View & sign contract |
| Payment | `/quote/[id]/payment` | Make deposit or full payment |
| Receipt | `/quote/[id]/receipt` | View payment receipt |
| Confirmation | `/quote/[id]/confirmation` | Booking confirmation |
| Questionnaire | `/quote/[id]/questionnaire` | Music preferences form |
| My Songs | `/quote/[id]/my-songs` | View/manage song list |

## Database Tables

### `quote_selections` (Source of Truth for Pricing)

```sql
- lead_id (contact ID)
- package_id, package_name, package_price
- addons (JSONB array)
- total_price
- status: 'pending' | 'confirmed' | 'invoiced' | 'paid' | 'cancelled'
- payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
- invoice_id → invoices.id
- contract_id → contracts.id
- signature, signed_at
```

### `invoices` (Formal Accounting Records)

```sql
- contact_id, project_id
- invoice_number (INV-YYYYMM-XXX)
- invoice_status: 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Partial' | 'Overdue'
- line_items (JSONB - synced from quote_selections)
- subtotal, tax, discount, total_amount
- amount_paid, balance_due
```

### `contracts` (Service Agreements)

```sql
- contact_id
- quote_selection_id → quote_selections.id
- invoice_id → invoices.id
- contract_number (CONT-YYYYMMDD-XXX)
- status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed'
- signed_at, signed_by_client
- client_signature_data (base64)
```

### `payments` (Transaction Records)

```sql
- contact_id
- invoice_id → invoices.id
- payment_status: 'Paid' | 'Pending' | 'Overdue' | 'Refunded'
- total_amount, net_amount
- payment_method
```

## Sync Triggers

The system automatically keeps data in sync:

### 1. Quote → Invoice Sync
When `quote_selections` changes:
- Updates `invoices.line_items` with package & add-ons
- Updates `invoices.total_amount`
- Updates `invoices.invoice_status`

### 2. Invoice → Quote Sync (Payments)
When `invoices.amount_paid` changes:
- Updates `quote_selections.payment_status`

### 3. Quote → Contract Sync (Pricing)
When `quote_selections.total_price` changes:
- Updates `contracts.total_amount`
- Updates `contracts.deposit_amount` (50%)
- Only updates draft/sent/viewed contracts (not signed ones)

### 4. Contract → Quote Sync (Signing)
When contract is signed:
- Updates `quote_selections.status` to 'confirmed'
- Stores signature data

## Duplicate Prevention

The system prevents duplicate contracts via:
1. Check if `quote_selections.contract_id` already exists
2. Check if contact already has an active contract
3. Only create new if neither exists

Use `get_or_create_contract_for_quote(quote_id, contact_id)` to safely get/create contracts.

## Typical Client Journey

```
1. Client fills contact form
   └─→ Contact created
   └─→ Auto-creates: quote_selections + invoices + contracts (all Draft)

2. Client receives quote link email
   └─→ Visits /quote/[id]
   └─→ Selects package & add-ons
   └─→ quote_selections updated
   └─→ Invoice synced automatically

3. Client views invoice
   └─→ Visits /quote/[id]/invoice
   └─→ Reviews pricing

4. Client signs contract
   └─→ Visits /quote/[id]/contract
   └─→ Signs electronically
   └─→ contracts.status = 'signed'
   └─→ quote_selections.status = 'confirmed'

5. Client makes payment
   └─→ Visits /quote/[id]/payment
   └─→ Pays deposit or full amount
   └─→ payments record created
   └─→ invoices.amount_paid updated
   └─→ quote_selections.payment_status synced

6. Client receives receipt
   └─→ Visits /quote/[id]/receipt
   └─→ Views confirmation

7. Client fills questionnaire
   └─→ Visits /quote/[id]/questionnaire
   └─→ Submits music preferences
```

## Admin Dashboard

Admins can view and manage records:

- `/admin/contacts/[id]` - Full contact details with Pipeline view
- `/admin/invoices` - All invoices dashboard
- `/admin/contracts` - Contract management
- `/admin/financial` - Payment/revenue reports

## Helper Functions

### Manual Sync
If data gets out of sync:

```sql
-- Sync a single quote to its invoice
SELECT sync_quote_selection_to_invoice('quote-uuid-here');

-- Sync all quotes to invoices
SELECT * FROM sync_all_quotes_to_invoices();

-- Sync a single quote to its contract
SELECT sync_quote_selection_to_contract('quote-uuid-here');

-- Sync all quotes to contracts
SELECT * FROM sync_all_quotes_to_contracts();

-- Get or create a contract for a quote (prevents duplicates)
SELECT get_or_create_contract_for_quote('quote-uuid', 'contact-uuid');
```

## Key Principles

1. **`quote_selections` is the source of truth** for pricing
2. **`invoices` is for formal accounting** (synced from quote_selections)
3. **`contracts` links to both** quote_selections and invoices
4. **No login required** for clients - uses secure links with contact ID
5. **All changes sync automatically** via database triggers

