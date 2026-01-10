import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get QR scan count for the authenticated user's organization within a time range
 * CRITICAL: Only returns scans for the user's organization (data isolation)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabaseClient = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's organization
    const organization = await getCurrentOrganization(supabaseClient);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get time range from query params
    const { startDate, endDate, isQrScan } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Build query - CRITICAL: Filter by organization_id
    let query = supabase
      .from('qr_scans')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id) // CRITICAL: Data isolation
      .gte('scanned_at', startDate)
      .lte('scanned_at', endDate + 'T23:59:59');

    // Optionally filter by is_qr_scan flag
    if (isQrScan === 'true') {
      query = query.eq('is_qr_scan', true);
    } else if (isQrScan === 'false') {
      query = query.eq('is_qr_scan', false);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching QR scan count:', error);
      return res.status(500).json({ error: 'Failed to fetch scan count' });
    }

    return res.status(200).json({
      success: true,
      count: count || 0,
      organizationId: organization.id,
      startDate,
      endDate,
      isQrScan: isQrScan || 'all'
    });
  } catch (error) {
    console.error('Error in QR scan count API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

