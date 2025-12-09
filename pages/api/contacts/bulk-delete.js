import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    // Get organization context (supports view-as mode for admins)
    const viewAsOrgId = getViewAsOrgIdFromRequest(req);
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email,
      viewAsOrgId
    );

    // Use service role for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Soft delete by setting deleted_at timestamp
    // First check if deleted_at column exists, if not, we'll use a different approach
    let fetchQuery = adminSupabase
      .from('contacts')
      .select('id, organization_id')
      .in('id', contactIds)
      .is('deleted_at', null);

    // Add organization filter if specified
    if (orgId) {
      fetchQuery = fetchQuery.eq('organization_id', orgId);
    }

    const { data: contacts, error: fetchError } = await fetchQuery;

    // Verify all contacts belong to the same organization (if orgId is specified)
    if (orgId && contacts) {
      const invalidContacts = contacts.filter(c => c.organization_id !== orgId);
      if (invalidContacts.length > 0) {
        logger.warn('Attempted to delete contacts from different organization', {
          invalidContactIds: invalidContacts.map(c => c.id),
          expectedOrgId: orgId
        });
        return res.status(403).json({ 
          error: 'Cannot delete contacts from different organization',
          invalidCount: invalidContacts.length
        });
      }
    }

    if (fetchError) {
      logger.error('Error fetching contacts for deletion', fetchError);
      // If deleted_at doesn't exist, try direct delete
      let deleteQuery = adminSupabase
        .from('contacts')
        .delete()
        .in('id', contactIds);

      if (orgId) {
        deleteQuery = deleteQuery.eq('organization_id', orgId);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        logger.error('Database error in bulk delete', deleteError);
        return res.status(500).json({ error: 'Failed to delete contacts', details: deleteError.message });
      }

      logger.info('Bulk contacts deleted (hard delete)', { count: contactIds.length, userId: user.id, orgId });
      
      return res.status(200).json({ 
        success: true,
        message: `Successfully deleted ${contactIds.length} contact(s)`,
        deleted: contactIds.length
      });
    }

    // Try soft delete first
    let updateQuery = adminSupabase
      .from('contacts')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds);

    if (orgId) {
      updateQuery = updateQuery.eq('organization_id', orgId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      // If soft delete fails (column might not exist), try hard delete
      logger.warn('Soft delete failed, attempting hard delete', { error: updateError.message });
      let deleteQuery = adminSupabase
        .from('contacts')
        .delete()
        .in('id', contactIds);

      if (orgId) {
        deleteQuery = deleteQuery.eq('organization_id', orgId);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        logger.error('Database error in bulk delete', deleteError);
        return res.status(500).json({ error: 'Failed to delete contacts', details: deleteError.message });
      }
    }

    logger.info('Bulk contacts deleted (soft delete)', { count: contactIds.length, userId: user.id });

    return res.status(200).json({ 
      success: true,
      message: `Successfully deleted ${contactIds.length} contact(s)`,
      deleted: contactIds.length
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in bulk delete', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

