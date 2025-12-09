import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { distributeLeadToDJs } from '@/utils/djdash/lead-distribution';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const leadData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      eventType: formData.get('eventType') as string || 'Other',
      eventDate: formData.get('eventDate') as string || null,
      guests: formData.get('guests') as string || null,
      venue: formData.get('venue') as string || null,
      message: formData.get('message') as string || null,
      city: formData.get('city') as string || null,
      state: formData.get('state') as string || null,
      source: 'DJ Dash Directory',
      leadSource: 'DJ Dash Directory',
      leadStatus: 'New',
      leadTemperature: 'Warm',
    };

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Standardize event type
    const eventTypeMapping: Record<string, string> = {
      'Wedding': 'wedding',
      'Corporate Event': 'corporate',
      'Birthday Party': 'birthday',
      'School Dance': 'school_dance',
      'Holiday Party': 'holiday_party',
      'Private Party': 'private_party',
      'Other': 'other',
    };
    const standardizedEventType = eventTypeMapping[leadData.eventType] || 'other';

    // Insert lead into contacts table
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        first_name: leadData.name.split(' ')[0] || leadData.name,
        last_name: leadData.name.split(' ').slice(1).join(' ') || '',
        email_address: leadData.email,
        phone: leadData.phone,
        city: leadData.city,
        state: leadData.state,
        event_type: standardizedEventType,
        event_date: leadData.eventDate,
        guest_count: leadData.guests ? parseInt(leadData.guests) : null,
        venue_name: leadData.venue,
        notes: leadData.message,
        lead_source: leadData.leadSource,
        lead_status: leadData.leadStatus,
        lead_temperature: leadData.leadTemperature,
        custom_fields: {
          source: 'DJ Dash Directory',
          city: leadData.city,
          state: leadData.state,
          form_url: request.headers.get('referer') || '',
        },
      })
      .select()
      .single();

    if (contactError || !contact) {
      console.error('Error saving lead:', contactError);
      return NextResponse.json(
        { error: 'Failed to save lead. Please try again.' },
        { status: 500 }
      );
    }

    // Distribute lead to matching DJs
    try {
      const distributions = await distributeLeadToDJs({
        contact_id: contact.id,
        city: leadData.city,
        state: leadData.state,
        event_type: standardizedEventType,
        event_date: leadData.eventDate,
      });

      console.log(`✅ Lead distributed to ${distributions.length} DJ(s)`);

      // TODO: Send email notifications to DJs
      // TODO: Send SMS notifications if enabled
      // TODO: Send confirmation email to lead

    } catch (distError) {
      console.error('Error distributing lead:', distError);
      // Don't fail the request if distribution fails - lead is still saved
    }

    // Redirect to thank you page
    return NextResponse.redirect(
      new URL(`/djdash/thank-you?city=${leadData.city || ''}&state=${leadData.state || ''}`, request.url)
    );
  } catch (error) {
    console.error('Error processing lead:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

