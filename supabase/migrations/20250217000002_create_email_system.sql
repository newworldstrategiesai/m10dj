-- Email System for LiveKit Voice Agents
-- Uses Resend for sending, Supabase for storage, Supabase Realtime for notifications

-- Email inboxes linked to organizations/contacts
CREATE TABLE IF NOT EXISTS email_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL, -- e.g., "assistant@m10djcompany.com" or "contact-123@m10djcompany.com"
  product_id TEXT, -- 'djdash', 'm10dj', 'tipjar'
  display_name TEXT, -- Friendly name for the inbox
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique email addresses per organization
  UNIQUE(organization_id, email_address)
);

-- Email messages stored locally
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_email TEXT NOT NULL, -- References email_inboxes.email_address
  resend_email_id TEXT, -- Resend email ID for sent emails
  thread_id TEXT, -- For grouping related emails (conversation threading)
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  cc_addresses TEXT[], -- Array of CC addresses
  bcc_addresses TEXT[], -- Array of BCC addresses
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- Additional metadata (headers, Resend data, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email attachments
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  resend_attachment_id TEXT, -- Resend attachment ID if available
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  storage_url TEXT, -- URL to stored attachment (Supabase Storage or external)
  is_processed BOOLEAN DEFAULT FALSE,
  processed_data JSONB, -- Extracted data from attachment (e.g., contract text)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email conversations (links emails to voice conversations)
CREATE TABLE IF NOT EXISTS email_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  voice_conversation_id UUID REFERENCES voice_conversations(id) ON DELETE SET NULL,
  thread_id TEXT, -- Email thread ID
  subject TEXT,
  last_email_at TIMESTAMPTZ,
  email_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_inboxes_org ON email_inboxes(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_contact ON email_inboxes(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_email ON email_inboxes(email_address);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_product ON email_inboxes(product_id);

CREATE INDEX IF NOT EXISTS idx_emails_inbox ON emails(inbox_email);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_sent ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_to ON emails(to_address);
CREATE INDEX IF NOT EXISTS idx_emails_resend_id ON emails(resend_email_id);

CREATE INDEX IF NOT EXISTS idx_email_attachments_email ON email_attachments(email_id);

CREATE INDEX IF NOT EXISTS idx_email_conversations_contact ON email_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_conversations_voice ON email_conversations(voice_conversation_id);
CREATE INDEX IF NOT EXISTS idx_email_conversations_thread ON email_conversations(thread_id);

-- RLS Policies

-- Email Inboxes: Users can only see inboxes for their organization
ALTER TABLE email_inboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inboxes for their organization"
  ON email_inboxes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT id FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inboxes for their organization"
  ON email_inboxes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT id FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inboxes for their organization"
  ON email_inboxes FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT id FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

-- Emails: Users can only see emails for their organization's inboxes
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emails for their organization"
  ON emails FOR SELECT
  USING (
    inbox_email IN (
      SELECT email_address FROM email_inboxes
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
      OR organization_id IN (
        SELECT id FROM organizations
        WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage all emails"
  ON emails FOR ALL
  USING (auth.role() = 'service_role');

-- Email Attachments: Same as emails
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for their organization"
  ON email_attachments FOR SELECT
  USING (
    email_id IN (
      SELECT id FROM emails
      WHERE inbox_email IN (
        SELECT email_address FROM email_inboxes
        WHERE organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT id FROM organizations
          WHERE owner_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Service role can manage all attachments"
  ON email_attachments FOR ALL
  USING (auth.role() = 'service_role');

-- Email Conversations: Same as emails
ALTER TABLE email_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations for their organization"
  ON email_conversations FOR SELECT
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
      OR organization_id IN (
        SELECT id FROM organizations
        WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage all conversations"
  ON email_conversations FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_email_inboxes_updated_at
  BEFORE UPDATE ON email_inboxes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_conversations_updated_at
  BEFORE UPDATE ON email_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically link emails to contacts by email address
CREATE OR REPLACE FUNCTION link_email_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  contact_uuid UUID;
BEGIN
  -- Try to find contact by email address
  SELECT id INTO contact_uuid
  FROM contacts
  WHERE email_address = NEW.from_address
  LIMIT 1;

  -- If contact found, update email with contact_id
  IF contact_uuid IS NOT NULL THEN
    -- Update email conversation if exists
    INSERT INTO email_conversations (contact_id, thread_id, subject, last_email_at, email_count)
    VALUES (contact_uuid, NEW.thread_id, NEW.subject, NEW.received_at, 1)
    ON CONFLICT (thread_id) DO UPDATE
    SET 
      last_email_at = NEW.received_at,
      email_count = email_conversations.email_count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link emails to contacts
CREATE TRIGGER auto_link_email_to_contact
  AFTER INSERT ON emails
  FOR EACH ROW
  WHEN (NEW.received_at IS NOT NULL) -- Only for received emails
  EXECUTE FUNCTION link_email_to_contact();

-- Comments for documentation
COMMENT ON TABLE email_inboxes IS 'Email inboxes for voice agents, linked to organizations and contacts';
COMMENT ON TABLE emails IS 'Email messages stored from Resend, with threading support';
COMMENT ON TABLE email_attachments IS 'Email attachments stored and processed';
COMMENT ON TABLE email_conversations IS 'Links emails to voice conversations and contacts';

