-- COMPLETE POLICY FIX - Drop ALL existing policies and recreate them properly

-- Drop ALL existing policies on all tables
DROP POLICY IF EXISTS "Allow public insert on contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow public read access to published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow public read access to active FAQs" ON faqs;
DROP POLICY IF EXISTS "Allow public read access to active testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow public read access to active venues" ON preferred_venues;
DROP POLICY IF EXISTS "Allow public read access to active vendors" ON preferred_vendors;
DROP POLICY IF EXISTS "Allow public read access to active services" ON services;
DROP POLICY IF EXISTS "Allow public read access to active gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Allow admin full access to all tables" ON contact_submissions;
DROP POLICY IF EXISTS "Allow admin full access to testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow admin full access to faqs" ON faqs;
DROP POLICY IF EXISTS "Allow admin full access to events" ON events;
DROP POLICY IF EXISTS "Allow admin full access to preferred_vendors" ON preferred_vendors;
DROP POLICY IF EXISTS "Allow admin full access to preferred_venues" ON preferred_venues;
DROP POLICY IF EXISTS "Allow admin full access to services" ON services;
DROP POLICY IF EXISTS "Allow admin full access to blog_posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admin full access to gallery_images" ON gallery_images;
DROP POLICY IF EXISTS "Allow admin full access to admin_users" ON admin_users;

-- Drop any other existing policies that might exist
DROP POLICY IF EXISTS "Allow authenticated users to read contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated users to update contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated users to manage testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow authenticated users to manage faqs" ON faqs;
DROP POLICY IF EXISTS "Allow authenticated users to manage events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to manage vendors" ON preferred_vendors;
DROP POLICY IF EXISTS "Allow authenticated users to manage venues" ON preferred_venues;
DROP POLICY IF EXISTS "Allow authenticated users to manage services" ON services;
DROP POLICY IF EXISTS "Allow authenticated users to manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage gallery" ON gallery_images;
DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated users to manage admin_users" ON admin_users;

-- Temporarily disable RLS to avoid issues during policy recreation
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

-- Create NEW simple, non-recursive policies

-- 1. CONTACT SUBMISSIONS
-- Allow anyone to insert (for contact form)
CREATE POLICY "contact_public_insert" ON contact_submissions 
FOR INSERT WITH CHECK (true);

-- Allow any authenticated user to read/update (for admin)
CREATE POLICY "contact_auth_select" ON contact_submissions 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "contact_auth_update" ON contact_submissions 
FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. PUBLIC CONTENT (readable by everyone)
CREATE POLICY "blog_public_read" ON blog_posts 
FOR SELECT USING (is_published = true);

CREATE POLICY "faq_public_read" ON faqs 
FOR SELECT USING (is_active = true);

CREATE POLICY "testimonial_public_read" ON testimonials 
FOR SELECT USING (is_active = true);

CREATE POLICY "venue_public_read" ON preferred_venues 
FOR SELECT USING (is_active = true);

CREATE POLICY "vendor_public_read" ON preferred_vendors 
FOR SELECT USING (is_active = true);

CREATE POLICY "service_public_read" ON services 
FOR SELECT USING (is_active = true);

CREATE POLICY "gallery_public_read" ON gallery_images 
FOR SELECT USING (is_active = true);

-- 3. ADMIN CONTENT MANAGEMENT (authenticated users can manage everything)
CREATE POLICY "testimonial_auth_manage" ON testimonials 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "faq_auth_manage" ON faqs 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "event_auth_manage" ON events 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "vendor_auth_manage" ON preferred_vendors 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "venue_auth_manage" ON preferred_venues 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "service_auth_manage" ON services 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "blog_auth_manage" ON blog_posts 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "gallery_auth_manage" ON gallery_images 
FOR ALL USING (auth.role() = 'authenticated');

-- 4. ADMIN USERS (simple access for authenticated users)
CREATE POLICY "admin_users_auth_read" ON admin_users 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_users_auth_manage" ON admin_users 
FOR ALL USING (auth.role() = 'authenticated'); 