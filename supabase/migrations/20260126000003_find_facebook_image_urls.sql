-- Find Facebook CDN image URLs in the database
-- This query searches all common image URL fields for Facebook CDN URLs

-- Search organizations table for Facebook image URLs
SELECT 
  'organizations' as table_name,
  id,
  name as organization_name,
  slug,
  'requests_cover_photo_url' as field_name,
  requests_cover_photo_url as image_url
FROM organizations
WHERE requests_cover_photo_url LIKE '%fbcdn.net%'
   OR requests_cover_photo_url LIKE '%facebook.com%'

UNION ALL

SELECT 
  'organizations' as table_name,
  id,
  name as organization_name,
  slug,
  'requests_artist_photo_url' as field_name,
  requests_artist_photo_url as image_url
FROM organizations
WHERE requests_artist_photo_url LIKE '%fbcdn.net%'
   OR requests_artist_photo_url LIKE '%facebook.com%'

UNION ALL

SELECT 
  'organizations' as table_name,
  id,
  name as organization_name,
  slug,
  'requests_venue_photo_url' as field_name,
  requests_venue_photo_url as image_url
FROM organizations
WHERE requests_venue_photo_url LIKE '%fbcdn.net%'
   OR requests_venue_photo_url LIKE '%facebook.com%'

UNION ALL

SELECT 
  'organizations' as table_name,
  id,
  name as organization_name,
  slug,
  'artist_page_profile_image_url' as field_name,
  artist_page_profile_image_url as image_url
FROM organizations
WHERE artist_page_profile_image_url LIKE '%fbcdn.net%'
   OR artist_page_profile_image_url LIKE '%facebook.com%'

UNION ALL

SELECT 
  'organizations' as table_name,
  id,
  name as organization_name,
  slug,
  'artist_page_cover_image_url' as field_name,
  artist_page_cover_image_url as image_url
FROM organizations
WHERE artist_page_cover_image_url LIKE '%fbcdn.net%'
   OR artist_page_cover_image_url LIKE '%facebook.com%'

UNION ALL

-- Check gallery images array (need to unnest)
SELECT 
  'organizations' as table_name,
  o.id,
  o.name as organization_name,
  o.slug,
  'artist_page_gallery_images' as field_name,
  unnest(o.artist_page_gallery_images) as image_url
FROM organizations o
WHERE EXISTS (
  SELECT 1 
  FROM unnest(o.artist_page_gallery_images) AS img
  WHERE img LIKE '%fbcdn.net%' OR img LIKE '%facebook.com%'
)

UNION ALL

-- Check dj_profiles table
SELECT 
  'dj_profiles' as table_name,
  dp.id,
  o.name as organization_name,
  o.slug,
  'profile_image_url' as field_name,
  dp.profile_image_url as image_url
FROM dj_profiles dp
JOIN organizations o ON dp.organization_id = o.id
WHERE dp.profile_image_url LIKE '%fbcdn.net%'
   OR dp.profile_image_url LIKE '%facebook.com%'

UNION ALL

SELECT 
  'dj_profiles' as table_name,
  dp.id,
  o.name as organization_name,
  o.slug,
  'cover_image_url' as field_name,
  dp.cover_image_url as image_url
FROM dj_profiles dp
JOIN organizations o ON dp.organization_id = o.id
WHERE dp.cover_image_url LIKE '%fbcdn.net%'
   OR dp.cover_image_url LIKE '%facebook.com%'

UNION ALL

-- Check dj_profiles gallery
SELECT 
  'dj_profiles' as table_name,
  dp.id,
  o.name as organization_name,
  o.slug,
  'photo_gallery_urls' as field_name,
  unnest(dp.photo_gallery_urls) as image_url
FROM dj_profiles dp
JOIN organizations o ON dp.organization_id = o.id
WHERE EXISTS (
  SELECT 1 
  FROM unnest(dp.photo_gallery_urls) AS img
  WHERE img LIKE '%fbcdn.net%' OR img LIKE '%facebook.com%'
)

ORDER BY table_name, organization_name, field_name;
