import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, bigNoSongs, specialDances, specialDanceSongs, playlistLinks, ceremonyMusicType, ceremonyMusic, mcIntroduction, isComplete } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Check if questionnaire already exists to preserve started_at
    const { data: existing } = await supabase
      .from('music_questionnaires')
      .select('started_at')
      .eq('lead_id', leadId)
      .single();

    const now = new Date().toISOString();
    const updateData = {
      lead_id: leadId,
      big_no_songs: bigNoSongs || null,
      special_dances: specialDances || [],
      special_dance_songs: specialDanceSongs || {},
      playlist_links: playlistLinks || {},
      ceremony_music_type: ceremonyMusicType || null,
      ceremony_music: ceremonyMusic || {},
      mc_introduction: mcIntroduction !== undefined ? (mcIntroduction === null ? null : mcIntroduction) : null,
      updated_at: now
    };

    // Set started_at if this is the first time
    if (!existing?.started_at) {
      updateData.started_at = now;
    }

    // Set completed_at only if explicitly marked as complete
    if (isComplete === true) {
      updateData.completed_at = now;
    }

    // Save questionnaire data
    const { data, error } = await supabase
      .from('music_questionnaires')
      .upsert(updateData, {
        onConflict: 'lead_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving questionnaire:', error);
      return res.status(500).json({ error: 'Failed to save questionnaire', details: error.message });
    }

    // Send admin notification
    try {
      const { sendAdminNotification } = await import('../../../utils/admin-notifications');
      await sendAdminNotification('questionnaire_completed', {
        leadId: leadId,
        completedAt: new Date().toISOString()
      });
    } catch (notifError) {
      console.error('Failed to send admin notification:', notifError);
      // Don't fail the request if notification fails
    }

    return res.status(200).json({
      success: true,
      message: 'Questionnaire saved successfully',
      data
    });
  } catch (error) {
    console.error('Error in save questionnaire API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

