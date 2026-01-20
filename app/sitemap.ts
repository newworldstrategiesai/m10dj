import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getURL } from '@/utils/helpers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Detect domain from request headers
  const headersList = await headers();
  const hostname = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  const hostnameLower = hostname.toLowerCase();
  
  // Determine base URL based on domain
  const isTipJarDomain = hostnameLower.includes('tipjar.live');
  const isDJDashDomain = hostnameLower.includes('djdash.net');
  
  // Force www subdomain for sitemap URLs to avoid redirect errors in Google Search Console
  const baseUrl = isTipJarDomain 
    ? 'https://www.tipjar.live'
    : isDJDashDomain
    ? 'https://www.djdash.net'
    : 'https://www.m10djcompany.com';
  
  // If TipJar domain, return TipJar sitemap
  if (isTipJarDomain) {
    return generateTipJarSitemap(baseUrl);
  }
  
  // If DJ Dash domain, return DJ Dash sitemap
  if (isDJDashDomain) {
    return generateDJDashSitemap(baseUrl);
  }
  
  // Default to M10 DJ Company sitemap
  
  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/about',
    '/contact',
    '/dj-near-me-memphis',
    '/memphis-event-dj-services',
    '/memphis-dj-pricing-guide',
    '/memphis-specialty-dj-services',
    '/multicultural-dj-memphis',
    '/dj-rentals-memphis',
    '/dj-germantown-tn',
    '/dj-collierville-tn',
    '/dj-east-memphis-tn',
    '/dj-ben-murray',
    '/services',
    '/memphis-wedding-dj',
    '/wedding-dj-memphis-tn',
    '/wedding-dj-packages-memphis',
    '/memphis-dj-services',
    '/best-wedding-dj-memphis',
    '/memphis-wedding-dj-prices-2025',
    '/corporate-events',
    '/dj-uplighting-memphis',
    '/photo-booth-rental-memphis',
    '/cold-sparks-memphis',
    '/private-parties',
    '/school-dances',
    '/holiday-parties',
    '/vendors',
    '/venues',
    '/blog',
    '/events/live/dj-ben-murray-silky-osullivans-2026-12-27'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1 : 
             // Primary wedding pages (highest conversion potential)
             route === '/memphis-wedding-dj' ? 0.98 : // Main wedding authority page
             route === '/dj-near-me-memphis' ? 0.97 : // High-intent local search
             route === '/wedding-dj-memphis-tn' ? 0.95 : // TN-focused page
             route === '/wedding-dj-packages-memphis' ? 0.96 : // High-intent packages page
             route === '/best-wedding-dj-memphis' ? 0.94 : // Reviews/social proof
             route === '/dj-uplighting-memphis' ? 0.93 : // High-ROI upsell
             route === '/photo-booth-rental-memphis' ? 0.93 : // High-ROI upsell
             route === '/cold-sparks-memphis' ? 0.92 : // Premium upsell
             // Service pages (good conversion potential)
             route === '/memphis-dj-services' ? 0.93 :
             route === '/dj-germantown-tn' ? 0.92 :
             route === '/dj-collierville-tn' ? 0.92 :
             route === '/dj-east-memphis-tn' ? 0.92 :
             route === '/memphis-event-dj-services' ? 0.91 :
             // Specialty and pricing pages
             route === '/memphis-dj-pricing-guide' ? 0.90 :
             route === '/memphis-wedding-dj-prices-2025' ? 0.89 :
             route === '/memphis-specialty-dj-services' ? 0.88 :
             // Contact and about pages
             route === '/contact' ? 0.89 :
             route === '/pricing' ? 0.88 :
             route === '/dj-ben-murray' ? 0.87 :
             route === '/events/live/dj-ben-murray-silky-osullivans-2026-12-27' ? 0.90 : // Live event page
             // Specialty services
             route === '/multicultural-dj-memphis' ? 0.85 :
             route === '/dj-rentals-memphis' ? 0.84 : 0.8,
  }));

  // Location pages
  const locations = [
    'memphis',
    'midtown-memphis', 
    'downtown-memphis',
    'east-memphis',
    'germantown',
    'collierville',
    'bartlett',
    'millington',
    'arlington',
    'cordova',
    'lakeland',
    'olive-branch',
    'southaven',
    'west-memphis'
  ];

  const locationPages = locations.map((location) => ({
    url: `${baseUrl}/${location}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as 'weekly',
    priority: location === 'memphis' ? 0.9 : 
             location === 'germantown' || location === 'collierville' || location === 'bartlett' || location === 'millington' ? 0.75 : 0.7,
  }));

  // Venue pages (update when venues are added/removed from database)
  const venuePages = [
    // Memphis venues
    'the-peabody-hotel',
    'memphis-botanic-garden', 
    'dixon-gallery-gardens',
    'woodruff-fontaine-house',
    'annesdale-mansion',
    'the-atrium-at-overton-square',
    'central-station-hotel',
    'avon-acres',
    'the-balinese-ballroom',
    'the-cadre-building',
    'the-columns-at-one-commerce-square',
    'old-dominick-distillery',
    'memphis-brooks-museum-of-art',
    'memphis-zoo-event-venues',
    'graceland-s-chapel-in-the-woods',
    'the-guest-house-at-graceland',
    // Suburban TN venues
    'heartwood-hall',
    'cedar-hall',
    'orion-hill',
    'the-robinshaw',
    'pin-oak-farms',
    'the-great-hall-conference-center',
    'pike-west',
    // MS venues  
    'mallard-s-croft',
    'the-gin-at-nesbit',
    'bonne-terre-inn-chapel',
    // AR venues
    'snowden-house'
  ].map((venueSlug) => ({
    url: `${baseUrl}/venues/${venueSlug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as 'monthly',
    priority: 0.7,
  }));

  // Dynamically fetch blog posts from Supabase
  let blogPages: MetadataRoute.Sitemap = [];
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

    if (!error && posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    // Fallback to hardcoded blog posts if database fetch fails
    blogPages = [
      '/blog/memphis-wedding-dj-cost-guide-2025',
      '/blog/memphis-wedding-songs-2025',
      '/blog/memphis-wedding-success-story-sarah-michael',
      '/blog/memphis-dj-cost-complete-guide-2025',
      '/blog/memphis-dj-cost-pricing-guide-2025',
      '/blog/how-to-choose-wedding-dj-memphis-2025',
      '/blog/memphis-wedding-music-top-songs-2025',
      '/blog/top-memphis-wedding-venues-2025',
      '/blog/east-memphis-wedding-dj-guide-2025'
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as 'monthly',
      priority: 0.6,
    }));
  }

  return [...staticPages, ...locationPages, ...venuePages, ...blogPages];
}

