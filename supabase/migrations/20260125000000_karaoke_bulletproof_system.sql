-- =====================================================================================
-- KARAOKE BULLETPROOF SYSTEM MIGRATION
-- Comprehensive security, performance, and reliability fixes for karaoke system
-- =====================================================================================

-- Add missing constraints to karaoke_signups table
DO $$ BEGIN
    -- Add CHECK constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_group_size_valid'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT chk_group_size_valid CHECK (group_size >= 1 AND group_size <= 10);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_priority_order_valid'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT chk_priority_order_valid CHECK (priority_order >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_priority_fee_valid'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT chk_priority_fee_valid CHECK (priority_fee >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_times_sung_valid'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT chk_times_sung_valid CHECK (times_sung >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_status_valid'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT chk_status_valid CHECK (status IN ('queued', 'next', 'singing', 'completed', 'skipped', 'cancelled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_payment_status_valid'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT chk_payment_status_valid CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'free'));
    END IF;
END $$;

-- Add unique constraints for payment IDs
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_payment_intent_id'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT unique_payment_intent_id UNIQUE (payment_intent_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_stripe_session_id'
    ) THEN
        ALTER TABLE karaoke_signups ADD CONSTRAINT unique_stripe_session_id UNIQUE (stripe_session_id);
    END IF;
END $$;

-- Add missing fields to karaoke_settings if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_settings' AND column_name = 'max_concurrent_singers') THEN
        ALTER TABLE karaoke_settings ADD COLUMN max_concurrent_singers INTEGER DEFAULT NULL CHECK (max_concurrent_singers IS NULL OR max_concurrent_singers > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_settings' AND column_name = 'phone_field_mode') THEN
        ALTER TABLE karaoke_settings ADD COLUMN phone_field_mode TEXT NOT NULL DEFAULT 'required' CHECK (phone_field_mode IN ('required', 'optional', 'hidden'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_settings' AND column_name = 'sms_notifications_enabled') THEN
        ALTER TABLE karaoke_settings ADD COLUMN sms_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_settings' AND column_name = 'auto_refresh_interval_seconds') THEN
        ALTER TABLE karaoke_settings ADD COLUMN auto_refresh_interval_seconds INTEGER NOT NULL DEFAULT 30 CHECK (auto_refresh_interval_seconds >= 5);
    END IF;
END $$;

-- Add missing constraints to karaoke_settings
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_priority_fee_cents_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_priority_fee_cents_valid CHECK (priority_fee_cents >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_max_singers_before_repeat_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_max_singers_before_repeat_valid CHECK (max_singers_before_repeat >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_display_show_queue_count_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_display_show_queue_count_valid CHECK (display_show_queue_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_auto_refresh_interval_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_auto_refresh_interval_valid CHECK (auto_refresh_interval_seconds >= 5);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_rotation_fairness_mode_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_rotation_fairness_mode_valid CHECK (rotation_fairness_mode IN ('strict', 'flexible', 'disabled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_display_theme_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_display_theme_valid CHECK (display_theme IN ('default', 'dark', 'colorful', 'minimal'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_phone_field_mode_valid'
    ) THEN
        ALTER TABLE karaoke_settings ADD CONSTRAINT chk_phone_field_mode_valid CHECK (phone_field_mode IN ('required', 'optional', 'hidden'));
    END IF;
END $$;

-- Create audit logging table for karaoke actions
CREATE TABLE IF NOT EXISTS karaoke_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  signup_id UUID REFERENCES karaoke_signups(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'status_change', 'payment_completed', 'settings_updated', etc.
  old_value JSONB,
  new_value JSONB,
  performed_by_email TEXT, -- Email of user who performed action
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB, -- Additional structured data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_organization ON karaoke_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_signup ON karaoke_audit_log(signup_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_action ON karaoke_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_created_at ON karaoke_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_audit_log_severity ON karaoke_audit_log(severity);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_updated_at ON karaoke_signups(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_payment_status ON karaoke_signups(payment_status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_is_priority ON karaoke_signups(is_priority) WHERE is_priority = true;
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_active_queue ON karaoke_signups(organization_id, event_qr_code, status, priority_order, created_at) WHERE status IN ('queued', 'next', 'singing');
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_rotation_fairness ON karaoke_signups(organization_id, singer_rotation_id, times_sung, last_sung_at);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_payment_intent ON karaoke_signups(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_stripe_session ON karaoke_signups(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Partial indexes for karaoke_settings performance
CREATE INDEX IF NOT EXISTS idx_karaoke_settings_enabled ON karaoke_settings(organization_id) WHERE karaoke_enabled = true;

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

  -- Log status changes to audit table
  IF OLD.status != NEW.status THEN
    INSERT INTO karaoke_audit_log (
      organization_id,
      signup_id,
      action,
      old_value,
      new_value,
      performed_by_email,
      severity
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status, 'updated_at', OLD.updated_at),
      jsonb_build_object('status', NEW.status, 'updated_at', NEW.updated_at),
      COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'system'),
      CASE
        WHEN NEW.status IN ('completed', 'cancelled') THEN 'low'
        WHEN NEW.status = 'singing' THEN 'medium'
        ELSE 'low'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent concurrent singing
CREATE OR REPLACE FUNCTION prevent_concurrent_singing()
RETURNS TRIGGER AS $$
DECLARE
  current_singing_count INTEGER;
  max_concurrent INTEGER;
BEGIN
  -- Check if status is changing to singing
  IF NEW.status = 'singing' AND (OLD.status IS NULL OR OLD.status != 'singing') THEN
    -- Get max concurrent singers setting
    SELECT max_concurrent_singers INTO max_concurrent
    FROM karaoke_settings
    WHERE organization_id = NEW.organization_id;

    -- Default to 1 if not set
    max_concurrent := COALESCE(max_concurrent, 1);

    -- Count currently singing for this event
    SELECT COUNT(*) INTO current_singing_count
    FROM karaoke_signups
    WHERE organization_id = NEW.organization_id
      AND event_qr_code = NEW.event_qr_code
      AND status = 'singing'
      AND id != NEW.id;

    -- Allow only max_concurrent singers at a time
    IF current_singing_count >= max_concurrent THEN
      RAISE EXCEPTION 'Maximum of % concurrent singers reached for this event', max_concurrent;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log karaoke actions (for manual logging from application)
CREATE OR REPLACE FUNCTION log_karaoke_action(
  p_signup_id UUID,
  p_action TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_performed_by_email TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium',
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get organization ID from signup
  SELECT organization_id INTO v_org_id
  FROM karaoke_signups
  WHERE id = p_signup_id;

  -- If no org from signup, try to get from context (for non-signup events)
  IF v_org_id IS NULL THEN
    v_org_id := current_setting('request.jwt.claims', true)::json->>'organization_id';
  END IF;

  -- Insert audit log
  INSERT INTO karaoke_audit_log (
    organization_id,
    signup_id,
    action,
    old_value,
    new_value,
    performed_by_email,
    ip_address,
    user_agent,
    severity,
    metadata
  ) VALUES (
    v_org_id,
    p_signup_id,
    p_action,
    p_old_value,
    p_new_value,
    COALESCE(p_performed_by_email, current_setting('request.jwt.claims', true)::json->>'email', 'system'),
    p_ip_address,
    p_user_agent,
    p_severity,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic validation and logging
DROP TRIGGER IF EXISTS trigger_validate_karaoke_status_transition ON karaoke_signups;
CREATE TRIGGER trigger_validate_karaoke_status_transition
BEFORE UPDATE ON karaoke_signups
FOR EACH ROW
EXECUTE FUNCTION validate_karaoke_status_transition();

DROP TRIGGER IF EXISTS trigger_prevent_concurrent_singing ON karaoke_signups;
CREATE TRIGGER trigger_prevent_concurrent_singing
BEFORE INSERT OR UPDATE ON karaoke_signups
FOR EACH ROW
EXECUTE FUNCTION prevent_concurrent_singing();

-- Function for advisory lock management (for atomic operations)
CREATE OR REPLACE FUNCTION get_karaoke_lock_key(org_id UUID, event_code TEXT)
RETURNS INTEGER AS $$
DECLARE
  key_string TEXT;
  hash INTEGER := 0;
  i INTEGER;
BEGIN
  key_string := org_id::TEXT || ':' || event_code;
  FOR i IN 1..length(key_string) LOOP
    hash := ((hash << 5) - hash) + ascii(substring(key_string, i, 1));
  END LOOP;
  RETURN abs(hash);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

UPDATE karaoke_settings
SET rotation_fairness_mode = 'strict'
WHERE rotation_fairness_mode NOT IN ('strict', 'flexible', 'disabled');

UPDATE karaoke_settings
SET display_theme = 'default'
WHERE display_theme NOT IN ('default', 'dark', 'colorful', 'minimal');

-- Add comments for documentation
COMMENT ON TABLE karaoke_signups IS 'Karaoke singer sign-ups with group support, atomic operations, and comprehensive validation';
COMMENT ON TABLE karaoke_settings IS 'Organization-level karaoke configuration with capacity and feature controls';
COMMENT ON TABLE karaoke_audit_log IS 'Complete audit trail for all karaoke system actions and security events';
COMMENT ON FUNCTION validate_karaoke_status_transition IS 'Validates karaoke status transitions and logs changes to audit table';
COMMENT ON FUNCTION prevent_concurrent_singing IS 'Enforces concurrent singer limits based on organization settings';
COMMENT ON FUNCTION log_karaoke_action IS 'Manually logs karaoke actions to audit table with full context';
COMMENT ON FUNCTION get_karaoke_lock_key IS 'Generates advisory lock keys for atomic queue operations';

-- Create a view for karaoke analytics
CREATE OR REPLACE VIEW karaoke_analytics AS
SELECT
  ks.organization_id,
  COUNT(*) as total_signups,
  COUNT(CASE WHEN ks.status = 'completed' THEN 1 END) as completed_signups,
  COUNT(CASE WHEN ks.is_priority THEN 1 END) as priority_signups,
  COUNT(CASE WHEN ks.payment_status = 'paid' THEN 1 END) as paid_signups,
  COALESCE(SUM(CASE WHEN ks.payment_status = 'paid' THEN ks.priority_fee END), 0) as total_revenue,
  AVG(EXTRACT(EPOCH FROM (ks.completed_at - ks.started_at))/60) as avg_song_duration_minutes,
  MAX(ks.created_at) as last_signup_at
FROM karaoke_signups ks
GROUP BY ks.organization_id;

-- Grant appropriate permissions
GRANT SELECT ON karaoke_audit_log TO authenticated;
GRANT SELECT ON karaoke_analytics TO authenticated;

-- Create RLS policies for audit log
ALTER TABLE karaoke_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their organization" ON karaoke_audit_log
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert audit logs" ON karaoke_audit_log
FOR INSERT WITH CHECK (true);

-- Performance: Analyze tables after migration
ANALYZE karaoke_signups;
ANALYZE karaoke_settings;
ANALYZE karaoke_audit_log;