-- Create contacts table optimized for DJ business
CREATE TABLE IF NOT EXISTS public.contacts (
    -- Core Identity
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone TEXT,
    email_address TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'United States',
    
    -- Event Information (DJ-specific)
    event_type VARCHAR(50), -- 'wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other'
    event_date DATE,
    event_time TIME,
    venue_name TEXT,
    venue_address TEXT,
    guest_count INTEGER,
    event_duration_hours DECIMAL(3,1), -- e.g., 4.5 hours
    
    -- Budget and Pricing
    budget_range VARCHAR(50), -- '$1,000-$2,500', '$2,500-$5,000', '$5,000+', etc.
    quoted_price DECIMAL(10,2),
    final_price DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
    
    -- Lead Management
    lead_status VARCHAR(50) DEFAULT 'New', -- 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost', 'Completed'
    lead_source VARCHAR(100), -- 'Website', 'Referral', 'Social Media', 'Wedding Show', 'Google', etc.
    lead_stage VARCHAR(50), -- 'Initial Inquiry', 'Consultation Scheduled', 'Quote Provided', 'Contract Signed'
    lead_temperature VARCHAR(10), -- 'Hot', 'Warm', 'Cold'
    lead_quality VARCHAR(20), -- 'High', 'Medium', 'Low'
    lead_score INTEGER DEFAULT 0,
    
    -- Communication & Follow-up
    communication_preference VARCHAR(20) DEFAULT 'email', -- 'email', 'phone', 'text', 'any'
    opt_in_status BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    last_contacted_date TIMESTAMP WITH TIME ZONE,
    last_contact_type VARCHAR(20), -- 'email', 'phone', 'text', 'in_person', 'social'
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    
    -- Music & Entertainment Preferences
    music_genres TEXT[], -- Array of preferred genres
    special_requests TEXT,
    equipment_needs TEXT[], -- Array: 'microphone', 'uplighting', 'photo_booth', etc.
    playlist_provided BOOLEAN DEFAULT FALSE,
    do_not_play_list TEXT, -- Songs/artists they don't want
    first_dance_song TEXT,
    special_moments TEXT, -- Father-daughter dance, cake cutting, etc.
    
    -- Referral & Marketing
    referral_source VARCHAR(100), -- Name of person who referred them
    referral_contact TEXT, -- Contact info of referrer
    campaign_source VARCHAR(100),
    how_heard_about_us TEXT,
    social_media_handles JSONB, -- {facebook: '', instagram: '', etc}
    
    -- Business Tracking
    assigned_to uuid REFERENCES auth.users(id), -- Which DJ is handling this lead
    priority_level VARCHAR(10) DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    deal_probability INTEGER, -- 0-100 percentage
    expected_close_date DATE,
    
    -- Proposal & Contract
    proposal_sent_date TIMESTAMP WITH TIME ZONE,
    proposal_value DECIMAL(10,2),
    contract_signed_date TIMESTAMP WITH TIME ZONE,
    contract_url TEXT, -- Link to signed contract
    
    -- Communication Metrics
    messages_sent_count INTEGER DEFAULT 0,
    messages_received_count INTEGER DEFAULT 0,
    emails_sent_count INTEGER DEFAULT 0,
    calls_made_count INTEGER DEFAULT 0,
    meetings_held INTEGER DEFAULT 0,
    
    -- Additional Info
    notes TEXT,
    internal_notes TEXT, -- Private notes not visible to client
    tags TEXT[], -- Flexible tagging system
    custom_fields JSONB, -- For any additional custom data
    
    -- Competitor Analysis
    competitors_considered TEXT[], -- Other DJs they're considering
    why_chose_us TEXT,
    why_lost_deal TEXT,
    
    -- Post-Event
    event_feedback TEXT,
    event_rating INTEGER CHECK (event_rating >= 1 AND event_rating <= 5),
    testimonial_provided BOOLEAN DEFAULT FALSE,
    testimonial_text TEXT,
    photos_provided BOOLEAN DEFAULT FALSE,
    review_requested BOOLEAN DEFAULT FALSE,
    review_left BOOLEAN DEFAULT FALSE,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Search
    search_vector tsvector
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON public.contacts(email_address);
CREATE INDEX IF NOT EXISTS contacts_event_date_idx ON public.contacts(event_date);
CREATE INDEX IF NOT EXISTS contacts_lead_status_idx ON public.contacts(lead_status);
CREATE INDEX IF NOT EXISTS contacts_event_type_idx ON public.contacts(event_type);
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON public.contacts(created_at);
CREATE INDEX IF NOT EXISTS contacts_next_follow_up_idx ON public.contacts(next_follow_up_date);
CREATE INDEX IF NOT EXISTS contacts_search_vector_idx ON public.contacts USING gin(search_vector);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at_trigger
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Create a trigger to update search vector
CREATE OR REPLACE FUNCTION update_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email_address, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.venue_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.event_type, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.lead_source, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_search_vector();

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own contacts" ON public.contacts
    FOR ALL USING (auth.uid() = user_id);

-- Create policy for admin users (if needed)
CREATE POLICY "Admin users can manage all contacts" ON public.contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add some useful views
CREATE OR REPLACE VIEW public.contacts_summary AS
SELECT 
    user_id,
    COUNT(*) as total_contacts,
    COUNT(*) FILTER (WHERE lead_status = 'New') as new_leads,
    COUNT(*) FILTER (WHERE lead_status = 'Booked') as booked_events,
    COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE) as upcoming_events,
    COUNT(*) FILTER (WHERE next_follow_up_date <= CURRENT_DATE + INTERVAL '7 days') as follow_ups_due,
    AVG(lead_score) as avg_lead_score,
    SUM(final_price) FILTER (WHERE lead_status = 'Booked') as total_booked_value
FROM public.contacts 
WHERE deleted_at IS NULL
GROUP BY user_id;

-- Create a view for hot leads
CREATE OR REPLACE VIEW public.hot_leads AS
SELECT *
FROM public.contacts
WHERE 
    deleted_at IS NULL
    AND lead_temperature = 'Hot'
    AND lead_status NOT IN ('Booked', 'Lost', 'Completed')
ORDER BY created_at DESC;

-- Add helpful comments
COMMENT ON TABLE public.contacts IS 'DJ business contacts and leads management';
COMMENT ON COLUMN public.contacts.event_type IS 'Type of event: wedding, corporate, school_dance, holiday_party, private_party, other';
COMMENT ON COLUMN public.contacts.lead_status IS 'Current status in the sales pipeline';
COMMENT ON COLUMN public.contacts.music_genres IS 'Array of preferred music genres';
COMMENT ON COLUMN public.contacts.equipment_needs IS 'Array of requested equipment/services';
COMMENT ON COLUMN public.contacts.search_vector IS 'Full-text search vector for fast searching';