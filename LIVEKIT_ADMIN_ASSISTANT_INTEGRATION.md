# LiveKit Admin Assistant Integration Plan

## Current LiveKit Infrastructure ✅

You already have:
- ✅ LiveKit SDKs installed (`livekit-server-sdk`, `@livekit/components-react`)
- ✅ Token generation API (`/app/api/livekit/token/route.ts`)
- ✅ Webhook handler (`/app/api/livekit/webhook/route.ts`)
- ✅ Room service client setup
- ✅ Supabase integration for real-time channels
- ✅ `LiveVideoPlayer` component pattern

## Integration Strategy

Reuse existing infrastructure, extend for admin assistant use cases.

---

## Phase 1: Voice-Enabled Admin Assistant 🎙️
**Timeline: 3-5 days | Priority: HIGH**

### Implementation Steps

#### 1.1 Extend Token API for Assistant Rooms
**File: `app/api/livekit/token/route.ts`**

Add admin assistant room type support:

```typescript
// Add to POST handler body parsing
const { roomName, participantName, participantIdentity, roomType } = body;

// Add new room type handling
if (roomType === 'admin-assistant') {
  // Admin assistant voice room
  // Grant permissions for audio publishing/subscribing
  at.addGrant({
    room: roomName || `assistant-${user.id}`,
    roomJoin: true,
    canPublish: true,  // Audio only
    canSubscribe: true,
    canPublishData: true,
  });
  
  // Set shorter TTL for assistant rooms (30 min)
  at.ttl = '30m';
}
```

#### 1.2 Create Voice Assistant Component
**File: `components/admin/VoiceAssistant.tsx`** (NEW)

```typescript
'use client';

import { useState, useRef, useCallback } from 'react';
import { LiveKitRoom, useLocalParticipant, useRoom } from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

interface VoiceAssistantProps {
  userId: string;
  onTranscription?: (text: string) => void;
}

export function VoiceAssistant({ userId, onTranscription }: VoiceAssistantProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const roomName = `assistant-${userId}`;

  // Get token from existing API
  const connectRoom = async () => {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName,
        roomType: 'admin-assistant',
        participantIdentity: userId,
      }),
    });
    
    const { token, url } = await response.json();
    // Connect to room...
  };

  // Use LiveKit transcription (Deepgram/Silero plugin)
  // Listen to transcription events and send to assistant API
  
  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={url}
      connect={isListening}
      onConnected={(room) => {
        setRoom(room);
        // Enable transcription
        // Set up transcription event listener
      }}
    >
      {/* UI components */}
    </LiveKitRoom>
  );
}
```

#### 1.3 Create Transcription Hook
**File: `hooks/useLiveKitTranscription.ts`** (NEW)

```typescript
import { useEffect, useState } from 'react';
import { useDataChannel, useRoom } from '@livekit/components-react';
import { DataPacket_Kind } from 'livekit-client';

export function useLiveKitTranscription() {
  const room = useRoom();
  const [transcription, setTranscription] = useState('');
  const { message } = useDataChannel('transcription');

  useEffect(() => {
    if (message) {
      const data = JSON.parse(message.payload);
      if (data.type === 'transcription') {
        setTranscription(data.text);
      }
    }
  }, [message]);

  return { transcription };
}
```

#### 1.4 Integrate with Admin Assistant Chat API
**File: `components/admin/FloatingAdminAssistant.tsx`**

Add voice input option:

```typescript
// Add to existing component
import { VoiceAssistant } from './VoiceAssistant';

// Add state
const [voiceMode, setVoiceMode] = useState(false);

// Add handler
const handleTranscription = async (text: string) => {
  // Use existing sendMessage function
  await sendMessage(text);
};

// Add UI toggle button near input field
<Button onClick={() => setVoiceMode(!voiceMode)}>
  {voiceMode ? <IconMicrophoneOff /> : <IconMicrophone />}
</Button>

{voiceMode && (
  <VoiceAssistant 
    userId={user?.id} 
    onTranscription={handleTranscription}
  />
)}
```

#### 1.5 Add Transcription Service (Server-Side)
**Option A: Use LiveKit Cloud Transcription**
- Enable in LiveKit dashboard
- Webhooks automatically receive transcription events

