import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

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

    // Create the project using service role client (needed for events table)
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Generate project name
      const generateProjectName = (contact) => {
        const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
        const eventType = contact.event_type || 'Event';
        const eventDate = contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }) : '';
        const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
        
        return `${clientName} - ${eventType}${eventDate ? ` - ${eventDate}` : ''}${venue}`;
      };

      // Map contact data to project data
      const projectData = {
        submission_id: contact.id,
        event_name: generateProjectName(contact),
        client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
        client_email: contact.email_address,
        client_phone: contact.phone || null,
        event_type: contact.event_type || 'other',
        event_date: contact.event_date || new Date().toISOString().split('T')[0],
        start_time: contact.event_time || null,
        venue_name: contact.venue_name || null,
        venue_address: contact.venue_address || null,
        number_of_guests: contact.guest_count || null,
        special_requests: contact.special_requests || null,
        status: 'confirmed',
        notes: `Auto-generated project from contact. Created on ${new Date().toLocaleDateString()}.`
      };

      const { data: project, error: projectError } = await supabaseAdmin
        .from('events')
        .insert([projectData])
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

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
