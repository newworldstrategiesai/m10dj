/**
 * Get Organization by Slug API
 * 
 * Public endpoint to get organization details by slug
 * Used for organization-specific request pages
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key to bypass RLS for public organization lookups
// This is safe because we only expose limited fields (id, name, slug, subscription_status)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Get organization by slug (public read - no auth required)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, subscription_status, subscription_tier')
      .eq('slug', slug)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if organization is active (not cancelled)
    if (organization.subscription_status === 'cancelled') {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.status(200).json({ organization });
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return res.status(500).json({
      error: 'Failed to get organization',
      message: error.message,
    });
  }
}

