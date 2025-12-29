-- Identify existing QR code scans using heuristics
-- This migration marks likely QR code scans based on patterns in the data

-- Strategy:
-- 1. Scans with no referrer (direct navigation) are likely QR code scans
-- 2. Mobile devices (iPhone, Android) with no referrer are very likely QR scans
-- 3. Scans that converted (led to a request) with no referrer are likely QR scans
-- 4. Exclude localhost/development traffic (::1, localhost referrers)

UPDATE qr_scans
SET is_qr_scan = TRUE
WHERE 
  -- Must have no referrer (direct navigation - typical of QR codes)
  (referrer IS NULL OR referrer = '')
  
  -- AND one of the following conditions:
  AND (
    -- Mobile device (iPhone, Android) - very likely QR code scan
    (user_agent LIKE '%iPhone%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%Mobile%')
    
    -- OR converted to a request (if they made a request, likely scanned QR)
    OR converted = TRUE
    
    -- OR has a real IP address (not localhost) - indicates real user
    OR (ip_address IS NOT NULL 
        AND ip_address != '::1' 
        AND ip_address NOT LIKE '127.%'
        AND ip_address NOT LIKE 'localhost%')
  )
  
  -- Exclude obvious development/admin traffic
  AND NOT (
    -- Localhost IPs
    (ip_address = '::1' OR ip_address LIKE '127.%')
    
    -- Development referrers
    OR (referrer IS NOT NULL AND (
      referrer LIKE '%localhost%' 
      OR referrer LIKE '%127.0.0.1%'
      OR referrer LIKE '%admin%'
      OR referrer LIKE '%/bid%'
    ))
    
    -- Development user agents (Cursor, Electron)
    OR user_agent LIKE '%Cursor%'
    OR user_agent LIKE '%Electron%'
  );

-- Add a comment explaining the heuristic
COMMENT ON COLUMN qr_scans.is_qr_scan IS 'True if this visit came from scanning a QR code. For existing data, marked based on heuristics: no referrer + (mobile device OR converted OR real IP). For new data, set via ?qr=1 query parameter.';

