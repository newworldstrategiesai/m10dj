# 📐 SMS + OpenAI Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOMER (Lead)                            │
│                   Sends Text Message                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TWILIO PLATFORM                              │
│         Receives SMS on Business Number                         │
│         +1 (914) 555-1234                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST Webhook
                             ▼
     ┌──────────────────────────────────────────────────┐
     │   /api/sms/incoming-message.js                   │
     │   (Main Webhook Handler)                         │
     └──────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐      ┌────────────┐    ┌──────────────┐
    │ Extract  │      │ Get        │    │ Auto-Reply   │
    │ Lead     │      │ Customer   │    │ (Instant)    │
    │ Info     │      │ Context    │    │ 0 seconds    │
    └─────────┘      └────────────┘    └──────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │  Supabase Database             │
            │  - contacts table              │
            │  - sms_conversations table     │
            └────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │ buildSystemPrompt()                  │
         │ (Create AI context with customer     │
         │ history, preferences, event details) │
         └──────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │ generateAIResponse()                 │
         │ Call OpenAI GPT-4o-mini              │
         │ + Conversation History              │
         │ = AI Preview                         │
         └──────────────────────────────────────┘
                             │
                 ┌───────────┴────────────┐
                 │                        │
                 ▼                        ▼
         ┌──────────────┐        ┌─────────────────┐
         │ Store in DB  │        │ Send Admin       │
         │ pending_ai_  │        │ Notification    │
         │ responses    │        │ + AI Preview    │
         └──────────────┘        └─────────────────┘
                 │                        │
                 ▼                        ▼
         ┌──────────────┐        ┌─────────────────┐
         │ Set Timer    │        │ Admin receives: │
         │ 60 seconds   │        │ • Customer msg  │
         │              │        │ • AI preview    │
         │              │        │ • Timestamp     │
         └──────────────┘        └─────────────────┘
                 │
         ┌───────┴────────┐
         │                │
      60s PASSED?      ADMIN REPLIES?
         │                │
         ▼ NO             ▼ YES (within 60s)
    ┌─────────────┐   ┌──────────────────┐
    │ CRON Job    │   │ Cancel AI        │
    │ Triggers    │   │ Response         │
    │ Send AI     │   │ Admin's reply    │
    │ Response    │   │ sent to customer │
    └─────────────┘   └──────────────────┘
         │                     │
         ▼                     ▼
    ┌─────────────────────────────────┐
    │   CUSTOMER RECEIVES MESSAGE     │
    │   (Either AI or Admin)           │
    │                                  │
    │   Conversation continues...      │
    │   Back to Twilio webhook ↑       │
    └─────────────────────────────────┘
