import { createClient } from '@supabase/supabase-js';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Server-Sent Events (SSE) endpoint for real-time karaoke queue updates
 * GET /api/karaoke/realtime/[organizationId]/[eventCode]
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { params } = req.query;
    const [organizationId, eventCode] = params;

    if (!organizationId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['organizationId']
      });
    }

    console.log('SSE Connection established for:', { organizationId, eventCode });

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
      data: { organizationId, eventCode }
    })}\n\n`);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Set up heartbeat interval (every 30 seconds)
    const heartbeat = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        console.error('Error sending heartbeat:', error);
        cleanup();
      }
    }, 30000);

    // Function to send queue updates
    const sendQueueUpdate = async () => {
      try {
        // Query current queue state
        let query = supabase
          .from('karaoke_signups')
          .select(`
            *,
            karaoke_song_videos (
              id,
              youtube_video_id,
              youtube_video_title,
              youtube_channel_name,
              video_quality_score,
              confidence_score,
              link_status
            )
          `)
          .eq('organization_id', organizationId)
          .in('status', ['queued', 'next', 'singing', 'completed'])
          .order('created_at', { ascending: true });

        // Filter by event code if provided and not 'all'
        if (eventCode && eventCode !== 'all') {
          query = query.eq('event_qr_code', eventCode);
        }

        const { data: signups, error } = await query;

        if (error) {
          console.error('SSE queue query error:', error);
          return;
        }

        // Process queue data (similar to queue.js but for real-time)
        const safeSignups = Array.isArray(signups) ? signups : [];

        // Import queue utilities
        const { getCurrentSinger, getNextSinger, getQueue, calculateEstimatedWait, formatEstimatedWait } = await import('@/utils/karaoke-queue');

        const current = getCurrentSinger(safeSignups);
        const next = getNextSinger(safeSignups);
        const queue = getQueue(safeSignups);

        // Format queue with estimated wait times
        const formattedQueue = queue.map((signup, index) => {
          const estimatedWait = calculateEstimatedWait(signup, safeSignups);
          return {
            id: signup.id,
            group_size: signup.group_size,
            singer_name: signup.singer_name,
            group_members: signup.group_members,
            song_title: signup.song_title,
            song_artist: signup.song_artist,
            queue_position: index + 1,
            estimated_wait: formatEstimatedWait(estimatedWait),
            is_priority: signup.is_priority,
            video_id: signup.video_id,
            video_url: signup.video_url,
            video_embed_allowed: signup.video_embed_allowed,
            video_data: signup.karaoke_song_videos ? {
              id: signup.karaoke_song_videos.id,
              youtube_video_id: signup.karaoke_song_videos.youtube_video_id,
              youtube_video_title: signup.karaoke_song_videos.youtube_video_title,
              youtube_channel_name: signup.karaoke_song_videos.youtube_channel_name,
              video_quality_score: signup.karaoke_song_videos.video_quality_score,
              confidence_score: signup.karaoke_song_videos.confidence_score,
              link_status: signup.karaoke_song_videos.link_status
            } : null
          };
        });

        const queueData = {
          current: current ? {
            id: current.id,
            group_size: current.group_size,
            singer_name: current.singer_name,
            group_members: current.group_members,
            song_title: current.song_title,
            song_artist: current.song_artist,
            started_at: current.started_at,
            video_id: current.video_id,
            video_url: current.video_url,
            video_embed_allowed: current.video_embed_allowed,
            video_data: current.karaoke_song_videos ? {
              id: current.karaoke_song_videos.id,
              youtube_video_id: current.karaoke_song_videos.youtube_video_id,
              youtube_video_title: current.karaoke_song_videos.youtube_video_title,
              youtube_channel_name: current.karaoke_song_videos.youtube_channel_name,
              video_quality_score: current.karaoke_song_videos.video_quality_score,
              confidence_score: current.karaoke_song_videos.confidence_score,
              link_status: current.karaoke_song_videos.link_status
            } : null
          } : null,
          next: next ? {
            id: next.id,
            group_size: next.group_size,
            singer_name: next.singer_name,
            group_members: next.group_members,
            song_title: next.song_title,
            song_artist: next.song_artist,
            video_id: next.video_id,
            video_url: next.video_url,
            video_embed_allowed: next.video_embed_allowed,
            video_data: next.karaoke_song_videos ? {
              id: next.karaoke_song_videos.id,
              youtube_video_id: next.karaoke_song_videos.youtube_video_id,
              youtube_video_title: next.karaoke_song_videos.youtube_video_title,
              youtube_channel_name: next.karaoke_song_videos.youtube_channel_name,
              video_quality_score: next.karaoke_song_videos.video_quality_score,
              confidence_score: next.karaoke_song_videos.confidence_score,
              link_status: next.karaoke_song_videos.link_status
            } : null
          } : null,
          queue: formattedQueue,
          total_in_queue: queue.length + (current ? 1 : 0) + (next ? 1 : 0)
        };

        // Send the update
        res.write(`data: ${JSON.stringify({
          type: 'queue_update',
          timestamp: new Date().toISOString(),
          data: queueData
        })}\n\n`);

      } catch (error) {
        console.error('Error sending queue update:', error);
      }
    };

    // Send initial queue state
    await sendQueueUpdate();

    // Set up real-time subscription
    const channel = supabase
      .channel(`karaoke_queue_${organizationId}_${eventCode || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'karaoke_signups',
          filter: eventCode && eventCode !== 'all'
            ? `organization_id=eq.${organizationId},event_qr_code=eq.${eventCode}`
            : `organization_id=eq.${organizationId}`
        },
        async (payload) => {
          console.log('SSE: Karaoke signup change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          // Debounce updates to avoid too many requests
          setTimeout(sendQueueUpdate, 100);
        }
      )
      .subscribe((status) => {
        console.log('SSE subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('SSE: Successfully subscribed to karaoke queue changes');
        }
      });

    // Cleanup function
    const cleanup = () => {
      console.log('SSE: Cleaning up connection');
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
      if (!res.headersSent) {
        res.end();
      }
    };

    // Handle client disconnect
    req.on('close', () => {
      console.log('SSE: Client disconnected');
      cleanup();
    });

    // Handle process termination
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

  } catch (error) {
    console.error('SSE setup error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

export default withSecurity(handler, 'sse', { requireOrgId: true });