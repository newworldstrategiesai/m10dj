import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verification endpoint to confirm questionnaire submission was successful
 * This endpoint re-fetches the questionnaire and compares it with submitted data
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, submissionLogId, submittedData } = req.body;

    if (!leadId) {
      return res.status(400).json({ 
        error: 'Lead ID is required',
        message: 'Missing contact ID for verification.'
      });
    }

    // Fetch questionnaire from database
    const { data: questionnaire, error: fetchError } = await supabase
      .from('music_questionnaires')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Questionnaire doesn't exist - this is a problem!
        return res.status(404).json({
          success: false,
          verified: false,
          error: 'Questionnaire not found in database',
          message: 'The questionnaire was not found. The submission may have failed.',
          recoveryAvailable: true
        });
      }
      
      return res.status(500).json({
        success: false,
        verified: false,
        error: 'Failed to fetch questionnaire',
        details: fetchError.message
      });
    }

    // If no submittedData provided, just verify it exists and is complete
    if (!submittedData) {
      const isComplete = !!questionnaire.completed_at;
      return res.status(200).json({
        success: true,
        verified: isComplete,
        questionnaire: {
          id: questionnaire.id,
          completedAt: questionnaire.completed_at,
          updatedAt: questionnaire.updated_at
        },
        message: isComplete 
          ? 'Questionnaire verified and complete' 
          : 'Questionnaire exists but not marked as complete'
      });
    }

    // Compare submitted data with database data
    const comparison = {
      bigNoSongs: questionnaire.big_no_songs === (submittedData.bigNoSongs || null),
      specialDances: JSON.stringify(questionnaire.special_dances || []) === JSON.stringify(submittedData.specialDances || []),
      specialDanceSongs: JSON.stringify(questionnaire.special_dance_songs || {}) === JSON.stringify(submittedData.specialDanceSongs || {}),
      playlistLinks: JSON.stringify(questionnaire.playlist_links || {}) === JSON.stringify(submittedData.playlistLinks || {}),
      ceremonyMusicType: questionnaire.ceremony_music_type === (submittedData.ceremonyMusicType || null),
      ceremonyMusic: JSON.stringify(questionnaire.ceremony_music || {}) === JSON.stringify(submittedData.ceremonyMusic || {}),
      mcIntroduction: questionnaire.mc_introduction === (submittedData.mcIntroduction !== undefined ? submittedData.mcIntroduction : null)
    };

    const allMatch = Object.values(comparison).every(match => match === true);
    const isComplete = !!questionnaire.completed_at;

    // Update submission log if provided
    if (submissionLogId) {
      await supabase
        .from('questionnaire_submission_log')
        .update({
          verification_status: allMatch && isComplete ? 'verified' : 'mismatch',
          verified_at: new Date().toISOString(),
          verification_error: allMatch && isComplete ? null : 'Data mismatch or incomplete'
        })
        .eq('id', submissionLogId);
    }

    if (allMatch && isComplete) {
      return res.status(200).json({
        success: true,
        verified: true,
        questionnaire: {
          id: questionnaire.id,
          completedAt: questionnaire.completed_at,
          updatedAt: questionnaire.updated_at
        },
        message: 'Questionnaire verified successfully'
      });
    } else {
      return res.status(200).json({
        success: false,
        verified: false,
        questionnaire: {
          id: questionnaire.id,
          completedAt: questionnaire.completed_at,
          updatedAt: questionnaire.updated_at
        },
        comparison: comparison,
        issues: [
          !isComplete && 'Questionnaire not marked as complete',
          !comparison.bigNoSongs && 'Big No Songs mismatch',
          !comparison.specialDances && 'Special Dances mismatch',
          !comparison.playlistLinks && 'Playlist Links mismatch',
          !comparison.ceremonyMusicType && 'Ceremony Music Type mismatch'
        ].filter(Boolean),
        message: 'Questionnaire exists but data does not match or is incomplete',
        recoveryAvailable: true
      });
    }
  } catch (error) {
    console.error('Error in verify questionnaire API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

