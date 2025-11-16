import { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Force www subdomain for sitemap URLs to avoid redirect errors in Google Search Console
  const baseUrl = 'https://www.m10djcompany.com';
  
  try {
    // Use service role client for sitemap (no cookies needed)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
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