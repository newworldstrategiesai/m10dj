# Complete AI Assistant Testing Guide

## 📊 Overview

This guide provides comprehensive testing procedures for the AI Assistant ecosystem (Web Chat + SMS + Database).

**Test Duration:** ~1-2 hours for full manual testing  
**Automated Tests:** ~5 minutes  
**Required Setup:** 15 minutes

---

## 🚀 Quick Start

### 1. Setup (15 minutes)

```bash
# Add to .env.local
OPENAI_API_KEY=your_api_key_here

# Setup Supabase database
# 1. Go to Supabase SQL Editor
# 2. Copy content from: supabase/migrations/20250115000000_create_sms_conversations.sql
# 3. Paste and run
```

### 2. Start Dev Server

```bash
npm run dev
```

### 3. Run Automated Tests

```bash
node scripts/test-ai-assistant.js
```

### 4. Manual Testing

Follow: `MANUAL_TEST_WALKTHROUGH.md`

---

## 📋 Test Matrix

| Feature | Type | Status | Notes |
|---------|------|--------|-------|
| Form → Chat Transform | Manual | TBD | Should be instant |
| Chat Message Sending | Manual | TBD | Should take <5s |
| AI Responses | Manual | TBD | Should be contextual |
| Error Handling | Manual | TBD | Should fallback gracefully |
| Mobile Responsive | Manual | TBD | Should work on iPhone |
| Dark Mode | Manual | TBD | Should be readable |
| SMS Webhook | Manual | TBD | Optional - requires Twilio |
| Database Storage | SQL | TBD | Should save conversations |
| API Endpoints | Automated | TBD | Run test script |

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path - Wedding Inquiry

```
1. User fills form with wedding details
2. Form transforms to chat
3. User asks: "What's included in Package 2?"
4. AI responds with package details
5. User asks: "Can you do a custom entrance song?"
6. AI responds contextually
7. Chat history is maintained
```

**Expected Result:** ✅ All messages flow naturally, AI understands context

---

### Scenario 2: Quick Question - Package Pricing

```
1. User fills form quickly
2. Chat appears with greeting
3. User asks: "How much for a 4-hour DJ?"
4. AI quotes price and asks about event type
5. User provides event details
6. AI recommends package
```

**Expected Result:** ✅ Quick back-and-forth, natural conversation

---

### Scenario 3: Error Recovery

```
1. User sends message
2. Network fails (simulate with offline mode)
3. AI can't respond
4. Fallback message appears instead
5. Network returns
6. User can continue chatting
```

**Expected Result:** ✅ Graceful degradation, conversation continues

---

### Scenario 4: Unclear Question

```
1. User types casual message: "yo whats ur prices lol"
2. AI understands and responds helpfully anyway
```

**Expected Result:** ✅ Casual language understood, helpful response

---

### Scenario 5: SMS Conversation (if Twilio set up)

```
1. User texts: "Hi what do you offer?"
2. AI responds via SMS with overview
3. User texts: "What's your cheapest?"
4. AI responds with Package 1 price
5. Conversation history saved
```

**Expected Result:** ✅ SMS responses are short, helpful, and saved

---

## 🧠 AI Response Quality Checklist

For each AI response, verify:

- [ ] Mentions company name (M10 DJ)
- [ ] References relevant information from form
- [ ] Tone is warm and professional
- [ ] Response is appropriate length
- [ ] Addresses the question asked
- [ ] Shows knowledge of packages/pricing
- [ ] Encourages next step or clarification
- [ ] No repeated information
- [ ] No mentions of training data cutoff
- [ ] Doesn't make impossible promises

---

## 🔧 Technical Testing

### API Testing

Test each endpoint with curl:

```bash
# Web Chat API
curl -X POST http://localhost:3000/api/leads/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hi"}],
    "leadData": {
      "name": "John",
      "email": "john@test.com",
      "phone": "+19145551234",
      "eventType": "Wedding",
      "eventDate": "2025-12-15"
    }
  }'

# Expected: 200 response with message
```

```bash
# SMS API
curl -X POST http://localhost:3000/api/leads/sms \
  -H "Content-Type: application/json" \
  -d '{
    "From": "+19145551234",
    "To": "+19145559999",
    "Body": "What packages do you offer?",
    "MessageSid": "SM1234567890"
  }'

# Expected: 200 response
```

### Database Testing

