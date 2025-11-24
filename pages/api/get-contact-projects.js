import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

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

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // First, get the contact to verify access and get email
    let contactQuery = supabase
      .from('contacts')
      .select('id, user_id, email_address, organization_id')
      .eq('id', contactId)
      .is('deleted_at', null);

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      // SaaS user without organization - deny access
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: contact, error: contactError } = await contactQuery.single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Additional check: Verify organization ownership for SaaS users
    if (!isAdmin && contact.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get projects linked to this contact
    // Try multiple methods to find projects:
    // 1. Direct contact_id link (for HoneyBook imports)
    // 2. Submission-based link (for website contact forms)
    // 3. Email matching (fallback)
    
    let projects = [];
    
    // Build events query with organization filtering
    let eventsQuery = supabase
      .from('events')
      .select('*')
      .or(`submission_id.eq.${contactId},client_email.eq.${contact.email_address}`);

    // For SaaS users, filter by organization_id. Platform admins see all events.
    if (!isAdmin && orgId) {
      eventsQuery = eventsQuery.eq('organization_id', orgId);
    }

    // Method 1: Check if events table has a contact_id column and use it
    const { data: directProjects, error: directError } = await eventsQuery
      .order('created_at', { ascending: false });

    if (directError) {
      console.error('Error fetching direct projects:', directError);
    } else if (directProjects && directProjects.length > 0) {
      console.log(`Found ${directProjects.length} projects via direct/email match`);
      projects = directProjects;
    }
    
    // Method 2: If no projects found, try submission-based lookup
    if (projects.length === 0 && contact.email_address) {
      // Build submissions query with organization filtering
      let submissionsQuery = supabase
        .from('contact_submissions')
        .select('id')
        .eq('email', contact.email_address);

      // For SaaS users, filter by organization_id. Platform admins see all submissions.
      if (!isAdmin && orgId) {
        submissionsQuery = submissionsQuery.eq('organization_id', orgId);
      }

      const { data: submissions, error: submissionError } = await submissionsQuery
        .order('created_at', { ascending: false });

      if (!submissionError && submissions && submissions.length > 0) {
        const submissionIds = submissions.map(sub => sub.id);
        console.log(`Found ${submissions.length} submissions, looking for projects...`);
        
        // Build events query with organization filtering
        let submissionEventsQuery = supabase
          .from('events')
          .select('*')
          .in('submission_id', submissionIds);

        // For SaaS users, filter by organization_id. Platform admins see all events.
        if (!isAdmin && orgId) {
          submissionEventsQuery = submissionEventsQuery.eq('organization_id', orgId);
        }

        const { data: submissionProjects, error: projectsError } = await submissionEventsQuery
          .order('created_at', { ascending: false});

        if (!projectsError && submissionProjects && submissionProjects.length > 0) {
          console.log(`Found ${submissionProjects.length} projects via submissions`);
          projects = submissionProjects;
        }
      }
    }
    
    console.log(`Total projects found: ${projects.length}`);

    res.status(200).json({ 
      projects: projects || [],
      count: projects?.length || 0
    });

  } catch (error) {
    console.error('Error in get-contact-projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
