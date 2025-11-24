import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin authentication
    const supabaseClient = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin using email-based authentication
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'  // Ben Murray - Owner
    ];
    const isAdmin = adminEmails.includes(session.user.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { event_qr_code, requester_email, requester_phone } = req.query;

    // Get user's organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get recent requests count (last hour) - Filtered by organization
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    let recentQuery = supabase
      .from('crowd_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id) // CRITICAL: Filter by organization
      .gte('created_at', oneHourAgo)
      .eq('payment_status', 'paid');

    if (event_qr_code) {
      recentQuery = recentQuery.eq('event_qr_code', event_qr_code);
    }

    const { count: recentCount } = await recentQuery;

    // Get user's request count (if email or phone provided) - Filtered by organization
    let userRequestCount = 0;
    if (requester_email || requester_phone) {
      let userQuery = supabase
        .from('crowd_requests')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id) // CRITICAL: Filter by organization
        .eq('payment_status', 'paid');

      if (event_qr_code) {
        userQuery = userQuery.eq('event_qr_code', event_qr_code);
      }

      if (requester_email) {
        userQuery = userQuery.eq('requester_email', requester_email);
      } else if (requester_phone) {
        userQuery = userQuery.eq('requester_phone', requester_phone);
      }

      const { count } = await userQuery;
      userRequestCount = count || 0;
    }

    // Get most popular song requests (last 24 hours) - Filtered by organization
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let popularQuery = supabase
      .from('crowd_requests')
      .select('song_title, song_artist')
      .eq('organization_id', org.id) // CRITICAL: Filter by organization
      .eq('request_type', 'song_request')
      .eq('payment_status', 'paid')
      .gte('created_at', oneDayAgo)
      .not('song_title', 'is', null);

    if (event_qr_code) {
      popularQuery = popularQuery.eq('event_qr_code', event_qr_code);
    }

    const { data: popularSongs } = await popularQuery;

    // Count song occurrences
    const songCounts = {};
    if (popularSongs) {
      popularSongs.forEach(song => {
        const key = `${song.song_title}${song.song_artist ? ` by ${song.song_artist}` : ''}`;
        songCounts[key] = (songCounts[key] || 0) + 1;
      });
    }

    // Get top 3 most requested songs
    const topSongs = Object.entries(songCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([song, count]) => ({ song, count }));

    res.status(200).json({
      recentCount: recentCount || 0,
      userRequestCount,
      topSongs,
    });
  } catch (error) {
    console.error('Error fetching request stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      recentCount: 0,
      userRequestCount: 0,
      topSongs: [],
    });
  }
}

