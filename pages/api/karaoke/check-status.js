import { createClient } from '@supabase/supabase-js';
import { calculateQueuePosition } from '@/utils/karaoke-queue';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * GET /api/karaoke/check-status
 * Check queue status for a signup by ID or lookup info
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { signup_id, event_code, organization_id, singer_name, singer_phone } = req.query;

    // Method 1: Lookup by signup ID (most reliable)
    if (signup_id) {
      const { data: signup, error: signupError } = await supabase
        .from('karaoke_signups')
        .select('*')
        .eq('id', signup_id)
        .single();

      if (signupError || !signup) {
        return res.status(404).json({ error: 'Signup not found' });
      }

      // Get all signups for queue position calculation
      const { data: allSignups } = await supabase
        .from('karaoke_signups')
        .select('*')
        .eq('organization_id', signup.organization_id)
        .eq('event_qr_code', signup.event_qr_code)
        .in('status', ['queued', 'next', 'singing']);

      const queuePosition = calculateQueuePosition(signup, allSignups || []);

      return res.status(200).json({
        signup: {
          id: signup.id,
          group_size: signup.group_size,
          singer_name: signup.singer_name,
          group_members: signup.group_members,
          song_title: signup.song_title,
          song_artist: signup.song_artist,
          status: signup.status,
          queue_position: queuePosition,
          is_priority: signup.is_priority,
          created_at: signup.created_at,
          started_at: signup.started_at
        },
        queue_info: {
          total_in_queue: allSignups?.length || 0,
          ahead_of_you: Math.max(0, queuePosition - 1)
        }
      });
    }

    // Method 2: Lookup by name/phone and event (for returning users)
    if (event_code && organization_id && singer_name) {
      let query = supabase
        .from('karaoke_signups')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('event_qr_code', event_code)
        .ilike('singer_name', `%${singer_name}%`)
        .in('status', ['queued', 'next', 'singing'])
        .order('created_at', { ascending: false });

      // Add phone filter if provided
      if (singer_phone) {
        query = query.ilike('singer_phone', `%${singer_phone.replace(/\D/g, '')}%`);
      }

      const { data: signups, error: lookupError } = await query;

      if (lookupError) {
        return res.status(500).json({ error: 'Failed to lookup signup' });
      }

      if (!signups || signups.length === 0) {
        return res.status(404).json({ 
          error: 'No signup found',
          message: 'Could not find your signup. Please check your name and event code.'
        });
      }

      // Get the most recent active signup
      const signup = signups[0];

      // Get all signups for queue position
      const { data: allSignups } = await supabase
        .from('karaoke_signups')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('event_qr_code', event_code)
        .in('status', ['queued', 'next', 'singing']);

      const queuePosition = calculateQueuePosition(signup, allSignups || []);

      return res.status(200).json({
        signup: {
          id: signup.id,
          group_size: signup.group_size,
          singer_name: signup.singer_name,
          group_members: signup.group_members,
          song_title: signup.song_title,
          song_artist: signup.song_artist,
          status: signup.status,
          queue_position: queuePosition,
          is_priority: signup.is_priority,
          created_at: signup.created_at,
          started_at: signup.started_at
        },
        queue_info: {
          total_in_queue: allSignups?.length || 0,
          ahead_of_you: Math.max(0, queuePosition - 1)
        }
      });
    }

    return res.status(400).json({
      error: 'Missing required parameters',
      required: 'Either signup_id OR (event_code, organization_id, singer_name)'
    });

  } catch (error) {
    console.error('Error checking karaoke status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withSecurity(handler, 'status');
