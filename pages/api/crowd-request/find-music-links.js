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

    const { requestId, songTitle, songArtist, youtubeUrl } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    // Allow either songTitle/songArtist OR youtubeUrl
    if (!songTitle && !songArtist && !youtubeUrl) {
      return res.status(400).json({ error: 'Song title and artist, or YouTube URL is required' });
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
                                 existingRequest.music_service_links.tidal ||
                                 existingRequest.music_service_links.apple_music)) {
        return res.status(200).json({
          links: existingRequest.music_service_links,
          cached: true
        });
      }
    }

    // Find music links
    // If YouTube URL is provided, use it to extract song info and find other services
    // Otherwise, use songTitle and songArtist
    console.log(youtubeUrl 
      ? `Finding music links from YouTube URL: ${youtubeUrl}`
      : `Finding music links for: "${songTitle}" by "${songArtist}"`
    );
    console.log('Request body:', { requestId, songTitle, songArtist, youtubeUrl });
    
    const links = await findMusicLinks(songTitle, songArtist, {
      timeout: 10000, // 10 second timeout per service (increased from 8s)
      services: ['spotify', 'youtube', 'tidal', 'apple_music'],
      youtubeUrl: youtubeUrl || null
    });

    console.log('Links found:', {
      spotify: !!links.spotify,
      youtube: !!links.youtube,
      tidal: !!links.tidal,
      apple_music: !!links.apple_music,
      found_at: links.found_at
    });
    
    // Log actual URLs for debugging (truncated)
    if (links.spotify) console.log('Spotify URL:', links.spotify.substring(0, 50) + '...');
    if (links.youtube) console.log('YouTube URL:', links.youtube.substring(0, 50) + '...');
    if (links.tidal) console.log('Tidal URL:', links.tidal.substring(0, 50) + '...');
    if (links.apple_music) console.log('Apple Music URL:', links.apple_music.substring(0, 50) + '...');
    
    // Ensure all fields are present in response
    const responseLinks = {
      spotify: links.spotify || null,
      youtube: links.youtube || null,
      tidal: links.tidal || null,
      apple_music: links.apple_music || null,
      found_at: links.found_at || null,
      search_method: links.search_method || 'web_scrape'
    };
    
    console.log('Response links object:', responseLinks);

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
      links: responseLinks,
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

