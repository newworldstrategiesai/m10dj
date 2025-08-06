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
  areaServed = ["Memphis", "Memphis Metro Area", "Germantown", "Collierville", "Bartlett", "Cordova", "East Memphis", "Midtown Memphis", "Downtown Memphis"],
  priceRange = "$799-$1899",
  businessType = "EntertainmentBusiness",
  address = {
    streetAddress: "65 Stewart Rd",
    addressLocality: "Eads",
    addressRegion: "TN", 
    postalCode: "38028",
    addressCountry: "US"
  }
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": businessType,
        "@id": `https://www.m10djcompany.com/#localbusiness-${serviceType.toLowerCase().replace(/\s+/g, '-')}`,
        "name": name,
        "description": description,
        "url": "https://www.m10djcompany.com",
        "telephone": "+19014102020",
        "email": "info@m10djcompany.com",
        "address": {
          "@type": "PostalAddress",
          ...address
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 35.2379,
          "longitude": -89.7465
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
        "serviceArea": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates", 
            "latitude": 35.1495,
            "longitude": -90.0490,
            "name": "Memphis, TN"
          },
          "geoRadius": "30000"
        },
        "knowsAbout": [
          "Memphis Wedding DJ Services",
          "Memphis Event Entertainment", 
          "Memphis Corporate DJ",
          "Memphis Party DJ",
          "Beale Street Events",
          "Memphis Music Scene"
        ],
        "priceRange": priceRange,
        "currenciesAccepted": "USD",
        "paymentAccepted": "Cash, Credit Card, Check, Online Payment",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "150",
          "bestRating": "5",
          "worstRating": "1"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday", 
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "09:00",
            "closes": "22:00"
          }
        ],
        "image": [
          "https://www.m10djcompany.com/logo-static.jpg"
        ],
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.m10djcompany.com/logo-static.jpg",
          "width": 400,
          "height": 400
        }
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

// Review Schema Component
export const ReviewSchema = ({ reviews = [] }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(reviews.map(review => ({
        "@context": "https://schema.org",
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": review.author
        },
        "datePublished": review.datePublished,
        "reviewBody": review.reviewBody,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": "5",
          "worstRating": "1"
        },
        "itemReviewed": {
          "@type": "LocalBusiness",
          "name": "M10 DJ Company",
          "url": "https://www.m10djcompany.com"
        }
      })))
    }}
  />
);

// BreadcrumbList Schema Component
export const BreadcrumbListSchema = ({ breadcrumbs = [] }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.url
        }))
      })
    }}
  />
);

// Person Schema Component for DJ Bio
export const PersonSchema = ({ 
  name = "Ben Murray",
  jobTitle = "Professional DJ & Entertainment Director",
  description = "Memphis DJ with 15+ years of experience and 500+ successful weddings and events",
  url = "https://www.m10djcompany.com/dj-ben-murray",
  image = "https://www.m10djcompany.com/logo-static.jpg"
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": name,
        "jobTitle": jobTitle,
        "description": description,
        "url": url,
        "image": image,
        "worksFor": {
          "@type": "Organization",
          "name": "M10 DJ Company",
          "url": "https://www.m10djcompany.com"
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Memphis",
          "addressRegion": "TN",
          "addressCountry": "US"
        },
        "knowsAbout": [
          "Wedding DJ Services",
          "Event Entertainment",
          "Music Curation",
          "MC Services",
          "Wedding Planning"
        ]
      })
    }}
  />
);

// Enhanced Organization Schema with more details
export const EnhancedOrganizationSchema = () => (
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
          "streetAddress": "65 Stewart Rd",
          "addressLocality": "Eads",
          "addressRegion": "TN",
          "postalCode": "38028",
          "addressCountry": "US"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 35.2379,
          "longitude": -89.7465
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
            "@type": "Place",
            "name": "Germantown"
          },
          {
            "@type": "Place",
            "name": "Collierville"
          }
        ],
        "serviceType": ["Wedding DJ Services", "Event Entertainment", "Corporate DJ", "MC Services"],
        "priceRange": "$799-$1899"
      })
    }}
  />
);

