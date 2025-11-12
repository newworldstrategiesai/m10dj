# ✅ Inbound SMS for OpenAI Assistant - Complete Setup Guide

## 🎉 Current Status

You already have a **fully functional inbound SMS + OpenAI system** set up! Here's what's currently active:

### ✅ What's Working

1. **Inbound SMS Webhook** - `/api/sms/incoming-message`
   - Receives messages from Twilio
   - Sends instant auto-reply to customer
   - Extracts customer context from database
   - Generates AI preview for admin notification

2. **OpenAI Integration** - `utils/chatgpt-sms-assistant.js`
   - Uses GPT-4o-mini model (cost-effective)
   - Maintains conversation history
   - Extracts lead information from messages
   - Sends context-aware responses

3. **Smart Two-Response System**
   - **Instant Auto-Reply** (0 seconds) - Professional immediate response
   - **Delayed AI Response** (60 seconds) - Allows you to take over if needed
   - Admin override - Just reply within 60 seconds to prevent AI response

4. **Database Integration** - Supabase
   - Tracks SMS conversations (`sms_conversations` table)
   - Stores customer context (`contacts` table)
   - Logs all activity

---

## 📱 How It Currently Works

### Customer Experience

```
Customer texts +1(XXXX)XXX-XXXX
        ↓
[INSTANT - 0 seconds]
✅ Customer gets immediate auto-reply
✅ You get enhanced notification with AI preview

[60 seconds later]
If you didn't reply, AI engages with context-aware response
If you replied, AI stays out of the way
```

### Admin Experience

1. Get SMS notification with:
   - Customer phone number
   - Their message
   - **AI preview of what would be sent**
   - Option to take over conversation

2. You have **60 seconds** to reply and prevent AI

3. If you don't reply, AI automatically sends the pre-generated response

---

## 🔧 Required Configuration

### 1. Environment Variables (Vercel)

Make sure these are set in your Vercel project:

```env
# OpenAI API Key
OPENAI_API_KEY=sk_your_openai_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Admin Notifications
ADMIN_PHONE_NUMBER=your_admin_number

# Site URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Twilio Webhook Configuration

In Twilio Console:

1. Go to: Phone Numbers → Manage → Active Numbers
2. Click your M10 DJ number
3. Scroll to "Messaging"
4. Set "A Message Comes In" webhook to:
   ```
   https://m10djcompany.com/api/sms/incoming-message
   ```
5. Method: **POST**
6. Save

### 3. Database Tables

The system uses these tables:
- `contacts` - Customer information
- `sms_conversations` - Message history
- `activity_log` - All interactions

All tables are already created in your Supabase project.

---

## 🚀 Testing the System

### Local Testing (with ngrok)

```bash
# 1. Start ngrok tunnel
ngrok http 3000

# 2. Update Twilio webhook to your ngrok URL:
# https://xxxxx.ngrok.io/api/sms/incoming-message

# 3. Text your Twilio number
# Watch server logs for responses
```

### Production Testing

1. **Send a test SMS** to your Twilio number
2. **You should receive:**
   - Immediate auto-reply (0 seconds)
   - Admin notification with AI preview
   - AI response after 60 seconds (if you don't reply)

3. **Verify in logs:**
   ```
   📱 Incoming SMS from +1XXXXXXXXXX: "Message text"
   🤖 Generating AI preview for admin...
   ✅ AI preview generated successfully
   📤 Sending enhanced admin notification...
   ```

---

## 🤖 Customizing the AI Assistant

### Change System Prompt

Edit `/utils/chatgpt-sms-assistant.js` - `buildSystemPrompt()` function:

```javascript
function buildSystemPrompt(context) {
  const customerInfo = context.isExistingCustomer 
    ? `You're talking to ${context.customerName}. They previously booked a ${context.eventType} event.`
    : `You're meeting this customer for the first time.`;

  return `You are a friendly DJ service assistant for M10 DJ Company.
${customerInfo}

IMPORTANT RULES:
- Keep responses SHORT (SMS friendly, under 160 characters when possible)
- Use friendly, professional tone
- Include relevant emojis
- Ask qualifying questions naturally
- Never make firm commitments - always say "Ben will follow up"
- If complex question, suggest calling (901) 410-2020

ABOUT OUR SERVICES:
- Package 1: $2,000 (4hr DJ/MC, speakers, basic lighting)
- Package 2: $2,500 (Package 1 + ceremony audio + monogram)
- Package 3: $3,000 (Full service with uplighting)
- Can customize based on needs

Always be helpful and try to move toward booking a consultation with Ben.`;
}
```

### Change Response Length

In `/utils/chatgpt-sms-assistant.js` - `generateAIResponse()`:

```javascript
body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [...],
  max_tokens: 300,  // ← Adjust this (higher = longer responses)
  temperature: 0.7,  // ← Lower = more consistent, higher = more creative
})
```

### Change Delay Timer

In `/pages/api/sms/incoming-message.js`, look for:

```javascript
const delayMs = 60000; // 60 seconds - change to whatever you want
```

---

## 📊 Monitoring & Analytics

### View All SMS Conversations

```sql
SELECT 
  phone_number,
  customer_name,
  message_count,
  last_message_at,
  conversation_status
