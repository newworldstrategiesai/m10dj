import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
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

    const { contactIds, updates } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' });
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

    // First, verify all contacts belong to the same organization (if orgId is specified)
    if (orgId) {
      const { data: contacts, error: verifyError } = await adminSupabase
        .from('contacts')
        .select('id, organization_id')
        .in('id', contactIds)
        .is('deleted_at', null);

      if (verifyError) {
        logger.error('Error verifying contacts', verifyError);
        return res.status(500).json({ error: 'Failed to verify contacts', details: verifyError.message });
      }

      // Check if all contacts belong to the specified organization
      const invalidContacts = contacts?.filter(c => c.organization_id !== orgId) || [];
      if (invalidContacts.length > 0) {
        logger.warn('Attempted to update contacts from different organization', {
          invalidContactIds: invalidContacts.map(c => c.id),
          expectedOrgId: orgId
        });
        return res.status(403).json({ 
          error: 'Cannot update contacts from different organization',
          invalidCount: invalidContacts.length
        });
      }
    }

    // Validate allowed update fields
    const allowedFields = [
      'lead_temperature',
      'lead_source',
      'lead_stage',
      'priority_level',
      'assigned_to',
      'notes'
    ];

    const updateData = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update contacts in bulk
    let updateQuery = adminSupabase
      .from('contacts')
      .update(updateData)
      .in('id', contactIds);

    // Add organization filter if specified (for safety)
    if (orgId) {
      updateQuery = updateQuery.eq('organization_id', orgId);
    }

    const { data, error } = await updateQuery;

    if (error) {
      logger.error('Database error in bulk update', error);
      return res.status(500).json({ error: 'Failed to update contacts', details: error.message });
    }

    logger.info('Bulk contacts updated', { count: contactIds.length, userId: user.id });
    
    return res.status(200).json({ 
      success: true,
      message: `Successfully updated ${contactIds.length} contact(s)`,
      updated: contactIds.length
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in bulk update', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

