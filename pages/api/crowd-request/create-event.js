/**
 * Create Event API
 * 
 * Creates a new event for crowd requests
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { canCreateEvent } from '@/utils/subscription-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin (admins bypass limits)
    const isAdmin = isPlatformAdmin(session.user.email);

    const { name, date, location, organization_id } = req.body;

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({ error: 'Event name and date are required' });
    }

    // Get organization ID from user if not provided
    let orgId = organization_id;
    let org = null;
    
    if (!orgId) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (orgError || !orgData) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      orgId = orgData.id;
      org = orgData;
    } else {
      // Fetch full org data for subscription checks
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError || !orgData) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      org = orgData;
    }

    // Enforce subscription limits (skip for platform admins)
    if (!isAdmin && org) {
      const limitCheck = await canCreateEvent(supabase, org);
      
      if (!limitCheck.allowed) {
        return res.status(403).json({
          error: 'Event creation limit reached',
          message: limitCheck.message,
          limit: limitCheck.limit,
          current: limitCheck.current,
          upgradeRequired: true,
        });
      }
    }

    // Generate event code (short, unique identifier)
    const generateEventCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let eventCode = generateEventCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    while (attempts < maxAttempts) {
      const { data: existing } = await supabaseAdmin
        .from('crowd_requests')
        .select('event_code')
        .eq('event_code', eventCode)
        .eq('organization_id', orgId)
        .limit(1)
        .single();

      if (!existing) {
        break; // Code is unique
      }

      eventCode = generateEventCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Failed to generate unique event code' });
    }

    // Create event (stored as a crowd_request with event_code)
    // Events are essentially crowd_requests with a specific event_code
    const eventData = {
      organization_id: orgId,
      event_code: eventCode,
      event_name: name,
      event_date: date,
      event_location: location || null,
      request_type: 'event', // Special type to indicate this is an event
      created_by: session.user.id,
      status: 'active'
    };

    const { data: event, error: createError } = await supabaseAdmin
      .from('crowd_requests')
      .insert([eventData])
      .select()
      .single();

    if (createError) {
      console.error('Error creating event:', createError);
      return res.status(500).json({ 
        error: 'Failed to create event',
        details: createError.message 
      });
    }

    // Generate event URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin || '';
    const eventUrl = `${baseUrl}/crowd-request/${eventCode}`;

    return res.status(200).json({
      success: true,
      event: {
        id: event.id,
        code: eventCode,
        name: event.event_name,
        date: event.event_date,
        location: event.event_location,
        url: eventUrl
      },
      eventUrl
    });
  } catch (error) {
    console.error('Error in create-event API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

