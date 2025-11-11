-- Fix admin RLS policy to allow admin emails
-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admin users can manage all contacts" ON public.contacts;

-- Create new policy that allows both role-based and email-based admin access
CREATE POLICY "Admin users can manage all contacts" ON public.contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE users.id = auth.uid()
            AND (
                users.raw_user_meta_data->>'role' = 'admin'
                OR users.email IN ('admin@m10djcompany.com', 'manager@m10djcompany.com', 'djbenmurray@gmail.com')
            )
        )
    );
