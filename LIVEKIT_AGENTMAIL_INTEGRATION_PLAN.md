# LiveKit + AgentMail Integration Plan

**Date:** February 17, 2025  
**Status:** Planning Phase  
**Priority:** HIGH - Enables voice agents with email capabilities

---

## 📋 Executive Summary

This integration will enable your LiveKit voice agents to send and receive emails in real-time through AgentMail, creating a unified communication system that spans both synchronous (voice) and asynchronous (email) channels.

### Key Capabilities
- Voice agents can read and respond to emails during conversations
- Real-time email notifications via WebSocket
- Email-based document processing (contracts, invoices, quotes)
- Calendar invite generation from voice commands
- Cross-channel conversation continuity

---

## 🎯 Affected Products

### Primary Impact
- **M10DJCompany.com** - Voice assistant for customer inquiries, email follow-ups
- **DJDash.net** - Lead management via email, automated responses
- **TipJar.live** - Email notifications for tips, receipts

### Cross-Product Considerations
- **Shared Database**: Email conversations stored in shared `contacts` and `communications` tables
- **Shared Infrastructure**: AgentMail API keys used across all products
- **Data Isolation**: Must ensure email inboxes are product-specific via `organization_id` or `product_id`
- **Billing**: AgentMail usage-based pricing affects all products

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LiveKit Voice Agent                       │
│  (agents/index.ts - existing RagAgent)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              EmailAssistant Class (NEW)                      │
│  - AgentMail API client                                      │
│  - WebSocket connection for real-time emails                 │
│  - Email parsing and processing                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│  AgentMail    │           │   Supabase DB     │
│  API          │           │   - emails        │
│  - Inboxes    │           │   - attachments   │
│  - WebSocket  │           │   - conversations │
└───────────────┘           └──────────────────┘
```

---

## 📁 Files to Create/Modify

### New Files to Create

1. **`lib/agentmail/client.ts`**
   - AgentMail API client wrapper
   - Handles inbox creation, email sending/receiving
   - WebSocket connection management

2. **`lib/agentmail/email-assistant.ts`**
   - `EmailAssistant` class (as referenced in blog post)
   - Integrates with LiveKit agent
   - Email processing logic

3. **`lib/agentmail/tools.ts`**
   - Email-related tools for function calling:
     - `send_email`
     - `read_email`
     - `search_emails`
     - `process_email_attachments`
     - `create_calendar_invite`

4. **`app/api/agentmail/webhook/route.ts`**
   - Webhook endpoint for AgentMail events
   - Handles incoming email notifications

5. **`app/api/agentmail/inbox/route.ts`**
   - API endpoint to create/manage inboxes
   - Links inboxes to contacts/organizations

6. **`supabase/migrations/YYYYMMDDHHMMSS_create_agentmail_tables.sql`**
   - Database schema for email storage
   - Email conversations table
   - Inbox mappings table

### Files to Modify

1. **`agents/index.ts`**
   - Add `EmailAssistant` to `RagAgent`
   - Include email tools in agent tools array
   - Initialize email WebSocket connection

2. **`package.json`**
   - Add AgentMail SDK (if available) or axios for API calls
   - Add WebSocket library (ws or native)

3. **`.env.local` / Environment Variables**
   - Add `AGENTMAIL_API_KEY`
   - Add `AGENTMAIL_WEBHOOK_SECRET` (if applicable)

4. **`utils/env-validator.ts`**
   - Add AgentMail environment variable validation

---

## 🗄️ Database Changes

### New Tables

```sql
-- Email inboxes linked to organizations/contacts
CREATE TABLE agentmail_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  contact_id UUID REFERENCES contacts(id),
  inbox_id TEXT NOT NULL UNIQUE, -- AgentMail inbox ID
  email_address TEXT NOT NULL,
  product_id TEXT, -- 'djdash', 'm10dj', 'tipjar'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email messages stored locally
