# Storage Setup Instructions for White-Label Branding

## ⚠️ Important

Storage policies **cannot** be created via migrations due to PostgreSQL permission requirements. They must be set up manually.

## Method 1: Via Supabase Dashboard (Recommended - Easiest)

### Step 1: Create the Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `organization-assets`
   - **Public bucket**: ✅ **Yes** (required for public logo/favicon access)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/*`
4. Click **"Create bucket"**

### Step 2: Create Storage Policies via Dashboard UI

1. Go to **Storage** → **organization-assets** → **Policies** tab
2. Click **"New Policy"** for each policy below:

#### Policy 1: Upload (INSERT)
- **Policy name**: `Users can upload to their organization folder`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'organization-assets' AND
 (storage.foldername(name))[1] = 'organizations' AND
 (storage.foldername(name))[2] = (
   SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
 ))
```

#### Policy 2: Update
- **Policy name**: `Users can update their organization assets`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'organization-assets' AND
 (storage.foldername(name))[1] = 'organizations' AND
 (storage.foldername(name))[2] = (
   SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
 ))
```

#### Policy 3: Delete
- **Policy name**: `Users can delete their organization assets`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'organization-assets' AND
 (storage.foldername(name))[1] = 'organizations' AND
 (storage.foldername(name))[2] = (
   SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
 ))
```

#### Policy 4: Public Read (SELECT)
- **Policy name**: `Public can read organization assets`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'organization-assets'
```

#### Policy 5: List (SELECT for authenticated)
- **Policy name**: `Users can list their organization folder`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'organization-assets' AND
 (storage.foldername(name))[1] = 'organizations' AND
 (storage.foldername(name))[2] = (
   SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
 ))
```

## Method 2: Via SQL Editor (Alternative)

If you prefer SQL, you can run the policies via SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `supabase/migrations/20250125000003_storage_policies_manual.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **"Run"**

**Note**: The SQL Editor should automatically use service role permissions, but if you get permission errors, use Method 1 (Dashboard UI) instead.

## Verification

After setup, verify the policies:

1. Go to **Storage** → **organization-assets** → **Policies**
2. You should see 5 policies listed
3. Test by uploading a logo via the admin branding page (`/admin/branding`)

## Troubleshooting

### Error: "must be owner of relation objects"
- **Solution**: Use Method 1 (Dashboard UI) instead of SQL Editor
- Storage policies require special permissions that may not be available in SQL Editor

### Error: "bucket does not exist"
- **Solution**: Create the bucket first (Step 1 above)

### Upload fails with permission error
- **Solution**: Verify all 5 policies are created correctly
- Check that the bucket is set to **Public**
- Ensure your user has an organization in the database

## Need Help?

If you continue to have issues:
1. Use Method 1 (Dashboard UI) - it's the most reliable
2. Check that the `organizations` table exists and has data
3. Verify your user has an organization with `owner_id` matching your user ID

