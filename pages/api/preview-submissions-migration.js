import { createClient } from '@/utils/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient();
    
    // Get admin user ID from environment
    const adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
    if (!adminUserId) {
      return res.status(500).json({ 
        error: 'DEFAULT_ADMIN_USER_ID not configured in environment variables' 
      });
    }

    // 1. Fetch all contact submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch submissions', details: fetchError });
    }

    // 2. Get existing contacts to identify duplicates
    const { data: existingContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('email_address, phone, first_name, last_name')
      .eq('user_id', adminUserId);

    if (contactsError) {
      return res.status(500).json({ error: 'Failed to fetch existing contacts', details: contactsError });
    }

    // Create lookup sets for existing contacts
    const existingEmails = new Set(existingContacts.map(c => c.email_address?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existingContacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));

    // 3. Preview what would be migrated
    const preview = submissions.map(submission => {
      const submissionEmail = submission.email?.toLowerCase();
      const submissionPhone = submission.phone?.replace(/\D/g, '');
      
      const isDuplicateEmail = submissionEmail && existingEmails.has(submissionEmail);
      const isDuplicatePhone = submissionPhone && existingPhones.has(submissionPhone);
      const wouldSkip = isDuplicateEmail || isDuplicatePhone;

      // Parse name
      const nameParts = submission.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Standardize event type
      const standardizeEventType = (type) => {
        if (!type) return 'other';
        const lower = type.toLowerCase();
        if (lower.includes('wedding')) return 'wedding';
        if (lower.includes('corporate')) return 'corporate';
        if (lower.includes('school') || lower.includes('dance')) return 'school_dance';
        if (lower.includes('holiday') || lower.includes('christmas')) return 'holiday_party';
        if (lower.includes('private') || lower.includes('birthday')) return 'private_party';
        return 'other';
      };

      return {
        submission_id: submission.id,
        original: {
          name: submission.name,
          email: submission.email,
          phone: submission.phone,
          event_type: submission.event_type,
          event_date: submission.event_date,
          location: submission.location,
          status: submission.status,
          created_at: submission.created_at
        },
        parsed: {
          first_name: firstName,
          last_name: lastName,
          email_address: submission.email,
          phone: submission.phone,
          event_type: standardizeEventType(submission.event_type),
          event_date: submission.event_date,
          venue_name: submission.location,
          lead_status: submission.status === 'new' ? 'New' : 
                      submission.status === 'contacted' ? 'Contacted' :
                      submission.status === 'quoted' ? 'Proposal Sent' :
                      submission.status === 'booked' ? 'Booked' :
                      submission.status === 'completed' ? 'Completed' :
                      submission.status === 'cancelled' ? 'Lost' : 'New'
        },
        migration_status: wouldSkip ? 'WILL_SKIP' : 'WILL_CREATE',
        skip_reason: wouldSkip ? (isDuplicateEmail ? 'duplicate_email' : 'duplicate_phone') : null
      };
    });

    const summary = {
      total_submissions: submissions.length,
      will_create: preview.filter(p => p.migration_status === 'WILL_CREATE').length,
      will_skip: preview.filter(p => p.migration_status === 'WILL_SKIP').length,
      existing_contacts: existingContacts.length
    };

    return res.status(200).json({
      success: true,
      summary,
      preview: preview.slice(0, 20), // First 20 for preview
      total_preview_items: preview.length,
      admin_user_id: adminUserId
    });

  } catch (error) {
    console.error('Preview failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Preview failed',
      details: error.message
    });
  }
}