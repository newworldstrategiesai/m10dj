import React from 'react';

// Standardized schema components for consistent structured data across the site
export const OrganizationSchema = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://www.m10djcompany.com/#organization",
        "name": "M10 DJ Company",
        "alternateName": "M10 DJ",
        "description": "Memphis's premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations.",
        "url": "https://www.m10djcompany.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.m10djcompany.com/logo-static.jpg",
          "width": 400,
          "height": 400
        },
        "image": "https://www.m10djcompany.com/logo-static.jpg",
        "telephone": "+19014102020",
        "email": "info@m10djcompany.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Memphis",
          "addressRegion": "TN",
          "addressCountry": "US"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 35.1495,
          "longitude": -90.0490
        },
        "foundingDate": "2009",
        "founder": {
          "@type": "Person",
          "name": "Ben Murray",
          "jobTitle": "Professional DJ & Entertainment Director"
        },
        "sameAs": [
          "https://www.facebook.com/m10djcompany",
          "https://www.instagram.com/m10djcompany",
          "https://www.linkedin.com/company/m10djcompany"
        ],
        "areaServed": [
          {
            "@type": "City",
            "name": "Memphis",
            "containedInPlace": {
              "@type": "State",
              "name": "Tennessee"
            }
          },
          {
            "@type": "Place",
            "name": "East Memphis"
          },
          {
            "@type": "City",
            "name": "Germantown"
          },
          {
            "@type": "City",
            "name": "Collierville"
          },
          {
            "@type": "City",
            "name": "Cordova"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "150",
          "bestRating": "5",
          "worstRating": "5"
        },
        "priceRange": "$799-$1899"
      })
    }}
  />
);

export const WebSiteSchema = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://www.m10djcompany.com/#website",
        "name": "M10 DJ Company - Memphis Wedding & Event DJ Services",
        "description": "Memphis's premier wedding and event DJ company. Professional DJ services for weddings, corporate events, and celebrations throughout Memphis, TN.",
        "url": "https://www.m10djcompany.com",
        "publisher": {
          "@id": "https://www.m10djcompany.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.m10djcompany.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "en-US"
      })
    }}
  />
);

export const LocalBusinessSchema = ({ 
  name = "M10 DJ Company", 
  description = "Memphis's premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations.",
  serviceType = "DJ Services",
  areaServed = ["Memphis", "Germantown", "Collierville", "East Memphis"],
  priceRange = "$799-$1899"
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `https://www.m10djcompany.com/#localbusiness-${serviceType.toLowerCase().replace(/\s+/g, '-')}`,
        "name": name,
        "description": description,
        "url": "https://www.m10djcompany.com",
        "telephone": "+19014102020",
        "email": "info@m10djcompany.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Memphis",
          "addressRegion": "TN",
          "addressCountry": "US"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 35.1495,
          "longitude": -90.0490
        },
        "serviceType": serviceType,
        "areaServed": areaServed.map(area => ({
          "@type": area.includes("Memphis") ? "City" : "Place",
          "name": area,
          ...(area === "Memphis" && {
            "containedInPlace": {
              "@type": "State",
              "name": "Tennessee"
            }
          })
        })),
        "priceRange": priceRange,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "150",
          "bestRating": "5",
          "worstRating": "5"
        },
        "openingHours": [
          "Mo-Su 09:00-22:00"
        ],
        "image": "https://www.m10djcompany.com/logo-static.jpg",
        "logo": "https://www.m10djcompany.com/logo-static.jpg"
      })
    }}
  />
);

export const ServiceSchema = ({ 
  name, 
  description, 
  provider = "M10 DJ Company",
  areaServed = ["Memphis", "TN"],
  offers = []
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": name,
        "description": description,
        "provider": {
          "@type": "LocalBusiness",
          "name": provider,
          "url": "https://www.m10djcompany.com"
        },
        "areaServed": areaServed.map(area => ({
          "@type": area.length === 2 ? "State" : "City",
          "name": area
        })),
        "serviceType": "Entertainment Services",
        "category": "DJ Services",
        ...(offers.length > 0 && {
          "offers": offers.map(offer => ({
            "@type": "Offer",
            "name": offer.name,
            "description": offer.description,
            "priceRange": offer.priceRange || "$799-$1899"
          }))
        })
      })
    }}
  />
);

export const BreadcrumbSchema = ({ items }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": `https://www.m10djcompany.com${item.url}`
        }))
      })
    }}
  />
);

// Combined schema for homepage
export const HomepageSchema = () => (
  <>
    <OrganizationSchema />
    <WebSiteSchema />
    <LocalBusinessSchema 
      serviceType="Wedding & Event DJ Services"
      areaServed={["Memphis", "East Memphis", "Germantown", "Collierville", "Cordova", "Bartlett"]}
    />
    <ServiceSchema 
      name="Memphis DJ Services"
      description="Professional wedding and event DJ services throughout Memphis and surrounding areas"
      areaServed={["Memphis", "TN"]}
      offers={[
        {
          name: "Wedding DJ Services",
          description: "Complete wedding entertainment from ceremony to reception",
          priceRange: "$999-$1899"
        },
        {
          name: "Corporate Event DJ",
          description: "Professional DJ services for corporate events and parties",
          priceRange: "$799-$1499"
        },
        {
          name: "Private Party DJ",
          description: "DJ services for private celebrations and special events",
          priceRange: "$799-$1299"
        }
      ]}
    />
  </>
);