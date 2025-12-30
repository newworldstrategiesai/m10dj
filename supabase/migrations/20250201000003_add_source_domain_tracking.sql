-- Add source_domain tracking to crowd_requests and contacts tables
-- This allows tracking where requests and inquiries originate from
-- (e.g., m10djcompany.com/requests, tipjar.live, m10djcompany.com, djdash.net)

-- Add source_domain to crowd_requests table
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS source_domain TEXT;

-- Add index for faster queries by source domain
CREATE INDEX IF NOT EXISTS idx_crowd_requests_source_domain 
ON crowd_requests(source_domain) 
WHERE source_domain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN crowd_requests.source_domain IS 'Domain where the request originated from (e.g., m10djcompany.com, tipjar.live)';

-- Add source_domain to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS source_domain TEXT;

-- Add index for faster queries by source domain
CREATE INDEX IF NOT EXISTS idx_contacts_source_domain 
ON contacts(source_domain) 
WHERE source_domain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN contacts.source_domain IS 'Domain where the inquiry originated from (e.g., m10djcompany.com, djdash.net)';

