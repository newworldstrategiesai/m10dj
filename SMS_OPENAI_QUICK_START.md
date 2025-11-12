# 🚀 SMS + OpenAI Quick Start Card

## ⚡ TL;DR - What You Have

Your Twilio number automatically responds to texts using OpenAI's ChatGPT, with a 60-second window for you to take over.

---

## ✅ Verification Checklist

- [ ] OPENAI_API_KEY set in Vercel
- [ ] TWILIO_ACCOUNT_SID set in Vercel
- [ ] TWILIO_AUTH_TOKEN set in Vercel
- [ ] TWILIO_PHONE_NUMBER set in Vercel
- [ ] ADMIN_PHONE_NUMBER set in Vercel
- [ ] Twilio webhook set to: `https://m10djcompany.com/api/sms/incoming-message`
- [ ] Customer phone number exists in contacts table

---

## 🧪 Test It

### Step 1: Send Test SMS
Text your Twilio number (e.g., +1 (914) 555-1234)

### Step 2: You Receive
- ✅ Instant auto-reply within seconds
- ✅ Admin notification on your phone
- ✅ AI preview of what will be sent

### Step 3: What Happens Next
- **If you reply within 60 seconds:** AI cancels, you're in control
- **If you wait 60 seconds:** AI sends pre-generated response

---

## 🎯 Sample Test Flow

```
You text to business number:
"Hi, I need a DJ for my wedding June 15th"

[INSTANT - 0 seconds]
You get: "Thank you for contacting M10! We'll respond shortly."

[Within 60 seconds]
You get admin notification with:
- Customer message
- AI response preview
- Option to reply

[60 seconds passed]
If you didn't reply → Customer gets AI response
If you did reply → Your message sent instead
```

---

## 🔧 Quick Config Check

### Vercel Environment Variables

```bash
vercel env ls
```

Should show:
- ✅ OPENAI_API_KEY
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN
- ✅ TWILIO_PHONE_NUMBER
- ✅ ADMIN_PHONE_NUMBER

### Twilio Webhook

1. Go to: https://console.twilio.com/phone-numbers/
2. Click your number
3. Check "A Message Comes In" webhook:
   ```
   https://m10djcompany.com/api/sms/incoming-message
   ```
   Method: POST

### Database Tables

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contacts', 'sms_conversations', 'activity_log');
```

---

## 📊 Monitor Conversations

```sql
-- View recent messages
SELECT 
  phone_number,
  created_at,
  message_count,
  last_message_at
FROM sms_conversations
ORDER BY last_message_at DESC
LIMIT 10;

-- View specific phone
SELECT * FROM sms_conversations
WHERE phone_number = '+1XXXXXXXXXX'
ORDER BY created_at DESC;
```

---

## 🎨 Customize AI

Edit `/utils/chatgpt-sms-assistant.js` - `buildSystemPrompt()` function:

1. Change tone/personality
2. Add business-specific info
3. Adjust response style
4. Set pricing examples
5. Add call-to-action

---

## ⚙️ Adjust Timing

Change 60-second delay in `/pages/api/sms/incoming-message.js`:

```javascript
const delayMs = 60000; // Change this (in milliseconds)
// 30000 = 30 seconds
// 120000 = 2 minutes
```

---

## 🐛 Troubleshooting

| Problem | Check |
|---------|-------|
| No webhook triggered | Verify Twilio URL is correct and domain is live |
| No AI response | Check OPENAI_API_KEY is set |
| Wrong customer identified | Verify phone format: +1XXXXXXXXXX |
| Responses cut off | SMS auto-splits at 160 chars - normal |
| No admin notification | Check ADMIN_PHONE_NUMBER is set |

---

## 📱 Example Prompts to Test

1. **Pricing question:**
   "What's the cheapest DJ package you offer?"

2. **Date/event question:**
   "I need a DJ for a wedding July 4th, 2026"

3. **Service question:**
   "Do you do uplighting?"

4. **Follow-up (if contact exists):**
   "Hey, question about my quote"

---

## 🎯 Success Indicators

✅ You're getting SMS notifications  
✅ AI preview shows in admin message  
✅ Customer gets auto-reply  
✅ AI response arrives after 60 seconds  
✅ You can reply to take over  
✅ Responses are relevant to questions  

---

## 📞 Files to Know

- **SMS Handler:** `/pages/api/sms/incoming-message.js`
- **AI Logic:** `/utils/chatgpt-sms-assistant.js`
- **System Prompt:** `buildSystemPrompt()` function
- **Database:** Supabase tables (contacts, sms_conversations, activity_log)

---

**Status:** ✅ Ready to Test  
**Cost:** ~$0.05 per conversation  
**Setup Time:** 5 minutes for config check

