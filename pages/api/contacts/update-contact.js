import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Get organization context (supports view-as mode for admins)
    const viewAsOrgId = getViewAsOrgIdFromRequest(req);
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email,
      viewAsOrgId
    );

    // Use service role for admin updates
    const env = getEnv();
    const adminSupabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // First, verify the contact belongs to the specified organization (if orgId is specified)
    if (orgId) {
      const { data: contact, error: verifyError } = await adminSupabase
        .from('contacts')
        .select('id, organization_id')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (verifyError || !contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      if (contact.organization_id !== orgId) {
        logger.warn('Attempted to update contact from different organization', {
          contactId: id,
          contactOrgId: contact.organization_id,
          expectedOrgId: orgId
        });
        return res.status(403).json({ error: 'Cannot update contact from different organization' });
      }
    }

    // Build update query
    let updateQuery = adminSupabase
      .from('contacts')
      .update(updates)
      .eq('id', id);

    // Add organization filter if specified (for safety)
    if (orgId) {
      updateQuery = updateQuery.eq('organization_id', orgId);
    }

    const { data, error } = await updateQuery
      .select()
      .single();

    if (error) {
      logger.error('Error updating contact', { contactId: id, error });
      return res.status(500).json({ error: 'Failed to update contact', details: error.message });
    }

    logger.info('Contact updated', { contactId: id, userId: user.id });

    res.status(200).json({ contact: data });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in update-contact', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

