import { createClient } from '@/utils/supabase/server';
import { sendNextUpNotification, sendCurrentlySingingNotification } from '@/utils/karaoke-notifications';

/**
 * PATCH /api/karaoke/update-status
 * Update status of a karaoke signup (DJ only)
 */
export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient();
    
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

    // Prepare update data
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add timestamps based on status
    if (status === 'singing' && !signupData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.last_sung_at = new Date().toISOString();
      // Increment times_sung
      updateData.times_sung = (signupData.times_sung || 0) + 1;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Update the signup
    const { data: updatedSignup, error: updateError } = await supabase
      .from('karaoke_signups')
      .update(updateData)
      .eq('id', signup_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating karaoke signup:', updateError);
      return res.status(500).json({
        error: 'Failed to update signup',
        details: updateError.message
      });
    }

    // Send notifications based on status change
    if (signupData) {
      // Send "next up" notification when status changes to 'next'
      if (status === 'next' && signupData.status !== 'next' && signupData.singer_phone && !signupData.next_up_notification_sent) {
        // Get organization name for message
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', signupData.organization_id)
          .single();

        // Send notification (non-blocking)
        sendNextUpNotification({
          id: signupData.id,
          singer_name: signupData.singer_name,
          group_members: signupData.group_members,
          group_size: signupData.group_size,
          song_title: signupData.song_title,
          song_artist: signupData.song_artist,
          singer_phone: signupData.singer_phone,
          event_qr_code: signupData.event_qr_code,
          organization_id: signupData.organization_id
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
      if (status === 'singing' && signupData.status !== 'singing' && signupData.singer_phone && !signupData.currently_singing_notification_sent) {
        sendCurrentlySingingNotification({
          singer_name: signupData.singer_name,
          song_title: signupData.song_title,
          song_artist: signupData.song_artist,
          singer_phone: signupData.singer_phone
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
