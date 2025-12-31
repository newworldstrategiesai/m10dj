# Custom Email System for LiveKit Agents - Build Plan

**Date:** February 17, 2025  
**Status:** Recommended Approach  
**Why:** You already have Resend + custom domain + Supabase. No need for AgentMail premium.

---

## 💰 Cost Comparison

### AgentMail Premium
- **Cost**: Premium subscription (likely $50-200+/month)
- **Custom Domain**: Requires premium
- **Features**: API-first, WebSocket, inbox management

### Custom Solution (Recommended)
- **Cost**: Resend Pro ($20/month) - **You may already have this**
- **Custom Domain**: ✅ Already configured (`hello@m10djcompany.com`)
- **Features**: Full control, integrated with your stack
- **Savings**: $30-180+/month

---

## ✅ What You Already Have

1. **Resend API** - Fully configured with custom domain
2. **Supabase** - Database and real-time infrastructure
3. **LiveKit** - Real-time WebSocket infrastructure
4. **Gmail Integration** - Fallback email provider
5. **Email Sending** - Working in `pages/api/admin/communications/send-email.js`

---

## 🏗️ Architecture: Custom Email System

```
┌─────────────────────────────────────────────────────────────┐
│                    LiveKit Voice Agent                       │
│  (agents/index.ts - existing RagAgent)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Custom EmailAssistant Class (NEW)                  │
│  - Resend API client (sending)                               │
│  - Resend Webhooks (receiving)                                │
│  - Supabase storage                                          │
│  - Supabase Realtime (real-time notifications)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│    Resend     │           │   Supabase DB     │
│  - Sending    │           │   - emails        │
│  - Webhooks   │           │   - attachments   │
│  - Custom     │           │   - conversations │
│    Domain ✅  │           │   - real-time     │
└───────────────┘           └──────────────────┘
```

---

## 📁 Files to Create

### 1. **`lib/email/email-assistant.ts`** - Core EmailAssistant Class
```typescript
/**
 * Custom EmailAssistant for LiveKit agents
 * Uses Resend for sending, Resend webhooks + Supabase for receiving
 */
export class EmailAssistant {
  private organizationId: string;
  private productId: string;
  private resend: Resend;
  private supabase: SupabaseClient;
  
  async sendEmail(to: string, subject: string, body: string) { }
  async readEmails(limit?: number) { }
  async searchEmails(query: string) { }
  async processIncomingEmail(emailId: string) { }
  onEmailReceived(callback: Function) { } // Via Supabase Realtime
}
```

### 2. **`lib/email/resend-client.ts`** - Resend Wrapper
```typescript
/**
 * Wrapper around Resend API
 * Handles sending, domain management, webhook setup
 */
export class ResendEmailClient {
  async sendEmail(params: SendEmailParams) { }
  async getEmails() { } // Via Resend API (if available) or webhook storage
  async setupWebhook(url: string) { }
}
```

### 3. **`lib/email/tools.ts`** - Email Tools for Agent
```typescript
/**
 * Email-related tools for LiveKit agent function calling
 */
export const sendEmailTool = llm.tool({ /* ... */ });
export const readEmailTool = llm.tool({ /* ... */ });
export const searchEmailsTool = llm.tool({ /* ... */ });
export const processEmailAttachmentsTool = llm.tool({ /* ... */ });
```

### 4. **`app/api/email/webhook/resend/route.ts`** - Resend Webhook Handler
```typescript
/**
 * Receives Resend webhook events for incoming emails
 * Stores in Supabase and triggers real-time notifications
 */
export async function POST(request: NextRequest) {
  // Validate webhook signature
  // Parse incoming email
  // Store in Supabase
  // Trigger Supabase Realtime notification
  // Notify LiveKit agent if active
}
```

### 5. **`app/api/email/inbox/route.ts`** - Inbox Management
```typescript
/**
 * Create/manage email inboxes for contacts/organizations
 * Uses Resend's email addresses (no separate inbox needed)
 */
export async function POST(request: NextRequest) {
  // Create email address mapping
  // Store in Supabase agentmail_inboxes table
  // Link to contact/organization
}
```

### 6. **`supabase/migrations/YYYYMMDDHHMMSS_create_email_system.sql`**
```sql
-- Same schema as AgentMail plan, but using Resend
-- No separate inbox IDs needed - use email addresses directly
```

---

## 🔧 Implementation Strategy

### Option A: Resend Webhooks (Recommended)
**How it works:**
1. Configure Resend webhook to point to your API
2. Resend sends POST request when email received
3. Store email in Supabase
4. Trigger Supabase Realtime notification
5. LiveKit agent receives via Supabase Realtime channel

**Pros:**
- ✅ Real-time email notifications
- ✅ No polling needed
- ✅ Uses existing Resend infrastructure
- ✅ Free with Resend account

**Cons:**
- ⚠️ Requires webhook endpoint (already have infrastructure)
- ⚠️ Need to handle webhook signature validation