```sql
-- Check if migration worked
SELECT * FROM sms_conversations LIMIT 1;

-- Expected: Table exists with columns: id, contact_id, phone_number, messages, last_message_at, etc.

-- Check if chat data is being saved
SELECT COUNT(*) FROM sms_conversations;

-- Check conversation structure
SELECT messages FROM sms_conversations LIMIT 1;

-- Expected: JSON array with message objects containing role, content, timestamp
```

### Performance Testing

Measure response times:

```bash
# Time a single API call
time curl -X POST http://localhost:3000/api/leads/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hi"}], "leadData": {...}}'

# Expected: <5 seconds including OpenAI API call
```

---

## 📊 Metrics to Track

### Response Time Benchmarks

| Metric | Target | Acceptable | Fail |
|--------|--------|-----------|------|
| Chat message response | <3s | <5s | >10s |
| SMS message response | <5s | <10s | >20s |
| Page load | <2s | <3s | >5s |
| Database query | <500ms | <1s | >2s |

### Success Criteria

- ✅ 100% of manual tests pass
- ✅ 90%+ of automated tests pass
- ✅ All response times within acceptable range
- ✅ No uncaught errors in console
- ✅ Mobile responsive on all screen sizes
- ✅ Dark mode readable on all components
- ✅ Fallback responses work correctly

---

## 🚨 Known Limitations

Current limitations to note:

1. **Conversation history limited to 10 messages** (to save storage)
2. **SMS responses max 160 characters** (auto-chunks longer responses)
3. **No real-time SMS delivery confirmation** (Twilio handles this)
4. **No contact creation for unknown SMS numbers** (returns helpful message instead)
5. **No authentication on /api/leads/sms** (Twilio validates webhooks)

---

## 📝 Test Report Template

```markdown
# AI Assistant Test Report

**Date:** YYYY-MM-DD  
**Tester:** [Name]  
**Environment:** Local Development  
**Duration:** [Time spent]

## Summary
- Total Tests: [X]
- Passed: [X] ✅
- Failed: [X] ❌
- Success Rate: [X]%

## Test Results

### Web Chat
- [ ] Form → Chat works
- [ ] Messages send and receive
- [ ] Multi-turn conversation
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Error handling works

### SMS (if tested)
- [ ] Webhook receives SMS
- [ ] AI responds
- [ ] Data saved

### Database
- [ ] Migration successful
- [ ] Data persistence verified

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Sign-Off
**Ready for production?** YES / NO

**Tester Signature:** _______________  
**Date:** _______________
```

---

## 🎯 Testing Priorities

### Must Pass (Blocking)
1. Form → Chat transition works
2. Chat messages send/receive
3. AI gives contextual responses
4. No JavaScript errors
5. Database saving works

### Should Pass (Important)
1. Mobile responsive
2. Dark mode compatible
3. Error handling graceful
4. SMS integration (if enabled)
5. Conversation history

### Nice to Have (Polish)
1. Response times <3s
2. Animated transitions smooth
3. Hover states polished
4. Accessibility (keyboard nav)
5. Analytics tracking

---

## 🔗 Related Documentation

- **Setup:** `TEST_SETUP_INSTRUCTIONS.md`
- **Manual Tests:** `MANUAL_TEST_WALKTHROUGH.md`
- **Web Chat:** `LEAD_FORM_CHAT_GUIDE.md`
- **Web Chat Setup:** `AI_LEAD_ASSISTANT_SETUP.md`
- **SMS Setup:** `TWILIO_SMS_ASSISTANT_SETUP.md`
- **Architecture:** `AI_ASSISTANT_ECOSYSTEM.md`

---

## ✅ Approval Checklist

Before marking as "ready for production":

- [ ] All manual tests completed
- [ ] Automated tests pass (90%+)
- [ ] No critical bugs found
- [ ] Response times acceptable
- [ ] Mobile responsive verified
- [ ] Dark mode verified
- [ ] Error handling verified
- [ ] Database persistence verified
- [ ] Documentation complete
- [ ] Team has reviewed results

---

## 📞 Support

**If tests fail, check:**

1. Is `.env.local` updated with OpenAI key?
2. Is Supabase migration run?
3. Is dev server running on localhost:3000?
4. Are there any console errors?
5. Is network tab showing errors?

**For help:**
- Check error logs: `test-results.json`
- Review browser console (F12)
- Check server terminal output
- Verify API credentials