FROM sms_conversations
ORDER BY last_message_at DESC;
```

### View Specific Customer

```sql
SELECT * FROM sms_conversations
WHERE phone_number = '+1XXXXXXXXXX'
ORDER BY created_at DESC;
```

### Track AI Response Times

```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as message_count,
  AVG(response_time_ms) as avg_response_time
FROM activity_log
WHERE activity_type = 'sms_received'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

---

## 🔐 Security Features

### ✅ Already Implemented

1. **Twilio Signature Validation** - All webhooks from Twilio are verified
2. **Rate Limiting** - Prevents SMS flooding
3. **Service Role Authentication** - Uses Supabase service role for database
4. **Error Handling** - Graceful fallbacks if AI fails
5. **Activity Logging** - All interactions are logged

### Additional Security (Optional)

Add rate limiting per customer:

```javascript
const MAX_SMS_PER_MINUTE = 3;
const now = new Date();
const recentMessages = messageHistory.filter(msg => {
  const msgTime = new Date(msg.timestamp);
  return (now.getTime() - msgTime.getTime()) < 60000;
});

if (recentMessages.length >= MAX_SMS_PER_MINUTE) {
  return "Whoa, slow down! 😄 We're processing your messages!";
}
```

---

## 💰 Pricing Breakdown

### Monthly Costs (100 SMS conversations)

| Service | Rate | Usage | Cost |
|---------|------|-------|------|
| Twilio Inbound | $0.0075/msg | 100 msgs | $0.75 |
| Twilio Outbound | $0.0075/msg | ~300 msgs | $2.25 |
| OpenAI GPT-4o-mini | ~$0.00015/token | ~15k tokens | $2.25 |
| **Total** | | | **~$5.25** |

---

## 🆘 Troubleshooting

### Problem: SMS not triggering webhook

**Check:**
- ✅ Webhook URL is correct in Twilio console
- ✅ URL is publicly accessible
- ✅ Method is POST

**Test:**
```bash
curl -X POST https://m10djcompany.com/api/sms/incoming-message \
  -d "From=+1XXXXXXXXXX&To=+1XXXXXXXXXX&Body=Test&MessageSid=test"
```

### Problem: No AI response

**Check:**
- ✅ `OPENAI_API_KEY` is set in Vercel
- ✅ Customer exists in contacts table or initial message works
- ✅ Check Vercel function logs for errors

**View logs:**
```bash
vercel logs --follow  # Real-time logs
```

### Problem: Responses being cut off

- SMS has 160 character limit
- Messages auto-split across multiple texts
- Check all message chunks arrive

### Problem: Wrong customer identified

**Fix:**
- Make sure phone numbers in contacts table match exactly
- Check phone number format: `+1XXXXXXXXXX`
- Run: 
```sql
SELECT DISTINCT phone FROM contacts 
WHERE phone ILIKE '%' || '9145551234' || '%';
```

---

## 📞 Feature Ideas

### 1. Add Appointment Booking
Modify system prompt to suggest booking directly via text:

```javascript
"To schedule a consultation, just text back:
📅 Date (e.g., Dec 15)
⏰ Time (e.g., 2pm)
📍 Venue (optional)"
```

### 2. Add Quick Replies
Preset responses for common questions:

```javascript
const quickReplies = {
  'pricing': 'Our packages range $2k-$3k. Happy to customize!',
  'available': 'We typically book 2-3 months in advance.',
  'contact': 'Call Ben at (901) 410-2020 for direct consultation'
};
```

### 3. Add Lead Scoring
Track engagement metrics:

```javascript
const leadScore = {
  messageCount: messages.length,
  responseTime: averageResponseTime,
  eventType: context.eventType,
  budget: context.budget ? 'qualified' : 'unqualified'
};
```

### 4. Add Escalation Rules
Automatically escalate complex questions:

```javascript
const escalationKeywords = ['contract', 'special request', 'ceremony', 'ceremony'];
if (escalationKeywords.some(k => Body.toLowerCase().includes(k))) {
  // Skip AI, forward directly to Ben
}
```

---

## 🎯 Next Steps

1. **Test the current system** - Send yourself a text
2. **Customize the AI prompt** - Edit to match your voice
3. **Adjust the delay timer** - Change from 60s to whatever works
4. **Monitor conversations** - Watch logs for quality
5. **Refine over time** - Improve responses based on real interactions

---

## 📚 Related Documentation

- `TWILIO_SMS_ASSISTANT_SETUP.md` - Detailed Twilio setup
- `SMART_SMS_SYSTEM_SETUP.md` - Admin override feature
- `CHATGPT_SMS_SETUP.md` - AI customization guide

---

## ✨ Summary

You have a **production-ready** inbound SMS system that:

✅ Receives texts on your Twilio number  
✅ Sends instant auto-replies  
✅ Generates AI responses with customer context  
✅ Notifies you with AI preview  
✅ Lets you override AI within 60 seconds  
✅ Tracks all conversations  
✅ Costs ~$5/month for 100 conversations  

**No additional setup needed - it's ready to go!**

---

**Status:** ✅ Production Ready  
**Last Updated:** November 12, 2025  
**Components:** Twilio + OpenAI + Supabase

