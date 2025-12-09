import { NextRequest, NextResponse } from 'next/server';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const baseUrl = 'https://www.tipjar.live';
  
  // TipJar marketing pages
  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/how-it-works',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  const sitemap: MetadataRoute.Sitemap = staticPages;

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

