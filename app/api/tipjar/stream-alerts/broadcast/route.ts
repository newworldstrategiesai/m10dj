import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, event_type, event_data } = body;

    // Validate required fields
    if (!user_id || !event_type || !event_data) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, event_type, event_data' },
        { status: 400 }
      );
    }

    // Validate event_type
    const validEventTypes = ['tip', 'song_request', 'merch_purchase', 'follower', 'subscriber'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Use service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user exists
    const { data: userCheck, error: userError } = await supabase
      .from('stream_alert_configs')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    if (userError || !userCheck) {
      return NextResponse.json(
        { error: 'User not found or alerts not configured' },
        { status: 404 }
      );
    }

    // Insert alert event
    const { data: alertEvent, error: insertError } = await supabase
      .from('stream_alert_events')
      .insert({
        user_id,
        event_type,
        event_data,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting alert event:', insertError);
      return NextResponse.json(
        { error: 'Failed to create alert event' },
        { status: 500 }
      );
    }

    // If it's a tip, add to recent donors
    if (event_type === 'tip' && event_data?.name) {
      await supabase.from('stream_recent_donors').insert({
        user_id,
        donor_name: event_data.name,
        amount: event_data.amount || null,
        event_type: 'tip',
      });

      // Update goal if enabled
      const { data: config } = await supabase
        .from('stream_alert_configs')
        .select('goal_enabled, goal_current')
        .eq('user_id', user_id)
        .single();

      if (config?.goal_enabled && event_data?.amount) {
        const newGoalCurrent = (config.goal_current || 0) + parseFloat(event_data.amount);
        await supabase
          .from('stream_alert_configs')
          .update({ goal_current: newGoalCurrent })
          .eq('user_id', user_id);
      }
    }

    return NextResponse.json({
      success: true,
      alert_id: alertEvent.id,
      message: 'Alert broadcast successfully',
    });
  } catch (error) {
    console.error('Error broadcasting alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook documentation
export async function GET() {
  return NextResponse.json({
    message: 'Stream Alerts Broadcast API',
    usage: {
      method: 'POST',
      endpoint: '/api/tipjar/stream-alerts/broadcast',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        user_id: 'uuid',
        event_type: 'tip | song_request | merch_purchase | follower | subscriber',
        event_data: {
          // Event data structure varies by event_type:
          // For tip: { amount: number, name: string, message?: string }
          // For song_request: { song_title: string, artist: string, name: string }
          // For merch_purchase: { item_name: string, name: string }
          // For follower/subscriber: { name: string, tier?: string }
        },
      },
      examples: {
        tip: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          event_type: 'tip',
          event_data: {
            amount: 20.00,
            name: 'John Doe',
            message: 'Great stream!',
          },
        },
        song_request: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          event_type: 'song_request',
          event_data: {
            song_title: 'Bohemian Rhapsody',
            artist: 'Queen',
            name: 'Jane Smith',
          },
        },
      },
    },
  });
}

