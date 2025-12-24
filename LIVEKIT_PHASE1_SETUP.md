# Phase 1: Voice Assistant Setup Guide

## ✅ Implementation Complete

Phase 1 has been implemented! Here's what was added:

### Files Created/Modified

1. **`app/api/livekit/token/route.ts`** - Extended to support `admin-assistant` room type
2. **`components/admin/VoiceAssistant.tsx`** - New voice input component
3. **`hooks/useLiveKitTranscription.ts`** - Hook for handling transcription
4. **`components/admin/FloatingAdminAssistant.tsx`** - Integrated voice assistant
5. **`app/api/livekit/transcription/route.ts`** - Webhook handler for transcription (optional)

## 🚀 How to Use

1. **Open the Admin Assistant** - Click the assistant widget in your admin dashboard
2. **Click "Use Voice"** - Toggle voice mode on
3. **Allow microphone access** - Browser will prompt for permission
4. **Start speaking** - Your commands will be transcribed and sent to the assistant

## ⚙️ Configuration Required

### Option 1: LiveKit Built-in Transcription (Recommended)

1. **Enable Transcription in LiveKit Dashboard:**
   - Go to your LiveKit Cloud dashboard
   - Navigate to Settings → Transcription
   - Enable transcription (Deepgram, Whisper, or other provider)
   - Configure webhook URL: `https://your-domain.com/api/livekit/transcription`

2. **Environment Variables:**
   ```bash
   # Already have these:
   LIVEKIT_URL=wss://your-instance.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   
   # If using Deepgram:
   DEEPGRAM_API_KEY=your-deepgram-key (optional, if not using LiveKit's built-in)
   ```

### Option 2: Browser Speech Recognition (Fallback)

If LiveKit transcription isn't set up, you can use the browser's built-in Speech Recognition API as a fallback. This would require modifying `VoiceAssistant.tsx` to use the Web Speech API.

**Note:** Browser Speech Recognition:
- ✅ Works without LiveKit transcription setup
- ✅ No additional cost
- ❌ Less accurate than Deepgram/Whisper
- ❌ Only works in Chrome/Edge (not Firefox/Safari)

## 🧪 Testing

1. **Test Token Generation:**
   ```bash
   curl -X POST http://localhost:3000/api/livekit/token \
     -H "Content-Type: application/json" \
     -d '{"roomType": "admin-assistant"}'
   ```

2. **Test Voice Input:**
   - Open admin assistant
   - Click "Use Voice"
   - Speak a command like "Show me all new leads"
   - Verify it appears in the chat

3. **Check Browser Console:**
   - Look for any connection errors
   - Verify microphone permissions granted
   - Check for transcription events

## 🔧 Troubleshooting

### "Failed to get token"
- Check that `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set
- Verify user is authenticated

### "Microphone not working"
- Check browser permissions (Settings → Privacy → Microphone)
- Try in Chrome/Edge (best compatibility)
- Check browser console for errors

### "No transcription received"
- Verify LiveKit transcription is enabled in dashboard
- Check webhook URL is configured correctly
- Verify `app/api/livekit/transcription/route.ts` is accessible
- Check server logs for webhook events

### "Connection failed"
- Verify `LIVEKIT_URL` is correct (should start with `wss://`)
- Check network connectivity
- Verify LiveKit server is running

## 📝 Next Steps

Once Phase 1 is working:

1. **Test thoroughly** - Try various voice commands
2. **Set up transcription** - Enable in LiveKit dashboard
3. **Consider Phase 2** - Call transcription for client calls
4. **Consider Phase 4** - Outbound AI calls (game changer!)

## 💡 Tips

- **Speak clearly** - Better accuracy
- **Use natural language** - "Show me new leads" works better than "query leads"
- **Check transcription** - The component shows what it heard
- **Combine with typing** - Voice + text input work together

## 🎯 Success Criteria

- ✅ Voice button appears in admin assistant
- ✅ Clicking "Use Voice" connects to LiveKit room
- ✅ Microphone permission requested and granted
- ✅ Speech is transcribed (even if not perfect)
- ✅ Transcribed text sent to assistant API
- ✅ Assistant responds normally

Ready to test! 🚀