**Option B: Self-Hosted with Silero**
**File: `app/api/livekit/transcription/route.ts`** (NEW)

```typescript
// Webhook endpoint for transcription events
// LiveKit sends transcription chunks here
export async function POST(request: NextRequest) {
  const { roomName, participantId, text, isFinal } = await request.json();
  
  // Send to admin assistant API if final
  if (isFinal && text) {
    await fetch('/api/admin-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        source: 'voice',
        roomName,
      }),
    });
  }
}
```

### Files to Create/Modify

1. ✅ **Modify**: `app/api/livekit/token/route.ts` - Add admin-assistant room type
2. ✅ **Create**: `components/admin/VoiceAssistant.tsx` - Voice input component
3. ✅ **Create**: `hooks/useLiveKitTranscription.ts` - Transcription hook
4. ✅ **Modify**: `components/admin/FloatingAdminAssistant.tsx` - Add voice toggle
5. ✅ **Create**: `app/api/livekit/transcription/route.ts` - Transcription webhook (optional)

### Testing Checklist
- [ ] Voice button appears in admin assistant
- [ ] Click starts LiveKit room connection
- [ ] Microphone permissions requested
- [ ] Speech transcribed in real-time
- [ ] Transcribed text sent to assistant API
- [ ] Assistant response received and displayed
- [ ] Audio feedback for responses (optional TTS)

---

## Phase 2: Call Transcription & Auto-Notes 📝
**Timeline: 5-7 days | Priority: VERY HIGH**

### Implementation Steps

#### 2.1 Update Twilio Webhook
**File: `pages/api/voice/incoming-call.js`**

Instead of direct dial, create LiveKit room:

```javascript
export default async function handler(req, res) {
  const { From, To } = req.body;
  
  // Create LiveKit room for call
  const roomName = `call-${Date.now()}-${From.replace(/\D/g, '')}`;
  
  // Generate tokens for admin and client
  const adminToken = await generateCallToken(roomName, 'admin', From);
  const clientToken = await generateCallToken(roomName, 'client', From);
  
  // Store call metadata in database
  await supabase.from('voice_calls').insert({
    room_name: roomName,
    client_phone: From,
    admin_phone: process.env.ADMIN_PHONE_NUMBER,
    status: 'ringing',
  });
  
  // TwiML response - dial admin and connect to LiveKit
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you now. Please hold.</Say>
  <Dial timeout="20">
    <Sip>
      sip:${process.env.LIVEKIT_SIP_GATEWAY}?room=${roomName}
    </Sip>
  </Dial>
</Response>`;
  
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}
```

#### 2.2 Create Call Token Generator
**File: `utils/livekit/call-tokens.ts`** (NEW)

```typescript
import { AccessToken } from 'livekit-server-sdk';

export async function generateCallToken(
  roomName: string,
  role: 'admin' | 'client',
  identity: string
) {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: role === 'admin' ? 'Admin' : 'Client',
    ttl: '1h',
  });
  
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: role === 'admin',
  });
  
  return await at.toJwt();
}
```

#### 2.3 Update Webhook Handler for Transcription
**File: `app/api/livekit/webhook/route.ts`**

Add transcription event handling:

```typescript
case 'transcription_received':
  // Handle transcription chunks
  if (event.transcription) {
    await handleCallTranscription(
      event.room?.name || '',
      event.transcription.text,
      event.transcription.isFinal
    );
  }
  break;

