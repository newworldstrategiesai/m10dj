-- Fix Orion Hill and Southern Grace addresses
-- Run this in Supabase SQL Editor to update existing records

-- Update Orion Hill to correct address
UPDATE preferred_venues 
SET address = '12055 West Donelson Rd', 
    venue_type = 'banquet_hall', 
    venue_name = 'Orion Hill',
    website = 'https://www.orionhillevents.com'
WHERE (venue_name ILIKE '%Orion Hill%' OR venue_name ILIKE '%Orion%') 
  AND city = 'Arlington' 
  AND state = 'TN';

-- Update Southern Grace Weddings & Events to correct address  
UPDATE preferred_venues 
SET address = '8545 Collierville Arlington Rd',
    venue_type = 'banquet_hall',
    website = 'https://www.weddingsatsoutherngrace.com'
WHERE venue_name = 'Southern Grace Weddings & Events' 
  AND city = 'Arlington' 
  AND state = 'TN';

-- Verify the updates
SELECT venue_name, address, city, state, zip_code, venue_type 
FROM preferred_venues 
WHERE (venue_name ILIKE '%Orion%' OR venue_name ILIKE '%Southern Grace%')
  AND city = 'Arlington'
ORDER BY venue_name;

