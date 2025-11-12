# Manual Testing Walkthrough - AI Assistant Features

## 🧪 Manual Test Plan

Follow these steps to manually test the AI Assistant features in your local environment.

---

## Part 1: Setup Verification

### Step 1: Verify Development Server

```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000`

### Step 2: Verify API Keys

Check that these are set in `.env.local`:
- `OPENAI_API_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

### Step 3: Verify Database Migration

In Supabase SQL Editor, run:

```sql
SELECT * FROM sms_conversations LIMIT 1;
```

Expected: Table exists (may be empty, that's fine)

---

## Part 2: Web Chat Testing

### Test 2.1: Form to Chat Transformation

1. Go to `http://localhost:3000` (homepage with lead form)
2. Find the "Get Your Free Quote" contact form
3. Fill out the form:
   - **Name:** `Test Customer`
   - **Email:** `test@example.com`
   - **Phone:** `(901) 555-1234`
   - **Event Type:** `Wedding`
   - **Event Date:** `2025-12-15`
   - **Guest Count:** `150`
   - **Venue:** `The Grand Ballroom`
   - **Message:** `We want something elegant and upscale`

4. Click "Get My Free Quote"

Expected outcomes:
- ✅ Form disappears
- ✅ Chat interface appears
- ✅ Chat has header with "M10 DJ Assistant" and green "Online now" indicator
- ✅ AI greeting appears: "👋 Hey Test Customer!..."
- ✅ No errors in browser console

**Screenshot moment:** Capture the chat interface appearing

---

### Test 2.2: Chat Message Sending

1. In the chat, type a message:
   ```
   What's your cheapest package?
   ```

2. Click the send button (📤 icon) or press Enter

Expected outcomes:
- ✅ Your message appears in chat bubble (right side, brand color)
- ✅ Message shows timestamp
- ✅ Loading indicator appears ("Assistant is thinking...")
- ✅ AI response appears within 5 seconds
- ✅ Response is contextual about packages and pricing
- ✅ Chat auto-scrolls to latest message

**Expected AI response something like:**
> "Our most affordable option is Package 1 at $2,000, which includes DJ/MC, speakers, and dance lighting. But let me ask - what's the vibe you're going for? That might help me suggest the perfect fit."

---

### Test 2.3: Multi-Turn Conversation

1. Send another message:
   ```
   It's a formal wedding with 150 guests
   ```

2. Wait for response

Expected outcomes:
- ✅ AI remembers previous context
- ✅ Response references wedding and guest count
- ✅ Conversation feels natural and flowing
- ✅ No previous messages disappeared

**Expected something like:**
> "Perfect! For a formal wedding with 150 guests, I'd recommend Package 2 or Package 3. Package 2 is $2,500 and includes ceremony audio and monogram projection. Package 3 is $3,000 and has everything..."

---

### Test 2.4: Mobile Responsiveness

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Set to iPhone 12
4. Send a chat message

Expected outcomes:
- ✅ Chat displays full-screen on mobile
- ✅ Input field is accessible
- ✅ Keyboard doesn't cover message
- ✅ Messages are readable
- ✅ Buttons are large enough to tap

---

### Test 2.5: Dark Mode

1. In DevTools, go to Settings (⚙️)
2. Rendering → Emulate CSS media feature prefers-color-scheme
3. Select "dark"
4. Send a message

Expected outcomes:
- ✅ Chat background is dark
- ✅ Text is light/readable
- ✅ Your messages still show in brand color
- ✅ Bot messages are light gray on dark background
- ✅ All elements are visible

---

### Test 2.6: Error Handling

1. Disconnect internet (dev tools → Network → Offline)
2. Send a message
3. Wait 10 seconds
4. Reconnect internet

Expected outcomes:
- ✅ Loading indicator shows
- ✅ Fallback message appears (not an error)
- ✅ Fallback is contextual and helpful
- ✅ Chat doesn't crash
- ✅ Can still send more messages

**Expected fallback:**
> "That's a great question! Ben is going to love discussing this with you in detail. Is there anything else I can help with?"

---

## Part 3: SMS Testing (Optional - Requires Twilio)

If you have Twilio set up, follow these steps:

### Test 3.1: SMS Webhook Setup

