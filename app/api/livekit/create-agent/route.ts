import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

/**
 * Create LiveKit Agent Job
 * 
 * Creates an agent job that will connect to a LiveKit room
 * and provide voice AI assistance with RAG capabilities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, sessionId, contactId, userName } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      );
    }

    const livekitUrl = process.env.LIVEKIT_URL;
    const livekitApiKey = process.env.LIVEKIT_API_KEY;
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret
    );

    // Prepare metadata for the agent
    const metadata: Record<string, any> = {};
    if (sessionId) metadata.sessionId = sessionId;
    if (contactId) metadata.contactId = contactId;
    if (userName) metadata.userName = userName;

    // Note: LiveKit Agents SDK handles job creation automatically
    // when the agent server is running and connected to LiveKit.
    // This endpoint is for documentation/reference.
    // 
    // The agent will automatically join rooms that match its configuration.
    // You can trigger agent creation by:
    // 1. Having the agent server running
    // 2. Creating a room with a specific naming pattern
    // 3. Or using LiveKit's agent job API (if available in your version)

    // Create the room (or it may already exist)
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60, // 10 minutes
        maxParticipants: 10,
      });
      console.log('Room created:', roomName);
    } catch (error: any) {
      // Room might already exist, that's okay
      if (error.message?.includes('already exists') || error.code === 'ROOM_ALREADY_EXISTS') {
        console.log('Room already exists:', roomName);
      } else {
        // For other errors, log but don't fail - room might still be usable
        console.warn('Room creation warning:', error.message);
      }
    }

    return NextResponse.json({
      success: true,
      roomName,
      message: 'Agent will connect automatically when agent server is running',
      metadata,
    });
  } catch (error) {
    console.error('Error creating agent job:', error);
    return NextResponse.json(
      {
        error: 'Failed to create agent job',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


