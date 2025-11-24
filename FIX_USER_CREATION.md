# Fix for Database User Creation Failure

## Problem
The database is failing to save new users. This is likely caused by the organization creation trigger failing and blocking user creation.

## Solution
Run the fix migration: `20250123000006_fix_organization_trigger.sql`

## What the Fix Does

1. **Error Handling**: Wraps the organization creation in a try-catch block so errors don't prevent user creation
2. **Unique Constraint**: Adds a unique constraint on `owner_id` to prevent duplicate organizations
3. **Better Slug Generation**: Improves slug uniqueness checking with retry logic
4. **Graceful Degradation**: If organization creation fails, user creation still succeeds

## Steps to Fix

1. **Run the migration in Supabase SQL Editor**:
   ```sql
   -- Copy and paste the contents of:
   -- supabase/migrations/20250123000006_fix_organization_trigger.sql
   ```

2. **Verify the fix**:
   ```sql
   -- Check if trigger exists
   SELECT trigger_name, event_manipulation, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created_organization';
   
   -- Check if unique constraint exists
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'organizations'::regclass 
   AND conname = 'organizations_owner_id_key';
   ```

3. **Test user creation**:
   - Try signing up a new user
   - Verify user is created in `auth.users`
   - Verify organization is created in `organizations` table
   - Check for any warnings in Supabase logs

## Alternative: Disable Trigger Temporarily

If you need to allow user creation immediately while fixing the trigger:

```sql
-- Temporarily disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created_organization;

-- Create organizations manually for existing users
-- Then re-enable after fixing:
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created_organization;
```

## Common Issues

1. **RLS Policies**: The trigger uses `SECURITY DEFINER` to bypass RLS, but if there are table-level constraints, they still apply
2. **Slug Conflicts**: The fix includes better slug uniqueness checking
3. **Race Conditions**: The fix checks if organization exists before creating

## Verification

After running the fix, test:
- [ ] New user signup works
- [ ] Organization is auto-created
- [ ] No errors in Supabase logs
- [ ] User can access onboarding page

