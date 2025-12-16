import { createClient } from '@supabase/supabase-js';

// GET /api/djdash/calls/analytics - Get aggregated call statistics
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { dj_profile_id, start_date, end_date, product_context = 'djdash' } = req.query;

    if (!dj_profile_id) {
      return res.status(400).json({ error: 'dj_profile_id is required' });
    }

    // Verify DJ profile exists
    const { data: profile, error: profileError } = await supabase
      .from('dj_profiles')
      .select('id, organization_id, organizations!inner(product_context)')
      .eq('id', dj_profile_id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'DJ profile not found' });
    }

    // Build base query
    let query = supabase
      .from('dj_calls')
      .select('*')
      .eq('dj_profile_id', dj_profile_id)
      .eq('product_context', product_context);

    // Apply date filters if provided
    if (start_date) {
      query = query.gte('timestamp', start_date);
    }
    if (end_date) {
      query = query.lte('timestamp', end_date);
    }

    const { data: calls, error: callsError } = await query;

    if (callsError) {
      console.error('Error fetching calls for analytics:', callsError);
      return res.status(500).json({ error: 'Failed to fetch calls', details: callsError.message });
    }

    // Calculate analytics
    const totalCalls = calls?.length || 0;
    const bookedCalls = calls?.filter(c => c.is_booked).length || 0;
    const conversionRate = totalCalls > 0 ? (bookedCalls / totalCalls) * 100 : 0;

    // Calculate TipJar revenue
    const tipjarPayments = calls?.filter(c => c.tipjar_payment_received) || [];
    const totalRevenue = tipjarPayments.reduce((sum, c) => sum + (parseFloat(c.tipjar_payment_amount) || 0), 0);
    const platformCut = totalRevenue * 0.15; // 15% platform fee (adjust as needed)
    const djRevenue = totalRevenue - platformCut;

    // Calculate recording and transcription stats
    const recordingsCount = calls?.filter(c => c.recording_url).length || 0;
    const transcriptionsCount = calls?.filter(c => c.transcription_status === 'completed').length || 0;
    const transcriptionSuccessRate = recordingsCount > 0
      ? (transcriptionsCount / recordingsCount) * 100
      : 0;

    // Group by lead score
    const leadScoreBreakdown = {
      hot: calls?.filter(c => c.lead_score === 'hot').length || 0,
      warm: calls?.filter(c => c.lead_score === 'warm').length || 0,
      cold: calls?.filter(c => c.lead_score === 'cold').length || 0
    };

    // Group by event type
    const eventTypeBreakdown = {};
    calls?.forEach(call => {
      const eventType = call.event_type || 'unknown';
      eventTypeBreakdown[eventType] = (eventTypeBreakdown[eventType] || 0) + 1;
    });

    // Average call duration
    const callsWithDuration = calls?.filter(c => c.call_duration_seconds) || [];
    const avgCallDuration = callsWithDuration.length > 0
      ? callsWithDuration.reduce((sum, c) => sum + (c.call_duration_seconds || 0), 0) / callsWithDuration.length
      : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        totalCalls,
        bookedCalls,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformCut: Math.round(platformCut * 100) / 100,
        djRevenue: Math.round(djRevenue * 100) / 100,
        leadScoreBreakdown,
        eventTypeBreakdown,
        avgCallDuration: Math.round(avgCallDuration),
        tipjarLinksSent: calls?.filter(c => c.tipjar_link_sent).length || 0,
        tipjarPaymentsReceived: tipjarPayments.length,
        recordingsCount,
        transcriptionsCount,
        transcriptionSuccessRate: Math.round(transcriptionSuccessRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error in GET /api/djdash/calls/analytics:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

