import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // SaaS users must have an organization
    if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Organization required' });
    }

    const eventData = req.body;

    // Basic validation
    if (!eventData.title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!eventData.content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Generate slug from title if not provided
    if (!eventData.slug) {
      eventData.slug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('case_studies')
      .select('id')
      .eq('slug', eventData.slug)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'A case study with this slug already exists' });
    }

    // Set published_at if publishing
    if (eventData.is_published && !eventData.published_at) {
      eventData.published_at = new Date().toISOString();
    }

    // Process highlights array
    let highlights = [];
    if (eventData.highlights) {
      if (typeof eventData.highlights === 'string') {
        highlights = eventData.highlights
          .split('\n')
          .map(h => h.trim())
          .filter(h => h.length > 0);
      } else if (Array.isArray(eventData.highlights)) {
        highlights = eventData.highlights;
      }
    }

    // Process gallery images array
    let galleryImages = [];
    if (eventData.gallery_images) {
      if (typeof eventData.gallery_images === 'string') {
        galleryImages = eventData.gallery_images
          .split('\n')
          .map(img => img.trim())
          .filter(img => img.length > 0);
      } else if (Array.isArray(eventData.gallery_images)) {
        galleryImages = eventData.gallery_images;
      }
    }

    // Process SEO keywords array
    let seoKeywords = [];
    if (eventData.seo_keywords) {
      if (typeof eventData.seo_keywords === 'string') {
        seoKeywords = eventData.seo_keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);
      } else if (Array.isArray(eventData.seo_keywords)) {
        seoKeywords = eventData.seo_keywords;
      }
    }

    // Process testimonial if provided
    let testimonial = null;
    if (eventData.testimonial_text || eventData.testimonial_client_name) {
      testimonial = {
        testimonial_text: eventData.testimonial_text || '',
        client_name: eventData.testimonial_client_name || '',
        rating: eventData.testimonial_rating || 5,
        event_date: eventData.testimonial_event_date || eventData.event_date || null
      };
    }

    // Create the case study
    const { data, error } = await supabase
      .from('case_studies')
      .insert([{
        title: eventData.title,
        slug: eventData.slug,
        excerpt: eventData.excerpt || '',
        content: eventData.content || '',
        event_date: eventData.event_date || null,
        event_type: eventData.event_type || '',
        venue_name: eventData.venue_name || '',
        venue_address: eventData.venue_address || '',
        number_of_guests: eventData.number_of_guests ? parseInt(eventData.number_of_guests) : null,
        featured_image_url: eventData.featured_image_url || '',
        gallery_images: galleryImages,
        highlights: highlights,
        testimonial: testimonial,
        testimonial_id: eventData.testimonial_id || null,
        is_published: eventData.is_published || false,
        is_featured: eventData.is_featured || false,
        display_order: eventData.display_order ? parseInt(eventData.display_order) : 0,
        seo_title: eventData.seo_title || '',
        seo_description: eventData.seo_description || '',
        seo_keywords: seoKeywords,
        published_at: eventData.published_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating event page:', error);
      return res.status(500).json({ 
        error: 'Failed to create event page', 
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      eventPage: data[0] 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

