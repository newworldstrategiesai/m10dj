// API endpoint to normalize song casing for all existing crowd requests
// Can be run manually by admins to fix casing for existing records
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';
import { normalizeSongCasing } from '@/utils/song-casing-normalizer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);

    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all song requests that need normalization
    const { data: requests, error: fetchError } = await supabase
      .from('crowd_requests')
      .select('id, song_title, song_artist, request_type')
      .eq('request_type', 'song_request')
      .not('song_title', 'is', null);

    if (fetchError) {
      console.error('Error fetching requests:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    if (!requests || requests.length === 0) {
      return res.status(200).json({
        message: 'No song requests found to normalize',
        updated: 0
      });
    }

    console.log(`Found ${requests.length} song requests to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each request
    for (const request of requests) {
      try {
        // Normalize casing
        const normalized = normalizeSongCasing(
          request.song_title || '',
          request.song_artist || ''
        );

        // Check if normalization would change anything
        const titleChanged = normalized.normalizedTitle !== request.song_title;
        const artistChanged = normalized.normalizedArtist !== request.song_artist;

        if (!titleChanged && !artistChanged) {
          skippedCount++;
          continue;
        }

        // Update the request
        const updateData = {};
        if (titleChanged) {
          updateData.song_title = normalized.normalizedTitle;
        }
        if (artistChanged) {
          updateData.song_artist = normalized.normalizedArtist;
        }

        const { error: updateError } = await supabase
          .from('crowd_requests')
          .update(updateData)
          .eq('id', request.id);

        if (updateError) {
          console.error(`Error updating request ${request.id}:`, updateError);
          errors.push({
            id: request.id,
            error: updateError.message
          });
        } else {
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`Processed ${updatedCount} requests...`);
          }
        }
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        errors.push({
          id: request.id,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: 'Casing normalization complete',
      total: requests.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error normalizing song casing:', error);
    
    if (res.headersSent) {
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to normalize song casing',
      details: error.message 
    });
  }
}

