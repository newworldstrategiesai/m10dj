import { createClient } from '@supabase/supabase-js';
import { generateRotationIdsForSignup } from '@/utils/karaoke-rotation';
import { canSignupProceed } from '@/utils/karaoke-rotation';
import { calculateQueuePosition } from '@/utils/karaoke-queue';
import { withSecurity } from '@/utils/rate-limiting';
import { logSignupChange, getClientInfo } from '@/utils/karaoke-audit';

/**
 * Comprehensive duplicate signup detection
 */
async function checkForDuplicateSignup(supabase, signupData) {
  const {
    organization_id,
    event_qr_code,
    singer_name,
    singer_phone,
    song_title,
    song_artist,
    group_members,
    group_size
  } = signupData;

  // Normalize phone number for comparison
  const normalizedPhone = singer_phone ? singer_phone.replace(/\D/g, '') : null;

  // Check 1: Exact same active signup (same person, same event, same song)
  const { data: exactMatch } = await supabase
    .from('karaoke_signups')
    .select('id, created_at, status')
    .eq('organization_id', organization_id)
    .eq('event_qr_code', event_qr_code)
    .eq('singer_name', singer_name.trim())
    .eq('song_title', song_title.trim())
    .in('status', ['queued', 'next', 'singing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (exactMatch && exactMatch.length > 0) {
    const existing = exactMatch[0];
    return {
      isDuplicate: true,
      message: 'You\'ve already signed up for this exact song in this event!',
      details: {
        type: 'exact_match',
        existing_signup_id: existing.id,
        existing_status: existing.status
      }
    };
  }

  // Check 2: Same person, different song (within last 30 minutes)
  if (normalizedPhone) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentSignups } = await supabase
      .from('karaoke_signups')
      .select('id, created_at, song_title, status')
      .eq('organization_id', organization_id)
      .eq('event_qr_code', event_qr_code)
      .eq('singer_name', singer_name.trim())
      .gte('created_at', thirtyMinutesAgo)
      .in('status', ['queued', 'next', 'singing', 'completed'])
      .order('created_at', { ascending: false });

    if (recentSignups && recentSignups.length > 0) {
      return {
        isDuplicate: true,
        message: 'You signed up recently for this event. Please wait before signing up again.',
        details: {
          type: 'recent_signup_same_person',
          last_signup: recentSignups[0].created_at,
          recent_songs: recentSignups.map(s => s.song_title)
        }
      };
    }
  }

  // Check 3: Same phone number, different name (potential abuse)
  if (normalizedPhone) {
    const { data: phoneMatches } = await supabase
      .from('karaoke_signups')
      .select('id, singer_name, created_at, status')
      .eq('organization_id', organization_id)
      .eq('event_qr_code', event_qr_code)
      .eq('singer_phone', normalizedPhone)
      .in('status', ['queued', 'next', 'singing'])
      .neq('singer_name', singer_name.trim())
      .order('created_at', { ascending: false })
      .limit(1);

    if (phoneMatches && phoneMatches.length > 0) {
      return {
        isDuplicate: true,
        message: 'This phone number is already registered for this event under a different name.',
        details: {
          type: 'phone_conflict',
          conflicting_name: phoneMatches[0].singer_name
        }
      };
    }
  }

  // Check 4: Group member conflicts (if this is a group signup)
  if (group_size > 1 && group_members) {
    for (const member of group_members) {
      if (!member || !member.trim()) continue;

      // Check if this group member is already signed up individually
      const { data: memberConflict } = await supabase
        .from('karaoke_signups')
        .select('id, singer_name, group_size')
        .eq('organization_id', organization_id)
        .eq('event_qr_code', event_qr_code)
        .eq('singer_name', member.trim())
        .in('status', ['queued', 'next', 'singing'])
        .limit(1);

      if (memberConflict && memberConflict.length > 0) {
        return {
          isDuplicate: true,
          message: `${member.trim()} is already signed up for this event.`,
          details: {
            type: 'group_member_conflict',
            conflicting_member: member.trim(),
            existing_signup_id: memberConflict[0].id
          }
        };
      }
    }
  }

  // Check 5: Same rotation ID active in queue (prevents gaming the system)
  const { singer_rotation_id } = generateRotationIdsForSignup(
    singer_name,
    group_members,
    group_size,
    singer_phone
  );

  const { data: rotationConflict } = await supabase
    .from('karaoke_signups')
    .select('id, singer_name, status, created_at')
    .eq('organization_id', organization_id)
    .eq('event_qr_code', event_qr_code)
    .eq('singer_rotation_id', singer_rotation_id)
    .in('status', ['queued', 'next', 'singing'])
    .limit(1);

  if (rotationConflict && rotationConflict.length > 0) {
    return {
      isDuplicate: true,
      message: 'Someone with similar details has already signed up for this event.',
      details: {
        type: 'rotation_conflict',
        existing_signup_id: rotationConflict[0].id
      }
    };
  }

  return { isDuplicate: false };
}