**Requirements:**
- Twilio account with phone number
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env.local`
- ngrok tunnel for localhost

**Setup ngrok:**

```bash
ngrok http 3000
# You'll get: https://xxxxx.ngrok.io
```

**Configure Twilio webhook:**

1. Go to Twilio Console → Phone Numbers → Your Number
2. Messaging → A Message Comes In → Webhook
3. URL: `https://xxxxx.ngrok.io/api/leads/sms`
4. Method: POST
5. Save

### Test 3.2: Send Test SMS

1. Text your Twilio number:
   ```
   Hi, what are your packages?
   ```

2. Wait 5 seconds for response

Expected outcomes:
- ✅ You receive SMS response
- ✅ Response mentions packages
- ✅ Response is short (fits in SMS)
- ✅ Check server logs for success message

---

## Part 4: Browser Console Checks

Throughout testing, check browser console (F12 → Console tab) for:

### Expected Console Messages

✅ **On form submission:**
```
📤 Submitting service selections: {...}
```

✅ **On chat message send:**
```
📤 Sending message to AI assistant...
📥 Response: { status: 200, data: {...} }
✅ Submission successful!
```

### NOT Expected (red flags):

❌ Any `Uncaught Error` messages
❌ `undefined is not a function`
❌ CORS errors
❌ Network errors
❌ 404 or 500 errors

---

## Part 5: Database Verification

After chat interaction, verify data was saved:

In Supabase SQL Editor:

```sql
-- Check if SMS conversations table has data
SELECT COUNT(*) as total_conversations
FROM sms_conversations;

-- See latest conversation
SELECT phone_number, last_message_at, conversation_status
FROM sms_conversations
ORDER BY last_message_at DESC
LIMIT 1;
```

Expected:
- ✅ Table exists
- ✅ May have SMS test data if SMS was tested
- ✅ Timestamps are recent

---

## 📋 Test Results Checklist

Mark these off as you complete tests:

### Web Chat Tests
- [ ] Form → Chat transformation works
- [ ] Chat header displays correctly
- [ ] AI greeting appears
- [ ] Can send messages
- [ ] AI responses are contextual
- [ ] Multi-turn conversation works
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Error handling works
- [ ] No console errors

### SMS Tests (Optional)
- [ ] Webhook receives SMS
- [ ] AI responds via SMS
- [ ] Response is SMS-appropriate length
- [ ] Data saved to database

### Database Tests
- [ ] SMS conversations table exists
- [ ] Data is being saved
- [ ] Timestamps are correct

---

## 🐛 Common Issues & Solutions

### Issue: Chat doesn't appear after form submission

**Cause:** Form submission failed
**Solution:**
1. Check browser console for errors
2. Verify NEXT_PUBLIC_SUPABASE_URL is correct
3. Check network tab for failed API calls

### Issue: AI response never appears

**Cause:** OpenAI API issue
**Solution:**
1. Verify OPENAI_API_KEY is correct
2. Check server logs for API errors
3. Verify API key has GPT-4 access
4. Check OpenAI account has available balance

### Issue: Chat loads but no greeting appears

**Cause:** Component initialization issue
**Solution:**
1. Check for JavaScript errors in console
2. Verify ContactFormChat component imported correctly
3. Try refreshing the page

### Issue: SMS not received

**Cause:** Twilio webhook not configured
**Solution:**
1. Verify webhook URL is correct
2. Check Twilio logs: https://www.twilio.com/console/sms/logs
3. Verify ngrok tunnel is running
4. Test webhook manually with curl

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Form filled out
- [ ] Chat appearing
- [ ] AI greeting visible
- [ ] Multi-turn conversation
- [ ] Mobile view
- [ ] Dark mode
- [ ] Error fallback (if possible)
- [ ] SMS response (if testing)

---

## ✅ Sign-Off

Once all tests pass, you can sign off:

```
✅ Web Chat: WORKING
✅ SMS Integration: READY (or WORKING if tested)
✅ Error Handling: WORKING
✅ Responsive Design: WORKING
✅ Database: WORKING

Status: READY FOR PRODUCTION
```

---

**Test Date:** _______________  
**Tester Name:** _______________  
**Issues Found:** _______________  
**Notes:** _______________


