# TipJar.live Launch - SQL Migrations Checklist

**Date**: January 2025  
**Status**: ✅ **Critical Migrations Identified**

---

## ✅ Required SQL Migrations for Launch

### 1. Ensure `white_label` Tier is Supported (Already Applied)

**Migration**: `supabase/migrations/20250125000001_add_white_label_branding.sql`

**What it does**:
- Updates `subscription_tier` CHECK constraint to include `'white_label'`
- Adds white-label branding fields (logo, colors, etc.)

**Status**: ✅ Already exists in migrations folder

**SQL**:
```sql
-- Update subscription_tier check constraint to include 'white_label'
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_subscription_tier_check 
CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'white_label'));
```

---

### 2. Organizations Table (Already Applied)

**Migration**: `supabase/migrations/20250123000000_create_organizations_table.sql`

**What it does**:
- Creates `organizations` table with subscription fields
- Sets up RLS policies
- Creates indexes

**Status**: ✅ Already exists in migrations folder

---

## 🔍 Verification Steps

### Check if Migrations are Applied

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check if white_label is in subscription_tier constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'organizations'::regclass
  AND conname = 'organizations_subscription_tier_check';

-- Should include 'white_label' in the CHECK clause

-- 2. Check if organizations table exists with correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('subscription_tier', 'subscription_status', 'stripe_customer_id', 'stripe_subscription_id', 'trial_ends_at')
ORDER BY column_name;

-- Should show all subscription-related columns

-- 3. Check if organizations table has subscription_tier constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'organizations'::regclass
  AND contype = 'c'
  AND conname LIKE '%subscription_tier%';
```

---

## ⚠️ If Migrations Haven't Been Applied

If the migrations haven't been applied to your Supabase database, you need to:

1. **Apply the migrations via Supabase Dashboard**:
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration files in order (by timestamp)

2. **Or use Supabase CLI**:
   ```bash
   supabase db push
   ```

---

## 📋 Migration Files to Apply (in order)

1. `supabase/migrations/20250123000000_create_organizations_table.sql`
   - Creates organizations table
   - Sets up subscription fields

2. `supabase/migrations/20250125000001_add_white_label_branding.sql`
   - Adds white_label to subscription_tier constraint
   - Adds branding fields

3. (Other migrations may have already been applied)

---

## ✅ Pre-Launch Checklist

- [ ] Verify `organizations` table exists
- [ ] Verify `subscription_tier` CHECK constraint includes `'white_label'`
- [ ] Verify `subscription_status` CHECK constraint includes all statuses
- [ ] Verify `stripe_customer_id` and `stripe_subscription_id` columns exist
- [ ] Verify `trial_ends_at` column exists
- [ ] Test creating a new organization
- [ ] Test subscription tier updates

---

**Status**: ✅ **Migrations Already Exist** - Just need to verify they're applied to your database!