```

---

## Data Flow: Message Path

```
SMS RECEIVED
    │
    ├─→ Extract: From (phone), To (Twilio #), Body (message), MessageSid
    │
    ├─→ Clean phone number (remove formatting)
    │
    ├─→ Look up customer in contacts table
    │   ├─ Existing customer? → Get full context
    │   └─ New customer? → Basic context
    │
    ├─→ Fetch last 10 messages from sms_conversations
    │   └─ Build conversation history
    │
    ├─→ Call OpenAI API with:
    │   ├─ System prompt (business context + customer info)
    │   ├─ Conversation history (last 10 messages)
    │   └─ New message from customer
    │
    ├─→ Receive AI response
    │
    ├─→ Store AI response in database (pending_ai_responses)
    │   └─ Mark status: 'pending'
    │   └─ Set execution_time: now + 60 seconds
    │
    ├─→ Send admin notification with AI preview
    │
    └─→ Return XML response to Twilio (empty 200 OK)
```

---

## Database Schema

### contacts table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  event_type TEXT,           -- 'wedding', 'corporate', 'birthday'
  event_date DATE,
  venue_name TEXT,
  budget_range TEXT,
  lead_status TEXT,          -- 'new', 'qualified', 'booked'
  special_requests TEXT,
  last_contacted_date TIMESTAMP,
  communication_preference TEXT,  -- 'sms', 'email', 'call'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### sms_conversations table
```sql
CREATE TABLE sms_conversations (
  id UUID PRIMARY KEY,
  phone_number TEXT,
  customer_name TEXT,
  message_count INTEGER DEFAULT 0,
  messages JSONB,            -- Array of {role, content, timestamp}
  conversation_status TEXT,  -- 'active', 'resolved', 'archived'
  last_message_at TIMESTAMP,
  last_message_from TEXT,    -- 'customer' or 'assistant'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### pending_ai_responses table
```sql
CREATE TABLE pending_ai_responses (
  id UUID PRIMARY KEY,
  phone_number TEXT,
  response_text TEXT,
  execution_time TIMESTAMP,
  status TEXT,               -- 'pending', 'sent', 'cancelled'
  created_at TIMESTAMP
);
```

### activity_log table
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY,
  activity_type TEXT,        -- 'sms_received', 'ai_response_sent'
  phone_number TEXT,
  contact_id UUID,
  details JSONB,
  timestamp TIMESTAMP
);
```

---

## API Endpoints

### 1. Incoming SMS Webhook (Twilio)
```
POST /api/sms/incoming-message

Body (from Twilio):
{
  From: "+19145551234",
  To: "+19998887777",
  Body: "What packages do you offer?",
  MessageSid: "SM...",
  NumMedia: "0"
}

Returns: XML Response (empty or status message)
```

### 2. Process AI Response (Cron/Internal)
```
POST /api/sms/process-ai-response

Triggered: Every 60 seconds
Action: Check pending_ai_responses table
- Find rows where execution_time <= now
- Status = 'pending'
- Send response via Twilio
- Update status to 'sent'
```

### 3. Alternative: Incoming Message AI (Simpler Version)
```
POST /api/sms/incoming-message-ai

Same as incoming-message.js but immediately sends AI response
(No delayed response, no admin override window)
```

---

## File Structure

```
project/
├── pages/api/sms/
│   ├── incoming-message.js              ← MAIN: Instant auto-reply + delayed AI
│   ├── incoming-message-ai.js           ← ALT: Immediate AI response
│   ├── process-ai-response.js           ← CRON: Sends queued responses
│   ├── incoming-message-simple.js       ← ALT: No AI, just forward to admin
│   └── incoming-message-reliable.js     ← ALT: Backup reliable version
│
├── utils/
│   ├── chatgpt-sms-assistant.js         ← Core AI logic
│   │   ├─ getCustomerContext()
│   │   ├─ generateAIResponse()
│   │   ├─ buildSystemPrompt()
│   │   ├─ buildConversationHistory()
│   │   ├─ saveConversationMessage()
│   │   ├─ extractLeadInfo()
│   │   ├─ updateContactName()
│   │   └─ more...
│   │
│   └── sms-helper.js                    ← Twilio helper functions
│       ├─ sendAdminSMS()
│       ├─ sendCustomerSMS()
│       └─ splitSMSMessage()
│
├── supabase/migrations/
│   ├── 20250115000000_create_sms_conversations.sql
│   ├── 20250115000001_create_pending_ai_responses.sql
│   └── more...
│
└── env configuration
    ├── .env.local (local dev)
    └── Vercel Settings (production)
```

---

## Configuration Flow

```
START
  │
  ▼
┌──────────────────────────────────┐
│ 1. Set Environment Variables     │
│    - OPENAI_API_KEY              │
│    - TWILIO_ACCOUNT_SID          │
│    - TWILIO_AUTH_TOKEN           │
│    - TWILIO_PHONE_NUMBER         │
│    - ADMIN_PHONE_NUMBER          │
│    - SUPABASE_URL                │
│    - SUPABASE_SERVICE_ROLE_KEY   │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│ 2. Create Database Tables        │
│    - contacts                    │
│    - sms_conversations           │
│    - pending_ai_responses        │
│    - activity_log                │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│ 3. Configure Twilio              │
│    - Set webhook to:             │
│    /api/sms/incoming-message     │
│    - Enable SMS messaging        │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│ 4. Deploy to Vercel              │
│    - Push code                   │
│    - Env vars auto-loaded        │
│    - Ready to receive SMS        │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│ 5. Set Up Cron Job               │
│    - Call /api/sms/process-ai-   │
│    response every 60 seconds     │
│    - Sends pending AI responses  │
└──────────────────────────────────┘
  │
  ▼
✅ READY TO RECEIVE SMS
```

---

## Execution Timeline

```
T=0s     Customer sends SMS
         → Twilio receives
         → Sends to /api/sms/incoming-message

T=0.1s   Webhook handler starts
         → Extract customer context
         → Call OpenAI API
         → Store AI response in database

T=0.5s   Admin receives notification with AI preview

T=1s     Auto-reply sent to customer

T=30s    Admin can still reply to take over

T=60s    Cron job checks pending_ai_responses
         → Finds response
         → Sends to customer via Twilio
         → Updates status to 'sent'

T=60+s   Customer receives AI response
```

---

## Error Handling Flow

```
Webhook Received
  │
  ├─→ Error getting customer context
  │   └─→ Continue with empty context (handles new customers)
  │
  ├─→ Error calling OpenAI API
  │   └─→ Send fallback auto-reply
  │   └─→ Notify admin of error
  │   └─→ Skip AI response
  │
  ├─→ Error storing AI response
  │   └─→ Log error
  │   └─→ Still send auto-reply
  │   └─→ Continue processing
  │
  ├─→ Error sending admin notification
  │   └─→ Log error
  │   └─→ Continue processing
  │
  └─→ Return 200 OK to Twilio
      (Even on errors - don't retry)
```

---

## Performance Metrics

### Response Times (Typical)

| Step | Time |
|------|------|
| Twilio webhook → Handler | 50ms |
| Get customer context | 100ms |
| Call OpenAI API | 800ms |
| Store response | 50ms |
| Send admin notification | 100ms |
| **Total** | **~1.1s** |

### Cost Breakdown (per 100 conversations)

| Service | Rate | Usage | Cost |
|---------|------|-------|------|
| Twilio Inbound | $0.0075/msg | 100 | $0.75 |
| Twilio Outbound | $0.0075/msg | ~300 | $2.25 |
| OpenAI API | $0.0006/1K input, $0.0018/1K output | ~100k tokens | $0.07 |
| **Total** | | | **$3.07** |

---

## Security Layers

```
Request
  │
  ├─→ Twilio Signature Validation
  │   └─ Verify x-twilio-signature header
  │   └─ Ensure request is from Twilio
  │
  ├─→ Environment Variable Protection
  │   └─ API keys in Vercel env (not in code)
  │   └─ Service role key restricted to server
  │
  ├─→ Database RLS (Row Level Security)
  │   └─ Service role bypasses RLS
  │   └─ User queries restricted to their data
  │
  ├─→ Rate Limiting
  │   └─ Max 3 SMS per minute per customer
  │   └─ Prevents abuse
  │
  └─→ Error Handling
      └─ Never expose API keys in errors
      └─ Log safely to console
```

---

## Monitoring Points

### Critical Logs to Watch

```
📱 Incoming SMS from +1XXXXXXXXXX: "Message text"
  └─ Webhook triggered successfully

🤖 Generating AI preview for admin...
  └─ Starting AI generation

✅ AI preview generated successfully
  └─ OpenAI API call succeeded

📤 Sending enhanced admin notification...
  └─ Admin SMS being sent

✅ Pending AI response stored in database
  └─ Response queued for later

⏭️ No AI preview generated, skipping delayed response
  └─ AI was skipped (e.g., error occurred)
```

---

**Architecture Version:** 2.0  
**Last Updated:** November 12, 2025  
**Status:** Production Ready

