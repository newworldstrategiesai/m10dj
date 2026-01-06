/**
 * Get Branding Settings API
 * 
 * Retrieves current branding settings for an organization
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
    const { organizationId, slug } = req.query;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    let organization;
    let orgError = null;
    
    // If organizationId is provided, use it; otherwise try slug
    if (organizationId) {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          white_label_enabled,
          custom_logo_url,
          custom_favicon_url,
          primary_color,
          secondary_color,
          background_color,
          text_color,
          font_family,
          custom_domain,
          subscription_tier
        `)
        .eq('id', organizationId)
        .single();
      
      organization = data;
      orgError = error;
      if (orgError) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    } else if (slug) {
      // Public access by slug (for public request pages)
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          white_label_enabled,
          custom_logo_url,
          custom_favicon_url,
          primary_color,
          secondary_color,
          background_color,
          text_color,
          font_family,
          custom_domain,
          subscription_tier
        `)
        .eq('slug', slug)
        .single();
      
      organization = data;
      orgError = error;
      if (orgError) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    } else {
      // Authenticated access - get user's organization
      const supabase = createServerSupabaseClient({ req, res });
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = session.user;

      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          white_label_enabled,
          custom_logo_url,
          custom_favicon_url,
          primary_color,
          secondary_color,
          background_color,
          text_color,
          font_family,
          custom_domain,
          subscription_tier
        `)
        .eq('owner_id', user.id)
        .single();
      
      organization = data;
      orgError = error;
      if (orgError) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    }

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.status(200).json({
      branding: {
        whiteLabelEnabled: organization.white_label_enabled || false,
        customLogoUrl: organization.custom_logo_url || null,
        customFaviconUrl: organization.custom_favicon_url || null,
        primaryColor: organization.primary_color || '#8B5CF6',
        secondaryColor: organization.secondary_color || '#EC4899',
        backgroundColor: organization.background_color || '#FFFFFF',
        textColor: organization.text_color || '#1F2937',
        fontFamily: organization.font_family || 'system-ui, sans-serif',
        customDomain: organization.custom_domain || null,
        subscriptionTier: organization.subscription_tier,
        hasAccess: organization.white_label_enabled || 
                   organization.subscription_tier === 'white_label' || 
                   organization.subscription_tier === 'enterprise',
      },
    });
  } catch (error) {
    console.error('Error in branding get API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

