import { supabase, db } from '../../../../utils/company_lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
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

      // Set published_at if publishing for the first time
      if (postData.is_published && !postData.published_at) {
        postData.published_at = new Date().toISOString();
      }

      // Update the blog post using the database helper
      const updatedPost = await db.updateBlogPost(id, {
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
        published_at: postData.published_at || null
      });

      return res.status(200).json({ 
        success: true, 
        blogPost: updatedPost 
      });

    } catch (error) {
      console.error('Error updating blog post:', error);
      return res.status(500).json({ 
        error: 'Failed to update blog post', 
        details: error.message 
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.deleteBlogPost(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return res.status(500).json({ 
        error: 'Failed to delete blog post', 
        details: error.message 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}