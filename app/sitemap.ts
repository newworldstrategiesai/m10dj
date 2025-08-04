import { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getURL();
  
  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/about',
    '/dj-ben-murray',
    '/services',
    '/memphis-wedding-dj',
    '/wedding-dj-memphis-tn',
    '/memphis-dj-services',
    '/best-wedding-dj-memphis',
    '/memphis-wedding-dj-prices-2025',
    '/blog/memphis-wedding-dj-cost-guide-2025',
    '/blog/memphis-wedding-songs-2025',
    '/blog/memphis-wedding-success-story-sarah-michael',
    '/weddings',
    '/corporate-events',
    '/private-parties',
    '/school-dances',
    '/holiday-parties',
    '/vendors',
    '/venues',
    '/blog'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1 : 
             route === '/dj-ben-murray' ? 0.96 :
             route === '/memphis-wedding-dj' ? 0.95 : 
             route === '/wedding-dj-memphis-tn' ? 0.94 : 
             route === '/best-wedding-dj-memphis' ? 0.93 : 
             route === '/memphis-dj-services' ? 0.92 : 
             route === '/memphis-wedding-dj-prices-2025' ? 0.9 : 
             route === '/pricing' ? 0.85 : 0.8,
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
    'olive-branch',
    'southaven',
    'cordova'
  ];

  const locationPages = locations.map((location) => ({
    url: `${baseUrl}/${location}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...locationPages];
} 