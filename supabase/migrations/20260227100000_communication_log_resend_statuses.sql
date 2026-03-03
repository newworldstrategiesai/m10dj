-- Allow Resend webhook statuses in communication_log so we can show delivered, bounced, complained
-- Existing: sent, delivered, read, failed, pending
ALTER TABLE communication_log
  DROP CONSTRAINT IF EXISTS communication_log_status_check;

ALTER TABLE communication_log
  ADD CONSTRAINT communication_log_status_check
  CHECK (status IN (
    'sent',
    'delivered',
    'read',
    'failed',
    'pending',
    'bounced',
    'complained'
  ));

COMMENT ON COLUMN communication_log.status IS 'sent=we sent; delivered=Resend confirmed delivery; read=opened; failed=send failed; bounced/complained=from Resend webhooks';
