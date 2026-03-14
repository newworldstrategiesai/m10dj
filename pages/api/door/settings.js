/**
 * GET /api/door/settings?slug=xxx
 * Public - returns door settings for organization (enabled, price, venue, max qty)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, slug, door_settings, subscription_status')
      .eq('slug', slug)
      .maybeSingle();

    if (!org && !error) {
      const { data: normalized } = await supabase.rpc('get_organization_by_normalized_slug', { input_slug: slug });
      if (normalized?.[0]) {
        const { data: full } = await supabase
          .from('organizations')
          .select('id, name, slug, door_settings, subscription_status')
          .eq('slug', normalized[0].slug)
          .maybeSingle();
        org = full;
      }
    }

    if (error || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.subscription_status === 'cancelled') {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const ds = org.door_settings || {};
    return res.status(200).json({
      organizationId: org.id,
      organizationName: org.name,
      slug: org.slug,
      enabled: ds.enabled ?? false,
      price_cents: ds.price_cents ?? 1500,
      venue_display: ds.venue_display || org.name || '',
      max_quantity_per_transaction: ds.max_quantity_per_transaction ?? 10,
    });
  } catch (err) {
    console.error('[door/settings]', err);
    return res.status(500).json({ error: 'Failed to load settings' });
  }
}
