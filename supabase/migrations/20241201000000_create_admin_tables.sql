-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT NOT NULL,
  event_date DATE,
  location TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonials table (for managing testimonials via admin)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  location TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  event_date DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create FAQ table (for managing FAQ content)
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table (for tracking booked events)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES contact_submissions(id),
  event_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  number_of_guests INTEGER,
  total_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT FALSE,
  final_payment_due DATE,
  final_payment_paid BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
  special_requests TEXT,
  equipment_needed TEXT[],
  playlist_notes TEXT,
  timeline_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preferred_vendors table
CREATE TABLE IF NOT EXISTS preferred_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  business_type TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'TN',
  zip_code TEXT,
  description TEXT,
  services_offered TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  partnership_level TEXT DEFAULT 'preferred' CHECK (partnership_level IN ('preferred', 'exclusive', 'recommended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preferred_venues table
CREATE TABLE IF NOT EXISTS preferred_venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_name TEXT NOT NULL,
  contact_name TEXT,
  venue_type TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'TN',
  zip_code TEXT,
  description TEXT,
  capacity_min INTEGER,
  capacity_max INTEGER,
  amenities TEXT[],
  pricing_notes TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  features TEXT[],
  base_price DECIMAL(10,2),
  price_notes TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table (for SEO content)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'M10 DJ Company',
  featured_image_url TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('wedding_tips', 'event_planning', 'music_trends', 'venue_spotlight', 'vendor_spotlight', 'general')),
  tags TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  event_type TEXT,
  venue_name TEXT,
  event_date DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table (for admin authentication)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'editor')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_event_type ON contact_submissions(event_type);

CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);

CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE INDEX IF NOT EXISTS idx_preferred_vendors_business_type ON preferred_vendors(business_type);
CREATE INDEX IF NOT EXISTS idx_preferred_vendors_city ON preferred_vendors(city);
CREATE INDEX IF NOT EXISTS idx_preferred_vendors_is_active ON preferred_vendors(is_active);

CREATE INDEX IF NOT EXISTS idx_preferred_venues_venue_type ON preferred_venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_preferred_venues_city ON preferred_venues(city);
CREATE INDEX IF NOT EXISTS idx_preferred_venues_is_active ON preferred_venues(is_active);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);

CREATE INDEX IF NOT EXISTS idx_gallery_images_event_type ON gallery_images(event_type);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_featured ON gallery_images(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_active ON gallery_images(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Enable Row Level Security (RLS)
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

-- Public access policies (for website visitors)
CREATE POLICY "Allow public read access to published blog posts" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Allow public read access to active FAQs" ON faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to active testimonials" ON testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to active venues" ON preferred_venues FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to active vendors" ON preferred_vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to active gallery images" ON gallery_images FOR SELECT USING (is_active = true);

-- Allow anyone to insert contact submissions (for the contact form)
CREATE POLICY "Allow public insert on contact_submissions" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Admin access policies (for authenticated admin users)
-- Note: You'll need to update these policies based on your auth setup
CREATE POLICY "Allow admin full access to all tables" ON contact_submissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to testimonials" ON testimonials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to faqs" ON faqs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to events" ON events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to preferred_vendors" ON preferred_vendors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to preferred_venues" ON preferred_venues FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to services" ON services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to blog_posts" ON blog_posts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to gallery_images" ON gallery_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Allow admin full access to admin_users" ON admin_users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true AND role = 'admin'
  )
);

-- Insert some sample data for testing
INSERT INTO faqs (question, answer, display_order) VALUES 
('How far in advance should I book your DJ services?', 'We recommend booking at least 3-6 months in advance, especially for wedding season (May-October). However, we often have availability for events with shorter notice.', 1),
('Do you provide your own sound equipment?', 'Yes! We provide professional-grade sound systems, microphones, and lighting equipment suitable for your venue size and event type.', 2),
('Can we request specific songs for our event?', 'Absolutely! We encourage you to share your must-play songs and do-not-play lists. We''ll work with you to create the perfect playlist for your celebration.', 3),
('Do you serve as the MC for events?', 'Yes, our DJs are experienced MCs who can handle announcements, introductions, and keep your event timeline running smoothly.', 4),
('What''s included in your wedding packages?', 'Our wedding packages include ceremony and reception music, sound system, wireless microphones, basic lighting, MC services, and online planning tools.', 5);

INSERT INTO testimonials (client_name, event_type, location, testimonial_text, event_date, is_featured) VALUES 
('Sarah & Michael Johnson', 'Wedding', 'The Peabody Hotel, Memphis', 'M10 DJ Company made our wedding absolutely perfect! They kept the dance floor packed all night and handled all our announcements flawlessly. Highly recommend!', '2023-09-15', true),
('Memphis Chamber of Commerce', 'Corporate Event', 'FedExForum, Memphis', 'Professional, punctual, and perfectly executed. M10 DJ Company provided excellent sound for our annual gala and kept the energy high throughout the evening.', '2023-11-03', true),
('Jennifer Williams', 'Birthday Party', 'Shelby Farms Park', 'They transformed my 40th birthday party into an unforgettable celebration. Great music mix and such friendly, professional service!', '2023-08-22', true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferred_vendors_updated_at BEFORE UPDATE ON preferred_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferred_venues_updated_at BEFORE UPDATE ON preferred_venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON gallery_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 