CREATE TABLE agentmail_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id TEXT REFERENCES agentmail_inboxes(inbox_id),
  agentmail_email_id TEXT NOT NULL UNIQUE,
  thread_id TEXT, -- For grouping related emails
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  metadata JSONB, -- Additional AgentMail metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email attachments
CREATE TABLE agentmail_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES agentmail_emails(id),
  agentmail_attachment_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  storage_url TEXT, -- URL to stored attachment
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email conversations (links emails to voice conversations)
CREATE TABLE email_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  voice_conversation_id UUID REFERENCES voice_conversations(id),
  thread_id TEXT, -- AgentMail thread ID
  subject TEXT,
  last_email_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agentmail_inboxes_org ON agentmail_inboxes(organization_id);
CREATE INDEX idx_agentmail_inboxes_contact ON agentmail_inboxes(contact_id);
CREATE INDEX idx_agentmail_emails_inbox ON agentmail_emails(inbox_id);
CREATE INDEX idx_agentmail_emails_thread ON agentmail_emails(thread_id);
CREATE INDEX idx_agentmail_emails_received ON agentmail_emails(received_at DESC);
CREATE INDEX idx_email_conversations_contact ON email_conversations(contact_id);
```

### RLS Policies

```sql
-- Inboxes: Users can only see inboxes for their organization
ALTER TABLE agentmail_inboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inboxes for their organization"
  ON agentmail_inboxes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Emails: Users can only see emails for their organization's inboxes