// Article Schema Component for Blog Posts
export const ArticleSchema = ({ 
  headline,
  description,
  author = "M10 DJ Company",
  datePublished,
  dateModified,
  url,
  image,
  category = "Wedding & DJ Tips"
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": headline,
        "description": description,
        "author": {
          "@type": "Organization",
          "name": author
        },
        "publisher": {
          "@type": "Organization",
          "name": "M10 DJ Company",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.m10djcompany.com/logo-static.jpg"
          }
        },
        "datePublished": datePublished,
        "dateModified": dateModified,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        },
        "image": {
          "@type": "ImageObject",
          "url": image || "https://www.m10djcompany.com/logo-static.jpg",
          "width": 1200,
          "height": 630
        },
        "articleSection": category,
        "about": {
          "@type": "Thing",
          "name": "Memphis Wedding DJ Services"
        },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".article-summary", ".key-points"]
        }
      })
    }}
  />
);

// Multi-Service Business Schema with Departments (Google recommended structure)
export const MultiServiceBusinessSchema = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "EntertainmentBusiness",
        "@id": "https://www.m10djcompany.com/#entertainmentbusiness",
        "name": "M10 DJ Company - Memphis Wedding & Event DJ",
        "description": "Memphis's premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations. Serving Memphis, Germantown, Collierville, and all Mid-South locations with professional DJ and entertainment services.",
        "url": "https://www.m10djcompany.com",
        "telephone": "+19014102020",
        "email": "info@m10djcompany.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "65 Stewart Rd",
          "addressLocality": "Eads",
          "addressRegion": "TN",
          "postalCode": "38028",
          "addressCountry": "US"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 35.2379,
          "longitude": -89.7465
        },
        "priceRange": "$799-$1899",
        "currenciesAccepted": "USD",
        "paymentAccepted": "Cash, Credit Card, Check, Online Payment",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "150",
          "bestRating": "5",
          "worstRating": "1"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "09:00",
            "closes": "22:00"
          }
        ],
        "image": [
          "https://www.m10djcompany.com/logo-static.jpg"
        ],
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.m10djcompany.com/logo-static.jpg",
          "width": 400,
          "height": 400
        },
        "department": [
          {
            "@type": "EntertainmentBusiness",
            "name": "M10 DJ Company Memphis Wedding Services",
            "description": "Premier Memphis wedding DJ and entertainment services - serving Memphis, Germantown, Collierville, and all Mid-South locations",
            "url": "https://www.m10djcompany.com/weddings",
            "telephone": "+19014102020",
            "priceRange": "$999-$1899",
            "servesCuisine": "Wedding Entertainment",
            "areaServed": ["Memphis", "Memphis Metro Area", "Germantown", "Collierville"]
          },
          {
            "@type": "EntertainmentBusiness", 
            "name": "M10 DJ Company Memphis Corporate Events",
            "description": "Professional Memphis corporate DJ services for downtown events, conferences, and business celebrations at FedExForum, Memphis Cook Convention Center, and premier venues",
            "url": "https://www.m10djcompany.com/corporate-events",
            "telephone": "+19014102020",
            "priceRange": "$799-$1499",
            "servesCuisine": "Corporate Entertainment",
            "areaServed": ["Memphis", "Downtown Memphis", "Memphis Metro Area"]
          },
          {
            "@type": "EntertainmentBusiness",
            "name": "M10 DJ Company Memphis Private Parties",
            "description": "Memphis DJ services for private celebrations, birthdays, anniversaries and special events throughout Memphis and surrounding areas",
            "url": "https://www.m10djcompany.com/private-parties",
            "telephone": "+19014102020",
            "priceRange": "$799-$1299",
            "servesCuisine": "Private Event Entertainment",
            "areaServed": ["Memphis", "Memphis Metro Area", "East Memphis", "Midtown Memphis"]
          }
        ]
      })
    }}
  />
);

// QA Schema Component (Google-compliant alternative to FAQPage)
export const QAPageSchema = ({ questions = [] }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "QAPage",
        "mainEntity": questions.map(qa => ({
          "@type": "Question",
          "name": qa.question,
          "answerCount": 1,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": qa.answer,
            "author": {
              "@type": "Organization",
              "name": "M10 DJ Company"
            }
          }
        }))
      })
    }}
  />
);

// HowTo Schema Component for Process-Based Content
export const HowToSchema = ({ 
  name,
  description,
  steps = []
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": name,
        "description": description,
        "step": steps.map((step, index) => ({
          "@type": "HowToStep",
          "position": index + 1,
          "name": step.name,
          "text": step.description
        }))
      })
    }}
  />
);

// Combined schema for homepage
export const HomepageSchema = () => (
  <>
    <EnhancedOrganizationSchema />
    <WebSiteSchema />
    <MultiServiceBusinessSchema />
  </>
);