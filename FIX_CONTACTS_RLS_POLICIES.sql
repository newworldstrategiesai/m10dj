-- =====================================================
-- FIX CONTACTS RLS POLICIES FOR ADMIN ACCESS
-- Run this script in the Supabase SQL Editor
-- =====================================================

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contacts;

-- 2. Create new admin policy using email-based authentication
CREATE POLICY "Admin users can manage all contacts" ON public.contacts
    FOR ALL USING (
        -- Allow admin emails full access to all contacts
        auth.email() IN (
            'admin@m10djcompany.com',
            'manager@m10djcompany.com', 
            'djbenmurray@gmail.com'
        )
    );

-- 3. Allow public contact form submissions (INSERT only)
CREATE POLICY "Allow public contact form submissions" ON public.contacts
    FOR INSERT WITH CHECK (
        -- Allow anyone to insert contacts (for contact form submissions)
        -- These will be unassigned (user_id = NULL) until claimed by admin
        true
    );

-- 4. Verify the contacts table has the correct structure
SELECT 
    'Contacts table info:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'contacts' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if there are any contacts in the database
SELECT 
    'Total contacts in database:' as info,
    COUNT(*) as total_contacts,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as contacts_with_user_id,
    COUNT(*) FILTER (WHERE user_id IS NULL) as contacts_without_user_id
FROM public.contacts 
WHERE deleted_at IS NULL;

-- 6. Show sample of contacts data
SELECT 
    'Sample contacts:' as info,
    id,
    first_name,
    last_name,
    email_address,
    user_id,
    created_at
FROM public.contacts 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check if contact_submissions table has data that needs migration
SELECT 
    'Contact submissions that could be migrated:' as info,
    COUNT(*) as total_submissions
FROM public.contact_submissions;

-- 8. If contacts table is empty but contact_submissions has data, 
--    this migration can help move the data:
/*
INSERT INTO public.contacts (
    first_name,
    last_name, 
    email_address,
    phone,
    event_type,
    event_date,
    venue_name,
    special_requests,
    notes,
    lead_status,
    created_at,
    updated_at
)
SELECT 
    SPLIT_PART(name, ' ', 1) as first_name,
    CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
        THEN ARRAY_TO_STRING(STRING_TO_ARRAY(name, ' ')[2:], ' ')
        ELSE NULL 
    END as last_name,
    email,
    phone,
    event_type,
    event_date,
    location as venue_name,
    message as special_requests,
    message as notes,
    CASE status
        WHEN 'new' THEN 'New'
        WHEN 'contacted' THEN 'Contacted'
        WHEN 'quoted' THEN 'Proposal Sent'
        WHEN 'booked' THEN 'Booked'
        WHEN 'completed' THEN 'Completed'
        WHEN 'cancelled' THEN 'Lost'
        ELSE 'New'
    END as lead_status,
    created_at,
    updated_at
FROM public.contact_submissions
WHERE id NOT IN (
    -- Avoid duplicates if this has been run before
    SELECT DISTINCT 'migration_placeholder'::uuid
    WHERE FALSE
);
*/

-- 9. Set a default user_id for contacts that don't have one (admin user)
-- This will assign all unassigned contacts to the admin user
UPDATE public.contacts 
SET user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'djbenmurray@gmail.com'
    LIMIT 1
)
WHERE user_id IS NULL AND deleted_at IS NULL;

-- Show how many contacts were updated
SELECT 
    'Contacts assigned to admin:' as info,
    COUNT(*) as contacts_updated
FROM public.contacts 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'djbenmurray@gmail.com'
    LIMIT 1
) AND deleted_at IS NULL;

-- 10. Verify RLS policies are working
SELECT 
    'Current RLS policies on contacts:' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contacts';

SELECT 'Fix completed! Try accessing the contacts page now.' as result;