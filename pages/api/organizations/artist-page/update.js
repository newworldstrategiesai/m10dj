/**
 * Update Artist Page API
 * 
 * Updates artist page settings for an organization
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId, ...updateData } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Verify user owns the organization
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, owner_id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.owner_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this organization' });
    }

    // Prepare update object with only allowed fields
    const allowedFields = [
      'artist_page_enabled',
      'artist_page_bio',
      'artist_page_headline',
      'artist_page_profile_image_url',
      'artist_page_cover_image_url',
      'artist_page_gallery_images',
      'artist_page_video_urls',
      'artist_page_links',
      'artist_page_contact_email',
      'artist_page_contact_phone',
      'artist_page_booking_url',
      'artist_page_custom_css'
    ];

    const updateFields = {};
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        updateFields[field] = updateData[field];
      }
    });

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update(updateFields)
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating artist page:', updateError);
      return res.status(500).json({ error: 'Failed to update artist page', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      organization: updatedOrg
    });

  } catch (error) {
    console.error('Error in artist page update:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

