import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const baseUrl = 'https://www.djdash.net';
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /signin/
Disallow: /account/
Disallow: /client/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /favicon.ico
Disallow: /*.json$

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /signin/
Disallow: /account/
Disallow: /client/
Disallow: /auth/
Disallow: /dashboard/

Sitemap: ${baseUrl}/sitemap-djdash.xml
Host: ${baseUrl}`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}

