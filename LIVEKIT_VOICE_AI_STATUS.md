# LiveKit Voice AI Integration - Current Status & Next Steps

## ✅ What You Already Have

### 1. **LiveKit Infrastructure** ✅
- ✅ LiveKit SDKs installed (`livekit-server-sdk`, `@livekit/components-react`)
- ✅ Token generation API (`/app/api/livekit/token/route.ts`) - **Supports admin-assistant rooms**
- ✅ Webhook handler (`/app/api/livekit/webhook/route.ts`)
- ✅ Room service client setup
- ✅ Supabase integration for real-time channels

### 2. **Voice Assistant Components** ✅
- ✅ `VoiceAssistant.tsx` - Voice input component with browser Speech Recognition
- ✅ `useLiveKitTranscription.ts` - Transcription hook
- ✅ Integrated into `FloatingAdminAssistant.tsx` with "Use Voice" button
- ✅ Supports both LiveKit transcription and browser fallback

### 3. **Call Infrastructure** ✅
- ✅ `voice_calls` table in Supabase
- ✅ Outbound call API (`/app/api/livekit/outbound-call/route.ts`)
- ✅ Call token generation utilities
- ✅ Call analyzer for AI transcript analysis
- ✅ Incoming call routing (Twilio integration ready)

### 4. **Admin Assistant with Function Calling** ✅
- ✅ Full admin assistant chat API (`/pages/api/admin-assistant/chat.js`)
- ✅ **Conversation history support** - accepts `conversationHistory` parameter
- ✅ **Function calling** - 20+ functions including:
  - `search_contacts`, `get_contact_details`, `update_lead_status`
  - `generate_contract`, `generate_invoice`, `generate_quote`
  - `create_contact`, `add_contact_note`
  - `initiate_outbound_call` (already integrated!)
  - And many more...

### 5. **Conversation History Storage** ✅
- ✅ `sms_conversations` table for SMS history
- ✅ `conversation_summaries` view
- ✅ Conversation session tracking
- ✅ Customer context retrieval (`getCustomerContext` function)
- ✅ Admin assistant accepts conversation history in API

### 6. **Real-Time Notifications** ✅
- ✅ LiveKit data channel notifications
- ✅ Notification publisher utility
- ✅ Enhanced admin notifications hook

---

## 🎯 What You Need to Add for Full Voice AI Integration

Based on your conversation with LiveKit, here's what's missing:

### 1. **Website Voice Assistant** ⚠️ PARTIAL
**Status:** You have voice assistant for admin, but not for public website

**What's Needed:**
- [ ] Public-facing voice assistant component for website
- [ ] Public token generation (or anonymous access)
- [ ] Website embedding (floating widget or inline)
- [ ] Public conversation history storage
- [ ] Function calls for public actions (booking, quotes, etc.)

**Files to Create:**
- `components/public/VoiceAssistant.tsx` (public version)
- `app/api/livekit/public-token/route.ts` (public token endpoint)
- `supabase/migrations/XXXX_create_public_conversations.sql` (public conversation history)

### 2. **Conversation History for Voice AI** ⚠️ NEEDS ENHANCEMENT
**Status:** You have conversation history for SMS and admin chat, but need unified voice conversation storage

**What's Needed:**
- [ ] Unified conversation history table for all voice interactions
- [ ] Link conversations to contacts/leads
- [ ] Fetch conversation history before each voice interaction
- [ ] Store voice transcripts with conversation context

