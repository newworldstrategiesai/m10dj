# 🧪 SMS + OpenAI System Testing Guide

## ✅ Pre-Test Checklist

Before you test, verify:

- [ ] Twilio webhook URL updated to: `https://m10djcompany.com/api/sms/incoming-message`
- [ ] Webhook method set to: POST
- [ ] OPENAI_API_KEY set in Vercel
- [ ] TWILIO_ACCOUNT_SID set in Vercel
- [ ] TWILIO_AUTH_TOKEN set in Vercel
- [ ] TWILIO_PHONE_NUMBER set in Vercel
- [ ] ADMIN_PHONE_NUMBER set in Vercel (your personal number)
- [ ] All environment variables deployed

---

## 📊 Test Scenarios

### Test 1: Basic Message Reception

**What to test:** System receives SMS and sends you admin notification

**Steps:**
1. Open terminal to watch Vercel logs:
   ```bash
   vercel logs --follow
   ```

2. From your phone or friend's phone, text your Twilio number:
   ```
   "Hi, what's your cheapest DJ package?"
   ```

3. **Expected Results (within 30 seconds):**

   **On Your Phone (Admin):**
   - Message 1: Admin notification with:
     ```
     📱 NEW TEXT MESSAGE
     
     👤 From: (901) 555-1234
     ⏰ Time: [current time]
     
     💬 Message:
     "Hi, what's your cheapest DJ package?"
     
     🤖 AI Suggests:
     "Our most affordable option is our Standard Package at $2,000..."
     
     💡 Reply within 60s to override AI
     ```

   **In Vercel Logs:**
   ```
   📱 Incoming SMS from +19015551234: "Hi, what's your cheapest DJ package?"
   🤖 Generating AI preview for admin...
   📋 Fetching customer context...
   ✅ Customer context retrieved
   🧠 Calling OpenAI API...
   ✅ AI preview generated successfully
   📤 Sending enhanced admin notification...
   ✅ Enhanced admin SMS sent successfully
   ```

**If it fails:**
- ❌ No admin notification → Check ADMIN_PHONE_NUMBER format
- ❌ No AI preview → Check OPENAI_API_KEY
- ❌ Webhook not triggered → Verify Twilio webhook URL

---

### Test 2: Customer Auto-Reply

**What to test:** Customer receives instant auto-reply

