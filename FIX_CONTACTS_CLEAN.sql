-- =====================================================
-- CLEAN FIX FOR CONTACTS RLS POLICIES
-- Run this script in the Supabase SQL Editor
-- =====================================================

-- Step 1: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contacts;

-- Step 2: Create admin policy using email-based authentication
CREATE POLICY "Admin users can manage all contacts" ON public.contacts
    FOR ALL USING (
        auth.email() IN (
            'admin@m10djcompany.com',
            'manager@m10djcompany.com', 
            'djbenmurray@gmail.com'
        )
    );

-- Step 3: Allow public contact form submissions
CREATE POLICY "Allow public contact form submissions" ON public.contacts
    FOR INSERT WITH CHECK (true);

-- Step 4: Assign all unassigned contacts to the admin user
UPDATE public.contacts 
SET user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'djbenmurray@gmail.com'
    LIMIT 1
)
WHERE user_id IS NULL AND deleted_at IS NULL;

-- Step 5: Show results
SELECT 
    'Contacts assigned to admin:' as result,
    COUNT(*) as contacts_updated
FROM public.contacts 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'djbenmurray@gmail.com'
    LIMIT 1
) AND deleted_at IS NULL;

-- Step 6: Show current policies
SELECT 
    'Current RLS policies:' as result,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'contacts';

SELECT 'Setup completed successfully!' as final_result;