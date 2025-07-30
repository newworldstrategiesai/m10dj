-- NUCLEAR POLICY RESET - Completely wipe and recreate ALL policies

-- First, let's see what policies currently exist (this will show in the output)
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Drop ALL policies on ALL tables (cast a wide net)
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Drop all policies on all public tables
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Disable RLS temporarily
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Clear any cached policy data
RESET ALL;

-- Re-enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create completely fresh policies with unique names

-- CONTACT SUBMISSIONS (most critical)
CREATE POLICY "cs_public_insert_v2" ON contact_submissions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "cs_auth_select_v2" ON contact_submissions 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cs_auth_update_v2" ON contact_submissions 
FOR UPDATE USING (auth.role() = 'authenticated');

-- PUBLIC CONTENT 
CREATE POLICY "blog_public_v2" ON blog_posts 
FOR SELECT USING (is_published = true);

CREATE POLICY "faq_public_v2" ON faqs 
FOR SELECT USING (is_active = true);

CREATE POLICY "testimonial_public_v2" ON testimonials 
FOR SELECT USING (is_active = true);

CREATE POLICY "venue_public_v2" ON preferred_venues 
FOR SELECT USING (is_active = true);

CREATE POLICY "vendor_public_v2" ON preferred_vendors 
FOR SELECT USING (is_active = true);

CREATE POLICY "service_public_v2" ON services 
FOR SELECT USING (is_active = true);

CREATE POLICY "gallery_public_v2" ON gallery_images 
FOR SELECT USING (is_active = true);

-- ADMIN MANAGEMENT
CREATE POLICY "testimonial_admin_v2" ON testimonials 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "faq_admin_v2" ON faqs 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "event_admin_v2" ON events 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "vendor_admin_v2" ON preferred_vendors 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "venue_admin_v2" ON preferred_venues 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "service_admin_v2" ON services 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "blog_admin_v2" ON blog_posts 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "gallery_admin_v2" ON gallery_images 
FOR ALL USING (auth.role() = 'authenticated');

-- ADMIN USERS
CREATE POLICY "admin_users_read_v2" ON admin_users 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_users_manage_v2" ON admin_users 
FOR ALL USING (auth.role() = 'authenticated');

-- Show final policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname; 