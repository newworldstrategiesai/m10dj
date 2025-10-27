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

    const { contactId } = req.query;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Check if user is admin using email-based authentication
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'  // Ben Murray - Owner
    ];
    const isAdmin = adminEmails.includes(session.user.email || '');

    // First, get the contact to verify access and get email
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id, email_address')
      .eq('id', contactId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if user has access to this contact
    if (!isAdmin && contact.user_id !== session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get the contact submission ID for this contact
    // We need to find the contact_submission_id that was used when creating projects
    // Since projects are linked via contact_submission_id, we need to find the submission
    const { data: submissions, error: submissionError } = await supabase
      .from('contact_submissions')
      .select('id')
      .eq('email', contact.email_address)
      .order('created_at', { ascending: false });

    if (submissionError) {
      console.error('Error fetching submissions:', submissionError);
      return res.status(500).json({ error: 'Failed to fetch contact submissions' });
    }

    console.log('Contact email:', contact.email_address);
    console.log('Found submissions:', submissions?.length || 0);

    if (!submissions || submissions.length === 0) {
      console.log('No submissions found for contact email:', contact.email_address);
      return res.status(200).json({ projects: [] });
    }

    // Get projects for all submissions related to this contact
    const submissionIds = submissions.map(sub => sub.id);
    
    console.log('Looking for projects with submission IDs:', submissionIds);
    
    const { data: projects, error: projectsError } = await supabase
      .from('events')
      .select('*')
      .in('submission_id', submissionIds)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    console.log('Found projects:', projects?.length || 0);

    res.status(200).json({ 
      projects: projects || [],
      count: projects?.length || 0
    });

  } catch (error) {
    console.error('Error in get-contact-projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
