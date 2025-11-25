import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  // Validate ID format (should not be null, undefined, or empty string)
  if (id === 'null' || id === 'undefined' || id.trim() === '') {
    console.error('Invalid lead ID format:', id);
    return res.status(400).json({ error: 'Invalid lead ID format' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Looking up lead with ID:', id, '(type:', typeof id, ')');

    // First, try to fetch from contacts table (UUID format)
    let { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address, phone, event_type, event_date, event_time, end_time, venue_name, venue_address, guest_count, special_requests, created_at, contract_signed_date, deposit_paid, payment_status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    // If not found in contacts, try contact_submissions table (integer format)
    if (error || !data) {
      console.log('Contact not found in contacts table, trying contact_submissions...');
      console.log('Contacts error:', error?.code, error?.message);
      
      // Try as integer if it looks like a number
      let submissionId = id;
      if (!isNaN(id) && !isNaN(parseInt(id))) {
        submissionId = parseInt(id);
      }
      
      const { data: submissionData, error: submissionError } = await supabase
        .from('contact_submissions')
        .select('id, name, email, phone, event_type, event_date, location, created_at')
        .eq('id', submissionId)
        .single();

      if (submissionError || !submissionData) {
        console.error('❌ Lead not found in either table');
        console.error('Contacts error:', error?.code, error?.message);
        console.error('Submissions error:', submissionError?.code, submissionError?.message);
        return res.status(404).json({ 
          error: 'Quote not found',
          details: 'The quote link may be invalid or expired. Please contact us to get a new quote.'
        });
      }

      console.log('✅ Found lead in contact_submissions table');

      // Map submission data to expected format
      const nameParts = (submissionData.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Set cache-control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).json({
        id: submissionData.id,
        name: submissionData.name || 'Valued Customer',
        email: submissionData.email,
        phone: submissionData.phone,
        eventType: submissionData.event_type,
        eventDate: submissionData.event_date,
        location: submissionData.location,
        createdAt: submissionData.created_at
      });
    }

    console.log('✅ Found lead in contacts table');

    // Combine first and last name
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Valued Customer';

    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Return sanitized lead data
    res.status(200).json({
      id: data.id,
      name: fullName,
      email: data.email_address,
      phone: data.phone,
      eventType: data.event_type,
      eventDate: data.event_date,
      eventTime: data.event_time || '',
      endTime: data.end_time || '',
      location: data.venue_address || data.venue_name || '',
      venueName: data.venue_name || '',
      guestCount: data.guest_count ? String(data.guest_count) : '',
      specialRequests: data.special_requests || '',
      createdAt: data.created_at,
      contractSignedDate: data.contract_signed_date || null,
      depositPaid: data.deposit_paid || false,
      paymentStatus: data.payment_status || 'pending'
    });
  } catch (error) {
    console.error('❌ Error in lead API:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred. Please try again or contact support.'
    });
  }
}

