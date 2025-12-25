# 🎫 Ticket System SQL Migration

## Migration File Location

The complete migration is located at:
```
supabase/migrations/20251225000000_create_event_tickets.sql
```

## Running the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Apply the migration
supabase migration up

# Or apply all pending migrations
supabase db push
```

### Option 2: Direct SQL Execution

1. Copy the contents of `supabase/migrations/20251225000000_create_event_tickets.sql`
2. Run it in your Supabase SQL Editor
3. Or execute via psql:
```bash
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/20251225000000_create_event_tickets.sql
```

## What the Migration Creates

### 1. **event_tickets Table**

Complete table schema with all fields needed for:
- Ticket sales (online and door sales)
- QR code tracking
- Payment processing (Stripe integration)
- Check-in management
- Refund tracking

#### Key Fields:
- `id` - UUID primary key
- `event_id` - Event identifier (TEXT to support custom IDs)
- `ticket_type` - Type of ticket (general_admission, early_bird, etc.)
- `purchaser_name`, `purchaser_email`, `purchaser_phone` - Customer info
- `quantity` - Number of tickets
- `price_per_ticket`, `total_amount` - Pricing
- `stripe_session_id`, `stripe_payment_intent_id` - Stripe integration
- `payment_status` - Status: pending, paid, failed, refunded, cash, card_at_door
- `payment_method` - Method: stripe, cash, card_at_door
- `qr_code`, `qr_code_short` - QR code identifiers
- `checked_in`, `checked_in_at`, `checked_in_by` - Check-in tracking
- `notes` - Additional notes (refunds, special instructions)
- `created_at`, `updated_at` - Timestamps

### 2. **Indexes**

Performance indexes on:
- `event_id` - Fast event-based queries
- `qr_code` - Fast QR code lookups
- `qr_code_short` - Fast short code lookups
- `payment_status` - Filter by payment status
- `checked_in` - Filter checked-in tickets
- `purchaser_email` - Search by email
- `purchaser_name` - Name-based search
- `created_at` - Date range filtering

### 3. **Triggers**

- Auto-update `updated_at` timestamp on record changes

### 4. **Row Level Security (RLS)**

Policies configured for:
- **Service Role**: Full access (for API operations)
- **Authenticated Users**: Read access (for admin dashboard)
- **Public**: Read access (for ticket validation pages)

## Verification

After running the migration, verify it worked:

```sql
-- Check table exists
SELECT * FROM event_tickets LIMIT 1;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'event_tickets';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_tickets';
```

## Requirements

### Database Requirements
- PostgreSQL 12+ (Supabase uses PostgreSQL 15)
- UUID extension (usually enabled by default in Supabase)
- `gen_random_uuid()` function available

### Environment Variables Needed

The application code expects these environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key (for online payments)
```

## Next Steps After Migration

1. ✅ **Verify table creation** (see verification queries above)
2. ✅ **Test ticket creation** via door sales interface
3. ✅ **Test QR code generation** - should work automatically
4. ✅ **Test check-in** via door interface
5. ✅ **Configure Stripe** webhooks if using online payments

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- WARNING: This will delete all ticket data!
DROP TABLE IF EXISTS event_tickets CASCADE;
DROP FUNCTION IF EXISTS update_event_tickets_updated_at() CASCADE;
```

## Migration Status

- ✅ Table creation
- ✅ Indexes
- ✅ Triggers
- ✅ RLS policies
- ✅ Grants
- ✅ Comments/documentation

**Status:** Ready to deploy

---

**Last Updated:** December 25, 2024