/**
 * POST /api/karaoke/signup
 * Create a new karaoke signup
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Karaoke signup API called with body:', req.body);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
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
    console.log('Fetching karaoke settings for org:', organization_id);
    const { data: karaokeSettings, error: settingsError } = await supabase
      .from('karaoke_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError) {
      console.log('Karaoke settings not found or error:', settingsError);
    } else {
      console.log('Karaoke settings loaded:', karaokeSettings);
    }

    // Check maximum concurrent singers limit (if setting exists)
    if (karaokeSettings?.max_concurrent_singers != null) {
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

    // Comprehensive duplicate detection
    const duplicateCheck = await checkForDuplicateSignup(supabase, {
      organization_id,
      event_qr_code,
      singer_name,
      singer_phone,
      song_title,
      song_artist,
      group_members,
      group_size
    });

    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        error: 'Duplicate signup detected',
        message: duplicateCheck.message,
        details: duplicateCheck.details
      });
    }

    // Check phone field requirements based on admin setting (default to required if not set)
    const phoneFieldMode = karaokeSettings?.phone_field_mode || 'required';

    if (phoneFieldMode === 'required') {
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
    } else if (phoneFieldMode === 'optional' && singer_phone && singer_phone.trim()) {
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

    // Additional validation for spam prevention
    if (song_title && song_title.length > 100) {
      return res.status(400).json({
        error: 'Song title too long',
        message: 'Please keep song titles under 100 characters'
      });
    }

    if (song_artist && song_artist.length > 100) {
      return res.status(400).json({
        error: 'Artist name too long',
        message: 'Please keep artist names under 100 characters'
      });
    }

    // Check for suspicious patterns (basic spam detection)
    const suspiciousPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /<script/i,   // Script tags
      /http[s]? :/i, // URLs
      /viagra|casino|poker/i // Spam keywords
    ];

    const textToCheck = `${singer_name} ${song_title} ${song_artist || ''}`.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(textToCheck)) {
        return res.status(400).json({
          error: 'Invalid input detected',
          message: 'Please provide valid information'
        });
      }
    }

    // Normalize and validate names
    if (!singer_name || singer_name.trim().length < 2) {
      return res.status(400).json({
        error: 'Name too short',
        message: 'Please provide a valid name (at least 2 characters)'
      });
    }

    if (singer_name.length > 50) {
      return res.status(400).json({
        error: 'Name too long',
        message: 'Please keep names under 50 characters'
      });
    }

    // Get or create karaoke settings
    let { data: settings, error: createSettingsError } = await supabase
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
          rotation_fairness_mode: 'strict',
          max_concurrent_singers: 10,
          sms_notifications_enabled: true,
          phone_field_mode: 'required'
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
    console.log('Attempting to insert karaoke signup:', signupData);
    const { data: signup, error: insertError } = await supabase
      .from('karaoke_signups')
      .insert(signupData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating karaoke signup:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));

      // Handle case where table doesn't exist
      if (insertError.code === 'PGRST116' || insertError.message?.includes('karaoke_signups')) {
        console.log('Karaoke signups table not found - karaoke feature not yet set up');
        return res.status(503).json({
          error: 'Karaoke feature not available',
          message: 'The karaoke feature has not been set up yet. Please contact support.',
          details: 'Database table not found'
        });
      }

      return res.status(500).json({
        error: 'Failed to create karaoke signup',
        details: insertError.message,
        code: insertError.code
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

    // Log successful signup
    await logSignupChange(
      organization_id,
      signup.id,
      'signup_created',
      'public_user', // No authenticated user for public signups
      null,
      {
        singer_name: signup.singer_name,
        song_title: signup.song_title,
        group_size: signup.group_size,
        is_priority: signup.is_priority,
        queue_position: queuePosition
      },
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress,
      req.headers['user-agent']
    );

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

export default withSecurity(handler, 'signup', { requireOrgId: true });
