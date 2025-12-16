# Product Context Migration Guide

## Overview

This migration adds `product_context` to the `organizations` table to separate TipJar, DJ Dash, and M10 DJ Company customers at the database level.

## What This Migration Does

1. **Adds `product_context` column** to `organizations` table
   - Values: `'tipjar'`, `'djdash'`, or `'m10dj'` (default)
   - Constrained to only allow these three values

2. **Backfills existing organizations** with product context from their owner's user metadata
   - If owner has `product_context` in metadata → uses that
   - Otherwise defaults to `'m10dj'`

3. **Creates index** for faster filtering by product context

4. **Updates organization creation trigger** to automatically set `product_context` from user metadata

## Running the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd /Users/benmurray/m10dj

# Run the migration
supabase migration up
```

### Option 2: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `supabase/migrations/20250203000000_add_product_context_to_organizations.sql`
5. Paste and run the SQL

## Verification

After running the migration, verify it worked:

```sql
-- Check that the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name = 'product_context';

-- Check that existing organizations have product_context set
SELECT id, name, product_context, owner_id 
FROM organizations 
ORDER BY created_at DESC 
LIMIT 10;

-- Check distribution of product contexts
SELECT product_context, COUNT(*) 
FROM organizations 
GROUP BY product_context;
```

## How Product Context Works

### User-Level (Auth Metadata)
- Stored in `auth.users.raw_user_meta_data->>'product_context'`
- Set during signup via `supabase.auth.signUp()` options
- No migration needed - handled by Supabase Auth

### Organization-Level (Database)
- Stored in `organizations.product_context` column
- Automatically set from user's metadata when organization is created
- Can be queried and filtered for product-specific features

## Usage Examples

### Filter Organizations by Product

```sql
-- Get all TipJar organizations
SELECT * FROM organizations WHERE product_context = 'tipjar';

-- Get all DJ Dash organizations
SELECT * FROM organizations WHERE product_context = 'djdash';

-- Get all M10 DJ Company organizations
SELECT * FROM organizations WHERE product_context = 'm10dj';
```

### In Application Code

```typescript
// Filter organizations by product context
const { data: tipjarOrgs } = await supabase
  .from('organizations')
  .select('*')
  .eq('product_context', 'tipjar');

// Check user's product context
const { data: { user } } = await supabase.auth.getUser();
const productContext = user?.user_metadata?.product_context;

// Check organization's product context
const { data: org } = await supabase
  .from('organizations')
  .select('product_context')
  .eq('owner_id', user.id)
  .single();
```

## Product Context Values

- **`'tipjar'`**: TipJar.Live customers (song requests & tips)
- **`'djdash'`**: DJ Dash customers (future product)
- **`'m10dj'`**: M10 DJ Company customers (existing main product)

## Important Notes

1. **Existing Organizations**: All existing organizations will be backfilled with `'m10dj'` unless their owner has a different `product_context` in metadata

2. **New Organizations**: Automatically inherit `product_context` from the user's metadata when created

3. **Manual Updates**: You can manually update an organization's `product_context` if needed:
   ```sql
   UPDATE organizations 
   SET product_context = 'tipjar' 
   WHERE id = 'organization-uuid';
   ```

4. **User Metadata**: The user's `product_context` in metadata is the source of truth. Organization `product_context` is derived from it.

## Troubleshooting

### Migration Fails
- Check that the `organizations` table exists
- Verify you have permissions to alter tables
- Check Supabase logs for specific error messages

### Product Context Not Set
- Verify user has `product_context` in their metadata
- Check that the trigger function `handle_new_user_organization()` is working
- Manually update if needed (see above)

### Need to Update Existing Organizations
```sql
-- Update all organizations for users with tipjar product_context
UPDATE organizations o
SET product_context = 'tipjar'
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = o.owner_id
  AND u.raw_user_meta_data->>'product_context' = 'tipjar'
);
```

## Next Steps

After running this migration:

1. ✅ Verify migration ran successfully
2. ✅ Check that existing organizations have correct `product_context`
3. ✅ Test creating a new TipJar user and verify organization gets `product_context = 'tipjar'`
4. ✅ Update any queries that need to filter by product context
5. ✅ Consider adding RLS policies that filter by product context if needed