**Steps:**
1. Use a different phone (friend's number recommended)
2. Text your Twilio number:
   ```
   "Do you do wedding DJs?"
   ```

3. **Expected Results (within 5 seconds):**

   **On Customer's Phone:**
   ```
   Thank you for contacting M10 DJ Company! Ben will respond personally within 30 minutes. For immediate assistance: (901) 497-7001
   ```

**If it fails:**
- ❌ No auto-reply received → Check Vercel logs for errors
- ❌ Wrong auto-reply message → Check `incoming-message.js` lines 117-140

---

### Test 3: AI Response After 60 Seconds

**What to test:** AI response sends automatically after 60 seconds

**Steps:**
1. Text from different number:
   ```
   "What time can you DJ on December 20th?"
   ```

2. You receive admin notification immediately

3. **Wait 60 seconds without replying**

4. **Expected Results:**

   **On Customer's Phone (after 60s):**
   ```
   To check availability for December 20th, I'd love to know more! What type of event is it (wedding, birthday, corporate)? And what time are you thinking?
   ```

   **In Vercel Logs:**
   ```
   ✅ Pending AI response stored in database
   🕐 AI response will be sent by cron job at: [time + 60s]
   ```

**If AI doesn't send after 60 seconds:**
- ❌ Check cron job is running: `GET /api/cron/process-sms-ai`
- ❌ Check `pending_ai_responses` table in Supabase
- ❌ May need manual trigger (see "Trigger AI Response Manually" below)

---

### Test 4: Admin Override (60-Second Window)

**What to test:** You can reply within 60 seconds to block AI and send your own message

**Steps:**
1. Text from different number:
   ```
   "I'm getting married in June!"
   ```

2. You receive admin notification with AI preview

3. **Immediately reply to the admin notification** within 60 seconds:
   ```
   "Congratulations! What date in June?"
   ```

4. **Expected Results:**

   **On Customer's Phone:**
   - Auto-reply: "Thank you for contacting M10..."
   - Your message: "Congratulations! What date in June?"
   - **NO AI response** (it was cancelled)

   **In Vercel Logs:**
   ```
   ✅ Enhanced admin SMS sent successfully
   📤 Sending SMS to customer from admin...
   ✅ Admin override detected - AI response cancelled
   ```

**If override doesn't work:**
- ❌ AI still sends despite your reply → Check override detection logic
- ❌ Customer sees both your reply + AI → Check cancellation logic

---

### Test 5: Database Verification

**What to test:** All data is being stored correctly in Supabase

**Steps:**

1. **Check SMS Conversations:**
   ```sql
   SELECT phone_number, customer_name, message_count, last_message_at
   FROM sms_conversations
   ORDER BY last_message_at DESC
   LIMIT 5;
   ```
   
   Should show your test conversations

2. **Check Pending AI Responses:**
   ```sql
   SELECT phone_number, response_text, execution_time, status
   FROM pending_ai_responses
   WHERE status IN ('pending', 'sent')
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   
   Should show responses with status 'sent'

3. **Check Activity Log:**
   ```sql
   SELECT activity_type, phone_number, timestamp
   FROM activity_log
   WHERE activity_type LIKE 'sms%'
   ORDER BY timestamp DESC
   LIMIT 10;
   ```
   
   Should show sms_received entries

**If database is empty:**
- ❌ Check Supabase connection string
- ❌ Check service role key has correct permissions
- ❌ Verify RLS policies allow writes

---

### Test 6: New vs. Returning Customer

**What to test:** AI recognizes and responds differently to new vs. returning customers

**Test 6A: New Customer**
1. Text from a number NOT in your contacts:
   ```
   "Hi, I'm new here!"
   ```

2. **Expected in Admin Notification:**
   ```
   🤖 AI Suggests:
   "Hi there! Welcome to M10 DJ Company..."
   ```

**Test 6B: Returning Customer**
1. Add a contact to Supabase with phone number and event details
2. Text from that number:
   ```
   "Question about my quote"
   ```

3. **Expected in Admin Notification:**
   ```
   🤖 AI Suggests:
   "Hi [Name]! Great to hear from you about your [Event] event..."
   ```
   
   *(Should reference their previous event)*

**If context isn't recognized:**
- ❌ Phone number format mismatch → Verify format in contacts table
- ❌ Contact not found → Check phone field in database

---

## 🔍 Monitoring Tools

### 1. Vercel Real-Time Logs

```bash
# Watch logs as they happen
vercel logs --follow

# Filter for SMS only
vercel logs --follow | grep -i sms

# Filter for errors
vercel logs --follow | grep -i error
```

### 2. Supabase Dashboard

1. Go to your Supabase project
2. Click "SQL Editor"
3. Create quick query for recent activity:

```sql
SELECT 
  'sms_conversations' as table_name,
  COUNT(*) as record_count,
  MAX(last_message_at) as latest
FROM sms_conversations
UNION ALL
SELECT 
  'pending_ai_responses',
  COUNT(*),
  MAX(created_at)
FROM pending_ai_responses
UNION ALL
SELECT 
  'activity_log',
  COUNT(*),
  MAX(timestamp)
FROM activity_log;
```

### 3. Twilio Console

1. Go to https://console.twilio.com/
2. Click "Logs" → "Messages"
3. See all inbound/outbound messages

---

## 🆘 Troubleshooting During Tests

### Problem: No Admin Notification

**Diagnostics:**
1. Check ADMIN_PHONE_NUMBER is set:
   ```bash
   vercel env pull  # Download environment variables
   grep ADMIN_PHONE_NUMBER .env.local
   ```

2. Check phone format (should be `+19014102020`)

3. Check Vercel logs for error:
   ```
   ❌ Admin SMS failed: [error message]
   ```

4. Test Twilio directly:
   ```bash
   curl -X POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json \
     -d "Body=Test&From={TWILIO_PHONE}&To={ADMIN_PHONE}" \
     -u "{ACCOUNT_SID}:{AUTH_TOKEN}"
   ```

---

### Problem: No AI Preview in Admin Notification

**Diagnostics:**
1. Check OPENAI_API_KEY:
   ```bash
   vercel env pull
   grep OPENAI_API_KEY .env.local
   ```

2. Check Vercel logs for:
   ```
   ❌ AI preview generation failed: [error]
   ```

3. Common errors:
   - `401 Unauthorized` → Invalid API key
   - `429 Rate Limited` → Too many requests
   - `500 Internal Error` → OpenAI service issue

4. Test OpenAI directly:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   ```

---

### Problem: AI Response Never Arrives After 60 Seconds

**Diagnostics:**
1. Check if response is pending:
   ```sql
   SELECT * FROM pending_ai_responses
   WHERE status = 'pending'
   ORDER BY created_at DESC;
   ```

2. Check if execution time passed:
   ```sql
   SELECT 
     phone_number,
     execution_time,
     NOW() as current_time,
     (execution_time <= NOW()) as should_execute
   FROM pending_ai_responses
   WHERE status = 'pending'
   LIMIT 5;
   ```

3. **Manual trigger** (if stuck):
   ```bash
   # Manually call the cron job
   curl -X GET "https://m10djcompany.com/api/cron/process-sms-ai"
   ```

4. Check Vercel cron job logs (if using cron)

---

### Problem: Customer Gets Both Your Reply AND AI Response

**Diagnostics:**
1. Check if override detection is working:
   ```bash
   vercel logs --follow | grep "override"
   ```

2. Check database for admin response:
   ```sql
   SELECT * FROM activity_log 
   WHERE activity_type = 'admin_override'
   ORDER BY timestamp DESC
   LIMIT 5;
   ```

3. Look for this in logs:
   ```
   ✅ Admin override detected - AI response cancelled
   ```

If not present, override logic needs fixing.

---

## 📋 Full Test Checklist

Use this to track all tests:

- [ ] **Test 1:** Message reception & admin notification
- [ ] **Test 2:** Customer receives auto-reply  
- [ ] **Test 3:** AI response after 60 seconds
- [ ] **Test 4:** Admin override within 60 seconds
- [ ] **Test 5:** Database entries created correctly
- [ ] **Test 6A:** New customer recognized by AI
- [ ] **Test 6B:** Returning customer gets context

---

## 🎯 Success Criteria

You'll know it's working when:

✅ You text → Immediate admin notification with AI preview  
✅ Customer texts → Instant auto-reply received  
✅ 60 seconds pass → Customer gets AI response (if you didn't reply)  
✅ You reply within 60s → Customer gets your reply, AI cancelled  
✅ Database has records → Check Supabase tables  
✅ Vercel logs show flow → All steps logged  

---

## 📝 Test Results Template

After running tests, fill this out:

```
Date: __________
Tester: __________

Test 1 (Reception): ✅ PASS / ❌ FAIL
  Notes: ________________________________

Test 2 (Auto-Reply): ✅ PASS / ❌ FAIL
  Notes: ________________________________

Test 3 (AI Response): ✅ PASS / ❌ FAIL
  Notes: ________________________________

Test 4 (Override): ✅ PASS / ❌ FAIL
  Notes: ________________________________

Test 5 (Database): ✅ PASS / ❌ FAIL
  Notes: ________________________________

Test 6 (Customer Context): ✅ PASS / ❌ FAIL
  Notes: ________________________________

Overall Status: ✅ READY / ❌ NEEDS FIXES

Issues to Fix:
1. ____________________________
2. ____________________________
3. ____________________________
```

---

## 🚀 Next Steps

1. Run through all test scenarios
2. Document any failures
3. Check logs for errors
4. Fix any issues
5. Re-test failed scenarios
6. Once all pass → Ready for production!

Good luck! 🎵

