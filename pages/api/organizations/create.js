/**
 * Create Organization API
 * 
 * Allows creating an organization (used during onboarding)
 * Also handles organization creation if it doesn't exist for a user
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Check if user already has an organization
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existingOrg) {
      return res.status(200).json({
        organization: existingOrg,
        message: 'Organization already exists',
      });
    }

    // Generate slug from name - ensure it's based on the business name
    // Remove special characters, convert to lowercase, replace spaces with hyphens
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, '') // Remove special chars first
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
    
    // Ensure slug is not empty
    if (!slug || slug.length === 0) {
      // Fallback to email prefix or user ID
      const emailPrefix = user.email?.split('@')[0] || '';
      slug = emailPrefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!slug || slug.length === 0) {
        slug = 'dj-' + user.id.substring(0, 8);
      }
    }

    // Ensure slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', uniqueSlug)
        .single();

      if (!existing) {
        break;
      }
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create organization using admin client (bypasses RLS)
    // Audio upload is disabled by default during onboarding
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: name.trim(),
        slug: uniqueSlug,
        owner_id: user.id,
        subscription_tier: 'starter',
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        requests_show_audio_upload: false, // Disabled by default during onboarding
      })
      .select()
      .single();

    if (orgError || !organization) {
      console.error('Error creating organization:', orgError);
      return res.status(500).json({
        error: 'Failed to create organization',
        details: orgError?.message,
      });
    }

    return res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('Error in create organization:', error);
    return res.status(500).json({
      error: 'Failed to create organization',
      message: error.message,
    });
  }
}

