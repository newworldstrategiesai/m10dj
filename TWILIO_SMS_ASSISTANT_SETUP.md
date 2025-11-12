# Twilio SMS AI Assistant - Setup Guide

## 🤖 Overview

The AI assistant now handles SMS conversations via Twilio! Leads can text your Twilio number and get intelligent responses from the AI assistant, which can also escalate to Ben for complex questions.

---

## 📱 How It Works

### SMS Flow

```
Lead texts your Twilio number
    ↓
Twilio webhook sends to /api/leads/sms
    ↓
Find contact by phone number
    ↓
Load conversation history
    ↓
Add user message to history
    ↓
Send to OpenAI with SMS context
    ↓
Get AI response
    ↓
Split into SMS chunks (160 chars)
    ↓
Send back via Twilio
    ↓
Save conversation to database
    ↓
Lead receives responses
```

### Features

✅ Intelligent SMS responses  
✅ Conversation history tracking  
✅ Multi-message support (SMS chunks)  
✅ Lead identification by phone  
✅ Automatic follow-ups  
✅ SMS-optimized prompts  
✅ Fallback responses on errors  
✅ Activity logging  

---

## ⚙️ Setup Steps

### 1. Create Twilio Account

1. Go to https://www.twilio.com/console/
2. Sign up or log in
3. Get a Twilio phone number (if you don't have one)
4. Save your phone number (e.g., `+19145551234`)

### 2. Get Twilio Credentials

1. Go to https://www.twilio.com/console
2. Find "Account SID" (starts with `AC`)
3. Find "Auth Token" (long string)
4. Copy both values

### 3. Add Environment Variables

Add to `.env.local`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+19145551234

# OpenAI (for SMS responses)
OPENAI_API_KEY=sk_xxxxxxxxxxxxx
```

### 4. Create Database Table

Run the migration to create `sms_conversations` table:

```bash
# Option 1: Use Supabase UI
# Go to SQL Editor and paste migration SQL

# Option 2: Use Supabase CLI
supabase migration up

# Option 3: Run SQL directly
# Copy content from supabase/migrations/20250115000000_create_sms_conversations.sql
# Paste into Supabase SQL editor and run
```

### 5. Configure Twilio Webhook

1. Go to https://www.twilio.com/console/phone-numbers/
2. Click your phone number
3. Scroll to "Messaging"
4. Find "A Message Comes In"
5. Set to "Webhook"
6. Enter URL:
   ```
   https://m10djcompany.com/api/leads/sms
   ```
   (Replace with your actual domain)
7. Method: POST
8. Click "Save"

### 6. Vercel Deployment

1. Go to Vercel Project Settings → Environment Variables
2. Add each variable:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `OPENAI_API_KEY`
3. Set to all environments
4. Redeploy project

---

## 🧪 Testing

### Local Testing (with ngrok tunnel)

```bash
# 1. Install ngrok
brew install ngrok

# 2. Start ngrok tunnel
ngrok http 3000
# You'll get: https://xxxxx.ngrok.io

# 3. Set TWILIO webhook to:
# https://xxxxx.ngrok.io/api/leads/sms

# 4. Send SMS to your Twilio number
# Watch server logs for responses
```

### Production Testing

1. **Make sure contact exists:**
   - Contact must have matching phone number
   - Phone format: `+19145551234`

2. **Send test SMS:**
   - Text your Twilio number
   - Wait for response
   - Check if AI responds naturally

3. **Verify database:**
   ```sql
   SELECT * FROM sms_conversations;
   SELECT * FROM activity_log WHERE activity_type = 'sms_received';
   ```

### Debugging

**Check server logs for:**
```
📱 SMS received from +19145551234: "What's your cheapest package?"
📤 Sending SMS to OpenAI...
✅ SMS response sent to +19145551234
```

**Check Twilio logs:**
- Go to https://www.twilio.com/console/sms/logs
- See all received and sent messages
- Check delivery status

**Check database:**
```sql
-- View all conversations
SELECT contact_id, phone_number, last_message_at, last_message_from
FROM sms_conversations
ORDER BY last_message_at DESC;

-- View specific conversation
SELECT messages
FROM sms_conversations
WHERE contact_id = 'xxxxx-xxxxx-xxxxx'
LIMIT 1;
```

---

## 📊 SMS Conversation Structure

### Message Format

```json
{
  "role": "user",
  "content": "What packages do you offer?",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Full Conversation Example

```json
[
  {
    "role": "user",
    "content": "Hi! What's your cheapest package?",
    "timestamp": "2025-01-15T10:00:00Z"
  },
  {
    "role": "assistant",
    "content": "Hey! Our most affordable is Package 1 at $2,000 - includes 4hr DJ/MC, speakers, and lighting. What vibe are you going for?",
    "timestamp": "2025-01-15T10:01:00Z"
  },
  {
    "role": "user",
    "content": "It's a wedding, pretty formal",
    "timestamp": "2025-01-15T10:05:00Z"
  },
  {
    "role": "assistant",
    "content": "Perfect! For a formal wedding, I'd recommend Package 2 or 3 - they include ceremony audio and monogram projection. Want details?",
    "timestamp": "2025-01-15T10:06:00Z"
  }
]
```

---

## 🔧 Customization

### Change SMS Prompt

File: `/pages/api/leads/sms.ts`

Function: `buildSMSSystemPrompt()`

```javascript
function buildSMSSystemPrompt(leadData: any): string {
  return `You are a friendly lead assistant...
  
  // Edit this section
  GUIDELINES:
  - Keep responses SHORT
  - Use friendly tone
  - Include emojis
  - Answer about packages
`;
}
```

### Adjust Response Length

```javascript
max_tokens: 150, // Change this for longer/shorter responses
```

### Change Fallback Responses

```javascript
function getFallbackSMSResponse(): string {
  const responses = [
    "Your custom message here",
    "Another fallback response",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
```

---

## 💬 Example Conversations

### Scenario 1: Package Question

```
Lead: What's included in your packages?
AI:   Package 1 ($2k): 4hr DJ/MC, speakers, dance lighting. Package 2 ($2.5k): + ceremony audio & monogram. Package 3 ($3k): Full service! 🎵

Lead: Which is best for 150 guests?
AI:   For 150 guests, Package 2 or 3 would be perfect. Gives you plenty of sound coverage. What's your budget range?

Lead: Around $3000
AI:   Perfect! Package 3 is $3k and includes everything. Ben will call you tomorrow to finalize! 🎉
```

### Scenario 2: Unknown Number

```
Lead: Hi, do you do DJ services?
AI:   👋 Hi! Thanks for reaching out to M10 DJ Company! To help you better, could you reply with your name? Or visit m10djcompany.com/contact to tell us about your event.
```

### Scenario 3: Complex Question

```
Lead: Can you do a special choreography entrance?
AI:   Great idea! That's something Ben can absolutely discuss with you. Give us a call at (901) 410-2020 to chat about your vision! 💬
```

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

```sql
-- Total SMS conversations
SELECT COUNT(*) as total_conversations
FROM sms_conversations;

-- Active conversations
SELECT COUNT(*) as active
FROM sms_conversations
WHERE conversation_status = 'active';

-- Average messages per conversation
SELECT AVG(array_length(messages, 1)) as avg_messages
FROM sms_conversations;

-- Busiest times
SELECT DATE_TRUNC('hour', last_message_at) as hour,
       COUNT(*) as message_count
FROM sms_conversations
GROUP BY DATE_TRUNC('hour', last_message_at)
ORDER BY hour DESC;
```

### Set Twilio Alerts

1. Go to Twilio Console
2. Settings → Alerts
3. Set SMS volume alerts
4. Get notified of unusual activity

---

## 🔐 Security

### Rate Limiting

Consider adding to `/pages/api/leads/sms.ts`:

```javascript
// Prevent SMS flooding
const MAX_SMS_PER_MINUTE = 3;
const now = new Date();
const recentMessages = messageHistory.filter(msg => {
  const msgTime = new Date(msg.timestamp);
  return (now.getTime() - msgTime.getTime()) < 60000; // Last minute
});

if (recentMessages.length >= MAX_SMS_PER_MINUTE) {
  return "Whoa, slow down! 😄 We're processing your messages. Check your inbox for responses!";
}
```

### Webhook Validation

Twilio signs all webhooks. Add validation:

```javascript
const twilio = require('twilio');

// In handler, verify signature:
const twilioSignature = req.headers['x-twilio-signature'];
const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN,
  twilioSignature,
  process.env.TWILIO_WEBHOOK_URL,
  req.body
);

if (!isValid) {
  return res.status(403).json({ error: 'Invalid signature' });
}
```

---

## 💰 Pricing

### Twilio SMS Costs

- Inbound SMS: $0.0075 per message
- Outbound SMS: $0.0075 per message
- Typical conversation: 5 messages × $0.015 = $0.075

### OpenAI Costs (Same as Chat)

- Average response: ~100 tokens = $0.003
- Per conversation: ~$0.015

### Total Cost Per Lead SMS Conversation

Roughly **$0.09** per lead (5 messages)

With 100 SMS conversations/month:
- **$9/month** for SMS
- **$5/month** for AI
- **$14/month total**

---

## 🆘 Troubleshooting

### Problem: SMS webhook not receiving messages

**Check:**
1. Webhook URL is correct and public
2. URL is accessible (test in browser)
3. Domain is live (not localhost)
4. Twilio webhook is enabled

**Solution:**
```bash
# Test webhook with curl
curl -X POST https://m10djcompany.com/api/leads/sms \
  -d "From=+19145551234&To=+19998887777&Body=Test"
```

### Problem: AI not responding

**Check:**
1. `OPENAI_API_KEY` is set and valid
2. Contact exists with matching phone number
3. Check server logs for errors

**Solution:**
1. Verify environment variables
2. Check OpenAI dashboard for usage
3. Test with fallback responses first

### Problem: SMS being cut off

**Details:**
- SMS has 160 character limit
- Longer messages auto-split
- Check `splitSMSMessage()` function

**Solution:**
- Messages are split by word boundaries
- All chunks are sent automatically
- Verify all chunks arrive

---

## 📞 Support

**Twilio Issues:**
- https://www.twilio.com/console/support
- Check SMS logs for delivery issues

**OpenAI Issues:**
- https://platform.openai.com/account/help/summary

**Database Issues:**
- Check Supabase logs
- Verify `sms_conversations` table exists

---

## 🚀 Next Steps

1. ✅ Get Twilio account and credentials
2. ✅ Add environment variables
3. ✅ Create database table
4. ✅ Configure Twilio webhook
5. ✅ Deploy to production
6. ✅ Test with SMS
7. ✅ Monitor conversations
8. ✅ Optimize responses

---

**Status:** ✅ Ready for Testing  
**Last Updated:** Today  
**Components:** Twilio + OpenAI + Supabase


