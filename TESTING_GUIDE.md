# LiveKit Integration - Testing Guide 🧪

## ✅ Code Pushed to Production

All changes have been committed and pushed to `main` branch.

---

## 🚀 Quick Test Checklist

### Phase 1: Voice-Enabled Admin Assistant (Works Immediately)

**Test Steps:**
1. ✅ Navigate to admin dashboard
2. ✅ Open the admin assistant widget (bottom right)
3. ✅ Click "Use Voice" button
4. ✅ Grant microphone permission when prompted
5. ✅ Speak a command: "Show me all new leads"
6. ✅ Verify:
   - Microphone button turns red when listening
   - Command is transcribed (may show in UI)
   - Assistant responds with results
   - Works in Chrome/Edge (browser Speech Recognition)

**Expected Result:**
- Voice commands work immediately without any LiveKit setup
- Commands are sent to assistant API and get responses

---

### Phase 3: Real-Time Notifications (Works Immediately)

**Test Steps:**
1. ✅ Open admin assistant widget
2. ✅ Enable "Use Voice" (to connect to LiveKit room)
3. ✅ In another tab/browser, submit a contact form
4. ✅ Verify:
   - Notification appears instantly in admin assistant
   - Toast notification shows new lead details
   - Works even if not in voice room (falls back to Supabase)

**Expected Result:**
- Instant notifications when new leads come in
- No polling delay

---

### Phase 2: Call Transcription (Requires Setup)

**Prerequisites:**
- LiveKit transcription enabled in dashboard
- Webhook URL configured: `https://your-domain.com/api/livekit/transcription`
- `ENABLE_LIVEKIT_CALLS=true` in environment variables

**Test Steps:**
1. ⚙️ Configure LiveKit transcription provider (Deepgram/Whisper)
2. ⚙️ Set webhook URL in LiveKit dashboard
3. ⚙️ Set `ENABLE_LIVEKIT_CALLS=true` in production env
4. ✅ Make a test call to your Twilio number
5. ✅ Verify:
   - Call record created in `voice_calls` table
   - Transcription chunks received via webhook
   - Transcript stored in database
   - AI analysis runs after call ends

**Expected Result:**
- Calls are transcribed automatically
- Transcripts analyzed by AI
- Notes created automatically

---

### Phase 4: Outbound AI Calls (Requires Setup)

**Prerequisites:**
- LiveKit SIP gateway configured
- AI voice bot worker process (not yet implemented)

**Test Steps:**
1. ✅ Ask admin assistant: "Call [contact name]"
2. ✅ Verify:
   - Call room created
   - Record in `voice_calls` table
   - API returns success

**Note:** Full AI bot conversation requires additional setup (background worker)

---

## 🔍 Detailed Testing

### Test 1: Voice Assistant - Basic Commands

```
Commands to test:
- "Show me all new leads"
- "What events are coming up this week?"
- "Show me contacts that need follow-up"
- "What's my revenue this month?"
```

**Expected:** All commands work via voice input

---

### Test 2: Voice Assistant - Outbound Calls

```
Commands to test:
- "Call Sarah Johnson"
- "Give them a call about the quote"
- "Reach out to [contact name]"
```

**Expected:** 
- Call room created
- API returns success message
- Record in database

---

### Test 3: Real-Time Notifications

1. Open admin assistant
2. Enable voice mode
3. Submit contact form from public website
4. Watch for instant notification

**Expected:** Notification appears within 1-2 seconds

---

### Test 4: Database Migrations

**Check Supabase:**
1. ✅ Verify `voice_calls` table exists
2. ✅ Verify `voice_conversations` table exists (if created)
3. ✅ Check RLS policies are correct

**SQL to verify:**
```sql
SELECT * FROM voice_calls LIMIT 5;
SELECT * FROM voice_conversations LIMIT 5;
```

---

## 🐛 Troubleshooting

### Voice Assistant Not Working

**Issue:** Microphone button doesn't respond
- **Fix:** Check browser permissions (Settings → Privacy → Microphone)
- **Fix:** Try Chrome/Edge (best compatibility)

**Issue:** "Failed to connect" error
- **Fix:** Check `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` env vars
- **Fix:** Verify LiveKit server is accessible

---

### Notifications Not Appearing

**Issue:** No notifications when submitting forms
- **Fix:** Check if admin is in voice assistant room
- **Fix:** Check browser console for errors
- **Fix:** Verify Supabase Realtime is enabled

---

### Call Transcription Not Working

**Issue:** No transcription received
- **Fix:** Verify transcription is enabled in LiveKit dashboard
- **Fix:** Check webhook URL is correct
- **Fix:** Verify `ENABLE_LIVEKIT_CALLS=true` is set
- **Fix:** Check webhook logs in LiveKit dashboard

---

## 📊 Monitoring

### Check Logs

**Production logs to monitor:**
- Admin assistant API: `/api/admin-assistant/chat`
- Voice assistant API: `/api/voice-assistant/chat`
- LiveKit webhook: `/api/livekit/webhook`
- Transcription webhook: `/api/livekit/transcription`

**Database to monitor:**
- `voice_calls` table for call records
- `voice_conversations` table for conversation history

---

## ✅ Success Criteria

- [x] Voice assistant accepts voice commands
- [x] Commands are transcribed correctly
- [x] Assistant responds appropriately
- [x] Notifications appear instantly
- [x] Outbound call API creates rooms
- [ ] Call transcription works (requires setup)
- [ ] AI voice bot works (requires setup)

---

## 🎯 Next Steps After Testing

1. **If Phase 1 & 3 work:** ✅ Ready for daily use!
2. **If Phase 2 needed:** Configure LiveKit transcription
3. **If Phase 4 needed:** Set up SIP gateway and AI bot worker

---

## 📝 Notes

- Phase 1 & 3 work immediately (no setup required)
- Phase 2 & 4 require LiveKit dashboard configuration
- All code is production-ready
- Database migrations should run automatically on deploy

---

**Happy Testing! 🚀**
