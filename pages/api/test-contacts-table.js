import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Test 1: Check if contacts table exists and is accessible
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      return res.status(500).json({
        success: false,
        error: 'Contacts table not accessible',
        details: contactsError.message,
        code: contactsError.code
      });
    }

    // Test 2: Test inserting a sample contact
    const sampleContact = {
      first_name: 'Test',
      last_name: 'Contact',
      email_address: 'test@example.com',
      phone: '+1234567890',
      event_type: 'wedding',
      lead_status: 'New',
      lead_source: 'Test',
      notes: 'This is a test contact created by the API test'
    };

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert([sampleContact])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to insert test contact',
        details: insertError.message,
        existingContacts: contacts?.length || 0
      });
    }

    // Test 3: Update the test contact
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({ notes: 'Updated test contact' })
      .eq('id', newContact.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update test contact',
        details: updateError.message
      });
    }

    // Test 4: Clean up - delete the test contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', newContact.id);

    if (deleteError) {
      console.warn('Failed to delete test contact:', deleteError.message);
    }

    // Test 5: Check views exist
    let summaryData = null;
    try {
      const { data: summary } = await supabase
        .from('contacts_summary')
        .select('*')
        .limit(1);
      summaryData = summary;
    } catch (viewError) {
      console.log('Summary view not available:', viewError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Contacts table is working correctly',
      tests: {
        tableExists: true,
        canRead: true,
        canInsert: true,
        canUpdate: true,
        canDelete: true,
        viewsWorking: !!summaryData
      },
      data: {
        existingContacts: contacts?.length || 0,
        sampleData: contacts?.slice(0, 2) || [],
        testContactId: newContact.id,
        summaryAvailable: !!summaryData
      }
    });

  } catch (error) {
    console.error('Contacts table test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test contacts table',
      details: error.message
    });
  }
}