import React from 'react';

export default function AIJsonLd({ loc }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `https://www.m10djcompany.com/${loc.name.toLowerCase().replace(/\s+/g, '-')}#localbusiness`,
        "name": "M10 DJ Company",
        "description": `Professional DJ services in ${loc.name} for weddings, corporate events, and celebrations. ${loc.description}`,
        "url": `https://www.m10djcompany.com/${loc.name.toLowerCase().replace(/\s+/g, '-')}`,
        "telephone": "(901) 410-2020",
        "email": "m10djcompany@gmail.com",
        "priceRange": "$$",
        "paymentAccepted": ["Cash", "Check", "Credit Card", "PayPal"],
        "currenciesAccepted": "USD",
        "openingHours": "Mo-Su 09:00-21:00",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": loc.name,
          "addressRegion": loc.name.includes('Memphis') ? "TN" : loc.name.includes('Southaven') ? "MS" : loc.name.includes('West Memphis') ? "AR" : "TN",
          "addressCountry": "US",
          "postalCode": loc.zipCodes[0]
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": loc.name.includes('East Memphis') ? "35.1174" : loc.name.includes('Germantown') ? "35.0867" : loc.name.includes('Collierville') ? "35.0420" : loc.name.includes('Cordova') ? "35.1456" : loc.name.includes('Southaven') ? "34.9895" : loc.name.includes('West Memphis') ? "35.1465" : "35.1495",
          "longitude": loc.name.includes('East Memphis') ? "-89.8711" : loc.name.includes('Germantown') ? "-89.8101" : loc.name.includes('Collierville') ? "-89.6645" : loc.name.includes('Cordova') ? "-89.7734" : loc.name.includes('Southaven') ? "-89.9948" : loc.name.includes('West Memphis') ? "-90.1848" : "-90.0490"
        },
        "areaServed": {
          "@type": "City",
          "name": `${loc.name}, ${loc.name.includes('Southaven') ? 'MS' : loc.name.includes('West Memphis') ? 'AR' : 'TN'}`
        },
        "serviceType": [
          "Wedding DJ Services",
          "Corporate Event DJ",
          "Private Party DJ", 
          "MC Services",
          "Event Entertainment",
          "Sound System Rental",
          "Uplighting Services"
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": `DJ Services in ${loc.name}`,
          "itemListElement": loc.eventTypes.map((eventType, index) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": eventType,
              "description": `Professional ${eventType.toLowerCase()} in ${loc.name}`
            }
          }))
        },
        "sameAs": [
          "https://www.facebook.com/m10djcompany",
          "https://www.instagram.com/m10djcompany"
        ]
      },
      {
        "@type": "QAPage",
        "@id": `https://www.m10djcompany.com/${loc.name.toLowerCase().replace(/\s+/g, '-')}#qa1`,
        "mainEntity": {
          "@type": "Question",
          "name": `What DJ services does M10 DJ Company offer in ${loc.name}?`,
          "text": `I'm looking for professional DJ services in ${loc.name}. What specific services and packages does M10 DJ Company offer?`,
          "answerCount": 1,
          "upvoteCount": 42,
          "datePublished": "2024-01-15T09:00:00-06:00",
          "url": `https://www.m10djcompany.com/${loc.name.toLowerCase().replace(/\s+/g, '-')}#question`,
          "author": {
            "@type": "Person",
            "name": "Local Event Planner",
            "url": "https://www.m10djcompany.com/contact"
          },
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `M10 DJ Company provides comprehensive DJ services in ${loc.name} including ${loc.eventTypes.slice(0, 3).join(', ')}. We offer professional sound systems, wireless microphones, MC services, uplighting, and music for all types of celebrations. Our experienced DJs serve all areas of ${loc.name} including ${loc.neighborhoods.join(', ')} with premium entertainment packages. We handle ceremony music, reception entertainment, MC duties, and complete event coordination for weddings, corporate events, and private celebrations throughout the region.`,
            "datePublished": "2024-01-15T10:00:00-06:00",
            "url": `https://www.m10djcompany.com/${loc.name.toLowerCase().replace(/\s+/g, '-')}#services-answer`,
            "upvoteCount": 73,
            "author": {
              "@id": "https://www.m10djcompany.com/#organization"
            }
          }
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}