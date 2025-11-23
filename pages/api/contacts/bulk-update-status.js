import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

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

    // Check if user is admin using email-based authentication
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'  // Ben Murray - Owner
    ];
    const isAdmin = adminEmails.includes(session.user.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { contactIds, status } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Valid status values
    const validStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Update contacts in bulk
    const { data, error } = await supabase
      .from('contacts')
      .update({ 
        lead_status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update contacts', details: error.message });
    }

    return res.status(200).json({ 
      success: true,
      message: `Successfully updated ${contactIds.length} contact(s) to ${status}`,
      updated: contactIds.length
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

