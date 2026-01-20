import { createClient } from '@supabase/supabase-js';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Enhanced song search API for karaoke and song requests
 * Combines database search with external API searches (Spotify, Apple Music)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, organizationId, limit = 10 } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const searchQuery = query.trim().toLowerCase();
    const suggestions = [];

    // 1. Search database (previously requested songs)
    let supabase;
    try {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      let dbQuery = supabase
        .from('crowd_requests')
        .select('song_title, song_artist, created_at')
        .not('song_title', 'is', null)
        .or(`song_title.ilike.%${searchQuery}%,song_artist.ilike.%${searchQuery}%`)
        .limit(20);

      if (organizationId) {
        dbQuery = dbQuery.eq('organization_id', organizationId);
      }

      const { data: dbResults } = await dbQuery;

      if (dbResults && dbResults.length > 0) {
        // Group and deduplicate
        const songMap = new Map();
        dbResults.forEach(row => {
          const key = `${(row.song_title || '').toLowerCase().trim()}|${(row.song_artist || '').toLowerCase().trim()}`;
          if (!songMap.has(key)) {
            songMap.set(key, {
              title: row.song_title?.trim() || '',
              artist: row.song_artist?.trim() || '',
              count: 0,
              mostRecent: row.created_at,
              source: 'database'
            });
          }
          const entry = songMap.get(key);
          entry.count++;
          if (new Date(row.created_at) > new Date(entry.mostRecent)) {
            entry.mostRecent = row.created_at;
          }
        });

        // Add database results (prioritize popular ones)
        Array.from(songMap.values())
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return new Date(b.mostRecent) - new Date(a.mostRecent);
          })
          .slice(0, 5)
          .forEach((song, index) => {
            suggestions.push({
              id: `db-${index}-${song.title}-${song.artist}`,
              title: song.title,
              artist: song.artist,
              source: 'database',
              popularity: song.count
            });
          });
      }
    } catch (dbError) {
      console.error('Database search error:', dbError);
    }

    // 2. Search Spotify (if API key available)
    if (suggestions.length < limit && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      try {
        // Get access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          },
          body: 'grant_type=client_credentials'
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          // Search Spotify
          const spotifyResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${Math.min(limit - suggestions.length, 5)}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );

          if (spotifyResponse.ok) {
            const spotifyData = await spotifyResponse.json();
            if (spotifyData.tracks && spotifyData.tracks.items) {
              spotifyData.tracks.items.forEach((track, index) => {
                // Avoid duplicates
                const isDuplicate = suggestions.some(s => 
                  s.title.toLowerCase() === track.name.toLowerCase() &&
                  s.artist.toLowerCase() === track.artists[0]?.name.toLowerCase()
                );

                if (!isDuplicate) {
                  suggestions.push({
                    id: `spotify-${track.id}`,
                    title: track.name,
                    artist: track.artists[0]?.name || 'Unknown Artist',
                    albumArt: track.album?.images?.[0]?.url || null,
                    spotifyUrl: track.external_urls?.spotify || null,
                    source: 'spotify',
                    popularity: track.popularity || 0
                  });
                }
              });
            }
          }
        }
      } catch (spotifyError) {
        console.error('Spotify search error:', spotifyError);
      }
    }

    // 3. Search Apple Music (if API key available)
    if (suggestions.length < limit && process.env.APPLE_MUSIC_API_KEY) {
      try {
        const appleResponse = await fetch(
          `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=${Math.min(limit - suggestions.length, 5)}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.APPLE_MUSIC_API_KEY}`
            }
          }
        );

        if (appleResponse.ok) {
          const appleData = await appleResponse.json();
          if (appleData.results && appleData.results.songs && appleData.results.songs.data) {
            appleData.results.songs.data.forEach((song, index) => {
              const isDuplicate = suggestions.some(s => 
                s.title.toLowerCase() === song.attributes.name.toLowerCase() &&
                s.artist.toLowerCase() === song.attributes.artistName.toLowerCase()
              );

              if (!isDuplicate) {
                suggestions.push({
                  id: `apple-${song.id}`,
                  title: song.attributes.name,
                  artist: song.attributes.artistName,
                  albumArt: song.attributes.artwork?.url?.replace('{w}', '300').replace('{h}', '300') || null,
                  appleMusicUrl: song.attributes.url || null,
                  source: 'apple_music',
                  popularity: 0
                });
              }
            });
          }
        }
      } catch (appleError) {
        console.error('Apple Music search error:', appleError);
      }
    }

    // 4. Fallback: iTunes Search API (no API key required, but less reliable)
    if (suggestions.length < limit) {
      try {
        const itunesResponse = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${Math.min(limit - suggestions.length, 5)}`
        );

        if (itunesResponse.ok) {
          const itunesData = await itunesResponse.json();

          if (itunesData.results && itunesData.results.length > 0) {
            itunesData.results.forEach((result) => {
              const isDuplicate = suggestions.some(s =>
                s.title.toLowerCase() === result.trackName?.toLowerCase() &&
                s.artist.toLowerCase() === result.artistName?.toLowerCase()
              );

              if (!isDuplicate) {
                suggestions.push({
                  id: `itunes-${result.trackId}`,
                  title: result.trackName,
                  artist: result.artistName,
                  albumArt: result.artworkUrl100?.replace('100x100', '300x300') || null,
                  itunesUrl: result.trackViewUrl || null,
                  source: 'itunes',
                  popularity: 0
                });
              }
            });
          }
        }
      } catch (itunesError) {
        console.error('iTunes search error:', itunesError);
      }
    }

    // Sort by relevance (database results first, then by popularity)
    const sorted = suggestions.sort((a, b) => {
      // Database results first
      if (a.source === 'database' && b.source !== 'database') return -1;
      if (b.source === 'database' && a.source !== 'database') return 1;
      
      // Then by popularity
      if (a.popularity !== b.popularity) {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      
      // Finally alphabetically
      return a.title.localeCompare(b.title);
    });

    return res.status(200).json({ 
      suggestions: sorted.slice(0, limit),
      query: searchQuery
    });

  } catch (error) {
    console.error('Error in song search:', error);
    return res.status(200).json({ suggestions: [] }); // Graceful degradation
  }
}

export default withSecurity(handler, 'search');
