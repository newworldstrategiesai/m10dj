import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { withSecurity } from '@/utils/rate-limiting';
import { broadcastQueueUpdate } from './realtime/[...params].js';
import { invalidateCache } from '@/utils/karaoke-cache';

/**
 * PATCH /api/karaoke/reorder
 * Update priority_order of a karaoke signup (DJ only)
 */
async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create server-side Supabase client (automatically extracts session from cookies)
    const supabase = createServerSupabaseClient({ req, res });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { signup_id, priority_order } = req.body;

    if (!signup_id || priority_order === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['signup_id', 'priority_order']
      });
    }

    // Get the signup to verify organization access
    const { data: signupData, error: signupError } = await supabase
      .from('karaoke_signups')
      .select('*')
      .eq('id', signup_id)
      .single();

    if (signupError || !signupData) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    // Check if user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', signupData.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Update priority_order
    const { data: updatedSignup, error: updateError } = await supabase
      .from('karaoke_signups')
      .update({ priority_order })
      .eq('id', signup_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating priority_order:', updateError);
      return res.status(500).json({
        error: 'Failed to update queue order',
        details: updateError.message
      });
    }

    // Invalidate cache for updated queue
    invalidateCache('queue', signupData.organization_id, signupData.event_qr_code);

    // Broadcast real-time update to all connected clients
    try {
      broadcastQueueUpdate(signupData.event_qr_code || 'all', signupData.organization_id, {
        updateType: 'priority_reorder',
        signupId: signup_id,
        newPriorityOrder: priority_order
      });
    } catch (broadcastError) {
      console.error('Failed to broadcast update:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return res.status(200).json({
      success: true,
      signup: updatedSignup
    });

  } catch (error) {
    console.error('Error reordering queue:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withSecurity(handler, 'adminUpdate', { requireOrgId: false });