### Option B: IMAP/POP3 Polling (Fallback)
**How it works:**
1. Connect to email account via IMAP
2. Poll for new emails every 30-60 seconds
3. Store in Supabase
4. Trigger notifications

**Pros:**
- ✅ Works with any email provider
- ✅ No webhook setup needed

**Cons:**
- ❌ Polling is less efficient
- ❌ 30-60 second delay
- ❌ Requires IMAP credentials

### Option C: Resend API + Supabase Realtime (Hybrid)
**How it works:**
1. Use Resend for sending (already working)
2. Use Resend webhooks for receiving
3. Use Supabase Realtime for agent notifications
4. Store everything in Supabase

**Pros:**
- ✅ Best of all worlds
- ✅ Real-time notifications
- ✅ Full control
- ✅ Uses existing infrastructure

**Cons:**
- ⚠️ Need to set up webhook

---

## 📋 Step-by-Step Implementation

### Phase 1: Email Storage & Management (Day 1)

1. **Create Database Schema**
   ```sql
   -- Same as AgentMail plan, but simpler
   -- Use email addresses as inbox identifiers
   CREATE TABLE email_inboxes (
     id UUID PRIMARY KEY,
     organization_id UUID,
     contact_id UUID,
     email_address TEXT NOT NULL, -- e.g., "contact-123@m10djcompany.com"
     product_id TEXT,
     created_at TIMESTAMPTZ
   );
   
   CREATE TABLE emails (
     id UUID PRIMARY KEY,
     inbox_email TEXT, -- References email_inboxes.email_address
     from_address TEXT,
     to_address TEXT,
     subject TEXT,
     body_text TEXT,
     body_html TEXT,
     received_at TIMESTAMPTZ,
     read_at TIMESTAMPTZ,
     metadata JSONB
   );
   ```

2. **Create EmailAssistant Class**
   - Basic structure
   - Resend integration for sending
   - Supabase integration for storage

3. **Test Email Sending**
   - Send test email via agent
   - Verify storage in Supabase

### Phase 2: Email Receiving via Webhooks (Day 2)

1. **Set Up Resend Webhook**
   - Go to Resend dashboard
   - Add webhook URL: `https://yourdomain.com/api/email/webhook/resend`
   - Configure events: `email.received`, `email.opened`

2. **Create Webhook Handler**
   - Validate webhook signature
   - Parse incoming email
   - Store in Supabase
   - Link to contact if email matches

3. **Test Email Receiving**
   - Send email to your domain
   - Verify webhook fires
   - Verify storage in Supabase

### Phase 3: Real-Time Notifications (Day 2-3)

1. **Set Up Supabase Realtime**
   - Create channel: `email-notifications:{organizationId}`
   - Subscribe in EmailAssistant
   - Trigger on new email

2. **Integrate with LiveKit Agent**
   - Agent subscribes to Supabase channel
   - Receives email notifications in real-time
   - Can respond via voice

3. **Test Real-Time Flow**
   - Send email externally
   - Verify agent receives notification
   - Test voice response

### Phase 4: Email Tools for Agent (Day 3-4)

1. **Create Email Tools**
   - `send_email` - Send email via Resend
   - `read_email` - Read emails from Supabase
   - `search_emails` - Search emails
   - `process_attachments` - Handle attachments

2. **Integrate with Agent**
   - Add tools to RagAgent
   - Test voice commands

3. **Test Voice-to-Email**
   - "Send email to john@example.com"
   - "Read my latest emails"
   - "Search for emails about wedding"

### Phase 5: Advanced Features (Day 4-5)

1. **Email Threading**
   - Group emails by conversation
   - Link to voice conversations

2. **Attachment Processing**
   - Download from Resend
   - Store in Supabase Storage
   - Process documents (contracts, invoices)

3. **Email Templates**
   - Pre-built templates
   - Voice-controlled template selection

---

## 🔑 Key Differences from AgentMail

### What We're Building
- ✅ Uses Resend (already have)
- ✅ Uses Supabase (already have)
- ✅ Uses Supabase Realtime (already have)
- ✅ Custom domain already working
- ✅ Full control over implementation

### What We're Not Using
- ❌ AgentMail API (no need)
- ❌ AgentMail WebSocket (using Supabase Realtime instead)
- ❌ AgentMail inbox management (using email addresses directly)

---

## 💻 Code Examples

### EmailAssistant Class

