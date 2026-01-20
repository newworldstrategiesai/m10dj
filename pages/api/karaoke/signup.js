import { createClient } from '@/utils/supabase/server';
import { generateRotationIdsForSignup } from '@/utils/karaoke-rotation';
import { canSignupProceed } from '@/utils/karaoke-rotation';
import { calculateQueuePosition } from '@/utils/karaoke-queue';

/**
 * POST /api/karaoke/signup
 * Create a new karaoke signup
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient();
    
    const {
      event_qr_code,
      organization_id,
      group_size = 1,
      singer_name,
      group_members = [],
      song_title,
      song_artist,
      singer_email,
      singer_phone,
      is_priority = false
    } = req.body;

    // Validation
    if (!event_qr_code || !organization_id || !singer_name || !song_title) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['event_qr_code', 'organization_id', 'singer_name', 'song_title']
      });
    }

    // Get karaoke settings to check SMS notifications and max singers
    const { data: karaokeSettings } = await supabase
      .from('karaoke_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .single();

    // Check maximum concurrent singers limit
    if (karaokeSettings?.max_concurrent_singers) {
      const { data: currentSignups } = await supabase
        .from('karaoke_signups')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('event_qr_code', event_qr_code)
        .in('status', ['queued', 'singing']);

      if (currentSignups && currentSignups.length >= karaokeSettings.max_concurrent_singers) {
        return res.status(400).json({
          error: 'Maximum singers reached',
          message: `Sorry, we've reached the maximum of ${karaokeSettings.max_concurrent_singers} singers for this event. Please try again later or check back soon!`
        });
      }
    }

    // Check phone field requirements based on admin setting
    if (karaokeSettings?.phone_field_mode === 'required') {
      if (!singer_phone || !singer_phone.trim()) {
        return res.status(400).json({
          error: 'Phone number is required',
          message: 'Please provide a phone number so we can notify you when you\'re next up!'
        });
      }

      // Validate phone number format (at least 10 digits)
      const phoneDigits = singer_phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: 'Please enter a valid phone number (at least 10 digits)'
        });
      }
    } else if (karaokeSettings?.phone_field_mode === 'optional' && singer_phone && singer_phone.trim()) {
      // If optional and provided, validate format
      const phoneDigits = singer_phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: 'Please enter a valid phone number (at least 10 digits)'
        });
      }
    }

    if (group_size < 1 || group_size > 10) {
      return res.status(400).json({
        error: 'Group size must be between 1 and 10'
      });
    }

    if (group_size > 1 && (!group_members || group_members.length !== group_size)) {
      return res.status(400).json({
        error: `Group size is ${group_size}, but ${group_members?.length || 0} members provided`
      });
    }

    // Get or create karaoke settings
    let { data: settings, error: settingsError } = await supabase
      .from('karaoke_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError && settingsError.code === 'PGRST116') {
      // Settings don't exist, create defaults
      const { data: newSettings, error: createError } = await supabase
        .from('karaoke_settings')
        .insert({
          organization_id,
          karaoke_enabled: true,
          priority_pricing_enabled: true,
          rotation_enabled: true,
          priority_fee_cents: 1000,
          free_signups_allowed: true,
          max_singers_before_repeat: 3,
          rotation_fairness_mode: 'strict'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating karaoke settings:', createError);
        return res.status(500).json({ error: 'Failed to initialize karaoke settings' });
      }
      settings = newSettings;
    } else if (settingsError) {
      console.error('Error fetching karaoke settings:', settingsError);
      return res.status(500).json({ error: 'Failed to fetch karaoke settings' });
    }

    if (!settings.karaoke_enabled) {
      return res.status(403).json({
        error: 'Karaoke mode is not enabled for this organization'
      });
    }

    // Generate rotation IDs
    const { singer_rotation_id, group_rotation_ids } = generateRotationIdsForSignup(
      singer_name,
      group_members,
      group_size,
      singer_phone
    );

    // Prepare signup data
    const signupData = {
      organization_id,
      event_qr_code,
      group_size,
      singer_name,
      group_members: group_size > 1 ? group_members.map((m) => m.trim()) : null,
      song_title,
      song_artist: song_artist?.trim() || null,
      singer_email: singer_email?.trim() || null,
      singer_phone: singer_phone?.trim() || null,
      singer_rotation_id,
      group_rotation_ids,
      is_priority: is_priority && settings.priority_pricing_enabled,
      priority_fee: is_priority && settings.priority_pricing_enabled ? settings.priority_fee_cents : 0,
      payment_status: is_priority && settings.priority_pricing_enabled ? 'pending' : 'free',
      status: 'queued',
      priority_order: is_priority && settings.priority_pricing_enabled ? 50 : 1000
    };

    // Check rotation fairness (if enabled)
    if (settings.rotation_enabled) {
      // Get existing signups for this event
      const { data: existingSignups } = await supabase
        .from('karaoke_signups')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('event_qr_code', event_qr_code)
        .in('status', ['queued', 'next', 'singing', 'completed']);

      // Create a temporary signup object for rotation check
      const tempSignup = {
        ...signupData,
        id: 'temp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        times_sung: 0,
        last_sung_at: null
      };

      const rotationCheck = canSignupProceed(
        tempSignup,
        existingSignups || [],
        settings
      );

      if (!rotationCheck.canProceed) {
        return res.status(403).json({
          error: 'Rotation restriction',
          message: rotationCheck.reason || 'Please wait before signing up again'
        });
      }

      // Recalculate priority based on rotation
      if (!is_priority || settings.rotation_fairness_mode === 'strict') {
        // Import rotation calculation
        const { calculateRotationPriority } = await import('@/utils/karaoke-rotation');
        const rotationPriority = calculateRotationPriority(
          tempSignup,
          existingSignups || [],
          settings
        );
        signupData.priority_order = Math.min(signupData.priority_order, rotationPriority);
      }
    }

    // Insert signup
    const { data: signup, error: insertError } = await supabase
      .from('karaoke_signups')
      .insert(signupData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating karaoke signup:', insertError);
      return res.status(500).json({
        error: 'Failed to create karaoke signup',
        details: insertError.message
      });
    }

    // Calculate queue position
    const { data: allSignups } = await supabase
      .from('karaoke_signups')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('event_qr_code', event_qr_code)
      .in('status', ['queued', 'next', 'singing']);

    const queuePosition = calculateQueuePosition(signup, allSignups || []);

    // Return response
    return res.status(201).json({
      success: true,
      signup: {
        ...signup,
        queue_position: queuePosition
      },
      requires_payment: is_priority && settings.priority_pricing_enabled && signup.payment_status === 'pending'
    });

  } catch (error) {
    console.error('Error in karaoke signup:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
