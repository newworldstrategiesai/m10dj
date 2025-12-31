# LiveKit + AgentMail Integration - Quick Start Guide

**Quick Reference** for implementing the integration. See `LIVEKIT_AGENTMAIL_INTEGRATION_PLAN.md` for full details.

---

## 🚀 5-Minute Overview

### What This Does
Enables your LiveKit voice agents to:
- ✅ Send and receive emails in real-time
- ✅ Process email attachments (contracts, invoices)
- ✅ Generate calendar invites from voice commands
- ✅ Maintain conversation continuity across voice + email

### Architecture
```
Voice Agent → EmailAssistant → AgentMail API → Supabase DB
```

---

## 📋 Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Sign up at [AgentMail](https://agentmail.to)
- [ ] Get API key from dashboard
- [ ] Add to `.env.local`: `AGENTMAIL_API_KEY=your_key`
- [ ] Install dependencies: `npm install ws` (if needed)

### Phase 2: Core Integration (Days 2-3)
- [ ] Create `lib/agentmail/client.ts` - API wrapper
- [ ] Create `lib/agentmail/email-assistant.ts` - EmailAssistant class
- [ ] Create `lib/agentmail/tools.ts` - Email tools for agent
- [ ] Modify `agents/index.ts` - Add EmailAssistant to agent

### Phase 3: Database (Day 3-4)
- [ ] Run migration: `supabase/migrations/YYYYMMDD_create_agentmail_tables.sql`
- [ ] Create `app/api/agentmail/webhook/route.ts` - Webhook handler
- [ ] Create `app/api/agentmail/inbox/route.ts` - Inbox management

### Phase 4: Testing (Day 4-5)
- [ ] Test inbox creation
- [ ] Test email sending
- [ ] Test WebSocket real-time emails
- [ ] Test voice commands triggering emails

---

## 🔑 Key Files to Create

### 1. AgentMail Client (`lib/agentmail/client.ts`)
```typescript
export class AgentMailClient {
  private apiKey: string;
  private baseUrl = 'https://api.agentmail.to';

  async createInbox(email: string) { /* ... */ }
  async sendEmail(inboxId: string, to: string, subject: string, body: string) { /* ... */ }
  async getEmails(inboxId: string) { /* ... */ }
}
```

### 2. EmailAssistant Class (`lib/agentmail/email-assistant.ts`)
```typescript
export class EmailAssistant {
  async initialize() { /* WebSocket connection */ }
  async sendEmail(to: string, subject: string, body: string) { /* ... */ }
  async readEmails() { /* ... */ }
  onEmailReceived(callback: Function) { /* WebSocket handler */ }
}
```

### 3. Email Tools (`lib/agentmail/tools.ts`)
```typescript
export const sendEmailTool = llm.tool({ /* ... */ });
export const readEmailTool = llm.tool({ /* ... */ });
export const searchEmailsTool = llm.tool({ /* ... */ });
```

---

## 🔧 Integration Points

### In `agents/index.ts`
```typescript
// Add to RagAgent constructor
const emailAssistant = new EmailAssistant(inboxId, organizationId, productId);
await emailAssistant.initialize();

// Add email tools
tools: [getContactInfo, searchKnowledgeBase, ...emailTools],

// Handle email events
emailAssistant.onEmailReceived(async (email) => {
  // Notify agent of new email
  // Can trigger voice response
});
```

---

## 🗄️ Database Schema (Quick Reference)

### Tables Needed
- `agentmail_inboxes` - Links inboxes to organizations/contacts
- `agentmail_emails` - Stores email messages
- `agentmail_attachments` - Stores email attachments
- `email_conversations` - Links emails to voice conversations

### Key Fields
- `product_id` - CRITICAL for cross-product isolation
- `organization_id` - Links to organization
- `contact_id` - Links to contact
- `inbox_id` - AgentMail inbox identifier

---

## ⚠️ Critical Cross-Product Considerations

### Data Isolation
- ✅ Always include `product_id` when creating inboxes
- ✅ Filter all queries by `product_id`
- ✅ Use RLS policies to enforce isolation

### API Key Management
- ✅ Store in environment variables only
- ✅ Use different keys per environment
- ✅ Monitor usage per product

### Email Storage
- ✅ Store only metadata + recent emails
- ✅ Archive old emails to reduce costs
- ✅ Implement retention policies

---

## 🧪 Testing Steps

1. **Create Test Inbox**
   ```bash
   curl -X POST /api/agentmail/inbox \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"contactId": "test-contact-id", "productId": "m10dj"}'
   ```

2. **Send Test Email**
   - Use voice agent: "Send an email to john@example.com"
   - Or use API directly

3. **Test Real-Time**
   - Send email to inbox from external account
   - Verify WebSocket receives notification
   - Verify voice agent is notified

4. **Test Cross-Product Isolation**
   - Create inbox for M10DJ product
   - Create inbox for DJDash product
   - Verify emails don't leak between products

---

## 📚 Resources

- **Full Plan**: `LIVEKIT_AGENTMAIL_INTEGRATION_PLAN.md`
- **AgentMail Docs**: https://agentmail.to/docs
- **LiveKit Docs**: https://docs.livekit.io/agents/
- **Blog Post**: https://agentmail.to/blog/livekit-integration

---

## 🆘 Troubleshooting

### WebSocket Not Connecting
- Check API key is correct
- Verify inbox ID exists
- Check network/firewall settings

### Emails Not Storing
- Verify database migration ran
- Check RLS policies allow insert
- Verify organization_id is set

### Cross-Product Leakage
- Double-check `product_id` filtering
- Review RLS policies
- Audit query logs

---

**Ready to start?** Begin with Phase 1: Sign up for AgentMail and get your API key!