async function handleCallTranscription(
  roomName: string,
  text: string,
  isFinal: boolean
) {
  // Get call record
  const { data: call } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('room_name', roomName)
    .single();
  
  if (!call) return;
  
  // Append to transcript
  await supabase
    .from('voice_calls')
    .update({
      transcript: (call.transcript || '') + ' ' + text,
      updated_at: new Date().toISOString(),
    })
    .eq('room_name', roomName);
  
  // If final, send to AI assistant for analysis
  if (isFinal && call.contact_id) {
    await analyzeCallTranscript(call.contact_id, text);
  }
}
```

#### 2.4 Create Transcript Analysis Function
**File: `utils/admin-assistant/call-analyzer.ts`** (NEW)

```typescript
export async function analyzeCallTranscript(
  contactId: string,
  transcript: string
) {
  // Call admin assistant API with transcript
  const response = await fetch('/api/admin-assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Analyze this call transcript and extract:
1. Key information mentioned
2. Action items
3. Update contact status if needed
4. Create notes

Transcript: ${transcript}`,
      context: { contactId, type: 'call_analysis' },
    }),
  });
  
  // The assistant will use existing functions to:
  // - add_contact_note()
  // - update_lead_status()
  // - update_contact()
}
```

#### 2.5 Create Database Table for Calls
**File: `supabase/migrations/XXXX_create_voice_calls.sql`** (NEW)

```sql
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT UNIQUE NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  client_phone TEXT,
  admin_phone TEXT,
  status TEXT DEFAULT 'ringing', -- ringing, connected, completed, failed
  transcript TEXT,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_calls_contact_id ON voice_calls(contact_id);
CREATE INDEX idx_voice_calls_room_name ON voice_calls(room_name);
```

### Files to Create/Modify

1. ✅ **Modify**: `pages/api/voice/incoming-call.js` - Route to LiveKit
2. ✅ **Create**: `utils/livekit/call-tokens.ts` - Token generation
3. ✅ **Modify**: `app/api/livekit/webhook/route.ts` - Handle transcriptions
4. ✅ **Create**: `utils/admin-assistant/call-analyzer.ts` - AI analysis
5. ✅ **Create**: Migration for `voice_calls` table

---

## Phase 3: Real-Time Notifications 🔔
**Timeline: 2-3 days | Priority: MEDIUM**

### Implementation Steps

#### 3.1 Create Notification Publisher
**File: `utils/livekit/notifications.ts`** (NEW)

```typescript
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function publishAdminNotification(
  adminUserId: string,
  notification: {
    type: 'new_lead' | 'payment' | 'contract_signed' | 'status_change';
    title: string;
    message: string;
    data?: any;
  }
) {
  // Check if admin is in an assistant room
  const roomName = `assistant-${adminUserId}`;
  
  try {
    // Broadcast via LiveKit data channel
    await roomService.sendData(
      roomName,
      JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString(),
      }),
      { kind: DataPacket_Kind.RELIABLE }
    );
  } catch (error) {
    // Room doesn't exist (admin not connected)
    // Fallback to Supabase channel
    const channel = supabase.channel(`admin-notifications:${adminUserId}`);
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: notification,
    });
  }
}
```

#### 3.2 Update Notification Sources
**File: `pages/api/contact.js`** (and other notification sources)

When new lead comes in:

```javascript
import { publishAdminNotification } from '@/utils/livekit/notifications';

// After creating contact
await publishAdminNotification(adminUserId, {
  type: 'new_lead',
  title: 'New Lead Received',
  message: `${contact.first_name} ${contact.last_name} - ${contact.event_type}`,
  data: { contactId: contact.id },
});
```

#### 3.3 Create Notification Listener Hook
**File: `hooks/useAdminNotifications.tsx`** (MODIFY existing)

Add LiveKit data channel listener:

```typescript
import { useDataChannel } from '@livekit/components-react';

export function useAdminNotifications() {
  // Existing Supabase polling...
  
  // NEW: LiveKit data channel
  const { room } = useRoom(); // From VoiceAssistant component
  const { message } = useDataChannel('notifications');
  
  useEffect(() => {
    if (message && room) {
      const notification = JSON.parse(message.payload);
      if (notification.type === 'notification') {
        toast({
          title: notification.title,
          description: notification.message,
        });
      }
    }
  }, [message, room]);
}
```

### Files to Create/Modify

1. ✅ **Create**: `utils/livekit/notifications.ts` - Notification publisher
2. ✅ **Modify**: `pages/api/contact.js` - Publish on new lead
3. ✅ **Modify**: `pages/api/quote/[id]/payments.js` - Publish on payment
4. ✅ **Modify**: `hooks/useAdminNotifications.tsx` - Listen via LiveKit

---

## Phase 4: Consultation Rooms (Future) 🎥
**Timeline: 7-10 days | Priority: LOW (After Phase 1-3)**

Uses same patterns, just extends token API and creates new room type.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Existing LiveKit Infrastructure          │
├─────────────────────────────────────────────────┤
│  Token API ──┐                                  │
│  Webhook ────┼──> Room Service Client           │
│  Components ─┘                                  │
└─────────────────────────────────────────────────┘
           │
           ├───> Phase 1: Voice Assistant
           │     └─> Assistant rooms (audio only)
           │
           ├───> Phase 2: Call Transcription  
           │     └─> Call rooms (audio + transcription)
           │
           └───> Phase 3: Real-time Notifications
                 └─> Data channels
```

---

## Environment Variables Needed

Add to `.env.local`:

```bash
# Already have these:
LIVEKIT_URL=wss://your-instance.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# New (optional):
LIVEKIT_TRANSCRIPTION_ENABLED=true
LIVEKIT_TRANSCRIPTION_PROVIDER=deepgram  # or silero
```

---

## Testing Strategy

### Phase 1 Testing
1. ✅ Connect to assistant room
2. ✅ Speak commands
3. ✅ Verify transcription
4. ✅ Verify assistant response
5. ✅ Test error handling (mic permissions, network)

### Phase 2 Testing
1. ✅ Mock Twilio webhook
2. ✅ Create call room
3. ✅ Join as admin and client
4. ✅ Verify transcription
5. ✅ Verify AI analysis runs
6. ✅ Verify notes created

### Phase 3 Testing
1. ✅ Create new lead
2. ✅ Verify notification received
3. ✅ Test when admin offline (fallback)

---

## Rollout Plan

### Week 1: Phase 1 (Voice Assistant)
- Days 1-2: Extend token API, create VoiceAssistant component
- Days 3-4: Integration with FloatingAdminAssistant
- Day 5: Testing and refinement

### Week 2: Phase 2 (Call Transcription)
- Days 1-2: Update Twilio webhook, create call token generator
- Days 3-4: Transcription webhook, AI analysis
- Days 5-7: Testing with real calls

### Week 3: Phase 3 (Notifications)
- Days 1-2: Notification publisher utility
- Days 3-4: Update notification sources
- Day 5: Testing

---

## Success Metrics

- ✅ Voice commands work 95%+ accuracy
- ✅ Call transcripts captured 100% of calls
- ✅ AI extracts action items correctly 80%+
- ✅ Notifications delivered < 1 second
- ✅ Zero impact on existing LiveKit features

---

## Phase 4: Outbound AI-Powered Voice Calls 🤖📞
**Timeline: 7-10 days | Priority: HIGH (Game Changer!)**

### Overview

Use LiveKit + your admin assistant AI to make **outbound calls** that:
- ✅ Automatically call leads/clients
- ✅ Have natural conversations using your AI assistant
- ✅ Qualify leads, confirm appointments, collect info
- ✅ Transcribe and analyze every call
- ✅ Update database automatically based on conversation

### Use Cases

1. **Automated Follow-up Calls**
   - Call leads 24 hours after form submission
   - "Hi, this is Ben from M10 DJ. I saw you requested a quote..."

2. **Lead Qualification**
   - Ask qualifying questions
   - Determine budget, event date, guest count
   - Update lead_status automatically

3. **Appointment Reminders**
   - Call clients 1 week before event
   - Confirm details, answer questions

4. **Payment Reminders**
   - Automated calls for overdue invoices
   - "Hi, just following up on your invoice..."

5. **Event Confirmations**
   - Pre-event calls to confirm final details
   - Collect music preferences, timeline

### Architecture

```
┌─────────────────────────────────────────────────┐
│         Admin Initiates Outbound Call           │
│  (via UI: "Call [Contact]" button)             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  /api/livekit/outbound-call                     │
│  - Creates LiveKit room                         │
│  - Generates tokens (AI bot + client)            │
│  - Initiates SIP call via LiveKit               │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐   ┌──────────────────┐
│  AI Bot      │   │  Client Phone     │
│  (LiveKit)   │◄──┤  (via SIP)       │
│              │   │                  │
│  - Listens   │   │  - Answers call  │
│  - Speaks    │   │  - Talks to AI   │
│  - Thinks    │   │                  │
└──────┬───────┘   └──────────────────┘
       │
       │ Transcription
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Admin Assistant AI                              │
│  - Processes conversation                       │
│  - Makes decisions                              │
│  - Updates database                             │
│  - Generates responses                          │
└─────────────────────────────────────────────────┘
```

### Implementation Steps

#### 4.1 Create Outbound Call API
**File: `app/api/livekit/outbound-call/route.ts`** (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { contactId, phoneNumber, callType } = await request.json();
    
    // Get contact details
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    // Create unique room name
    const roomName = `outbound-${contactId}-${Date.now()}`;
    
    // Create LiveKit room
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 300, // 5 minutes
      maxParticipants: 2,
    });
    
    // Generate token for AI bot
    const botToken = await generateBotToken(roomName);
    
    // Generate token for client (if they join via web)
    const clientToken = await generateClientToken(roomName, contact);
    
    // Start AI bot in room
    await startAIVoiceBot(roomName, botToken, contact);
    
    // Initiate SIP call to client's phone
    await initiateSIPCall(roomName, phoneNumber);
    
    // Store call record
    await supabase.from('voice_calls').insert({
      room_name: roomName,
      contact_id: contactId,
      client_phone: phoneNumber,
      direction: 'outbound',
      call_type: callType, // 'follow_up', 'qualification', 'reminder', etc.
      status: 'ringing',
      started_at: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      roomName,
      status: 'calling',
    });
    
  } catch (error) {
    console.error('Error initiating outbound call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}

async function generateBotToken(roomName: string) {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity: 'ai-bot',
    name: 'AI Assistant',
    ttl: '1h',
  });
  
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  
  return await at.toJwt();
}

async function generateClientToken(roomName: string, contact: any) {
  // Similar to bot token but for client identity
  // (if they join via web link instead of phone)
}

async function startAIVoiceBot(
  roomName: string,
  token: string,
  contact: any
) {
  // This runs as a server-side process
  // Connects bot to LiveKit room
  // Handles audio I/O and AI conversation
  
  // See section 4.2 for bot implementation
}

async function initiateSIPCall(roomName: string, phoneNumber: string) {
  // Use LiveKit SIP gateway to call phone number
  // Connect phone call to LiveKit room
  
  const sipTrunk = process.env.LIVEKIT_SIP_TRUNK_ID;
  if (!sipTrunk) {
    throw new Error('LiveKit SIP trunk not configured');
  }
  
  // LiveKit SIP API call
  await roomService.createSIPDTMF({
    roomName,
    participantIdentity: 'client-phone',
    dtmf: phoneNumber, // Phone number to dial
  });
  
  // Alternative: Use LiveKit SIP outbound API
  // This depends on your LiveKit SIP configuration
}
```

#### 4.2 Create AI Voice Bot
**File: `utils/livekit/ai-voice-bot.ts`** (NEW)

This is a **server-side process** that:
1. Connects to LiveKit room as a bot
2. Listens to audio from client
3. Transcribes speech in real-time
4. Sends to admin assistant API
5. Gets AI response
6. Converts text to speech
7. Plays audio back to client

```typescript
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { connect } from 'livekit-client';
import { OpenAI } from 'openai';

export class AIVoiceBot {
  private room: Room | null = null;
  private contact: any;
  private conversationHistory: any[] = [];
  private openai: OpenAI;
  
  constructor(contact: any) {
    this.contact = contact;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  
  async connect(roomName: string, token: string, serverUrl: string) {
    this.room = await connect(serverUrl, token, {
      autoSubscribe: true,
    });
    
    // Set up event listeners
    this.room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed);
    this.room.on(RoomEvent.DataReceived, this.handleDataReceived);
    
    // Start conversation
    await this.startConversation();
  }
  
  private async startConversation() {
    // Generate opening based on call type and contact info
    const greeting = this.generateGreeting();
    
    // Convert to speech and play
    await this.speak(greeting);
  }
  
  private generateGreeting(): string {
    const name = `${this.contact.first_name} ${this.contact.last_name}`.trim();
    const eventType = this.contact.event_type || 'event';
    
    return `Hi ${this.contact.first_name}, this is Ben from M10 DJ Company. I'm calling to follow up on your ${eventType} inquiry. Do you have a quick minute to chat?`;
  }
  
  private async handleTrackSubscribed(
    track: any,
    publication: any,
    participant: RemoteParticipant
  ) {
    if (track.kind === 'audio' && participant.identity !== 'ai-bot') {
      // Client is speaking - transcribe
      await this.transcribeAndRespond(track);
    }
  }
  
  private async transcribeAndRespond(audioTrack: any) {
    // 1. Get audio stream
    const audioStream = audioTrack.mediaStreamTrack;
    
    // 2. Send to transcription service (Deepgram/Whisper)
    const transcript = await this.transcribeAudio(audioStream);
    
    if (!transcript) return;
    
    // 3. Send to admin assistant API
    const response = await fetch('http://localhost:3000/api/admin-assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: transcript,
        conversationHistory: this.conversationHistory,
        context: {
          contactId: this.contact.id,
          callType: 'outbound',
        },
      }),
    });
    
    const { message, functions_called } = await response.json();
    
    // 4. Update conversation history
    this.conversationHistory.push(
      { role: 'user', content: transcript },
      { role: 'assistant', content: message }
    );
    
    // 5. Convert response to speech
    await this.speak(message);
    
    // 6. Handle function calls (update database, etc.)
    if (functions_called?.length > 0) {
      await this.handleFunctionCalls(functions_called);
    }
  }
  
  private async transcribeAudio(audioStream: MediaStreamTrack): Promise<string> {
    // Use Deepgram, Whisper, or LiveKit's built-in transcription
    // This is a simplified example
    
    // Option 1: Use LiveKit transcription plugin
    // (configured in LiveKit server)
    
    // Option 2: Use Deepgram SDK
    const { createClient } = require('@deepgram/sdk');
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
    
    // Stream audio to Deepgram
    // Return transcript
    
    // Option 3: Use OpenAI Whisper
    // Record audio chunk, send to Whisper API
    
    return ''; // Placeholder
  }
  
  private async speak(text: string) {
    // Convert text to speech
    // Options:
    // 1. OpenAI TTS API
    // 2. Google Cloud TTS
    // 3. Amazon Polly
    // 4. ElevenLabs (best quality)
    
    const audioUrl = await this.textToSpeech(text);
    
    // Play audio in LiveKit room
    await this.playAudio(audioUrl);
  }
  
  private async textToSpeech(text: string): Promise<string> {
    // Use OpenAI TTS
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy', // or 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      input: text,
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    // Save to temp file or return buffer
    return buffer.toString('base64');
  }
  
  private async playAudio(audioData: string) {
    // Create audio track from TTS output
    // Publish to LiveKit room
    // Client hears the AI speaking
  }
  
  private async handleFunctionCalls(functions: any[]) {
    // Functions are already executed by admin assistant API
    // But we can log them or take additional actions
    console.log('Functions called during call:', functions);
  }
}
```

#### 4.3 Add "Call Contact" Button to UI
**File: `pages/admin/contacts/[id].tsx`** (MODIFY)

Add button to contact detail page:

```typescript
const handleOutboundCall = async () => {
  const response = await fetch('/api/livekit/outbound-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId: contact.id,
      phoneNumber: contact.phone,
      callType: 'follow_up',
    }),
  });
  
  const { success, roomName } = await response.json();
  
  if (success) {
    toast({
      title: 'Calling...',
      description: `Initiating call to ${contact.phone}`,
    });
  }
};