ALTER TABLE agentmail_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emails for their organization"
  ON agentmail_emails FOR SELECT
  USING (
    inbox_id IN (
      SELECT inbox_id FROM agentmail_inboxes
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );
```

---

## 🔌 API Changes

### New API Endpoints

1. **`POST /api/agentmail/inbox`**
   - Create a new inbox for a contact/organization
   - Returns inbox ID and email address
   - **Auth**: Admin or organization owner

2. **`GET /api/agentmail/inbox/:inboxId/emails`**
   - List emails for an inbox
   - Supports pagination and filtering
   - **Auth**: Organization member

3. **`POST /api/agentmail/webhook`**
   - Receives AgentMail webhook events
   - Processes incoming emails
   - **Auth**: Webhook secret validation

4. **`POST /api/agentmail/send`**
   - Send email via AgentMail
   - Can be called from voice agent or directly
   - **Auth**: Organization member

### Modified Endpoints

1. **`agents/index.ts`** (Agent Server)
   - Add email tools to agent
   - Initialize EmailAssistant on agent start
   - Handle email events during voice sessions

---

## 🎨 Frontend Changes

### New Components (Optional)

1. **`components/admin/EmailInbox.tsx`**
   - Display emails for a contact/organization
   - Show email threads
   - Link to voice conversations

2. **`components/admin/EmailComposer.tsx`**
   - Compose emails from admin dashboard
   - Can be triggered by voice agent

### Modified Components

1. **`components/admin/FloatingAdminAssistant.tsx`**
   - Show email notifications
   - Display "New Email" indicator
   - Link to email inbox view

---

## ⚠️ Cross-Product Risks & Mitigation

### Risk 1: Email Inbox Isolation
**Problem**: Emails from one product could leak to another  
**Mitigation**: 
- Always include `product_id` when creating inboxes
- Filter emails by `product_id` in all queries
- Use separate AgentMail organizations per product (if supported)

### Risk 2: Shared API Keys
**Problem**: AgentMail API key used across all products  
**Mitigation**:
- Use environment-specific keys (dev/staging/prod)
- Implement rate limiting per product
- Monitor usage per `product_id`

### Risk 3: Email Storage Costs
**Problem**: Storing all emails in Supabase could be expensive  
**Mitigation**:
- Store only metadata and recent emails
- Archive old emails to external storage
- Implement email retention policies

### Risk 4: Webhook Security
**Problem**: Webhook endpoint could be abused  
**Mitigation**:
- Validate webhook signatures
- Rate limit webhook endpoint
- Log all webhook events

### Risk 5: PII Exposure
**Problem**: Email addresses and content contain sensitive PII  
**Mitigation**:
- Encrypt email bodies at rest
- Implement proper RLS policies
- Audit email access logs
- Comply with GDPR/CCPA requirements

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up AgentMail API integration

1. ✅ Sign up for AgentMail account
2. ✅ Get API key and configure environment variables
3. ✅ Create `lib/agentmail/client.ts` - API client
4. ✅ Test inbox creation and email sending
5. ✅ Set up webhook endpoint (basic)

**Deliverables**:
- Working AgentMail API client
- Test inbox created
- Test email sent successfully

### Phase 2: Database & Storage (Week 1-2)
**Goal**: Store emails in database

1. ✅ Create database migration
2. ✅ Implement RLS policies
3. ✅ Create inbox management API
4. ✅ Test email storage and retrieval

**Deliverables**:
- Database tables created
- RLS policies active
- API endpoints working

### Phase 3: EmailAssistant Class (Week 2)
**Goal**: Integrate email with LiveKit agent

1. ✅ Create `EmailAssistant` class
2. ✅ Implement WebSocket connection
3. ✅ Add email tools to agent
4. ✅ Test real-time email notifications

**Deliverables**:
- EmailAssistant integrated with agent
- Real-time email notifications working
- Voice agent can read/send emails

### Phase 4: Function Calling (Week 2-3)
**Goal**: Enable email actions from voice

1. ✅ Implement `send_email` tool
2. ✅ Implement `read_email` tool
3. ✅ Implement `search_emails` tool
4. ✅ Implement `process_attachments` tool
5. ✅ Test voice commands triggering email actions

**Deliverables**:
- All email tools functional
- Voice agent can execute email commands
- Document processing working

### Phase 5: Frontend Integration (Week 3)
**Goal**: Display emails in admin dashboard

1. ✅ Create email inbox component
2. ✅ Link emails to contacts
3. ✅ Show email-voice conversation links
4. ✅ Add email notifications

**Deliverables**:
- Email UI in admin dashboard
- Email-voice conversation continuity visible
- Notifications working

### Phase 6: Testing & Polish (Week 3-4)
**Goal**: Production readiness

1. ✅ End-to-end testing
2. ✅ Cross-product isolation testing
3. ✅ Performance optimization
4. ✅ Security audit
5. ✅ Documentation

**Deliverables**:
- All tests passing
- Security review complete
- Documentation updated
- Production deployment ready

---

## 🔧 Technical Implementation Details

### EmailAssistant Class Structure

```typescript
class EmailAssistant {
  private agentmailClient: AgentMailClient;
  private websocket: WebSocket | null = null;
  private inboxId: string;
  private organizationId: string;
  private productId: string;

  constructor(inboxId: string, organizationId: string, productId: string) {
    this.inboxId = inboxId;
    this.organizationId = organizationId;
    this.productId = productId;
    this.agentmailClient = new AgentMailClient();
  }

  async initialize() {
    // Create WebSocket connection
    // Subscribe to email events
    // Load recent emails
  }

  async sendEmail(to: string, subject: string, body: string) {
    // Send email via AgentMail API
    // Store in database
    // Return email ID
  }

  async readEmails(limit: number = 10) {
    // Fetch emails from AgentMail
    // Store in database
    // Return formatted emails
  }

  async processIncomingEmail(emailId: string) {
    // Handle new email notification
    // Parse email content
    // Link to contact if possible
    // Trigger voice agent notification
  }

  onEmailReceived(callback: (email: Email) => void) {
    // WebSocket event handler
  }
}
```

### Email Tools for Agent

```typescript
const sendEmailTool = llm.tool({
  description: 'Send an email to a contact or email address',
  parameters: z.object({
    to: z.string().describe('Recipient email address'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body (plain text or HTML)'),
    contactId: z.string().optional().describe('Contact ID if sending to a contact'),
  }),
  execute: async ({ to, subject, body, contactId }, { ctx }) => {
    // Get organization/product context from agent
    // Create email via EmailAssistant
    // Store in database
    // Return success/error
  },
});
```

### WebSocket Integration

```typescript
// In EmailAssistant.initialize()
const ws = new WebSocket(`wss://agentmail.to/ws?apiKey=${apiKey}&inboxId=${inboxId}`);

ws.on('message', async (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'email.received') {
    await this.processIncomingEmail(event.emailId);
    
    // Notify voice agent
    await ctx.room.localParticipant.publishData(
      JSON.stringify({
        type: 'email.received',
        emailId: event.emailId,
        subject: event.subject,
      }),
      { reliable: true }
    );
  }
});
```

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Email delivery rate > 99%
- ✅ WebSocket connection uptime > 99.9%
- ✅ Email processing latency < 2 seconds
- ✅ API response time < 500ms

### Business Metrics
- ✅ Email response time reduced by 50%
- ✅ Voice-to-email conversion rate
- ✅ Customer satisfaction scores
- ✅ Email automation adoption rate

---

## 🔐 Security Considerations

### API Key Management
- Store AgentMail API key in environment variables only
- Never commit keys to repository
- Rotate keys quarterly
- Use different keys per environment

### Webhook Security
- Validate webhook signatures
- Use HTTPS only
- Rate limit webhook endpoint
- Log all webhook events

### Data Privacy
- Encrypt email bodies at rest
- Implement proper RLS policies
- Audit email access
- Comply with GDPR/CCPA

### Email Content
- Sanitize email content before storage
- Scan attachments for malware
- Implement spam filtering
- Rate limit email sending

---

## 📚 Resources & Documentation

### AgentMail
- [AgentMail Documentation](https://agentmail.to/docs)
- [AgentMail API Reference](https://agentmail.to/docs/api)
- [LiveKit Integration Guide](https://agentmail.to/blog/livekit-integration)

### LiveKit
- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [LiveKit Voice AI Quickstart](https://docs.livekit.io/agents/quickstart/voice)

### Internal Documentation
- `LIVEKIT_VOICE_AI_STATUS.md` - Current LiveKit setup
- `agents/index.ts` - Existing agent implementation
- `EMAIL_INTEGRATION_SETUP.md` - Current email setup

---

## ✅ Pre-Implementation Checklist

### Account Setup
- [ ] Sign up for AgentMail account
- [ ] Get API key from AgentMail dashboard
- [ ] Verify domain (if using custom domain)
- [ ] Set up webhook URL in AgentMail dashboard

### Environment Setup
- [ ] Add `AGENTMAIL_API_KEY` to `.env.local`
- [ ] Add `AGENTMAIL_WEBHOOK_SECRET` to `.env.local`
- [ ] Add `AGENTMAIL_API_URL` (if different from default)
- [ ] Update `utils/env-validator.ts`

### Database Setup
- [ ] Review migration file
- [ ] Test migration on local Supabase
- [ ] Verify RLS policies
- [ ] Create test inbox

### Code Review
- [ ] Review existing agent code
- [ ] Understand current email flow
- [ ] Identify integration points
- [ ] Plan testing strategy

---

## 🐛 Edge Cases & Error Handling

### Email Delivery Failures
- Retry logic with exponential backoff
- Dead letter queue for failed emails
- Alert admin on persistent failures

### WebSocket Disconnections
- Automatic reconnection with backoff
- Queue emails during disconnection
- Sync missed emails on reconnect

### Rate Limiting
- Respect AgentMail rate limits
- Queue emails if rate limited
- Alert when approaching limits

### Attachment Processing
- Handle large attachments
- Support multiple file types
- Store attachments in Supabase Storage
- Clean up old attachments

### Email Threading
- Group emails by thread ID
- Maintain conversation context
- Link threads to contacts

---

## 🎯 Next Steps

1. **Review this plan** with team
2. **Sign up for AgentMail** account
3. **Create Phase 1 tasks** in project management tool
4. **Set up development environment**
5. **Begin Phase 1 implementation**

---

## 📝 Notes

- AgentMail pricing is usage-based (emails sent/received)
- Consider implementing email caching to reduce API calls
- May need to upgrade AgentMail plan for production usage
- Monitor email costs across all products
- Consider email archiving strategy for compliance

---

**Last Updated**: February 17, 2025  
**Status**: Ready for Implementation  
**Next Review**: After Phase 1 completion

