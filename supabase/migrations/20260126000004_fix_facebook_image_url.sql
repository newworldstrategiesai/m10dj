-- Fix Facebook CDN image URL for M10 DJ Company
-- Option 1: Remove the Facebook URL (will use default fallback image)
UPDATE organizations
SET requests_artist_photo_url = NULL
WHERE id = '2a10fa9f-c129-451d-bc4e-b669d42d521e'
  AND requests_artist_photo_url LIKE '%fbcdn.net%';

-- Option 2: If you want to replace with a new URL, uncomment and update:
-- UPDATE organizations
-- SET requests_artist_photo_url = 'https://your-new-image-url.com/image.jpg'
-- WHERE id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Verify the update
SELECT 
  id,
  name,
  slug,
  requests_artist_photo_url,
  requests_venue_photo_url,
  requests_cover_photo_url
FROM organizations
WHERE id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';