// In JSX:
<Button onClick={handleOutboundCall}>
  <IconPhone /> Call with AI Assistant
</Button>
```

#### 4.4 Add to Admin Assistant Functions
**File: `utils/admin-assistant/functions.js`** (MODIFY)

Add new function:

```javascript
{
  name: 'initiate_outbound_call',
  description: 'Initiate an AI-powered outbound call to a contact. Use this when user says "call [contact]", "give them a call", "reach out to [name]".',
  parameters: {
    type: 'object',
    properties: {
      contact_id: {
        type: 'string',
        description: 'Contact ID to call'
      },
      call_type: {
        type: 'string',
        enum: ['follow_up', 'qualification', 'reminder', 'confirmation'],
        description: 'Type of call'
      },
      message: {
        type: 'string',
        description: 'Optional: Specific message or topic for the call'
      }
    },
    required: ['contact_id']
  }
}
```

#### 4.5 Set Up LiveKit SIP Gateway

**Required Configuration:**

1. **Enable SIP in LiveKit Cloud** (or self-hosted)
   - Go to LiveKit dashboard
   - Enable SIP gateway
   - Configure SIP trunk (Twilio SIP, or other provider)

2. **Environment Variables:**
```bash
LIVEKIT_SIP_TRUNK_ID=your-trunk-id
LIVEKIT_SIP_USERNAME=your-sip-username
LIVEKIT_SIP_PASSWORD=your-sip-password
```

3. **SIP Provider Options:**
   - **Twilio SIP** (easiest if you already use Twilio)
   - **Vonage/Nexmo**
   - **LiveKit's SIP gateway** (if available)

### Call Flow Example

```
1. Admin clicks "Call with AI" on contact page
2. API creates LiveKit room
3. AI bot joins room
4. SIP call initiated to client's phone
5. Client answers: "Hello?"
6. AI: "Hi Sarah, this is Ben from M10 DJ..."
7. Client: "Oh hi! Yes, I was interested in a quote"
8. AI: "Great! I'd love to help. What's your event date?"
9. Client: "June 15th, 2025"
10. AI: "Perfect! And how many guests are you expecting?"
11. [Conversation continues...]
12. AI updates database: event_date, guest_count, lead_status
13. Call ends
14. Admin sees transcript and updated contact info
```

### Advanced Features

#### 4.6 Call Scheduling
**File: `utils/admin-assistant/call-scheduler.ts`** (NEW)

```typescript
// Schedule calls for later
export async function scheduleOutboundCall(
  contactId: string,
  scheduledTime: Date,
  callType: string
) {
  // Store in database
  await supabase.from('scheduled_calls').insert({
    contact_id: contactId,
    scheduled_time: scheduledTime.toISOString(),
    call_type: callType,
    status: 'scheduled',
  });
  
  // Set up cron job or queue
}
```

#### 4.7 Call Analytics
Track:
- Call duration
- Conversation quality (sentiment analysis)
- Information collected
- Outcome (qualified, booked, not interested)
- Cost per call

### Cost Considerations

**LiveKit SIP Calling:**
- Typically $0.01-0.02 per minute
- Much cheaper than Twilio direct ($0.013-0.02/min)

**Transcription:**
- Deepgram: $0.0043/min
- OpenAI Whisper: $0.006/min

**TTS (Text-to-Speech):**
- OpenAI TTS: $15 per 1M characters (~$0.001 per call)
- ElevenLabs: $0.18 per 1000 characters (better quality)

**Total per 5-minute call: ~$0.10-0.15**

### Files to Create/Modify

1. ✅ **Create**: `app/api/livekit/outbound-call/route.ts` - Initiate calls
2. ✅ **Create**: `utils/livekit/ai-voice-bot.ts` - AI bot logic
3. ✅ **Create**: `utils/livekit/call-scheduler.ts` - Schedule calls
4. ✅ **Modify**: `utils/admin-assistant/functions.js` - Add call function
5. ✅ **Modify**: `pages/admin/contacts/[id].tsx` - Add call button
6. ✅ **Create**: Migration for `scheduled_calls` table

### Testing Strategy

1. ✅ Test with your own phone number first
2. ✅ Verify AI bot connects to room
3. ✅ Test transcription accuracy
4. ✅ Test TTS quality
5. ✅ Test conversation flow
6. ✅ Test database updates
7. ✅ Test with real contacts (with permission!)

---

## Next Steps

1. **Review this plan** - Any changes needed?
2. **Start Phase 1** - Voice assistant (highest ROI)
3. **Set up LiveKit transcription** - Enable in dashboard
4. **Test token generation** - Verify admin-assistant room type works
5. **Plan Phase 4** - Outbound calls (game changer!)

Ready to start implementing Phase 1?

