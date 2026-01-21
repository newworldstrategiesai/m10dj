import { createClient } from '@supabase/supabase-js';
import { sendNextUpNotification, sendCurrentlySingingNotification } from '@/utils/karaoke-notifications';
import { withSecurity } from '@/utils/rate-limiting';
import { karaokeQueueManager } from '@/utils/karaoke-atomic-operations';
import { broadcastQueueUpdate } from './realtime/[...params].js';
import { invalidateCache } from '@/utils/karaoke-cache';

/**
 * PATCH /api/karaoke/update-status
 * Update status of a karaoke signup (DJ only)
 */
async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { signup_id, status, admin_notes } = req.body;

    if (!signup_id || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['signup_id', 'status']
      });
    }

    const validStatuses = ['queued', 'next', 'singing', 'completed', 'skipped', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    // Get the signup to verify organization access and get current data
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

    // Use atomic queue manager for status updates
    const result = await karaokeQueueManager.updateSignupStatus({
      type: 'status_update',
      signupId: signup_id,
      newStatus: status,
      performedBy: user.email || user.id,
      organizationId: signupData.organization_id,
      eventQrCode: signupData.event_qr_code
    });

    if (!result.success) {
      return res.status(result.conflict ? 409 : 400).json({
        error: result.error || 'Failed to update status',
        conflict: result.conflict || false
      });
    }

    const updatedSignup = result.signup;

    // Update admin_notes separately if provided
    if (admin_notes !== undefined) {
      await supabase
        .from('karaoke_signups')
        .update({ admin_notes })
        .eq('id', signup_id);
    }

    // Invalidate cache for updated queue
    invalidateCache('queue', updatedSignup.organization_id, updatedSignup.event_qr_code);

    // Broadcast real-time update to all connected clients
    try {
      broadcastQueueUpdate(updatedSignup.event_qr_code, updatedSignup.organization_id, {
        updateType: 'status_change',
        signupId: signup_id,
        oldStatus: signupData.status,
        newStatus: status,
        signup: {
          id: updatedSignup.id,
          singer_name: updatedSignup.singer_name,
          group_members: updatedSignup.group_members,
          group_size: updatedSignup.group_size,
          song_title: updatedSignup.song_title,
          song_artist: updatedSignup.song_artist,
          status: updatedSignup.status,
          is_priority: updatedSignup.is_priority
        }
      });
    } catch (broadcastError) {
      console.error('Failed to broadcast update:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    // Send notifications based on status change
    if (updatedSignup) {
      // Send "next up" notification when status changes to 'next'
      if (status === 'next' && signupData.status !== 'next' && updatedSignup.singer_phone && !updatedSignup.next_up_notification_sent) {
        // Get organization name for message
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', signupData.organization_id)
          .single();

        // Send notification (non-blocking)
        sendNextUpNotification({
          id: updatedSignup.id,
          singer_name: updatedSignup.singer_name,
          group_members: updatedSignup.group_members,
          group_size: updatedSignup.group_size,
          song_title: updatedSignup.song_title,
          song_artist: updatedSignup.song_artist,
          singer_phone: updatedSignup.singer_phone,
          event_qr_code: updatedSignup.event_qr_code,
          organization_id: updatedSignup.organization_id
        }, org?.name).then(result => {
          // Mark notification as sent in database
          if (result.success) {
            supabase
              .from('karaoke_signups')
              .update({
                next_up_notification_sent: true,
                next_up_notification_sent_at: new Date().toISOString(),
                sms_notification_error: null
              })
              .eq('id', signup_id)
              .catch(err => console.error('Error updating notification status:', err));
          } else {
            // Store error
            supabase
              .from('karaoke_signups')
              .update({
                sms_notification_error: result.error || 'Failed to send SMS'
              })
              .eq('id', signup_id)
              .catch(err => console.error('Error storing notification error:', err));
          }
        }).catch(err => {
          console.error('Error sending next-up notification:', err);
          // Store error
          supabase
            .from('karaoke_signups')
            .update({
              sms_notification_error: err.message || 'Failed to send SMS'
            })
            .eq('id', signup_id)
            .catch(updateErr => console.error('Error storing notification error:', updateErr));
        });
      }

      // Send "currently singing" notification when status changes to 'singing'
      if (status === 'singing' && signupData.status !== 'singing' && updatedSignup.singer_phone && !updatedSignup.currently_singing_notification_sent) {
        sendCurrentlySingingNotification({
          singer_name: updatedSignup.singer_name,
          song_title: updatedSignup.song_title,
          song_artist: updatedSignup.song_artist,
          singer_phone: updatedSignup.singer_phone
        }).then(result => {
          // Mark notification as sent
          if (result.success) {
            supabase
              .from('karaoke_signups')
              .update({
                currently_singing_notification_sent: true,
                currently_singing_notification_sent_at: new Date().toISOString()
              })
              .eq('id', signup_id)
              .catch(err => console.error('Error updating notification status:', err));
          }
        }).catch(err => {
          console.error('Error sending currently-singing notification:', err);
        });
      }
    }

    // If marking as completed, check if we should auto-advance next
    if (status === 'completed') {
      const { data: settings } = await supabase
        .from('karaoke_settings')
        .select('auto_advance')
        .eq('organization_id', signupData.organization_id)
        .single();

      if (settings?.auto_advance) {
        // Find next queued signup and mark as 'next'
        const { data: nextSignup } = await supabase
          .from('karaoke_signups')
          .select('*')
          .eq('organization_id', signupData.organization_id)
          .eq('event_qr_code', updatedSignup.event_qr_code)
          .eq('status', 'queued')
          .order('priority_order', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (nextSignup && nextSignup.singer_phone && !nextSignup.next_up_notification_sent) {
          // Update status
          await supabase
            .from('karaoke_signups')
            .update({ status: 'next' })
            .eq('id', nextSignup.id);

          // Send notification to next singer (non-blocking)
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', signupData.organization_id)
            .single();

          sendNextUpNotification({
            id: nextSignup.id,
            singer_name: nextSignup.singer_name,
            group_members: nextSignup.group_members,
            group_size: nextSignup.group_size,
            song_title: nextSignup.song_title,
            song_artist: nextSignup.song_artist,
            singer_phone: nextSignup.singer_phone,
            event_qr_code: nextSignup.event_qr_code,
            organization_id: nextSignup.organization_id
          }, org?.name).then(result => {
            // Mark notification as sent
            if (result.success) {
              supabase
                .from('karaoke_signups')
                .update({
                  next_up_notification_sent: true,
                  next_up_notification_sent_at: new Date().toISOString(),
                  sms_notification_error: null
                })
                .eq('id', nextSignup.id)
                .catch(err => console.error('Error updating notification status:', err));
            }
          }).catch(err => {
            console.error('Error sending auto-advance notification:', err);
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      signup: updatedSignup
    });

  } catch (error) {
    console.error('Error updating karaoke status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withSecurity(handler, 'adminUpdate', { requireOrgId: true });
