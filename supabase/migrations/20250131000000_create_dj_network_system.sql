-- DJ Dash Network System
-- This migration creates tables for managing DJ network and lead distribution

-- Create dj_network_profiles table
-- This stores DJ profiles that appear in the directory and can receive leads
CREATE TABLE IF NOT EXISTS public.dj_network_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Profile Information
    business_name TEXT NOT NULL,
    dj_name TEXT, -- Individual DJ name if different from business
    bio TEXT,
    years_experience INTEGER,
    
    -- Service Areas (cities/states where DJ operates)
    service_cities TEXT[], -- Array of cities: ['Memphis', 'Nashville', 'Atlanta']
    service_states TEXT[], -- Array of states: ['TN', 'MS', 'AR']
    service_radius_miles INTEGER DEFAULT 50, -- Max distance willing to travel
    
    -- Event Types
    event_types TEXT[], -- ['wedding', 'corporate', 'birthday', 'school_dance', etc.]
    specialties TEXT[], -- ['wedding', 'corporate', 'latin', 'hip-hop', etc.]
    
    -- Pricing
    starting_price DECIMAL(10,2),
    price_range TEXT, -- '$500-$1,000', '$1,000-$2,500', etc.
    
    -- Contact Information (public)
    public_email TEXT,
    public_phone TEXT,
    website_url TEXT,
    
    -- Social Media
    social_media JSONB, -- {facebook: '', instagram: '', twitter: '', etc.}
    
    -- Portfolio
    portfolio_images TEXT[], -- Array of image URLs
    video_urls TEXT[], -- Array of video URLs
    testimonials JSONB, -- Array of testimonials
    
    -- Ratings & Reviews
    average_rating DECIMAL(3,2) DEFAULT 0, -- 0.00 to 5.00
    total_reviews INTEGER DEFAULT 0,
    total_events_completed INTEGER DEFAULT 0,
    
    -- Directory Settings
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified by platform admin
    featured_until TIMESTAMP WITH TIME ZONE, -- Featured listing expiration
    
    -- Lead Preferences
    accepts_leads BOOLEAN DEFAULT TRUE,
    lead_types_accepted TEXT[], -- ['wedding', 'corporate', 'all']
    max_leads_per_month INTEGER, -- Limit on leads received
    current_month_leads INTEGER DEFAULT 0,
    lead_response_time_hours INTEGER DEFAULT 24, -- Expected response time
    
    -- Subscription/Plan
    subscription_tier TEXT DEFAULT 'free', -- 'free', 'basic', 'pro', 'premium'
    subscription_status TEXT DEFAULT 'active', -- 'active', 'paused', 'cancelled'
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Lead Distribution Settings
    auto_accept_leads BOOLEAN DEFAULT FALSE, -- Auto-accept matching leads
    lead_notification_email BOOLEAN DEFAULT TRUE,
    lead_notification_sms BOOLEAN DEFAULT FALSE,
    
    -- Performance Metrics
    leads_received_total INTEGER DEFAULT 0,
    leads_contacted INTEGER DEFAULT 0,
    leads_booked INTEGER DEFAULT 0,
    booking_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    average_response_time_hours DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_lead_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
    CONSTRAINT valid_booking_rate CHECK (booking_rate >= 0 AND booking_rate <= 100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS dj_network_profiles_user_id_idx ON public.dj_network_profiles(user_id);
CREATE INDEX IF NOT EXISTS dj_network_profiles_organization_id_idx ON public.dj_network_profiles(organization_id);
CREATE INDEX IF NOT EXISTS dj_network_profiles_service_cities_idx ON public.dj_network_profiles USING gin(service_cities);
CREATE INDEX IF NOT EXISTS dj_network_profiles_service_states_idx ON public.dj_network_profiles USING gin(service_states);
CREATE INDEX IF NOT EXISTS dj_network_profiles_event_types_idx ON public.dj_network_profiles USING gin(event_types);
CREATE INDEX IF NOT EXISTS dj_network_profiles_is_active_idx ON public.dj_network_profiles(is_active);
CREATE INDEX IF NOT EXISTS dj_network_profiles_is_verified_idx ON public.dj_network_profiles(is_verified);
CREATE INDEX IF NOT EXISTS dj_network_profiles_accepts_leads_idx ON public.dj_network_profiles(accepts_leads);
CREATE INDEX IF NOT EXISTS dj_network_profiles_subscription_tier_idx ON public.dj_network_profiles(subscription_tier);

-- Create lead_distributions table
-- Tracks which leads have been distributed to which DJs
CREATE TABLE IF NOT EXISTS public.lead_distributions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    dj_profile_id uuid REFERENCES dj_network_profiles(id) ON DELETE CASCADE,
    
    -- Distribution Details
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    distribution_method TEXT DEFAULT 'auto', -- 'auto', 'manual', 'round_robin', 'best_match'
    distribution_priority INTEGER DEFAULT 0, -- Higher = more priority
    
    -- DJ Response
    dj_viewed_at TIMESTAMP WITH TIME ZONE,
    dj_contacted_at TIMESTAMP WITH TIME ZONE,
    dj_declined_at TIMESTAMP WITH TIME ZONE,
    dj_decline_reason TEXT,
    dj_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Outcome
    outcome TEXT, -- 'contacted', 'declined', 'booked', 'lost', 'no_response'
    outcome_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead distributions
CREATE INDEX IF NOT EXISTS lead_distributions_contact_id_idx ON public.lead_distributions(contact_id);
CREATE INDEX IF NOT EXISTS lead_distributions_dj_profile_id_idx ON public.lead_distributions(dj_profile_id);
CREATE INDEX IF NOT EXISTS lead_distributions_distributed_at_idx ON public.lead_distributions(distributed_at);
CREATE INDEX IF NOT EXISTS lead_distributions_outcome_idx ON public.lead_distributions(outcome);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_dj_network_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dj_network_profiles_updated_at_trigger
    BEFORE UPDATE ON public.dj_network_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_dj_network_profiles_updated_at();

CREATE TRIGGER update_lead_distributions_updated_at_trigger
    BEFORE UPDATE ON public.lead_distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_dj_network_profiles_updated_at();

-- Create view for active DJs by city
CREATE OR REPLACE VIEW public.active_djs_by_city AS
SELECT 
    dnp.id,
    dnp.user_id,
    dnp.organization_id,
    dnp.business_name,
    dnp.dj_name,
    dnp.average_rating,
    dnp.total_reviews,
    dnp.starting_price,
    dnp.is_featured,
    dnp.is_verified,
    unnest(dnp.service_cities) as city,
    unnest(dnp.service_states) as state
FROM public.dj_network_profiles dnp
WHERE dnp.is_active = TRUE 
    AND dnp.accepts_leads = TRUE
    AND (dnp.subscription_expires_at IS NULL OR dnp.subscription_expires_at > NOW());

-- Enable Row Level Security
ALTER TABLE public.dj_network_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dj_network_profiles
-- DJs can view and update their own profile
CREATE POLICY "DJs can manage their own profile" ON public.dj_network_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Public can view active profiles (for directory)
CREATE POLICY "Public can view active DJ profiles" ON public.dj_network_profiles
    FOR SELECT USING (is_active = TRUE);

-- Platform admins can manage all profiles
CREATE POLICY "Platform admins can manage all profiles" ON public.dj_network_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for lead_distributions
-- DJs can view their own lead distributions
CREATE POLICY "DJs can view their lead distributions" ON public.lead_distributions
    FOR SELECT USING (
        dj_profile_id IN (
            SELECT id FROM dj_network_profiles WHERE user_id = auth.uid()
        )
    );

-- Platform admins can view all distributions
CREATE POLICY "Platform admins can view all distributions" ON public.lead_distributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add helpful comments
COMMENT ON TABLE public.dj_network_profiles IS 'DJ profiles for directory listing and lead distribution';
COMMENT ON TABLE public.lead_distributions IS 'Tracks which leads have been distributed to which DJs';
COMMENT ON COLUMN public.dj_network_profiles.service_cities IS 'Array of cities where DJ provides service';
COMMENT ON COLUMN public.dj_network_profiles.service_states IS 'Array of states where DJ provides service';
COMMENT ON COLUMN public.dj_network_profiles.event_types IS 'Array of event types DJ handles';
COMMENT ON COLUMN public.lead_distributions.distribution_method IS 'How the lead was distributed: auto, manual, round_robin, best_match';

