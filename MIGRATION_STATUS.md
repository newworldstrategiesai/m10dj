# Migration Status Checklist

## ✅ Core Tables Created
- [x] `organizations` table exists
- [x] `crowd_requests` table exists

## 📋 Migration Checklist

Run these migrations in order:

### 1. Organizations Table ✅
- [x] `20250123000000_create_organizations_table.sql`
  - Status: **COMPLETE** (table exists)

### 2. Add organization_id to crowd_requests ✅
- [x] `20250123000001_add_organization_id_to_crowd_requests.sql`
  - Status: **COMPLETE** (table exists, migration should be run)

### 3. Add organization_id to contacts
- [ ] `20250123000002_add_organization_id_to_contacts.sql`
  - **Action**: Run this migration
  - **Note**: Will backfill existing contacts with default organization

### 4. Add organization_id to admin_settings
- [ ] `20250123000003_add_organization_id_to_admin_settings.sql`
  - **Action**: Run this migration
  - **Note**: Updated to drop correct policy names

### 5. Auto-create organization on signup
- [ ] `20250123000004_auto_create_organization_on_signup.sql`
  - **Action**: Run this migration
  - **Note**: Creates trigger to auto-create organizations for new users

### 6. Add organization_id to events
- [ ] `20250123000005_add_organization_id_to_events.sql`
  - **Action**: Run this migration
  - **Note**: Will backfill existing events with default organization

## 🔍 Verify Migration Success

After running each migration, verify:

```sql
-- Check if organization_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'crowd_requests' 
AND column_name = 'organization_id';

-- Check if policies exist
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'crowd_requests' 
AND schemaname = 'public';
```

## ⚠️ Important Notes

1. **Default Organization**: The migrations will create a default organization called "M10 DJ Company" with slug "m10dj" for existing data
2. **Backfilling**: Existing records will be assigned to the default organization
3. **RLS Policies**: All policies have been updated to filter by organization
4. **Public Requests**: Anonymous requests can still be created, but organization_id should be set in the application layer

## 🚀 Next Steps After Migrations

1. Test signup flow - should auto-create organization
2. Test request submission - should link to organization
3. Test admin dashboard - should only show organization's data
4. Verify data isolation between organizations

