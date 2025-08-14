import { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Force www subdomain for sitemap URLs to avoid redirect errors in Google Search Console
  const baseUrl = 'https://www.m10djcompany.com';
  
  try {
    const supabase = createClient();
    
    // Fetch all published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts for sitemap:', error);
      return [];
    }

    const blogPages = posts?.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) || [];

    return blogPages;
  } catch (error) {
    console.error('Error generating blog sitemap:', error);
    return [];
  }
} 