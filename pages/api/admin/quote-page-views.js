/**
 * GET /api/admin/quote-page-views?contactId=xxx
 * Returns a timeline of each time the quote page was viewed (for admin on the quote page).
 * Admin only.
 */

import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await requireAdmin(req, res);
    const supabase = createServerSupabaseClient({ req, res });
    const contactId = req.query.contactId;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    const isAdmin = isPlatformAdmin(user.email);
    const orgId = await getOrganizationContext(supabase, user.id, user.email);
    if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Organization required' });
    }

    const env = getEnv();
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    let contactQuery = supabaseAdmin
      .from('contacts')
      .select('id, organization_id')
      .eq('id', contactId)
      .is('deleted_at', null);

    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    }

    const { data: contact, error: contactError } = await contactQuery.single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { data: views, error: viewsError } = await supabaseAdmin
      .from('quote_analytics')
      .select('id, created_at, time_spent, metadata')
      .eq('quote_id', contactId)
      .eq('event_type', 'page_view')
      .order('created_at', { ascending: false });

    if (viewsError) {
      console.error('quote-page-views', viewsError);
      return res.status(500).json({ error: 'Failed to load page views' });
    }

    return res.status(200).json({
      views: (views || []).map((v) => ({
        id: v.id,
        createdAt: v.created_at,
        timeSpent: v.time_spent ?? null,
        metadata: v.metadata ?? {},
      })),
    });
  } catch (err) {
    if (res.headersSent) return;
    console.error('quote-page-views', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