```typescript
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export class EmailAssistant {
  private resend: Resend;
  private supabase: SupabaseClient;
  private realtimeChannel: RealtimeChannel | null = null;
  private organizationId: string;
  private productId: string;
  private emailAddress: string; // e.g., "assistant@m10djcompany.com"

  constructor(
    organizationId: string,
    productId: string,
    emailAddress: string
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY!);
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.organizationId = organizationId;
    this.productId = productId;
    this.emailAddress = emailAddress;
  }

  async initialize() {
    // Subscribe to Supabase Realtime for email notifications
    this.realtimeChannel = this.supabase
      .channel(`email-notifications:${this.organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emails',
          filter: `to_address=eq.${this.emailAddress}`,
        },
        (payload) => {
          this.handleNewEmail(payload.new);
        }
      )
      .subscribe();
  }

  async sendEmail(to: string, subject: string, body: string) {
    // Send via Resend
    const result = await this.resend.emails.send({
      from: this.emailAddress,
      to: [to],
      subject,
      html: body,
    });

    // Store in Supabase
    await this.supabase.from('emails').insert({
      inbox_email: this.emailAddress,
      from_address: this.emailAddress,
      to_address: to,
      subject,
      body_text: body,
      received_at: new Date().toISOString(),
      metadata: { resend_id: result.data?.id },
    });

    return result;
  }

  async readEmails(limit: number = 10) {
    const { data } = await this.supabase
      .from('emails')
      .select('*')
      .eq('inbox_email', this.emailAddress)
      .order('received_at', { ascending: false })
      .limit(limit);

    return data;
  }

  async searchEmails(query: string) {
    const { data } = await this.supabase
      .from('emails')
      .select('*')
      .eq('inbox_email', this.emailAddress)
      .or(`subject.ilike.%${query}%,body_text.ilike.%${query}%`)
      .order('received_at', { ascending: false });

    return data;
  }

  private async handleNewEmail(email: any) {
    // Notify agent of new email
    // Can trigger voice response
    console.log('New email received:', email);
  }

  onEmailReceived(callback: (email: any) => void) {
    // Set up callback for new emails
    if (this.realtimeChannel) {
      // Already set up in initialize()
      // Could add additional callback here
    }
  }
}
```

### Resend Webhook Handler

```typescript
// app/api/email/webhook/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Validate webhook signature (Resend provides this)
    const signature = request.headers.get('resend-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify signature (implement Resend signature verification)
    // const isValid = verifyResendSignature(signature, body);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const body = await request.json();
    const event = body.type; // 'email.received', 'email.opened', etc.

    if (event === 'email.received') {
      const email = body.data;

      // Store in Supabase
      const { data, error } = await supabase
        .from('emails')
        .insert({
          inbox_email: email.to[0].email,
          from_address: email.from.email,
          to_address: email.to[0].email,
          subject: email.subject,
          body_text: email.text,
          body_html: email.html,
          received_at: new Date(email.created_at).toISOString(),
          metadata: {
            resend_id: email.id,
            headers: email.headers,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing email:', error);
        return NextResponse.json({ error: 'Failed to store email' }, { status: 500 });
      }

      // Trigger Supabase Realtime notification
      // This will notify any subscribed EmailAssistant instances
      await supabase
        .channel(`email-notifications`)
        .send({
          type: 'broadcast',
          event: 'email.received',
          payload: { email: data },
        });

      return NextResponse.json({ success: true, emailId: data.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## ⚠️ Important Considerations

### Resend Webhook Limitations
- Resend webhooks may not support all email providers
- May need to use email forwarding or IMAP as fallback
- Check Resend documentation for webhook capabilities

### Email Address Strategy
- Use subdomain addresses: `contact-{id}@m10djcompany.com`
- Or use catch-all: `*@m10djcompany.com` → route to webhook
- Or use specific addresses: `assistant@m10djcompany.com`

### Real-Time Performance
- Supabase Realtime is very fast (< 100ms)
- Better than polling
- Scales well with your existing infrastructure

### Cost Analysis
- **Resend Pro**: $20/month (50k emails)
- **Supabase**: Already using (free tier or paid)
- **Total**: ~$20/month vs AgentMail premium ($50-200+/month)

---

## 🚀 Quick Start

1. **Verify Resend Setup**
   ```bash
   # Check you have RESEND_API_KEY
   echo $RESEND_API_KEY
   
   # Test sending
   curl -X POST http://localhost:3000/api/test-send-email
   ```

2. **Set Up Webhook**
   - Go to Resend Dashboard → Webhooks
   - Add webhook: `https://yourdomain.com/api/email/webhook/resend`
   - Select events: `email.received`

3. **Create Database Tables**
   ```bash
   # Run migration
   npx supabase migration new create_email_system
   # Add SQL from Phase 1
   npx supabase db push
   ```

4. **Implement EmailAssistant**
   - Copy code examples above
   - Integrate with agent
   - Test!

---

## ✅ Advantages of Custom Solution

1. **Cost**: $20/month vs $50-200+/month
2. **Control**: Full control over implementation
3. **Integration**: Already integrated with your stack
4. **Custom Domain**: Already working
5. **Flexibility**: Can customize to your needs
6. **No Vendor Lock-in**: Using standard APIs

---

## 📚 Next Steps

1. **Review this plan**
2. **Verify Resend webhook capabilities** (check Resend docs)
3. **Start Phase 1**: Database schema + EmailAssistant class
4. **Test email sending** via agent
5. **Set up webhook** for receiving
6. **Test end-to-end flow**

---

**Recommendation**: Build the custom solution. You have everything you need, and it'll save money while giving you more control.

