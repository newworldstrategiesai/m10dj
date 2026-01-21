import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Unlink a karaoke video from a signup
 * POST /api/karaoke/unlink-signup-video
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { signupId, organizationId } = req.body;

    if (!signupId || !organizationId) {
      return res.status(400).json({ error: 'Signup ID and organization ID are required' });
    }

    // Verify organization access
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMember) {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    // Get current signup to store video info for audit log
    const { data: currentSignup, error: getError } = await supabase
      .from('karaoke_signups')
      .select('song_title, song_artist, video_id, video_data')
      .eq('id', signupId)
      .eq('organization_id', organizationId)
      .single();

    if (getError) {
      console.error('Error fetching current signup:', getError);
    }

    // Update the signup to remove video information
    const { data: signup, error: signupError } = await supabase
      .from('karaoke_signups')
      .update({
        video_id: null,
        video_url: null,
        video_data: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (signupError) {
      console.error('Signup update error:', signupError);
      return res.status(500).json({ error: 'Failed to unlink video from signup' });
    }

    // Log the video unlinking action
    await supabase
      .from('karaoke_audit_log')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        action: 'unlink_video_from_signup',
        entity_type: 'signup',
        entity_id: signupId,
        details: {
          previous_video_id: currentSignup?.video_id,
          song_title: currentSignup?.song_title,
          song_artist: currentSignup?.song_artist,
          previous_video_data: currentSignup?.video_data
        }
      });

    return res.status(200).json({
      success: true,
      signup: signup
    });

  } catch (error) {
    console.error('Unlink signup video error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}