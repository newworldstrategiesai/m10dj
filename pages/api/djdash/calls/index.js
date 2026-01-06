import { createClient } from '@supabase/supabase-js';

// POST /api/djdash/calls - Log a new call
// GET /api/djdash/calls - Get calls for a DJ
export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (req.method === 'POST') {
    try {
      const {
        dj_profile_id,
        virtual_number,
        caller_number,
        caller_name,
        page_url,
        event_type,
        call_sid,
        call_status,
        call_duration_seconds
      } = req.body;

      if (!dj_profile_id || !virtual_number || !caller_number) {
        return res.status(400).json({
          error: 'Missing required fields: dj_profile_id, virtual_number, caller_number'
        });
      }

      // Verify DJ profile exists and is published
      const { data: profile, error: profileError } = await supabase
        .from('dj_profiles')
        .select('id, organization_id, organizations!inner(product_context)')
        .eq('id', dj_profile_id)
        .eq('is_published', true)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'DJ profile not found or not published' });
      }

      // Verify product context
      if (profile.organizations?.product_context !== 'djdash') {
        return res.status(403).json({ error: 'Invalid product context' });
      }

      // Insert call record
      const { data: callRecord, error: insertError } = await supabase
        .from('dj_calls')
        .insert({
          dj_profile_id,
          virtual_number,
          caller_number,
          caller_name,
          page_url: page_url || `https://djdash.net/dj/${profile.dj_slug}`,
          event_type,
          call_sid,
          call_status: call_status || 'completed',
          call_duration_seconds,
          product_context: 'djdash',
          lead_score: 'hot'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting call record:', insertError);
        return res.status(500).json({ error: 'Failed to log call', details: insertError.message });
      }

      return res.status(201).json({ success: true, call: callRecord });
    } catch (error) {
      console.error('Error in POST /api/djdash/calls:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'GET') {
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

      // Build query
      let query = supabase
        .from('dj_calls')
        .select('*')
        .eq('dj_profile_id', dj_profile_id)
        .eq('product_context', product_context)
        .order('timestamp', { ascending: false });

      // Apply date filters if provided
      if (start_date) {
        query = query.gte('timestamp', start_date);
      }
      if (end_date) {
        query = query.lte('timestamp', end_date);
      }

      const { data: calls, error: callsError } = await query;

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        return res.status(500).json({ error: 'Failed to fetch calls', details: callsError.message });
      }

      return res.status(200).json({ success: true, calls: calls || [] });
    } catch (error) {
      console.error('Error in GET /api/djdash/calls:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}











