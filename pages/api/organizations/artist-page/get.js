/**
 * Get Artist Page API
 * 
 * Retrieves artist page settings for an organization
 */

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
    
    // If organizationId is provided, use it; otherwise try slug
    if (organizationId) {
      const { data, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          artist_page_enabled,
          artist_page_bio,
          artist_page_headline,
          artist_page_profile_image_url,
          artist_page_cover_image_url,
          artist_page_gallery_images,
          artist_page_video_urls,
          artist_page_links,
          artist_page_contact_email,
          artist_page_contact_phone,
          artist_page_booking_url,
          artist_page_custom_css
        `)
        .eq('id', organizationId)
        .single();
      
      organization = data;
      if (orgError) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    } else if (slug) {
      const { data, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          artist_page_enabled,
          artist_page_bio,
          artist_page_headline,
          artist_page_profile_image_url,
          artist_page_cover_image_url,
          artist_page_gallery_images,
          artist_page_video_urls,
          artist_page_links,
          artist_page_contact_email,
          artist_page_contact_phone,
          artist_page_booking_url,
          artist_page_custom_css
        `)
        .eq('slug', slug)
        .single();
      
      organization = data;
      if (orgError) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    } else {
      return res.status(400).json({ error: 'Organization ID or slug is required' });
    }

    return res.status(200).json({
      success: true,
      artistPage: organization
    });

  } catch (error) {
    console.error('Error fetching artist page:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

