-- Create contact_submissions table
CREATE TABLE contact_submissions (
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
CREATE TABLE testimonials (
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
CREATE TABLE faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table (for tracking booked events)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_submission_id UUID REFERENCES contact_submissions(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  event_duration INTEGER, -- in hours
  number_of_guests INTEGER,
  special_requests TEXT,
  contract_value DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT FALSE,
  final_payment_paid BOOLEAN DEFAULT FALSE,
  equipment_needed TEXT[],
  music_preferences TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'setup', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preferred_vendors table
CREATE TABLE preferred_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT DEFAULT 'Memphis',
  state TEXT DEFAULT 'TN',
  zip_code TEXT,
  business_type TEXT NOT NULL CHECK (business_type IN ('photographer', 'videographer', 'caterer', 'florist', 'planner', 'baker', 'decorator', 'transportation', 'other')),
  description TEXT,
  specialties TEXT[],
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  years_worked_together INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  logo_url TEXT,
  gallery_images TEXT[],
  social_media JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preferred_venues table
CREATE TABLE preferred_venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Memphis',
  state TEXT DEFAULT 'TN',
  zip_code TEXT,
  venue_type TEXT NOT NULL CHECK (venue_type IN ('wedding', 'corporate', 'banquet_hall', 'outdoor', 'historic', 'hotel', 'restaurant', 'country_club', 'other')),
  description TEXT,
  capacity_min INTEGER,
  capacity_max INTEGER,
  indoor_outdoor TEXT CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
  parking_available BOOLEAN DEFAULT TRUE,
  wheelchair_accessible BOOLEAN DEFAULT TRUE,
  alcohol_allowed BOOLEAN DEFAULT TRUE,
  catering_options TEXT CHECK (catering_options IN ('in_house', 'preferred_vendors', 'any_caterer', 'no_catering')),
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  events_hosted INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  main_image_url TEXT,
  gallery_images TEXT[],
  amenities TEXT[],
  social_media JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table (detailed service offerings)
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('dj', 'lighting', 'sound', 'mc', 'additional')),
  short_description TEXT,
  full_description TEXT,
  base_price DECIMAL(10,2),
  price_unit TEXT DEFAULT 'event',
  duration_hours INTEGER,
  equipment_included TEXT[],
  setup_time_minutes INTEGER DEFAULT 60,
  is_addon BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table (for SEO content)
CREATE TABLE blog_posts (
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
CREATE TABLE gallery_images (
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

-- Create indexes for better performance
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_event_type ON contact_submissions(event_type);

CREATE INDEX idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX idx_testimonials_is_active ON testimonials(is_active);

CREATE INDEX idx_faqs_display_order ON faqs(display_order);
CREATE INDEX idx_faqs_is_active ON faqs(is_active);

CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

CREATE INDEX idx_preferred_vendors_business_type ON preferred_vendors(business_type);
CREATE INDEX idx_preferred_vendors_city ON preferred_vendors(city);
CREATE INDEX idx_preferred_vendors_is_active ON preferred_vendors(is_active);
CREATE INDEX idx_preferred_vendors_is_featured ON preferred_vendors(is_featured);

CREATE INDEX idx_preferred_venues_venue_type ON preferred_venues(venue_type);
CREATE INDEX idx_preferred_venues_city ON preferred_venues(city);
CREATE INDEX idx_preferred_venues_is_active ON preferred_venues(is_active);
CREATE INDEX idx_preferred_venues_is_featured ON preferred_venues(is_featured);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_display_order ON services(display_order);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

CREATE INDEX idx_gallery_images_event_type ON gallery_images(event_type);
CREATE INDEX idx_gallery_images_is_active ON gallery_images(is_active);
CREATE INDEX idx_gallery_images_is_featured ON gallery_images(is_featured);

-- Row Level Security (RLS) policies
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert contact submissions
CREATE POLICY "Allow anonymous contact submissions" ON contact_submissions
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to read active content
CREATE POLICY "Allow public read of active testimonials" ON testimonials
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow public read of active FAQs" ON faqs
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow public read of active vendors" ON preferred_vendors
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow public read of active venues" ON preferred_venues
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow public read of active services" ON services
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow public read of published blog posts" ON blog_posts
  FOR SELECT TO anon USING (is_published = true);

CREATE POLICY "Allow public read of active gallery images" ON gallery_images
  FOR SELECT TO anon USING (is_active = true);

-- Admin policies (you'll need to set up authentication for these)
-- CREATE POLICY "Allow authenticated users to manage all tables" ON contact_submissions
--   FOR ALL TO authenticated USING (true);

-- Insert sample data

-- Insert some sample FAQs
INSERT INTO faqs (question, answer, display_order, is_active) VALUES
('How far in advance should I book your DJ services?', 
 'We recommend booking at least 6-8 weeks in advance for most events, especially during peak wedding season (May-October). However, we understand that sometimes events come up last minute, so feel free to contact us regardless of your timeline.', 
 1, true),

('What areas do you serve around Memphis?', 
 'We proudly serve Memphis and all surrounding areas including Midtown, Downtown, Arlington, Bartlett, Germantown, Collierville, and beyond. We''re happy to travel to your venue location throughout the Greater Memphis area.', 
 2, true),

('Do you take song requests during events?', 
 'Absolutely! We encourage song requests and will work with you before the event to create a must-play list and do-not-play list. During the event, we''re happy to take requests from you and your guests while keeping the dance floor packed.', 
 3, true),

('What equipment do you provide?', 
 'We provide professional-grade sound systems, wireless microphones, DJ booth setup, and lighting effects. Our equipment is regularly maintained and we always bring backup systems to ensure your event goes smoothly.', 
 4, true),

('How do you handle music for different age groups?', 
 'We''re experienced in reading the crowd and playing music that appeals to all age groups. We''ll discuss your guest demographics during planning and create a playlist that keeps everyone entertained, from the youngest to the oldest attendees.', 
 5, true),

('What''s included in your wedding DJ packages?', 
 'Our wedding packages include ceremony music, cocktail hour playlist, reception DJ services, wireless microphones for speeches, dance floor lighting, and a final consultation to plan your special day timeline and music preferences.', 
 6, true),

('Do you offer MC services?', 
 'Yes! Our DJs are experienced MCs who can handle announcements, introductions, and help keep your event timeline on track. We''ll work with you to understand the flow of your event and ensure smooth transitions throughout.', 
 7, true),

('What happens if there''s a technical problem during my event?', 
 'We always bring backup equipment and have contingency plans in place. Our DJs are experienced in troubleshooting any technical issues quickly and discreetly to ensure your event continues without interruption.', 
 8, true);

-- Insert some sample testimonials
INSERT INTO testimonials (client_name, event_type, location, rating, testimonial_text, event_date, is_featured, is_active) VALUES
('Sarah & Michael Johnson', 'Wedding Reception', 'Germantown, TN', 5, 
 'M10 DJ Company made our wedding absolutely perfect! They played exactly what we wanted and kept everyone dancing all night long. Professional, responsive, and truly cared about making our day special.', 
 '2024-01-15', true, true),

('Jennifer Martinez', 'Corporate Holiday Party', 'Downtown Memphis', 5, 
 'We hired M10 for our company''s annual holiday party and they exceeded all expectations. The music selection was perfect for our diverse group, and they handled all the announcements professionally.', 
 '2023-12-10', true, true),

('David Thompson', '50th Birthday Party', 'Midtown Memphis', 5, 
 'From start to finish, M10 DJ Company was fantastic. They helped us plan the perfect playlist that had guests from all generations dancing. Highly recommend for any celebration!', 
 '2024-02-20', true, true),

('Lisa & James Wilson', 'Wedding Reception', 'Collierville, TN', 5, 
 'Our wedding wouldn''t have been the same without M10 DJ Company. They were so easy to work with, took all our requests, and created the perfect atmosphere. Dance floor was packed all night!', 
 '2023-11-05', true, true),

('Memphis High School', 'Homecoming Dance', 'Arlington, TN', 5, 
 'M10 DJ Company knows how to work with teenagers! They played all the current hits while keeping everything appropriate. The students had an amazing time and we''ll definitely book them again.', 
 '2023-10-28', true, true),

('Rachel & Chris Adams', 'Anniversary Party', 'Bartlett, TN', 5, 
 'For our 25th anniversary party, M10 DJ Company created the perfect mix of our favorite songs from over the years. They even surprised us with our wedding song at the perfect moment. Truly magical!', 
 '2024-03-12', true, true);

-- Insert sample preferred vendors
INSERT INTO preferred_vendors (business_name, contact_name, phone, email, website, address, city, business_type, description, specialties, price_range, years_worked_together, is_featured, is_active) VALUES
('Memphis Wedding Photography', 'Sarah Chen', '(901) 555-0101', 'sarah@memphisweddingphoto.com', 'https://memphisweddingphoto.com', '123 Union Ave', 'Memphis', 'photographer', 'Award-winning wedding photographers capturing your special moments with artistic flair and professional excellence.', ARRAY['weddings', 'engagements', 'bridal_portraits'], '$$$', 5, true, true),

('Bloom & Blossom Florists', 'Maria Rodriguez', '(901) 555-0102', 'maria@bloomandblossom.com', 'https://bloomandblossom.com', '456 Madison Ave', 'Memphis', 'florist', 'Creating stunning floral arrangements for weddings and events throughout the Memphis area.', ARRAY['bridal_bouquets', 'centerpieces', 'ceremony_decor'], '$$', 3, true, true),

('Elegant Events Catering', 'James Wilson', '(901) 555-0103', 'james@elegantevents.com', 'https://elegantevents.com', '789 Poplar Ave', 'Memphis', 'caterer', 'Full-service catering with a focus on Southern cuisine and elegant presentation.', ARRAY['southern_cuisine', 'buffet_style', 'plated_dinners'], '$$', 7, true, true),

('Perfect Moments Planning', 'Jennifer Davis', '(901) 555-0104', 'jen@perfectmoments.com', 'https://perfectmoments.com', '321 Beale St', 'Memphis', 'planner', 'Professional wedding and event planning services to make your day stress-free and perfect.', ARRAY['full_planning', 'day_coordination', 'destination_weddings'], '$$$', 4, true, true),

('Sweet Dreams Bakery', 'Amanda Foster', '(901) 555-0105', 'amanda@sweetdreamsbakery.com', 'https://sweetdreamsbakery.com', '654 Cooper St', 'Memphis', 'baker', 'Custom wedding cakes and desserts made fresh with the finest ingredients.', ARRAY['wedding_cakes', 'cupcakes', 'dessert_tables'], '$$', 6, false, true),

('Lights Camera Action Video', 'Michael Thompson', '(901) 555-0106', 'mike@lcavideo.com', 'https://lcavideo.com', '987 Central Ave', 'Memphis', 'videographer', 'Cinematic wedding videography that tells your love story beautifully.', ARRAY['wedding_films', 'highlight_reels', 'drone_footage'], '$$$', 3, false, true);

-- Insert sample preferred venues
INSERT INTO preferred_venues (venue_name, contact_name, phone, email, website, address, city, venue_type, description, capacity_min, capacity_max, indoor_outdoor, parking_available, wheelchair_accessible, alcohol_allowed, catering_options, price_range, events_hosted, is_featured, is_active, amenities) VALUES
('The Peabody Memphis', 'Event Coordinator', '(901) 529-4000', 'events@peabodymemphis.com', 'https://peabodymemphis.com', '149 Union Ave', 'Memphis', 'hotel', 'Historic luxury hotel in downtown Memphis with elegant ballrooms and rooftop spaces.', 50, 400, 'indoor', true, true, true, 'in_house', '$$$$', 25, true, true, ARRAY['valet_parking', 'bridal_suite', 'av_equipment', 'catering_kitchen']),

('Dixon Gallery and Gardens', 'Events Manager', '(901) 761-5250', 'events@dixon.org', 'https://dixon.org', '4339 Park Ave', 'Memphis', 'historic', 'Beautiful historic mansion with stunning gardens, perfect for elegant weddings and receptions.', 100, 250, 'both', true, true, true, 'preferred_vendors', '$$$', 18, true, true, ARRAY['gardens', 'historic_mansion', 'parking', 'photo_opportunities']),

('Elmwood Cemetery', 'Special Events', '(901) 774-3212', 'events@elmwoodcemetery.org', 'https://elmwoodcemetery.org', '824 S Dudley St', 'Memphis', 'historic', 'Historic cemetery with beautiful chapel and unique outdoor spaces for memorable events.', 75, 200, 'both', true, false, true, 'any_caterer', '$$', 12, false, true, ARRAY['historic_chapel', 'gardens', 'unique_setting']),

('The Columns', 'Venue Coordinator', '(901) 861-6666', 'events@thecolumns.com', 'https://thecolumns.com', '615 S Colony Rd', 'Memphis', 'banquet_hall', 'Elegant banquet facility with multiple room options and full-service event coordination.', 40, 300, 'indoor', true, true, true, 'in_house', '$$$', 35, true, true, ARRAY['multiple_rooms', 'dance_floor', 'stage', 'full_bar']),

('Shelby Farms Park', 'Event Services', '(901) 222-7275', 'events@shelbyfarmspark.org', 'https://shelbyfarmspark.org', '500 Pine Lake Dr', 'Memphis', 'outdoor', 'Beautiful outdoor park setting with pavilions and lake views for nature-loving couples.', 50, 500, 'outdoor', true, true, false, 'any_caterer', '$$', 22, false, true, ARRAY['lake_views', 'pavilions', 'natural_setting', 'photography_spots']),

('Memphis Hunt and Polo Club', 'Events Director', '(901) 767-0782', 'events@memphishuntpolo.com', 'https://memphishuntpolo.com', '3224 Walnut Grove Rd', 'Memphis', 'country_club', 'Exclusive country club with elegant dining rooms and beautiful grounds.', 75, 180, 'indoor', true, true, true, 'in_house', '$$$$', 28, true, true, ARRAY['golf_course_views', 'elegant_dining', 'full_service', 'valet_parking']);

-- Insert sample services
INSERT INTO services (service_name, category, short_description, full_description, base_price, duration_hours, equipment_included, is_featured, is_active, display_order) VALUES
('Wedding DJ Package', 'dj', 'Complete wedding entertainment from ceremony to reception', 'Our comprehensive wedding package includes ceremony music, cocktail hour playlist, reception DJ services with MC announcements, wireless microphones for speeches, and coordination with your wedding timeline. We provide all necessary sound equipment and lighting to create the perfect atmosphere for your special day.', 895.00, 8, ARRAY['sound_system', 'wireless_mics', 'dance_lighting', 'ceremony_speakers'], true, true, 1),

('Corporate Event DJ', 'dj', 'Professional entertainment for business functions', 'Sophisticated background music and entertainment for corporate events, holiday parties, product launches, and business celebrations. Includes professional MC services for presentations and announcements.', 695.00, 6, ARRAY['sound_system', 'wireless_mics', 'presentation_support'], true, true, 2),

('Birthday Party DJ', 'dj', 'Fun entertainment for birthday celebrations', 'Age-appropriate music and entertainment for birthday parties of all ages. From kids parties with interactive games to adult celebrations with dance music.', 495.00, 4, ARRAY['sound_system', 'party_lighting', 'microphone'], true, true, 3),

('Uplighting Package', 'lighting', 'Transform your venue with colorful accent lighting', 'Professional LED uplighting in your choice of colors to transform any venue. Includes setup, color coordination, and remote control operation throughout your event.', 295.00, 8, ARRAY['led_uplights', 'wireless_control', 'color_options'], false, true, 4),

('Premium Sound System', 'sound', 'Enhanced audio for larger venues', 'Upgraded sound system for venues over 150 guests or outdoor events. Includes additional speakers, subwoofers, and extended coverage area.', 195.00, 8, ARRAY['additional_speakers', 'subwoofers', 'extended_range'], false, true, 5),

('Ceremony Sound', 'sound', 'Dedicated audio system for wedding ceremonies', 'Separate sound system for your wedding ceremony including processional music, microphones for officiants, and clear audio for vows and readings.', 145.00, 2, ARRAY['ceremony_speakers', 'wireless_mics', 'music_playback'], false, true, 6);

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, is_published, is_featured, seo_title, seo_description, published_at) VALUES
('Top 10 Wedding Venues in Memphis', 'top-wedding-venues-memphis', 'Discover the most beautiful wedding venues in Memphis, from historic mansions to modern ballrooms.', 'Memphis offers incredible wedding venues for every style and budget. From the historic elegance of The Peabody to the natural beauty of Dixon Gallery and Gardens, here are our top picks for Memphis wedding venues...', 'venue_spotlight', ARRAY['weddings', 'venues', 'memphis'], true, true, 'Best Wedding Venues in Memphis TN | M10 DJ Company', 'Discover the top 10 wedding venues in Memphis, TN. Expert recommendations from M10 DJ Company with photos, pricing, and booking tips.', '2024-01-15 10:00:00-06'),

('How to Choose the Perfect Wedding DJ', 'choose-perfect-wedding-dj', 'Essential tips for finding the right DJ to make your wedding celebration unforgettable.', 'Your wedding DJ plays a crucial role in creating the perfect atmosphere for your special day. Here''s everything you need to know about choosing the right DJ for your wedding...', 'wedding_tips', ARRAY['weddings', 'dj_tips', 'planning'], true, false, 'How to Choose a Wedding DJ in Memphis | Expert Tips', 'Learn how to choose the perfect wedding DJ with expert tips from M10 DJ Company. Get the best entertainment for your Memphis wedding.', '2024-01-10 09:00:00-06'),

('Memphis Corporate Event Venues That Impress', 'memphis-corporate-event-venues', 'Professional venues perfect for corporate events, meetings, and business celebrations in Memphis.', 'Planning a corporate event in Memphis? These venues offer the perfect blend of professionalism and Southern hospitality for your business functions...', 'venue_spotlight', ARRAY['corporate', 'venues', 'business'], true, false, 'Best Corporate Event Venues in Memphis TN', 'Find the perfect corporate event venue in Memphis. Professional spaces for meetings, parties, and business celebrations.', '2024-01-05 08:00:00-06');

-- Insert sample gallery images
INSERT INTO gallery_images (title, description, image_url, event_type, venue_name, is_featured, is_active, display_order) VALUES
('Elegant Wedding Reception', 'Beautiful wedding reception at The Peabody Memphis', '/images/gallery/wedding-peabody-1.jpg', 'Wedding', 'The Peabody Memphis', true, true, 1),
('Corporate Holiday Party', 'Festive corporate celebration in downtown Memphis', '/images/gallery/corporate-downtown-1.jpg', 'Corporate Event', 'Downtown Memphis Venue', true, true, 2),
('Birthday Celebration', 'Fun 50th birthday party with dancing', '/images/gallery/birthday-party-1.jpg', 'Birthday Party', 'Private Residence', false, true, 3),
('Garden Wedding Ceremony', 'Romantic outdoor ceremony at Dixon Gallery', '/images/gallery/ceremony-dixon-1.jpg', 'Wedding', 'Dixon Gallery and Gardens', true, true, 4),
('Dance Floor Action', 'Guests dancing the night away', '/images/gallery/dancing-1.jpg', 'Wedding', 'The Columns', false, true, 5),
('Anniversary Party', 'Intimate anniversary celebration', '/images/gallery/anniversary-1.jpg', 'Anniversary', 'Private Venue', false, true, 6); 