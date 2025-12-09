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

    const postData = req.body;

    // Basic validation
    if (!postData.title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Generate slug from title if not provided
    if (!postData.slug) {
      postData.slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Set published_at if publishing
    if (postData.is_published && !postData.published_at) {
      postData.published_at = new Date().toISOString();
    }

    // Create the blog post with organization_id
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt || '',
        content: postData.content || '',
        category: postData.category || 'general',
        tags: Array.isArray(postData.tags) ? postData.tags : (postData.tags ? [postData.tags] : []),
        featured_image_url: postData.featured_image_url || '',
        seo_title: postData.seo_title || '',
        seo_description: postData.seo_description || '',
        is_published: postData.is_published || false,
        is_featured: postData.is_featured || false,
        author: postData.author || 'M10 DJ Company',
        published_at: postData.published_at || null,
        organization_id: orgId, // Add organization_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating blog post:', error);
      return res.status(500).json({ 
        error: 'Failed to create blog post', 
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      blogPost: data[0] 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 