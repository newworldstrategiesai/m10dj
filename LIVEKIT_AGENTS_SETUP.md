# LiveKit Agents Server Setup Guide

## Overview

This guide explains how to set up and run the LiveKit Agents server with RAG (Retrieval-Augmented Generation) capabilities for real-time voice AI interactions.

## Architecture

The LiveKit Agents server is a **separate Node.js service** that:
- Connects to LiveKit rooms for real-time audio
- Provides voice AI using STT (Speech-to-Text), LLM, and TTS (Text-to-Speech)
- Performs RAG lookups against your Supabase database
- Uses tools to access external data and take actions

## Prerequisites

1. **LiveKit Server** - Running and accessible
2. **OpenAI API Key** - For LLM (GPT-4o recommended)
3. **Deepgram API Key** - For Speech-to-Text
4. **ElevenLabs API Key** - For Text-to-Speech
5. **Supabase** - Already configured in your project

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@livekit/agents` - LiveKit Agents SDK
- `tsx` - TypeScript execution for development

### 2. Environment Variables

Create a `.env` file in the `agents/` directory (or use your main `.env.local`):

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Supabase Configuration (use existing values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Speech-to-Text (Deepgram)
DEEPGRAM_API_KEY=your-deepgram-api-key

# Text-to-Speech (ElevenLabs)
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### 3. Get API Keys

#### Deepgram (Speech-to-Text)
1. Sign up at https://deepgram.com
2. Create a new project
3. Get your API key from the dashboard

#### ElevenLabs (Text-to-Speech)
1. Sign up at https://elevenlabs.io
2. Get your API key from your profile
3. Optionally choose a voice ID (default is provided)

## Running the Agent Server

### Development Mode (with hot reload)

```bash
npm run agent:dev
```

### Production Mode

```bash
npm run agent:start
```

The agent server will:
- Connect to LiveKit
- Listen for new agent jobs
- Handle voice interactions in real-time

## How It Works

### 1. Job Creation

When a user connects to a LiveKit room (via your Next.js app), you create an agent job with metadata:

```typescript
// In your Next.js API route
const { RoomServiceClient } = require('livekit-server-sdk');

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

// Create agent job with metadata
await roomService.createAgentJob({
  room: roomName,
  agentType: 'voice',
  metadata: JSON.stringify({
    sessionId: 'user-session-id',
    contactId: 'contact-uuid', // optional
    userName: 'John Doe', // optional
  }),
});
```

### 2. Initial Context Loading

The agent loads initial context from:
- **Job metadata**: sessionId, contactId, userName
- **Supabase contacts**: If contactId is provided, loads contact details
- **Conversation history**: If sessionId exists, loads recent messages

### 3. RAG Lookup

On each user turn, the agent performs RAG lookup to find:
- **Recent conversation history** (last 5 messages)
- **Contact information** (if contactId provided)
- **Relevant FAQs** (matching query keywords)
- **Customer testimonials** (for social proof)

This context is automatically injected before the LLM generates a response.

### 4. Tool Calls

The agent has access to tools:
- `getContactInfo`: Retrieve detailed contact information
- `searchKnowledgeBase`: Search FAQs, testimonials, and conversation history

## Integration with Your App

### Frontend: Creating Agent Jobs

When a user starts a voice conversation, create an agent job:

```typescript
// app/api/livekit/create-agent/route.ts
import { RoomServiceClient } from 'livekit-server-sdk';

export async function POST(request: Request) {
  const { roomName, sessionId, contactId, userName } = await request.json();

  const roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );

  // Create agent job
  await roomService.createAgentJob({
    room: roomName,
    agentType: 'voice',
    metadata: JSON.stringify({
      sessionId,
      contactId,
      userName,
    }),
  });

  return Response.json({ success: true });
}
```

### Updating Token API

Update your existing token API to support agent rooms:

```typescript
// app/api/livekit/token/route.ts
if (roomType === 'agent') {
  // Grant permissions for agent rooms
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
}
```

## RAG Data Sources

The agent searches these Supabase tables:

1. **voice_conversations** - Recent conversation history
2. **contacts** - Customer/lead information
3. **faqs** - Frequently asked questions
4. **testimonials** - Customer reviews

### Adding More RAG Sources

To add more data sources, edit `agents/index.ts`:

```typescript
async function performRagLookup(query: string, sessionId?: string, contactId?: string): Promise<string> {
  // Add your custom searches here
  const { data: customData } = await supabase
    .from('your_table')
    .select('*')
    .ilike('column', `%${query}%`)
    .limit(5);
  
  // Add to contextPieces array
}
```

## Customization

### Changing the LLM Model

Edit `agents/index.ts`:

```typescript
llm: llm.LLMManager.create({
  provider: 'openai',
  model: 'gpt-4o-mini', // Change model here
  apiKey: OPENAI_API_KEY,
}),
```

### Changing the Voice

Edit `agents/index.ts`:

```typescript
tts: tts.TTSManager.create({
  provider: 'elevenlabs',
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: 'your-voice-id', // Change voice ID
}),
```

### Adding Custom Tools

```typescript
const myCustomTool = llm.tool({
  description: 'Description of what the tool does',
  parameters: z.object({
    param1: z.string(),
  }),
  execute: async ({ param1 }, { ctx }) => {
    // Tool implementation
    return { result: 'success' };
  },
});

// Add to agent tools array
tools: [getContactInfo, searchKnowledgeBase, myCustomTool],
```

## Deployment

### Option 1: Separate Server (Recommended)

Deploy the agent server as a separate service:
- **Vercel**: Use serverless functions (may have timeout limits)
- **Railway**: Good for long-running processes
- **Render**: Supports background workers
- **Docker**: Deploy to any container platform

### Option 2: Same Server

Run alongside your Next.js app using PM2:

```bash
pm2 start npm --name "livekit-agent" -- run agent:start
```

## Monitoring

The agent logs important events:
- Agent session started/ended
- RAG lookup results
- Tool call executions
- Errors

Monitor logs to ensure the agent is working correctly.

## Troubleshooting

### Agent Not Connecting

1. Check LiveKit server is running
2. Verify API keys are correct
3. Check network connectivity
4. Review agent server logs

### RAG Not Finding Context

1. Verify Supabase connection
2. Check table names match
3. Ensure RLS policies allow service role access
4. Test queries directly in Supabase

### Audio Issues

1. Check STT/TTS API keys
2. Verify audio codec compatibility
3. Test with different providers
4. Check network latency

## Next Steps

- [ ] Set up API keys
- [ ] Test agent locally
- [ ] Integrate with frontend
- [ ] Deploy agent server
- [ ] Monitor and optimize

## Additional Resources

- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [RAG Best Practices](https://docs.livekit.io/agents/logic/external-data.md)
- [Tool Calling Guide](https://docs.livekit.io/agents/build/tools.md)









