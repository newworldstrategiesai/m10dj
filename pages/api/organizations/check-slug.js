/**
 * Check Slug Availability API
 * 
 * Checks if a slug is available for use
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Normalize slug
    const normalizedSlug = slug.toLowerCase().trim();

    // Validate slug format
    if (normalizedSlug.length < 3) {
      return res.status(400).json({ 
        error: 'Slug must be at least 3 characters',
        exists: false 
      });
    }

    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return res.status(400).json({ 
        error: 'Slug can only contain lowercase letters, numbers, and hyphens',
        exists: false 
      });
    }

    // Check if slug exists (excluding current user's organization if provided)
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabaseAdmin
      .from('organizations')
      .select('id, slug, owner_id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    const { data: existingOrg, error: queryError } = await query;

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error checking slug:', queryError);
      return res.status(500).json({ error: 'Failed to check slug availability' });
    }

    // If organization exists, check if it belongs to the current user
    if (existingOrg) {
      if (user && existingOrg.owner_id === user.id) {
        // User owns this slug, it's available for them
        return res.status(200).json({ exists: false, available: true });
      }
      // Slug exists and belongs to another user
      return res.status(200).json({ exists: true, available: false });
    }

    // Slug doesn't exist, it's available
    return res.status(200).json({ exists: false, available: true });
  } catch (error) {
    console.error('Error checking slug:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

