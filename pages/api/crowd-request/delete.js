// API endpoint to delete crowd requests
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { requestIds } = req.body; // Can be a single ID or array of IDs

    if (!requestIds || (Array.isArray(requestIds) && requestIds.length === 0)) {
      return res.status(400).json({ error: 'Request ID(s) are required' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Normalize to array
    const ids = Array.isArray(requestIds) ? requestIds : [requestIds];

    // Build query - users can only delete requests from their organization
    let query = supabase
      .from('crowd_requests')
      .delete()
      .in('id', ids);

    // For SaaS users, filter by organization_id. Platform admins can delete any.
    if (!isAdmin && orgId) {
      query = query.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'No organization found' });
    }

    const { error: deleteError, data } = await query;

    if (deleteError) {
      console.error('Error deleting requests:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete request(s)',
        details: deleteError.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${ids.length} request(s)`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error in delete endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

