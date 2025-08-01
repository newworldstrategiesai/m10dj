-- Direct SQL Migration: Contact Submissions to Contacts Table
-- Run this in Supabase SQL Editor
-- Replace 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' with your actual admin user ID if different

-- First, let's see what we're working with
-- SELECT COUNT(*) as total_submissions FROM contact_submissions;
-- SELECT COUNT(*) as existing_contacts FROM contacts WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- Migration Script
INSERT INTO public.contacts (
    -- Core Identity
    user_id,
    
    -- Personal Information  
    first_name,
    last_name,
    phone,
    email_address,
    
    -- Event Information
    event_type,
    event_date,
    venue_name,
    
    -- Lead Management
    lead_status,
    lead_source,
    lead_stage,
    lead_temperature,
    lead_quality,
    lead_score,
    
    -- Communication & Follow-up
    communication_preference,
    last_contacted_date,
    
    -- Music & Entertainment
    special_requests,
    
    -- Business Tracking
    assigned_to,
    priority_level,
    
    -- Additional Info
    notes,
    tags,
    
    -- Timestamps
    created_at,
    updated_at
)
SELECT 
    -- Core Identity
    'aa23eed5-de23-4b28-bc5d-26e72077e7a8'::uuid as user_id,
    
    -- Personal Information (parse name)
    CASE 
        WHEN position(' ' in trim(cs.name)) > 0 
        THEN trim(substring(cs.name from 1 for position(' ' in trim(cs.name)) - 1))
        ELSE trim(cs.name)
    END as first_name,
    
    CASE 
        WHEN position(' ' in trim(cs.name)) > 0 
        THEN trim(substring(cs.name from position(' ' in trim(cs.name)) + 1))
        ELSE ''
    END as last_name,
    
    cs.phone,
    cs.email as email_address,
    
    -- Event Information (standardize event types)
    CASE 
        WHEN lower(cs.event_type) LIKE '%wedding%' THEN 'wedding'
        WHEN lower(cs.event_type) LIKE '%corporate%' THEN 'corporate'  
        WHEN lower(cs.event_type) LIKE '%school%' OR lower(cs.event_type) LIKE '%dance%' THEN 'school_dance'
        WHEN lower(cs.event_type) LIKE '%holiday%' OR lower(cs.event_type) LIKE '%christmas%' THEN 'holiday_party'
        WHEN lower(cs.event_type) LIKE '%private%' OR lower(cs.event_type) LIKE '%birthday%' THEN 'private_party'
        ELSE 'other'
    END as event_type,
    
    cs.event_date,
    cs.location as venue_name,
    
    -- Lead Management (map statuses)
    CASE 
        WHEN lower(cs.status) = 'new' THEN 'New'
        WHEN lower(cs.status) = 'contacted' THEN 'Contacted'
        WHEN lower(cs.status) = 'quoted' THEN 'Proposal Sent'
        WHEN lower(cs.status) = 'booked' THEN 'Booked'
        WHEN lower(cs.status) = 'completed' THEN 'Completed'
        WHEN lower(cs.status) = 'cancelled' THEN 'Lost'
        ELSE 'New'
    END as lead_status,
    
    'Website' as lead_source,
    'Initial Inquiry' as lead_stage,
    
    -- Lead temperature based on age
    CASE 
        WHEN cs.created_at > (NOW() - INTERVAL '7 days') THEN 'Hot'
        WHEN cs.created_at > (NOW() - INTERVAL '30 days') THEN 'Warm'
        ELSE 'Cold'
    END as lead_temperature,
    
    'Medium' as lead_quality,
    50 as lead_score,
    
    -- Communication
    CASE 
        WHEN cs.phone IS NOT NULL AND cs.phone != '' THEN 'any'
        ELSE 'email'
    END as communication_preference,
    
    cs.last_contact_date,
    
    -- Music & Entertainment
    cs.message as special_requests,
    
    -- Business Tracking
    'aa23eed5-de23-4b28-bc5d-26e72077e7a8'::uuid as assigned_to,
    'Medium' as priority_level,
    
    -- Additional Info
    cs.notes,
    ARRAY[
        COALESCE(cs.event_type, 'unknown'), 
        'migrated_from_submissions'
    ] as tags,
    
    -- Timestamps
    cs.created_at,
    cs.updated_at

FROM contact_submissions cs
WHERE cs.id NOT IN (
    -- Avoid duplicates: skip if email or phone already exists in contacts
    SELECT DISTINCT cs2.id 
    FROM contact_submissions cs2
    WHERE EXISTS (
        SELECT 1 FROM contacts c 
        WHERE c.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
        AND (
            (c.email_address IS NOT NULL AND lower(c.email_address) = lower(cs2.email))
            OR 
            (c.phone IS NOT NULL AND cs2.phone IS NOT NULL AND 
             regexp_replace(c.phone, '[^0-9]', '', 'g') = regexp_replace(cs2.phone, '[^0-9]', '', 'g'))
        )
    )
)
ORDER BY cs.created_at ASC;

-- Check results
SELECT 
    'Migration completed!' as message,
    COUNT(*) as total_contacts_now 
FROM contacts 
WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- Show sample of migrated data
SELECT 
    first_name,
    last_name, 
    email_address,
    event_type,
    lead_status,
    created_at
FROM contacts 
WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
AND 'migrated_from_submissions' = ANY(tags)
ORDER BY created_at DESC 
LIMIT 10;