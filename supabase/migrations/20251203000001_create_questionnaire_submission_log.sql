-- Create questionnaire_submission_log table for audit trail and recovery
-- This table tracks every submission attempt to prevent data loss

CREATE TABLE IF NOT EXISTS questionnaire_submission_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES music_questionnaires(id) ON DELETE SET NULL,
  
  -- Submission details
  submission_status TEXT NOT NULL CHECK (submission_status IN ('attempted', 'success', 'failed', 'verified')),
  is_complete BOOLEAN DEFAULT FALSE,
  
  -- Request data (stored as JSONB for flexibility)
  request_data JSONB NOT NULL,
  request_headers JSONB,
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Response data
  response_status INTEGER,
  response_data JSONB,
  response_timestamp TIMESTAMPTZ,
  
  -- Error information
  error_type TEXT, -- 'network', 'validation', 'database', 'unknown'
  error_message TEXT,
  error_details JSONB,
  error_stack TEXT,
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'mismatch', 'failed')),
  verification_error TEXT,
  
  -- Recovery
  recovered_at TIMESTAMPTZ,
  recovery_method TEXT, -- 'automatic', 'manual', 'admin'
  recovery_notes TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  idempotency_key TEXT,
  queue_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_log_lead_id ON questionnaire_submission_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_submission_log_status ON questionnaire_submission_log(submission_status);
CREATE INDEX IF NOT EXISTS idx_submission_log_created_at ON questionnaire_submission_log(created_at);
CREATE INDEX IF NOT EXISTS idx_submission_log_failed ON questionnaire_submission_log(lead_id, submission_status) 
  WHERE submission_status = 'failed';
CREATE INDEX IF NOT EXISTS idx_submission_log_unverified ON questionnaire_submission_log(lead_id, verification_status) 
  WHERE verification_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_submission_log_idempotency ON questionnaire_submission_log(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_questionnaire_submission_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_questionnaire_submission_log_updated_at ON questionnaire_submission_log;
CREATE TRIGGER update_questionnaire_submission_log_updated_at
  BEFORE UPDATE ON questionnaire_submission_log
  FOR EACH ROW
  EXECUTE FUNCTION update_questionnaire_submission_log_updated_at();

-- Enable Row Level Security
ALTER TABLE questionnaire_submission_log ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all logs
DROP POLICY IF EXISTS "Service role can manage questionnaire_submission_log" ON questionnaire_submission_log;
CREATE POLICY "Service role can manage questionnaire_submission_log" ON questionnaire_submission_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE questionnaire_submission_log IS 'Audit log for all questionnaire submission attempts. Enables recovery of lost submissions and debugging of failures.';
COMMENT ON COLUMN questionnaire_submission_log.submission_status IS 'Status of the submission: attempted (logged), success (saved), failed (error), verified (confirmed)';
COMMENT ON COLUMN questionnaire_submission_log.verification_status IS 'Whether the submission was verified: pending (not checked), verified (confirmed), mismatch (data differs), failed (verification error)';
COMMENT ON COLUMN questionnaire_submission_log.request_data IS 'Full request payload including all questionnaire data';
COMMENT ON COLUMN questionnaire_submission_log.error_details IS 'Structured error information for debugging';

