import { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getURL();
  
  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/about',
    '/services',
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
    priority: route === '' ? 1 : route === '/pricing' ? 0.9 : 0.8,
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