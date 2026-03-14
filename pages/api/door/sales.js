/**
 * GET /api/door/sales
 * Returns door ticket sales for the authenticated user's organization.
 * Requires auth. Optional ?limit=50&offset=0 for pagination.
 */
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's organization (owner or member)
    let organizationId = null;
    const { data: ownerOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (ownerOrg) {
      organizationId = ownerOrg.id;
    } else {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (membership?.organization_id) {
        organizationId = membership.organization_id;
      }
    }

    if (!organizationId) {
      return res.status(404).json({ error: 'No organization found' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: tickets, error } = await supabaseAdmin
      .from('event_tickets')
      .select('id, purchaser_name, purchaser_email, quantity, total_amount, qr_code, payment_status, created_at')
      .eq('organization_id', organizationId)
      .eq('ticket_type', 'door')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[door/sales]', error);
      return res.status(500).json({ error: 'Failed to load sales' });
    }

    // Count total for pagination
    const { count } = await supabaseAdmin
      .from('event_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('ticket_type', 'door');

    return res.status(200).json({
      sales: tickets || [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[door/sales]', err);
    return res.status(500).json({ error: err?.message || 'Failed to load sales' });
  }
}
