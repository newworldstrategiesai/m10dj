-- Track when we've sent admin SMS for "page opened" events so we only send 1 per day per contact per page type.
-- Used by utils/admin-notifications.js for quote_page_open and invoice_page_open.
CREATE TABLE IF NOT EXISTS admin_sms_daily_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sent_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, event_type, sent_date)
);

CREATE INDEX IF NOT EXISTS idx_admin_sms_daily_sent_lookup
  ON admin_sms_daily_sent(contact_id, event_type, sent_date);

COMMENT ON TABLE admin_sms_daily_sent IS 'One row per contact per event_type per calendar day when admin SMS was sent; used to throttle page-open SMS to 1/day';
