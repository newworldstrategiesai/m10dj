import { NextRequest, NextResponse } from 'next/server';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const baseUrl = 'https://www.djdash.net';
  
  // DJ Dash marketing pages
  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/how-it-works',
    '/use-cases',
    '/signup',
    '/dj-gigs-memphis-tn',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: route === '' ? 1.0 : route === '/dj-gigs-memphis-tn' ? 0.9 : 0.8,
  }));

  // Major US cities for directory pages (Find DJs)
  const directoryCities = [
    'memphis-tn',
    'nashville-tn',
    'atlanta-ga',
    'los-angeles-ca',
    'new-york-ny',
    'chicago-il',
    'houston-tx',
    'phoenix-az',
    'philadelphia-pa',
    'san-antonio-tx',
    'san-diego-ca',
    'dallas-tx',
    'austin-tx',
    'jacksonville-fl',
    'charlotte-nc',
    'san-francisco-ca',
    'seattle-wa',
    'denver-co',
    'washington-dc',
    'boston-ma',
    'detroit-mi',
    'portland-or',
    'oklahoma-city-ok',
    'las-vegas-nv',
    'miami-fl',
    'minneapolis-mn',
    'tucson-az',
    'sacramento-ca',
    'kansas-city-mo',
    'raleigh-nc',
    'virginia-beach-va',
    'oakland-ca',
    'tulsa-ok',
    'cleveland-oh',
    'wichita-ks',
    'arlington-tx',
  ];

  // Directory pages (Find DJs in [city])
  const directoryPages = directoryCities.map((city) => ({
    url: `${baseUrl}/find-dj/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as 'weekly',
    priority: 0.9, // High priority for directory pages
  }));

  // Wedding DJs pages (Wedding DJs in [city])
  const weddingDJPages = directoryCities.map((city) => ({
    url: `${baseUrl}/find-dj/${city}/wedding-djs`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as 'weekly',
    priority: 0.85, // High priority for event-specific pages
  }));

  // DJ gigs pages (for DJs managing gigs)
  const djGigsCities = [
    'nashville-tn',
    'atlanta-ga',
    'los-angeles-ca',
    'new-york-ny',
    'chicago-il',
    'houston-tx',
    'phoenix-az',
    'philadelphia-pa',
    'san-antonio-tx',
    'san-diego-ca',
    'dallas-tx',
    'austin-tx',
    'jacksonville-fl',
    'charlotte-nc',
    'san-francisco-ca',
    'seattle-wa',
    'denver-co',
    'washington-dc',
    'boston-ma',
    'detroit-mi',
    'portland-or',
    'oklahoma-city-ok',
    'las-vegas-nv',
    'miami-fl',
    'minneapolis-mn',
    'tucson-az',
    'sacramento-ca',
    'kansas-city-mo',
    'raleigh-nc',
    'virginia-beach-va',
    'oakland-ca',
    'tulsa-ok',
    'cleveland-oh',
    'wichita-ks',
    'arlington-tx',
  ];

  const djGigsPages = djGigsCities.map((city) => ({
    url: `${baseUrl}/dj-gigs/${city}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as 'monthly',
    priority: 0.7,
  }));

  const sitemap: MetadataRoute.Sitemap = [
    ...staticPages,
    ...directoryPages,
    ...weddingDJPages,
    ...djGigsPages,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((page) => {
    const lastMod = page.lastModified 
      ? (typeof page.lastModified === 'string' ? new Date(page.lastModified) : page.lastModified)
      : new Date();
    return `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastMod.toISOString()}</lastmod>
    <changefreq>${page.changeFrequency || 'monthly'}</changefreq>
    <priority>${page.priority || 0.8}</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}

