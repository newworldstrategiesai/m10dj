// API endpoint to find music service links for a song request
// Called on-demand when admin views a request
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { findMusicLinks } from '@/utils/music-link-finder';
import { getEnv } from '@/utils/env-validator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);

    const { requestId, songTitle, songArtist } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    if (!songTitle || !songArtist) {
      return res.status(400).json({ error: 'Song title and artist are required' });
    }

    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if links already exist in database
    const { data: existingRequest, error: fetchError } = await supabase
      .from('crowd_requests')
      .select('music_service_links')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching request:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch request' });
    }

    // If links already exist and were found recently (within last 7 days), return cached
    if (existingRequest?.music_service_links?.found_at) {
      const foundDate = new Date(existingRequest.music_service_links.found_at);
      const daysSinceFound = (Date.now() - foundDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceFound < 7 && (existingRequest.music_service_links.spotify || 
                                 existingRequest.music_service_links.youtube || 
                                 existingRequest.music_service_links.tidal)) {
        return res.status(200).json({
          links: existingRequest.music_service_links,
          cached: true
        });
      }
    }

    // Find music links
    console.log(`Finding music links for: "${songTitle}" by "${songArtist}"`);
    const links = await findMusicLinks(songTitle, songArtist, {
      timeout: 8000, // 8 second timeout per service
      services: ['spotify', 'youtube', 'tidal']
    });

    // Update the request with found links
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update({ music_service_links: links })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request with links:', updateError);
      // Still return the links even if update fails
    }

    res.status(200).json({
      links,
      cached: false
    });

  } catch (error) {
    console.error('Error finding music links:', error);
    
    // If it's an auth error, it's already handled by requireAdmin
    if (res.headersSent) {
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to find music links',
      details: error.message 
    });
  }
}

