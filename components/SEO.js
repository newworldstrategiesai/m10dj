import Head from 'next/head';

export default function SEO({ title, description, canonical, jsonLd, keywords = [], ogImage = '/logo-static.jpg', ogType = 'website' }) {
  const fullCanonical = canonical ? `https://www.m10djcompany.com${canonical}` : 'https://www.m10djcompany.com';
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={`https://www.m10djcompany.com${ogImage}`} />
      <meta property="og:site_name" content="M10 DJ Company" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`https://www.m10djcompany.com${ogImage}`} />
      <meta name="twitter:creator" content="@m10djcompany" />
      
      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="M10 DJ Company" />
      <meta name="language" content="en-US" />
      
      {/* Local SEO tags */}
      <meta name="geo.region" content="US-TN" />
      <meta name="geo.placename" content="Memphis" />
      <meta name="ICBM" content="35.1495, -90.0490" />
      
      {/* JSON-LD structured data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
          }}
        />
      )}
    </Head>
  );
}