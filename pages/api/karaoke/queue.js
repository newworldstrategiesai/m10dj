import { createClient } from '@supabase/supabase-js';
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
    console.log('Queue API called with:', req.query);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Wrap the entire handler logic in try-catch
    try {
    const { event_code, organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['organization_id']
      });
    }

    console.log('About to query karaoke_signups table');

    // Get all signups - either for specific event or all organization events
    let query = supabase
      .from('karaoke_signups')
      .select('*')
      .eq('organization_id', organization_id)
      .in('status', ['queued', 'next', 'singing', 'completed'])
      .order('created_at', { ascending: true });

    console.log('Query built:', query);

    // If event_code is provided and not 'all', filter by event
    if (event_code && event_code !== 'all') {
      query = query.eq('event_qr_code', event_code);
      console.log('Added event_code filter:', event_code);
    }

      console.log('Executing query...');
      const { data: signups, error: signupsError } = await query;
      console.log('Query executed, data length:', signups?.length, 'error:', signupsError);

      // Handle case where table doesn't exist or other database issues
      if (signupsError) {
        console.error('Error fetching karaoke signups:', signupsError);
        console.error('Query details:', { event_code, organization_id });
        console.error('Full error:', JSON.stringify(signupsError, null, 2));

        // If table doesn't exist, return empty queue
        if (signupsError.code === 'PGRST116' || signupsError.message?.includes('karaoke_signups')) {
          console.log('Karaoke signups table not found, returning empty queue');
          return res.status(200).json({
            current: null,
            next: null,
            queue: [],
            total_in_queue: 0
          });
        }

        return res.status(500).json({
          error: 'Failed to fetch queue',
          details: signupsError.message,
          code: signupsError.code
        });
      }

      // Ensure signups is an array
      const safeSignups = Array.isArray(signups) ? signups : [];
      console.log('Safe signups length:', safeSignups.length);

      let current, next, queue, formattedQueue;

      try {
        console.log('Calling getCurrentSinger...');
        current = getCurrentSinger(safeSignups);
        console.log('getCurrentSinger result:', current);

        console.log('Calling getNextSinger...');
        next = getNextSinger(safeSignups);
        console.log('getNextSinger result:', next);

        console.log('Calling getQueue...');
        queue = getQueue(safeSignups);
        console.log('getQueue result length:', queue.length);

        // Format queue with estimated wait times
        console.log('Formatting queue...');
        formattedQueue = queue.map((signup, index) => {
          console.log(`Processing signup ${index}:`, signup.id);
          const estimatedWait = calculateEstimatedWait(signup, safeSignups);
          console.log(`Estimated wait for signup ${index}:`, estimatedWait);
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
      } catch (utilError) {
        console.error('Error in queue utility functions:', utilError);
        console.error('Error stack:', utilError.stack);
        console.error('Error type:', typeof utilError);
        return res.status(500).json({
          error: 'Failed to process queue data',
          details: utilError.message,
          stack: utilError.stack
        });
      }

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
    } catch (innerError) {
      console.error('Inner error in queue API:', innerError);
      console.error('Inner error stack:', innerError.stack);
      return res.status(500).json({
        error: 'Internal server error',
        message: innerError.message,
        stack: innerError.stack
      });
    }

  } catch (error) {
    console.error('Outer error in karaoke queue:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
