import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { db } from '../../utils/company_lib/supabase';

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

    // Check if user is admin
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'
    ];
    const isAdmin = adminEmails.includes(session.user.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Get the contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Create the project using the contact data
    try {
      const project = await db.createProject(contact, contact.id);
      res.status(200).json({
        success: true,
        project: project,
        message: 'Project created successfully'
      });
    } catch (projectError) {
      console.error('Error creating project:', projectError);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
        details: projectError.message
      });
    }

  } catch (error) {
    console.error('Error in create-project-for-contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
