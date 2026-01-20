import { createClient } from '@/utils/supabase/server';
import {
  getCurrentSinger,
  getNextSinger,
  getQueue,
  calculateEstimatedWait,
  formatEstimatedWait
} from '@/utils/karaoke-queue';

/**
 * GET /api/karaoke/queue
 * Get karaoke queue for an event
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient();
    const { event_code, organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['organization_id']
      });
    }

    // Get all signups - either for specific event or all organization events
    let query = supabase
      .from('karaoke_signups')
      .select('*')
      .eq('organization_id', organization_id)
      .in('status', ['queued', 'next', 'singing', 'completed'])
      .order('created_at', { ascending: true });

    // If event_code is provided and not 'all', filter by event
    if (event_code && event_code !== 'all') {
      query = query.eq('event_qr_code', event_code);
    }

    const { data: signups, error: signupsError } = await query;

    if (signupsError) {
      console.error('Error fetching karaoke signups:', signupsError);
      return res.status(500).json({
        error: 'Failed to fetch queue',
        details: signupsError.message
      });
    }

    const current = getCurrentSinger(signups || []);
    const next = getNextSinger(signups || []);
    const queue = getQueue(signups || []);

    // Format queue with estimated wait times
    const formattedQueue = queue.map((signup, index) => {
      const estimatedWait = calculateEstimatedWait(signup, signups || []);
      return {
        id: signup.id,
        group_size: signup.group_size,
        singer_name: signup.singer_name,
        group_members: signup.group_members,
        song_title: signup.song_title,
        song_artist: signup.song_artist,
        queue_position: index + 1,
        estimated_wait: formatEstimatedWait(estimatedWait),
        is_priority: signup.is_priority
      };
    });

    return res.status(200).json({
      current: current ? {
        id: current.id,
        group_size: current.group_size,
        singer_name: current.singer_name,
        group_members: current.group_members,
        song_title: current.song_title,
        song_artist: current.song_artist,
        started_at: current.started_at
      } : null,
      next: next ? {
        id: next.id,
        group_size: next.group_size,
        singer_name: next.singer_name,
        group_members: next.group_members,
        song_title: next.song_title,
        song_artist: next.song_artist
      } : null,
      queue: formattedQueue,
      total_in_queue: queue.length + (current ? 1 : 0) + (next ? 1 : 0)
    });

  } catch (error) {
    console.error('Error in karaoke queue:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
