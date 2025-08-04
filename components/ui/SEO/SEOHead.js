import Head from 'next/head';

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = '/logo-static.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noindex = false,
  nofollow = false,
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
  const fullTitle = title.includes('M10 DJ Company') ? title : `${title} | M10 DJ Company`;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : `${siteUrl}${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex" />}
      {nofollow && <meta name="robots" content="nofollow" />}
      {!noindex && !nofollow && <meta name="robots" content="index, follow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="M10 DJ Company" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:creator" content="@m10djcompany" />
      
      {/* Additional SEO */}
      <meta name="author" content="M10 DJ Company" />
      <meta name="geo.region" content="US-TN" />
      <meta name="geo.placename" content="Memphis" />
      <meta name="ICBM" content="35.1495, -90.0490" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  );
}