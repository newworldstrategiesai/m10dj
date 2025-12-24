import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory } from '@/utils/voice-conversations';

/**
 * Get conversation history for a session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, conversationType = 'website', limit = 20 } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const history = await getConversationHistory(sessionId, conversationType, limit);

    return NextResponse.json({
      history,
      sessionId,
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return NextResponse.json(
      {
        error: 'Failed to get conversation history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

