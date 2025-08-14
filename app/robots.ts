import { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

export default function robots(): MetadataRoute.Robots {
  // Force www subdomain for consistency with sitemap
  const baseUrl = 'https://www.m10djcompany.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/signin/',
          '/account/',
          '/client/',
          '/auth/',
          '/_next/',
          '/favicon.ico',
          '/*.json$', // Block JSON files
          '/chat/', // Block chat interface from crawling
        ],
        crawlDelay: 1, // Be respectful to server resources
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/signin/',
          '/account/',
          '/client/',
          '/auth/',
          '/chat/',
        ],
        // No crawl delay for Googlebot - we want fast indexing
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/signin/',
          '/account/',
          '/client/',
          '/auth/',
          '/chat/',
        ],
        crawlDelay: 2, // Bing can be more aggressive, slow it down
      },
      // Block problematic bots
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 