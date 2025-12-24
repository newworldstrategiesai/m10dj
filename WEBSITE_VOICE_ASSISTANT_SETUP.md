# Website Voice Assistant - Setup Guide

## ✅ What's Been Built

The Website Voice Assistant is now ready! Here's what was created:

### 1. **Database Migration** ✅
- `supabase/migrations/20250128000005_create_voice_conversations.sql`
- Stores all voice conversation history
- Links conversations to contacts/leads
- Supports website, inbound calls, outbound calls, and admin assistant

### 2. **Public Token Endpoint** ✅
- `app/api/livekit/public-token/route.ts`
- Allows anonymous users to get LiveKit tokens
- Uses session ID for tracking

### 3. **Voice Assistant Components** ✅
- `components/public/PublicVoiceAssistant.tsx` - Core voice component
- `components/public/FloatingVoiceWidget.tsx` - Floating widget for website

### 4. **API Endpoints** ✅
- `app/api/voice-assistant/chat/route.ts` - Handles voice interactions
- `app/api/voice-assistant/history/route.ts` - Gets conversation history

### 5. **Conversation Utilities** ✅
- `utils/voice-conversations.ts` - Conversation history management

### 6. **Public Functions** ✅
- `schedule_consultation` - Creates scheduling links
- `request_quote` - Submits quote requests
- `get_music_recommendations` - Provides music suggestions
- `create_contact` - Creates new contacts from voice

---

## 🚀 How to Use

### Step 1: Run Database Migration

```bash
# Run the migration in Supabase dashboard or via CLI
supabase/migrations/20250128000005_create_voice_conversations.sql
```

### Step 2: Add Widget to Your Website

Add the floating widget to any page:

```tsx
import { FloatingVoiceWidget } from '@/components/public/FloatingVoiceWidget';

// In your page component:
<FloatingVoiceWidget 
  contactId={contactId} // Optional: if user is logged in
  phoneNumber={phoneNumber} // Optional: if available
  context={{ eventType: 'wedding' }} // Optional: additional context
/>
```

### Step 3: Test It Out

1. Visit your website
2. Click the floating microphone button (bottom right)
3. Allow microphone access
4. Start talking!

**Example interactions:**
- "I need a quote for a wedding"
- "Schedule a consultation for me"
- "What music do you recommend for a corporate event?"
- "I'm planning a birthday party on March 15th"

---

## 🎯 Features

### ✅ Conversation History
- All conversations are automatically stored
- Previous context is retrieved before each interaction
- No redundancy - assistant remembers what was discussed

### ✅ Function Calling
- Can create contacts from voice
- Can schedule consultations
- Can request quotes
- Can get music recommendations

### ✅ Contact Linking
- If contactId or phoneNumber provided, conversations are linked
- Helps track customer journey

### ✅ Browser Speech Recognition
- Works immediately (Chrome/Edge)
- No LiveKit transcription setup required for basic use
- Falls back gracefully

---

## 🔧 Configuration

### Environment Variables

Make sure these are set:
```bash
LIVEKIT_URL=wss://your-instance.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
OPENAI_API_KEY=your-openai-key
```

### Optional: LiveKit Transcription

For better accuracy, set up LiveKit transcription:
1. Go to LiveKit dashboard
2. Enable transcription
3. Configure Deepgram or other provider
4. Component will automatically use it if available

---

## 📝 Next Steps

### Immediate
1. ✅ Run database migration
2. ✅ Add widget to website
3. ✅ Test basic functionality

### Enhancements
1. Add Text-to-Speech for responses (ElevenLabs)
2. Add more music recommendation data
3. Integrate with your music database
4. Add voice-activated payment processing
5. Add playlist control functions

---

## 🐛 Troubleshooting

### "Failed to get token"
- Check LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set
- Verify token endpoint is accessible

### "Microphone not working"
- Check browser permissions
- Try Chrome/Edge (best support)
- Check browser console for errors

### "No response from assistant"
- Check OPENAI_API_KEY is set
- Verify API endpoint is accessible
- Check server logs for errors

### "Conversation history not working"
- Verify migration ran successfully
- Check Supabase RLS policies
- Verify session ID is being stored

---

## 📚 API Reference

### POST `/api/voice-assistant/chat`
```json
{
  "message": "I need a quote for a wedding",
  "sessionId": "session-123",
  "conversationHistory": [],
  "contactId": "uuid-optional",
  "phoneNumber": "optional",
  "context": {}
}
```

### POST `/api/voice-assistant/history`
```json
{
  "sessionId": "session-123",
  "conversationType": "website",
  "limit": 20
}
```

### POST `/api/livekit/public-token`
```json
{
  "sessionId": "session-123",
  "participantName": "Guest"
}
```

---

## 🎉 You're Ready!

The Website Voice Assistant is fully functional. Just:
1. Run the migration
2. Add the widget to your site
3. Start talking!

For questions or issues, check the server logs and browser console.

