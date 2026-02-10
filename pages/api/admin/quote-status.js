/**
 * GET /api/admin/quote-status?contactId=xxx
 * Returns whether the client has viewed the quote page and whether they've made a selection.
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

    const [viewResult, selectionResult] = await Promise.all([
      supabaseAdmin
        .from('quote_analytics')
        .select('created_at')
        .eq('quote_id', contactId)
        .eq('event_type', 'page_view')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('quote_selections')
        .select('id, created_at')
        .eq('lead_id', contactId)
        .limit(1)
        .maybeSingle(),
    ]);

    const viewedAt = viewResult.data?.created_at ?? null;
    const hasSelection = !!selectionResult.data;

    return res.status(200).json({
      viewed: !!viewedAt,
      viewedAt: viewedAt || null,
      hasSelection,
      selectionAt: hasSelection ? selectionResult.data?.created_at ?? null : null,
    });
  } catch (err) {
    if (res.headersSent) return;
    console.error('quote-status', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
