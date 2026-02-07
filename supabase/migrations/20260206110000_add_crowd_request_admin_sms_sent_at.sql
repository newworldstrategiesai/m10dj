-- Track when admin SMS was sent for a paid crowd request (dedupe + audit)
-- Used so we send exactly one SMS per paid request (either from process-payment-success or Stripe webhook)
ALTER TABLE crowd_requests
  ADD COLUMN IF NOT EXISTS admin_sms_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN crowd_requests.admin_sms_sent_at IS 'When admin was notified via SMS for this paid request (Twilio). Used to avoid duplicate SMS.';

CREATE INDEX IF NOT EXISTS idx_crowd_requests_admin_sms_sent_at
  ON crowd_requests(admin_sms_sent_at) WHERE admin_sms_sent_at IS NOT NULL;
