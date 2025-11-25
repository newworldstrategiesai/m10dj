import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId } = req.query;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Fetch questionnaire data
    const { data, error } = await supabase
      .from('music_questionnaires')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No questionnaire found
        return res.status(404).json({ error: 'Questionnaire not found' });
      }
      console.error('Error fetching questionnaire:', error);
      return res.status(500).json({ error: 'Failed to fetch questionnaire', details: error.message });
    }

    return res.status(200).json({
      success: true,
      data: {
        bigNoSongs: data.big_no_songs || '',
        specialDances: data.special_dances || [],
        specialDanceSongs: data.special_dance_songs || {},
        playlistLinks: data.playlist_links || {},
        ceremonyMusicType: data.ceremony_music_type || '',
        ceremonyMusic: data.ceremony_music || {},
        importedPlaylists: data.imported_playlists || {},
        completedAt: data.completed_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error in get questionnaire API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

