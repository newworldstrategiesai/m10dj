/**
 * DJ Dash Individual DJ Inquiry API
 * Handles contact form submissions from individual DJ profile pages
 * Creates both dj_inquiry and contact records for M10 DJ Company
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface DJInquiryRequest {
  dj_profile_id: string;
  planner_name: string;
  planner_email: string;
  planner_phone?: string | null;
  event_type: string;
  event_date?: string | null;
  event_time?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  guest_count?: number | null;
  budget_range?: string | null;
  budget_amount?: number | null;
  special_requests?: string | null;
  lead_score?: number;
  minimum_budget_met?: boolean;
  lead_quality?: 'high' | 'medium' | 'low';
  lead_temperature?: 'hot' | 'warm' | 'cold';
}

export async function POST(request: NextRequest) {
  try {
    const body: DJInquiryRequest = await request.json();

    // Validate required fields
    if (!body.dj_profile_id || !body.planner_name || !body.planner_email || !body.event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: dj_profile_id, planner_name, planner_email, event_type' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch DJ profile to get organization_id
    const { data: djProfile, error: profileError } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        organization_id,
        organizations!inner(id, product_context, is_platform_owner)
      `)
      .eq('id', body.dj_profile_id)
      .eq('is_published', true)
      .single();

    if (profileError || !djProfile) {
      console.error('Error fetching DJ profile:', profileError);
      return NextResponse.json(
        { error: 'DJ profile not found or not published' },
        { status: 404 }
      );
    }

    const organizationId = djProfile.organization_id;
    // Supabase returns joined relations as arrays, so access first element
    const organization = Array.isArray(djProfile.organizations) 
      ? djProfile.organizations[0] 
      : djProfile.organizations;
    const isM10DJCompany = organization?.is_platform_owner === true;

    // Calculate lead score if not provided
    let leadScore = body.lead_score ?? 0;
    if (leadScore === 0) {
      leadScore = calculateLeadScore({
        budget: body.budget_amount || 0,
        eventType: body.event_type,
        hasDate: !!body.event_date,
        hasVenue: !!(body.venue_name || body.venue_address),
        hasPhone: !!body.planner_phone,
        guestCount: body.guest_count
      });
    }

    const leadQuality = body.lead_quality || (leadScore >= 50 ? 'high' : leadScore >= 30 ? 'medium' : 'low');
    const leadTemperature = body.lead_temperature || (leadScore >= 60 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold');

    // Create DJ inquiry record
    const { data: inquiry, error: inquiryError } = await supabase
      .from('dj_inquiries')
      .insert({
        dj_profile_id: body.dj_profile_id,
        planner_name: body.planner_name.trim(),
        planner_email: body.planner_email.trim().toLowerCase(),
        planner_phone: body.planner_phone?.trim() || null,
        event_type: body.event_type,
        event_date: body.event_date || null,
        event_time: body.event_time || null,
        venue_name: body.venue_name?.trim() || null,
        venue_address: body.venue_address?.trim() || null,
        guest_count: body.guest_count || null,
        budget_range: body.budget_range || null,
        budget_amount: body.budget_amount || null,
        special_requests: body.special_requests?.trim() || null,
        lead_score: leadScore,
        lead_quality: leadQuality,
        lead_temperature: leadTemperature,
        minimum_budget_met: body.minimum_budget_met || false,
        status: 'new',
        custom_fields: {
          source: 'dj_profile_page',
          dj_profile_id: body.dj_profile_id,
          dj_name: djProfile.dj_name
        }
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('Error creating DJ inquiry:', inquiryError);
      return NextResponse.json(
        { error: 'Failed to create inquiry. Please try again.' },
        { status: 500 }
      );
    }

    // CRITICAL: For M10 DJ Company, also create a contact record
    // This ensures inquiries from DJ Dash appear in the same CRM as m10djcompany.com
    let contactId = null;
    if (isM10DJCompany && organizationId) {
      try {
        // Parse name into first/last
        const nameParts = body.planner_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Check if contact already exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, phone')
          .eq('email_address', body.planner_email.trim().toLowerCase())
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .maybeSingle();

        if (existingContact) {
          // Update existing contact
          const { data: updatedContact, error: updateError } = await supabase
            .from('contacts')
            .update({
              first_name: firstName || existingContact.first_name || null,
              last_name: lastName || existingContact.last_name || null,
              phone: body.planner_phone?.trim() || existingContact.phone || null,
              event_type: body.event_type,
              event_date: body.event_date || null,
              event_time: body.event_time || null,
              venue_name: body.venue_name?.trim() || null,
              venue_address: body.venue_address?.trim() || null,
              special_requests: body.special_requests?.trim() || null,
              lead_status: 'New',
              lead_source: 'DJ Dash',
              lead_stage: 'Initial Inquiry',
              lead_temperature: leadTemperature.charAt(0).toUpperCase() + leadTemperature.slice(1),
              lead_score: leadScore,
              notes: `Inquiry from DJ Dash profile: ${djProfile.dj_name}\n${body.special_requests || ''}`,
              last_contacted_date: new Date().toISOString(),
              last_contact_type: 'form_submission',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id)
            .select()
            .single();

          if (!updateError && updatedContact) {
            contactId = updatedContact.id;
            console.log('✅ Updated existing contact for M10 DJ Company:', contactId);
          }
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              organization_id: organizationId,
              first_name: firstName,
              last_name: lastName,
              email_address: body.planner_email.trim().toLowerCase(),
              phone: body.planner_phone?.trim() || null,
              event_type: body.event_type,
              event_date: body.event_date || null,
              event_time: body.event_time || null,
              venue_name: body.venue_name?.trim() || null,
              venue_address: body.venue_address?.trim() || null,
              special_requests: body.special_requests?.trim() || null,
              lead_status: 'New',
              lead_source: 'DJ Dash',
              lead_stage: 'Initial Inquiry',
              lead_temperature: leadTemperature.charAt(0).toUpperCase() + leadTemperature.slice(1),
              lead_quality: leadQuality.charAt(0).toUpperCase() + leadQuality.slice(1),
              lead_score: leadScore,
              communication_preference: 'email',
              how_heard_about_us: 'DJ Dash Profile',
              notes: `Inquiry from DJ Dash profile: ${djProfile.dj_name}\n${body.special_requests || ''}`,
              last_contacted_date: new Date().toISOString(),
              last_contact_type: 'form_submission',
              opt_in_status: true,
              priority_level: leadScore >= 50 ? 'High' : leadScore >= 30 ? 'Medium' : 'Low'
            })
            .select()
            .single();

          if (!contactError && newContact) {
            contactId = newContact.id;
            console.log('✅ Created new contact for M10 DJ Company:', contactId);
          } else {
            console.error('Error creating contact:', contactError);
          }
        }

        // Link inquiry to contact
        if (contactId) {
          await supabase
            .from('dj_inquiries')
            .update({
              converted_to_contact_id: contactId,
              converted_at: new Date().toISOString()
            })
            .eq('id', inquiry.id);
        }
      } catch (contactError) {
        console.error('Error creating/updating contact for M10 DJ Company:', contactError);
        // Don't fail the request - inquiry was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      inquiry_id: inquiry.id,
      contact_id: contactId,
      message: 'Your inquiry has been sent successfully!'
    });

  } catch (error: any) {
    console.error('Error processing DJ inquiry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}

function calculateLeadScore(params: {
  budget: number;
  eventType: string;
  hasDate: boolean;
  hasVenue: boolean;
  hasPhone: boolean;
  guestCount?: number | null;
}): number {
  let score = 0;

  // Budget scoring
  if (params.budget >= 2000) score += 30;
  else if (params.budget >= 1000) score += 20;
  else if (params.budget >= 500) score += 10;

  // Event type scoring
  const highValueTypes = ['wedding', 'corporate'];
  if (highValueTypes.includes(params.eventType.toLowerCase())) {
    score += 15;
  }

  // Completeness scoring
  if (params.hasDate) score += 15;
  if (params.hasVenue) score += 10;
  if (params.hasPhone) score += 10;

  // Guest count scoring
  if (params.guestCount && params.guestCount >= 100) score += 10;

  return Math.min(score, 100); // Cap at 100
}

