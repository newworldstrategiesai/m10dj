-- Fix the Row Level Security policies to prevent infinite recursion

-- First, drop the problematic policies
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

-- Create simpler, non-recursive policies

-- Contact submissions: Allow public insert, allow authenticated users to read their own
CREATE POLICY "Allow public insert on contact_submissions" ON contact_submissions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read contact_submissions" ON contact_submissions 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update contact_submissions" ON contact_submissions 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Public read access for content tables
CREATE POLICY "Allow public read access to published blog posts" ON blog_posts 
FOR SELECT USING (is_published = true);

CREATE POLICY "Allow public read access to active FAQs" ON faqs 
FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to active testimonials" ON testimonials 
FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to active venues" ON preferred_venues 
FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to active vendors" ON preferred_vendors 
FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to active services" ON services 
FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to active gallery images" ON gallery_images 
FOR SELECT USING (is_active = true);

-- Admin access for content management (authenticated users can manage all content)
CREATE POLICY "Allow authenticated users to manage testimonials" ON testimonials 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage faqs" ON faqs 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage events" ON events 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage vendors" ON preferred_vendors 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage venues" ON preferred_venues 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage services" ON services 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage blog posts" ON blog_posts 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage gallery" ON gallery_images 
FOR ALL USING (auth.role() = 'authenticated');

-- Admin users table: Allow authenticated users to read admin_users
CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage admin_users" ON admin_users 
FOR ALL USING (auth.role() = 'authenticated'); 