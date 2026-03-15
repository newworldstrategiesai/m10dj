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
      .select('id, name, slug, door_settings, subscription_status, requests_venmo_username, requests_venmo_phone_number, requests_payment_method_venmo_enabled')
      .eq('slug', slug)
      .maybeSingle();

    if (!org && !error) {
      const { data: normalized } = await supabase.rpc('get_organization_by_normalized_slug', { input_slug: slug });
      if (normalized?.[0]) {
        const { data: full } = await supabase
          .from('organizations')
          .select('id, name, slug, door_settings, subscription_status, requests_venmo_username, requests_venmo_phone_number, requests_payment_method_venmo_enabled')
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
      enabled: ds.enabled === true,
      price_cents: ds.price_cents ?? 1500,
      venue_display: ds.venue_display || org.name || '',
      max_quantity_per_transaction: ds.max_quantity_per_transaction ?? 10,
      // Customization
      header_text: ds.header_text ?? org.name,
      subtitle_text: ds.subtitle_text ?? ds.venue_display ?? org.name ?? '',
      cover_photo_url: ds.cover_photo_url ?? null,
      show_cover_photo: ds.show_cover_photo !== false,
      button_color: ds.button_color ?? null,
      // Venmo (from org requests settings)
      venmo_enabled: !!(org.requests_venmo_username && org.requests_payment_method_venmo_enabled !== false),
      venmo_username: org.requests_venmo_username || null,
      venmo_phone_number: org.requests_venmo_phone_number || null,
    });
  } catch (err) {
    console.error('[door/settings]', err);
    return res.status(500).json({ error: 'Failed to load settings' });
  }
}
