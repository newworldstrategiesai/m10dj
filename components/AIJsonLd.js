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
        "@id": `https://www.m10djcompany.com/${loc.name.toLowerCase().replace(/\s+/g, '-')}#qa`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What DJ services does M10 DJ Company offer in ${loc.name}?`,
            "answerCount": 1,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `M10 DJ Company provides comprehensive DJ services in ${loc.name} including ${loc.eventTypes.slice(0, 3).join(', ')}. We offer professional sound systems, wireless microphones, MC services, uplighting, and music for all types of celebrations. Our experienced DJs serve ${loc.neighborhoods.join(', ')} and surrounding areas with premium entertainment packages.`,
              "author": {
                "@type": "Organization",
                "name": "M10 DJ Company"
              }
            }
          },
          {
            "@type": "Question", 
            "name": `Do you provide ceremony music and MC services in ${loc.name}?`,
            "answerCount": 1,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes! We provide full ceremony music and professional MC services throughout ${loc.name}. Our services include processional and recessional music, wireless microphone systems for vows and readings, and experienced MC services for reception introductions, toasts, and event coordination. We're familiar with venues in ${loc.neighborhoods.slice(0, 2).join(' and ')} and can adapt to any location.`,
              "author": {
                "@type": "Organization",
                "name": "M10 DJ Company"
              }
            }
          },
          {
            "@type": "Question",
            "name": `What areas of ${loc.name} do you serve?`,
            "answerCount": 1,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `We serve all areas of ${loc.name} including ${loc.neighborhoods.join(', ')}. Our service area covers zip codes ${loc.zipCodes.join(', ')} and we're experienced with venues near ${loc.landmarks.slice(0, 2).join(' and ')}. We also work with ${loc.localBusinesses.slice(0, 2).join(' and ')} and other premier locations throughout the area.`,
              "author": {
                "@type": "Organization",
                "name": "M10 DJ Company"
              }
            }
          }
        ]
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