# Database Migration Order

## ⚠️ IMPORTANT: Run migrations in this exact order

The migrations must be run in chronological order (by timestamp). Supabase will track which migrations have been run, but if you're running them manually, follow this order:

## Required Migration Order

### 1. First: Create the base tables (if not already created)
- `20250121000000_create_crowd_requests.sql` OR
- `20250121000000_create_crowd_requests_with_fast_track.sql`
  - **Purpose**: Creates the `crowd_requests` table
  - **Note**: Only run ONE of these (the `_with_fast_track` version includes additional columns)

### 2. Create organizations table
- `20250123000000_create_organizations_table.sql`
  - **Purpose**: Creates the `organizations` table for multi-tenancy
  - **Must run before**: Any migration that references `organizations`

### 3. Add organization_id to crowd_requests
- `20250123000001_add_organization_id_to_crowd_requests.sql`
  - **Purpose**: Adds `organization_id` column to `crowd_requests` table
  - **Requires**: Both `crowd_requests` and `organizations` tables to exist
  - **Will fail if**: Previous migrations haven't been run

### 4. Auto-create organization on signup
- `20250123000004_auto_create_organization_on_signup.sql`
  - **Purpose**: Creates a database trigger to auto-create organizations when users sign up
  - **Requires**: `organizations` table to exist

### 5. Add organization_id to events
- `20250123000005_add_organization_id_to_events.sql`
  - **Purpose**: Adds `organization_id` column to `events` table
  - **Requires**: Both `events` and `organizations` tables to exist

## Quick Check: Verify Tables Exist

Before running migrations, you can check if tables exist in Supabase SQL Editor:

```sql
-- Check if crowd_requests exists
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'crowd_requests'
);

-- Check if organizations exists
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'organizations'
);
```

## Troubleshooting

### Error: "relation 'crowd_requests' does not exist"
**Solution**: Run `20250121000000_create_crowd_requests.sql` first (or the `_with_fast_track` version)

### Error: "relation 'organizations' does not exist"
**Solution**: Run `20250123000000_create_organizations_table.sql` first

### Error: "foreign key constraint violation"
**Solution**: Make sure you've run the migrations in order, and that the referenced tables exist

## Running Migrations in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order (copy/paste the SQL)
3. Or use the Supabase CLI: `supabase migration up`

