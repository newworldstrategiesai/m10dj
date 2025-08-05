import { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getURL();
  
  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/about',
    '/dj-near-me-memphis',
    '/memphis-event-dj-services',
    '/memphis-dj-pricing-guide',
    '/dj-germantown-tn',
    '/dj-collierville-tn',
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
             // Primary wedding pages
             route === '/memphis-wedding-dj' ? 0.98 : // Main wedding authority page
             route === '/wedding-dj-memphis-tn' ? 0.95 : // TN-focused page
             route === '/best-wedding-dj-memphis' ? 0.94 : // Reviews/social proof
             // Location-based pages
             route === '/dj-near-me-memphis' ? 0.97 :
             route === '/dj-germantown-tn' ? 0.92 :
             route === '/dj-collierville-tn' ? 0.92 :
             // Service pages
             route === '/memphis-dj-services' ? 0.93 :
             route === '/memphis-event-dj-services' ? 0.91 :
             // Informational pages
             route === '/memphis-dj-pricing-guide' ? 0.90 :
             route === '/memphis-wedding-dj-prices-2025' ? 0.89 :
             route === '/pricing' ? 0.88 :
             route === '/dj-ben-murray' ? 0.87 : 0.8,
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
    'olive-branch',
    'southaven',
    'cordova'
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

  return [...staticPages, ...locationPages, ...venuePages];
} 