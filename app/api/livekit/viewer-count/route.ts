import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomName = searchParams.get('roomName');

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(url, apiKey, apiSecret);
    const participants = await roomService.listParticipants(roomName);
    
    // Filter out the streamer (participants with canPublish permission)
    const viewerCount = participants.filter(
      (p: any) => !p.permissions?.canPublish
    ).length;

    return NextResponse.json({ count: viewerCount });
  } catch (error) {
    console.error('Error fetching viewer count:', error);
    // Return 0 on error rather than failing
    return NextResponse.json({ count: 0 });
  }
}

