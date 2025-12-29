-- Add is_qr_scan field to qr_scans table to distinguish QR code scans from other visits
ALTER TABLE qr_scans 
ADD COLUMN IF NOT EXISTS is_qr_scan BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_qr_scans_is_qr_scan ON qr_scans(is_qr_scan);

-- Add comment
COMMENT ON COLUMN qr_scans.is_qr_scan IS 'True if this visit came from scanning a QR code, false for direct visits or other sources';

