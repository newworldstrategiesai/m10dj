-- Critical schema fixes for karaoke system bulletproofing
-- This migration addresses data integrity, performance, and security issues

-- Add missing constraints to karaoke_signups table
ALTER TABLE karaoke_signups
ADD CONSTRAINT chk_group_size_valid CHECK (group_size >= 1 AND group_size <= 10),
ADD CONSTRAINT chk_priority_order_valid CHECK (priority_order >= 0),
ADD CONSTRAINT chk_priority_fee_valid CHECK (priority_fee >= 0),
ADD CONSTRAINT chk_times_sung_valid CHECK (times_sung >= 0),
ADD CONSTRAINT chk_status_valid CHECK (status IN ('queued', 'next', 'singing', 'completed', 'skipped', 'cancelled')),
ADD CONSTRAINT chk_payment_status_valid CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'free'));

-- Add unique constraints for payment IDs
ALTER TABLE karaoke_signups
ADD CONSTRAINT unique_payment_intent_id UNIQUE (payment_intent_id),
ADD CONSTRAINT unique_stripe_session_id UNIQUE (stripe_session_id);

-- Add missing fields to karaoke_settings if they don't exist
ALTER TABLE karaoke_settings
ADD COLUMN IF NOT EXISTS max_concurrent_singers INTEGER DEFAULT NULL CHECK (max_concurrent_singers IS NULL OR max_concurrent_singers > 0),
ADD COLUMN IF NOT EXISTS phone_field_mode TEXT NOT NULL DEFAULT 'required' CHECK (phone_field_mode IN ('required', 'optional', 'hidden')),
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_refresh_interval_seconds INTEGER NOT NULL DEFAULT 30 CHECK (auto_refresh_interval_seconds >= 5);

-- Add missing constraints to karaoke_settings
ALTER TABLE karaoke_settings
ADD CONSTRAINT chk_priority_fee_cents_valid CHECK (priority_fee_cents >= 0),
ADD CONSTRAINT chk_max_singers_before_repeat_valid CHECK (max_singers_before_repeat >= 0),
ADD CONSTRAINT chk_display_show_queue_count_valid CHECK (display_show_queue_count >= 0),
ADD CONSTRAINT chk_auto_refresh_interval_valid CHECK (auto_refresh_interval_seconds >= 5),
ADD CONSTRAINT chk_rotation_fairness_mode_valid CHECK (rotation_fairness_mode IN ('strict', 'flexible', 'disabled')),
ADD CONSTRAINT chk_display_theme_valid CHECK (display_theme IN ('default', 'dark', 'colorful', 'minimal')),
ADD CONSTRAINT chk_phone_field_mode_valid CHECK (phone_field_mode IN ('required', 'optional', 'hidden'));

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_updated_at ON karaoke_signups(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_payment_status ON karaoke_signups(payment_status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_is_priority ON karaoke_signups(is_priority) WHERE is_priority = true;
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_active_queue ON karaoke_signups(organization_id, event_qr_code, status, priority_order, created_at) WHERE status IN ('queued', 'next', 'singing');
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_rotation_fairness ON karaoke_signups(organization_id, singer_rotation_id, times_sung, last_sung_at);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_payment_intent ON karaoke_signups(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_stripe_session ON karaoke_signups(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Create partial indexes for karaoke_settings performance
CREATE INDEX IF NOT EXISTS idx_karaoke_settings_enabled ON karaoke_settings(organization_id) WHERE karaoke_enabled = true;

-- Add audit logging table for karaoke actions
CREATE TABLE IF NOT EXISTS karaoke_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  signup_id UUID REFERENCES karaoke_signups(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'status_change', 'priority_update', 'payment_update', etc.
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES auth.users(id), -- Admin who performed action
  performed_by_email TEXT, -- Cached for performance
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_organization ON karaoke_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_signup ON karaoke_audit_log(signup_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_action ON karaoke_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_created_at ON karaoke_audit_log(created_at DESC);

-- Function to log karaoke actions
CREATE OR REPLACE FUNCTION log_karaoke_action(
  p_signup_id UUID,
  p_action TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
  v_performed_by_email TEXT;
BEGIN
  -- Get organization ID from signup
  SELECT organization_id INTO v_org_id
  FROM karaoke_signups
  WHERE id = p_signup_id;

  -- Get performer email if user ID provided
  IF p_performed_by IS NOT NULL THEN
    SELECT email INTO v_performed_by_email
    FROM auth.users
    WHERE id = p_performed_by;
  END IF;

  -- Insert audit log
  INSERT INTO karaoke_audit_log (
    organization_id,
    signup_id,
    action,
    old_value,
    new_value,
    performed_by,
    performed_by_email,
    ip_address,
    user_agent
  ) VALUES (
    v_org_id,
    p_signup_id,
    p_action,
    p_old_value,
    p_new_value,
    p_performed_by,
    v_performed_by_email,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate status transitions
CREATE OR REPLACE FUNCTION validate_karaoke_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent invalid status transitions
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot change status from completed';
  END IF;

  IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION 'Cannot change status from cancelled';
  END IF;

  -- Log status changes
  IF OLD.status != NEW.status THEN
    PERFORM log_karaoke_action(
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      NULL, -- performed_by (would need to be passed from application)
      NULL, -- ip_address
      NULL  -- user_agent
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status transition validation
DROP TRIGGER IF EXISTS trigger_validate_karaoke_status_transition ON karaoke_signups;
CREATE TRIGGER trigger_validate_karaoke_status_transition
BEFORE UPDATE ON karaoke_signups
FOR EACH ROW
EXECUTE FUNCTION validate_karaoke_status_transition();

-- Function to prevent concurrent singing
CREATE OR REPLACE FUNCTION prevent_concurrent_singing()
RETURNS TRIGGER AS $$
DECLARE
  current_singing_count INTEGER;
BEGIN
  -- Count currently singing for this event
  SELECT COUNT(*) INTO current_singing_count
  FROM karaoke_signups
  WHERE organization_id = NEW.organization_id
    AND event_qr_code = NEW.event_qr_code
    AND status = 'singing'
    AND id != NEW.id;

  -- Allow only one singer at a time (unless status is not changing to singing)
  IF NEW.status = 'singing' AND current_singing_count > 0 THEN
    RAISE EXCEPTION 'Only one singer can be singing at a time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent concurrent singing
DROP TRIGGER IF EXISTS trigger_prevent_concurrent_singing ON karaoke_signups;
CREATE TRIGGER trigger_prevent_concurrent_singing
BEFORE UPDATE ON karaoke_signups
FOR EACH ROW
EXECUTE FUNCTION prevent_concurrent_singing();

-- Data cleanup: Fix invalid data in existing records
UPDATE karaoke_signups
SET payment_status = 'free'
WHERE payment_status NOT IN ('pending', 'paid', 'failed', 'cancelled', 'free');

UPDATE karaoke_signups
SET status = 'queued'
WHERE status NOT IN ('queued', 'next', 'singing', 'completed', 'skipped', 'cancelled');

UPDATE karaoke_settings
SET phone_field_mode = 'required'
WHERE phone_field_mode NOT IN ('required', 'optional', 'hidden');

-- Add comments for documentation
COMMENT ON TABLE karaoke_audit_log IS 'Audit log for all karaoke system actions and changes';
COMMENT ON FUNCTION log_karaoke_action IS 'Logs karaoke actions for audit and debugging purposes';
COMMENT ON FUNCTION validate_karaoke_status_transition IS 'Validates karaoke status transitions and prevents invalid state changes';
COMMENT ON FUNCTION prevent_concurrent_singing IS 'Ensures only one person can be singing at a time per event';