**Enhancement Needed:**
```sql
-- Add to existing voice_calls table or create new table
CREATE TABLE voice_conversations (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  phone_number TEXT,
  room_name TEXT,
  conversation_type TEXT, -- 'website', 'inbound_call', 'outbound_call'
  messages JSONB, -- Array of {role, content, timestamp}
  summary TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 3. **Function Calls from Voice AI** ✅ MOSTLY READY
**Status:** Your admin assistant already has function calling! Just need to connect it to voice.

**What's Already Working:**
- ✅ `generate_contract` function exists
- ✅ `generate_invoice` function exists  
- ✅ `generate_quote` function exists
- ✅ All functions are in `utils/admin-assistant/functions.js`

**What's Needed:**
- [ ] Connect voice assistant to same function executor
- [ ] Ensure voice transcripts trigger function calls
- [ ] Add voice-specific functions (music recommendations, playlist control)

### 4. **Inbound Call Handling** ⚠️ PARTIAL
**Status:** Infrastructure exists, needs LiveKit transcription setup

**What's Needed:**
- [ ] Enable LiveKit transcription in dashboard
- [ ] Connect transcription webhook to conversation history
- [ ] Auto-fetch conversation history when call starts
- [ ] Real-time AI analysis during call

**Files Already Exist:**
- ✅ `pages/api/voice/incoming-call.js`
- ✅ `utils/admin-assistant/call-analyzer.ts`
- ✅ `app/api/livekit/webhook/route.ts` (has transcription handling)

### 5. **Outbound AI Calls** ⚠️ PARTIAL
**Status:** API exists, but needs AI voice bot worker

**What's Needed:**
- [ ] AI voice bot worker process (background service)
- [ ] Text-to-speech integration (ElevenLabs as discussed)
- [ ] LiveKit SIP gateway configuration
- [ ] Conversation history fetching before call
- [ ] Function calling during call

**Files Already Exist:**
- ✅ `app/api/livekit/outbound-call/route.ts`
- ✅ `initiate_outbound_call` function in admin assistant
- ⚠️ Needs: `utils/livekit/ai-voice-bot.ts` (worker process)

### 6. **Music Recommendations & Playlist Control** ❌ NOT STARTED
**Status:** Not implemented yet

**What's Needed:**
- [ ] Function: `get_music_recommendations` (based on event type, preferences)
- [ ] Function: `add_song_to_playlist` (voice-controlled)
- [ ] Function: `request_song_for_event` (customer requests)
- [ ] Integration with your music/playlist system

---

## 🚀 Implementation Priority

### Phase 1: Website Voice Assistant (HIGH PRIORITY)
**Timeline:** 2-3 days

1. Create public voice assistant component
2. Add public token endpoint
3. Create public conversation history table
4. Connect to existing function executor
5. Embed on website

### Phase 2: Enhanced Conversation History (HIGH PRIORITY)
**Timeline:** 1-2 days

1. Create unified `voice_conversations` table
2. Update voice assistant to fetch history before each interaction
3. Store all voice interactions with context
4. Link to contacts/leads automatically

### Phase 3: Inbound Call Enhancement (MEDIUM PRIORITY)
**Timeline:** 2-3 days

1. Enable LiveKit transcription
2. Connect transcription to conversation history
3. Real-time AI analysis during calls
4. Auto-note generation

### Phase 4: Outbound AI Bot (MEDIUM PRIORITY)
**Timeline:** 3-5 days

1. Create AI voice bot worker process
2. Integrate ElevenLabs TTS
3. Configure LiveKit SIP gateway
4. Add conversation history to bot context
5. Enable function calling during calls

### Phase 5: Music Features (LOW PRIORITY)
**Timeline:** 2-3 days

1. Add music recommendation functions
2. Add playlist control functions
3. Integrate with existing music system

---

## 📋 Quick Start: Website Voice Assistant

Here's what you need to build first:

### 1. Public Token Endpoint
```typescript
// app/api/livekit/public-token/route.ts
// Similar to admin token, but for anonymous/public users
// Store session ID in cookie or localStorage
```

### 2. Public Voice Assistant Component
```typescript
// components/public/VoiceAssistant.tsx
// Similar to admin VoiceAssistant, but:
// - No authentication required
// - Links to contact/lead if email/phone provided
// - Stores in public conversation history
```

### 3. Conversation History Integration
```typescript
// Before each voice interaction:
// 1. Get session ID (from cookie/localStorage)
// 2. Fetch conversation history from Supabase
// 3. Include in API call to admin assistant
// 4. Store new messages after response
```

### 4. Function Calls for Public
```typescript
// Add public-safe functions:
// - create_contact (from voice)
// - schedule_consultation
// - request_quote
// - get_music_recommendations
```

---

## 🔗 Integration Points

Your existing code is **perfectly positioned** for this! Here's how to connect:

1. **Voice → Admin Assistant API**
   - Voice assistant sends transcript → `/api/admin-assistant/chat`
   - Include conversation history from Supabase
   - Function calls execute via existing `function-executor.js`

2. **Conversation History Flow**
   ```
   Voice Input → Store in Supabase → Fetch History → Include in API Call → Store Response
   ```

3. **Function Calling Flow**
   ```
   Voice: "Generate a quote for John" 
   → Admin Assistant API 
   → Function: generate_quote 
   → Executor: Creates quote in database
   → Response: "Quote generated successfully"
   → Voice: TTS response
   ```

---

## ✅ You're 70% There!

**What's Working:**
- ✅ LiveKit infrastructure
- ✅ Voice input components
- ✅ Admin assistant with function calling
- ✅ Conversation history for SMS/admin chat
- ✅ Call infrastructure
- ✅ Outbound call API

**What's Missing:**
- ⚠️ Public website voice assistant
- ⚠️ Unified voice conversation history
- ⚠️ AI voice bot worker (for outbound calls)
- ⚠️ Music recommendation functions
- ⚠️ LiveKit transcription setup (configuration)

---

## 🎯 Recommended Next Steps

1. **Start with Website Voice Assistant** - This gives immediate value
2. **Enhance Conversation History** - Critical for avoiding redundancy
3. **Set up LiveKit Transcription** - Enables call features
4. **Build AI Voice Bot Worker** - Completes outbound calls
5. **Add Music Functions** - Nice-to-have features

Would you like me to start building the **Website Voice Assistant** first? It's the highest-impact feature and builds on your existing infrastructure!

