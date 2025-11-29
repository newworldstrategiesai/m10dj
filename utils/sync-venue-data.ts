/**
 * Utility functions to keep venue data in sync between contacts and projects
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Sync venue data from contact to all linked projects
 */
export async function syncVenueFromContactToProjects(
  contactId: string,
  venueData: {
    venue_name?: string | null;
    venue_address?: string | null;
  }
): Promise<void> {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[syncVenueFromContactToProjects] Missing Supabase credentials');
    return;
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get contact email
    const { data: contact, error: contactError } = await adminClient
      .from('contacts')
      .select('email_address')
      .eq('id', contactId)
      .single();

    if (contactError || !contact?.email_address) {
      console.log('[syncVenueFromContactToProjects] Contact not found or no email');
      return;
    }

    // Find all projects linked to this contact by email
    const { data: projects, error: projectsError } = await adminClient
      .from('events')
      .select('id')
      .eq('client_email', contact.email_address);

    if (projectsError) {
      console.error('[syncVenueFromContactToProjects] Error finding projects:', projectsError);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('[syncVenueFromContactToProjects] No projects found for contact');
      return;
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (venueData.venue_name !== undefined) {
      updatePayload.venue_name = venueData.venue_name;
    }
    if (venueData.venue_address !== undefined) {
      updatePayload.venue_address = venueData.venue_address;
    }

    // Only update if we have fields to update
    if (Object.keys(updatePayload).length > 1) {
      const { error: updateError } = await adminClient
        .from('events')
        .update(updatePayload)
        .eq('client_email', contact.email_address);

      if (updateError) {
        console.error('[syncVenueFromContactToProjects] Error updating projects:', updateError);
      } else {
        console.log(`[syncVenueFromContactToProjects] Successfully synced venue to ${projects.length} project(s)`);
      }
    }
  } catch (error) {
    console.error('[syncVenueFromContactToProjects] Unexpected error:', error);
  }
}

/**
 * Sync venue data from project to linked contact
 */
export async function syncVenueFromProjectToContact(
  projectId: string,
  venueData: {
    venue_name?: string | null;
    venue_address?: string | null;
  }
): Promise<void> {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[syncVenueFromProjectToContact] Missing Supabase credentials');
    return;
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get project email
    const { data: project, error: projectError } = await adminClient
      .from('events')
      .select('client_email')
      .eq('id', projectId)
      .single();

    if (projectError || !project?.client_email) {
      console.log('[syncVenueFromProjectToContact] Project not found or no email');
      return;
    }

    // Find contact by email
    const { data: contacts, error: contactsError } = await adminClient
      .from('contacts')
      .select('id')
      .eq('email_address', project.client_email)
      .is('deleted_at', null);

    if (contactsError) {
      console.error('[syncVenueFromProjectToContact] Error finding contacts:', contactsError);
      return;
    }

    if (!contacts || contacts.length === 0) {
      console.log('[syncVenueFromProjectToContact] No contacts found for project');
      return;
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (venueData.venue_name !== undefined) {
      updatePayload.venue_name = venueData.venue_name;
    }
    if (venueData.venue_address !== undefined) {
      updatePayload.venue_address = venueData.venue_address;
    }

    // Only update if we have fields to update
    if (Object.keys(updatePayload).length > 1) {
      // Update all matching contacts (should usually be just one)
      const { error: updateError } = await adminClient
        .from('contacts')
        .update(updatePayload)
        .eq('email_address', project.client_email)
        .is('deleted_at', null);

      if (updateError) {
        console.error('[syncVenueFromProjectToContact] Error updating contacts:', updateError);
      } else {
        console.log(`[syncVenueFromProjectToContact] Successfully synced venue to ${contacts.length} contact(s)`);
      }
    }
  } catch (error) {
    console.error('[syncVenueFromProjectToContact] Unexpected error:', error);
  }
}

