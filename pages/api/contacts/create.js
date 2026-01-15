/**
 * Create Contact API
 * Creates a new contact with proper organization_id handling
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    if (!orgId && !isAdmin) {
      return res.status(400).json({ 
        error: 'Organization ID is required',
        details: 'User does not have an organization assigned. Please assign the user to an organization first.'
      });
    }

    const { 
      first_name,
      last_name,
      email_address,
      phone,
      event_type,
      event_date,
      venue_name,
      notes
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Use service role client for insert
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // Prepare contact data
    const contactData = {
      user_id: session.user.id,
      organization_id: orgId, // Always set organization_id for proper RLS
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email_address: email_address ? email_address.toLowerCase().trim() : null,
      phone: phone ? phone.trim() : null,
      event_type: event_type || 'other',
      event_date: event_date || null,
      venue_name: venue_name || null,
      lead_status: 'New',
      lead_source: 'Manual Entry',
      lead_stage: 'Initial Inquiry',
      lead_temperature: 'Warm',
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    console.log('[create-contact] Creating contact with data:', {
      ...contactData,
      organization_id: orgId
    });

    const { data: contact, error: contactError } = await adminSupabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();

    if (contactError) {
      console.error('Error creating contact:', {
        error: contactError,
        code: contactError.code,
        message: contactError.message,
        details: contactError.details,
        hint: contactError.hint
      });
      return res.status(500).json({ 
        error: 'Failed to create contact',
        details: contactError.message,
        code: contactError.code,
        hint: contactError.hint
      });
    }

    return res.status(200).json({
      success: true,
      contact: contact,
      message: 'Contact created successfully'
    });

  } catch (error) {
    console.error('Error in create contact API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
