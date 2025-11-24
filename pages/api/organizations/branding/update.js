/**
 * Update Branding Settings API
 * 
 * Updates branding colors, fonts, and other settings
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = session.user;

    // Get user's organization
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, subscription_tier, white_label_enabled')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if white-label is enabled or if user has white_label/enterprise tier
    const hasWhiteLabelAccess = 
      organization.white_label_enabled || 
      organization.subscription_tier === 'white_label' || 
      organization.subscription_tier === 'enterprise';

    if (!hasWhiteLabelAccess) {
      return res.status(403).json({ 
        error: 'White-label branding is not available for your subscription tier',
        requiredTier: 'white_label or enterprise'
      });
    }

    const {
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      fontFamily,
      whiteLabelEnabled,
    } = req.body;

    // Validate hex colors if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const updates = {};

    if (primaryColor !== undefined) {
      if (!hexColorRegex.test(primaryColor)) {
        return res.status(400).json({ error: 'Invalid primaryColor format. Must be a hex color (e.g., #8B5CF6)' });
      }
      updates.primary_color = primaryColor;
    }

    if (secondaryColor !== undefined) {
      if (!hexColorRegex.test(secondaryColor)) {
        return res.status(400).json({ error: 'Invalid secondaryColor format. Must be a hex color (e.g., #EC4899)' });
      }
      updates.secondary_color = secondaryColor;
    }

    if (backgroundColor !== undefined) {
      if (!hexColorRegex.test(backgroundColor)) {
        return res.status(400).json({ error: 'Invalid backgroundColor format. Must be a hex color (e.g., #FFFFFF)' });
      }
      updates.background_color = backgroundColor;
    }

    if (textColor !== undefined) {
      if (!hexColorRegex.test(textColor)) {
        return res.status(400).json({ error: 'Invalid textColor format. Must be a hex color (e.g., #1F2937)' });
      }
      updates.text_color = textColor;
    }

    if (fontFamily !== undefined) {
      updates.font_family = fontFamily;
    }

    if (whiteLabelEnabled !== undefined) {
      updates.white_label_enabled = whiteLabelEnabled;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update organization
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', organization.id);

    if (updateError) {
      console.error('Error updating organization branding:', updateError);
      return res.status(500).json({ error: 'Failed to update branding settings' });
    }

    return res.status(200).json({
      success: true,
      message: 'Branding settings updated successfully',
      updates,
    });
  } catch (error) {
    console.error('Error in branding update API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

