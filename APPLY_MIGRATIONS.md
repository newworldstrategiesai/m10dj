# Apply Database Migrations

## Issue
The `crowd_requests` table is missing the following columns:
- `is_next` (BOOLEAN)
- `next_fee` (INTEGER)
- `payment_code` (VARCHAR)

This is causing a 500 error when submitting requests.

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/APPLY_CROWD_REQUESTS_UPDATES.sql`
4. Click **Run**
5. Verify the migration succeeded by checking the output

### Option 2: Use Supabase CLI (If you have it set up)

```bash
# If you have Supabase CLI linked to your project
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

### Option 3: Run Individual Migrations

If you prefer to run them separately, run these in order:

1. `supabase/migrations/20250121000003_add_next_option_to_crowd_requests.sql`
2. `supabase/migrations/20250121000004_add_payment_code_to_crowd_requests.sql`

## Verification

After running the migration, verify the columns exist:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'crowd_requests' 
    AND table_schema = 'public'
    AND column_name IN ('is_next', 'next_fee', 'payment_code')
ORDER BY column_name;
```

You should see:
- `is_next` (boolean)
- `next_fee` (integer)
- `payment_code` (character varying)

## Test

After applying the migration, test the form submission again at:
- http://localhost:3002/requests

The 500 error should be resolved.