/**
 * Generate TipJar sitemap
 */
function generateTipJarSitemap(baseUrl: string): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    // Support page - high priority for SEO
    {
      url: `${baseUrl}/tipjar/support`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9, // High priority - important support content
    },
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/embed`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return staticPages;
}

/**
 * Generate DJ Dash sitemap with city pages
 */
async function generateDJDashSitemap(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/djdash`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/djdash/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/djdash/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/djdash/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/djdash/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/djdash/business`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/djdash/use-cases`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/djdash/dj-gigs-memphis-tn`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Fetch city pages from database
  let cityPages: MetadataRoute.Sitemap = [];
  let cityFindDJPages: MetadataRoute.Sitemap = [];
  let cityWeddingDJPages: MetadataRoute.Sitemap = [];
  let cityDJGigsPages: MetadataRoute.Sitemap = [];
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: cities, error } = await supabase
      .from('city_pages')
      .select('city_slug, updated_at, is_featured, priority')
      .eq('is_published', true)
      .eq('product_context', 'djdash')
      .order('is_featured', { ascending: false })
      .order('priority', { ascending: false });

    if (!error && cities) {
      // City pages: /djdash/cities/[city]
      cityPages = cities.map((city) => ({
        url: `${baseUrl}/djdash/cities/${city.city_slug}`,
        lastModified: new Date(city.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: city.is_featured ? 0.9 : city.priority ? city.priority / 100 : 0.7,
      }));

      // City find-dj pages: /djdash/find-dj/[city]
      cityFindDJPages = cities.map((city) => ({
        url: `${baseUrl}/djdash/find-dj/${city.city_slug}`,
        lastModified: new Date(city.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: city.is_featured ? 0.85 : city.priority ? city.priority / 100 : 0.72,
      }));

      // City wedding DJs pages: /djdash/find-dj/[city]/wedding-djs
      cityWeddingDJPages = cities.map((city) => ({
        url: `${baseUrl}/djdash/find-dj/${city.city_slug}/wedding-djs`,
        lastModified: new Date(city.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: city.is_featured ? 0.88 : city.priority ? city.priority / 100 : 0.74,
      }));

      // City DJ gigs pages: /djdash/dj-gigs/[city]
      cityDJGigsPages = cities.map((city) => ({
        url: `${baseUrl}/djdash/dj-gigs/${city.city_slug}`,
        lastModified: new Date(city.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: city.is_featured ? 0.8 : city.priority ? city.priority / 100 : 0.7,
      }));
    }
  } catch (error) {
    console.error('Error fetching city pages for sitemap:', error);
  }

  // Fetch city + event type pages from database
  let cityEventPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: eventPages, error } = await supabase
      .from('city_event_pages')
      .select('city_slug, event_type_slug, updated_at, is_published')
      .eq('is_published', true)
      .eq('product_context', 'djdash')
      .order('updated_at', { ascending: false })
      .limit(5000); // Limit to prevent sitemap from being too large

    if (!error && eventPages) {
      cityEventPages = eventPages.map((page) => ({
        url: `${baseUrl}/djdash/find-dj/${page.city_slug}/${page.event_type_slug}`,
        lastModified: new Date(page.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.75, // High priority for SEO-rich event pages
      }));
    }
  } catch (error) {
    console.error('Error fetching city event pages for sitemap:', error);
  }

  // Fetch DJ profiles for sitemap
  let djProfilePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profiles, error } = await supabase
      .from('dj_profiles')
      .select('dj_slug, updated_at, is_featured, organizations!inner(product_context)')
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash')
      .order('is_featured', { ascending: false })
      .limit(1000); // Limit to prevent sitemap from being too large

    if (!error && profiles) {
      djProfilePages = profiles.map((profile) => ({
        url: `${baseUrl}/dj/${profile.dj_slug}`,
        lastModified: new Date(profile.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: profile.is_featured ? 0.8 : 0.7,
      }));
    }
  } catch (error) {
    console.error('Error fetching DJ profiles for sitemap:', error);
  }

  return [
    ...staticPages,
    ...cityPages,
    ...cityFindDJPages,
    ...cityWeddingDJPages,
    ...cityDJGigsPages,
    ...cityEventPages,
    ...djProfilePages
  ];
} 