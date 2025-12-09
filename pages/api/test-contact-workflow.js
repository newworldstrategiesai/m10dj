import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get organization context for test data
    const viewAsOrgId = getViewAsOrgIdFromRequest(req);
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email,
      viewAsOrgId
    );

    // Simulate a contact form submission
    const testContactData = {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email_address: 'sarah.johnson@example.com',
      phone: '+1234567890',
      event_type: 'wedding',
      event_date: '2025-06-15',
      venue_name: 'Grand Ballroom',
      venue_address: '123 Wedding Lane, Memphis, TN',
      guest_count: 150,
      budget_range: '$2,500-$5,000',
      special_requests: 'Looking for a DJ for our wedding. Need someone who can play a mix of country and pop music.',
      lead_status: 'New',
      lead_source: 'Website',
      lead_stage: 'Initial Inquiry',
      lead_temperature: 'Hot',
      communication_preference: 'email',
      notes: 'Test contact created via API test',
      user_id: session.user.id,
      organization_id: orgId // Include organization_id for multi-tenant isolation
    };

    // Test 1: Create contact
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert([testContactData])
      .select()
      .single();

    if (createError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create test contact',
        details: createError.message
      });
    }

    // Test 2: Fetch the contact back
    const { data: fetchedContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', newContact.id)
      .single();

    if (fetchError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch created contact',
        details: fetchError.message
      });
    }

    // Test 3: Update contact
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({ 
        lead_status: 'Contacted',
        notes: 'Contact updated via API test - called and left message'
      })
      .eq('id', newContact.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update contact',
        details: updateError.message
      });
    }

    // Test 4: Search for contact (filter by organization if applicable)
    let searchQuery = supabase
      .from('contacts')
      .select('*')
      .or('first_name.ilike.%Sarah%,email_address.ilike.%sarah%');

    if (orgId) {
      searchQuery = searchQuery.eq('organization_id', orgId);
    } else {
      searchQuery = searchQuery.eq('user_id', session.user.id);
    }

    const { data: searchResults, error: searchError } = await searchQuery;

    if (searchError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to search contacts',
        details: searchError.message
      });
    }

    // Test 5: Get contacts summary
    const { data: summary, error: summaryError } = await supabase
      .from('contacts_summary')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Clean up - delete test contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', newContact.id);

    if (deleteError) {
      console.warn('Failed to delete test contact:', deleteError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Contact workflow test completed successfully',
      tests: {
        create: !!newContact,
        fetch: !!fetchedContact,
        update: !!updatedContact,
        search: searchResults?.length > 0,
        summary: !summaryError,
        cleanup: !deleteError
      },
      data: {
        createdContact: newContact,
        updatedContact: updatedContact,
        searchResults: searchResults?.length || 0,
        summary: summary || null
      }
    });

  } catch (error) {
    console.error('Contact workflow test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test contact workflow',
      details: error.message
    });
  }
}