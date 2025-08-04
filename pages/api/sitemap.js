// Dynamic sitemap generation for M10 DJ Company
export default function handler(req, res) {
  // Location data keys - these match the locationData in pages/[location].js
  const locations = [
    'memphis',
    'midtown-memphis', 
    'east-memphis',
    'downtown-memphis',
    'germantown',
    'collierville',
    'bartlett',
    'arlington',
    'millington',
    'cordova',
    'lakeland',
    'southaven',
    'west-memphis'
  ];

  // Static pages
  const staticPages = [
    '',  // home page
    'services',
    'pricing',
    'about',
    'contact',
    'blog',
    'weddings',
    'corporate-events',
    'private-parties',
    'holiday-parties',
    'school-dances',
    'venues',
    'vendors',
    'dj-ben-murray',
    'memphis-wedding-dj',
    'wedding-dj-memphis-tn',
    'memphis-dj-services',
    'memphis-event-dj-services',
    'memphis-dj-pricing-guide',
    'memphis-wedding-dj-prices-2025',
    'best-wedding-dj-memphis',
    'dj-near-me-memphis',
    'dj-germantown-tn',
    'dj-collierville-tn',
    'dj-east-memphis-tn'
  ];

  const baseUrl = 'https://www.m10djcompany.com';
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page ? '/' + page : ''}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('')}
  ${locations.map(location => `
  <url>
    <loc>${baseUrl}/${location}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('')}
</urlset>`.trim();

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.status(200).send(sitemap);
}