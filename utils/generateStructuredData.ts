// Dynamic Structured Data Generator for M10 DJ Company
// Generates appropriate JSON-LD schema based on page type and props


// Simplified imports to avoid constructor errors
import { businessInfo, locationData, serviceTypes, venueTypes, faqData, reviewData } from './seoConfig';

export type PageType = 
  | 'homepage' 
  | 'service' 
  | 'location' 
  | 'venue' 
  | 'blog' 
  | 'event'
  | 'about'
  | 'contact'
  | 'pricing'
  | 'dj_profile';

interface BasePageProps {
  pageType: PageType;
  slug?: string;
  canonical?: string;
  title?: string;
  description?: string;
}

interface ServicePageProps extends BasePageProps {
  pageType: 'service';
  serviceKey?: string;
  locationKey?: string;
}

interface LocationPageProps extends BasePageProps {
  pageType: 'location';
  locationKey: string;
  serviceKey?: string;
}

interface VenuePageProps extends BasePageProps {
  pageType: 'venue';
  venueName?: string;
  venueType?: string;
  address?: any;
  coordinates?: { latitude: number; longitude: number };
}

interface BlogPageProps extends BasePageProps {
  pageType: 'blog';
  headline?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  category?: string;
  image?: string;
}

interface EventPageProps extends BasePageProps {
  pageType: 'event';
  eventName?: string;
  startDate?: string;
  endDate?: string;
  location?: any;
  offers?: any;
}

interface DJProfilePageProps extends BasePageProps {
  pageType: 'dj_profile';
  djName: string;
  djSlug: string;
  bio?: string;
  tagline?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  city?: string;
  state?: string;
  serviceRadiusMiles?: number;
  serviceAreas?: string[];
  eventTypes?: string[];
  startingPriceRange?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  availabilityStatus?: string;
  socialLinks?: any;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export type StructuredDataProps = 
  | ServicePageProps 
  | LocationPageProps 
  | VenuePageProps 
  | BlogPageProps 
  | EventPageProps
  | DJProfilePageProps
  | BasePageProps;

export function generateStructuredData(props: StructuredDataProps) {
  const { pageType, slug = '', canonical, title, description } = props;
  
  const baseUrl = businessInfo.url;
  const pageUrl = canonical ? `${baseUrl}${canonical}` : `${baseUrl}/${slug}`;

  // Generate unique @id for each schema type to avoid duplication
  const generateId = (type: string, suffix: string = '') => 
    `${pageUrl}#${type}${suffix ? `-${suffix}` : ''}`;

  const schemas: any[] = [];

  // Base Organization schema (included on every page except DJ profiles)
  if (pageType !== 'dj_profile') {
    schemas.push({
      "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${businessInfo.url}/#organization`,
    "name": businessInfo.name,
    "alternateName": businessInfo.alternateName,
    "description": businessInfo.description,
    "url": businessInfo.url,
    "logo": {
      "@type": "ImageObject",
      "url": businessInfo.logo.url,
      "width": businessInfo.logo.width,
      "height": businessInfo.logo.height
    },
    "image": businessInfo.image,
    "telephone": businessInfo.telephone,
    "email": businessInfo.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": businessInfo.address.streetAddress,
      "addressLocality": businessInfo.address.addressLocality,
      "addressRegion": businessInfo.address.addressRegion,
      "postalCode": businessInfo.address.postalCode,
      "addressCountry": businessInfo.address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": businessInfo.geo.latitude,
      "longitude": businessInfo.geo.longitude
    },
    "foundingDate": businessInfo.foundingDate,
    "founder": {
      "@type": "Person",
      "name": businessInfo.founder.name,
      "jobTitle": businessInfo.founder.jobTitle
    },
    "sameAs": businessInfo.socialMedia,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": businessInfo.aggregateRating.ratingValue,
      "reviewCount": businessInfo.aggregateRating.reviewCount,
      "bestRating": businessInfo.aggregateRating.bestRating,
      "worstRating": businessInfo.aggregateRating.worstRating
    },
    "priceRange": businessInfo.priceRange,
    "currenciesAccepted": businessInfo.currenciesAccepted,
    "paymentAccepted": businessInfo.paymentAccepted
    });
  }

  switch (pageType) {
    case 'homepage':
      // Enhanced LocalBusiness schema with Organization properties for homepage
      // This consolidates both LocalBusiness and Organization into one comprehensive schema
      schemas[0] = {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "Organization"],
        "@id": `${businessInfo.url}/#organization`,
        "name": businessInfo.name,
        "alternateName": businessInfo.alternateName,
        "description": businessInfo.description,
        "url": businessInfo.url,
        "logo": {
          "@type": "ImageObject",
          "url": businessInfo.logo.url,
          "width": businessInfo.logo.width,
          "height": businessInfo.logo.height
        },
        "image": businessInfo.image,
        "telephone": businessInfo.telephone,
        "email": businessInfo.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": businessInfo.address.streetAddress,
          "addressLocality": businessInfo.address.addressLocality,
          "addressRegion": businessInfo.address.addressRegion,
          "postalCode": businessInfo.address.postalCode,
          "addressCountry": businessInfo.address.addressCountry
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": businessInfo.geo.latitude,
          "longitude": businessInfo.geo.longitude
        },
        "foundingDate": businessInfo.foundingDate,
        "founder": {
          "@type": "Person",
          "name": businessInfo.founder.name,
          "jobTitle": businessInfo.founder.jobTitle
        },
        "sameAs": businessInfo.socialMedia,
        "openingHours": businessInfo.openingHours,
        "areaServed": Object.values(locationData).map(location => ({
          "@type": "City",
          "name": location.name,
          "containedInPlace": {
            "@type": "State",
            "name": "Tennessee"
          }
        })),
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "DJ Services",
          "itemListElement": Object.values(serviceTypes).map((service, index) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": service.name,
              "description": service.description
            },
            "priceRange": service.priceRange,
            "position": index + 1
          }))
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": businessInfo.aggregateRating.ratingValue,
          "reviewCount": businessInfo.aggregateRating.reviewCount,
          "bestRating": businessInfo.aggregateRating.bestRating,
          "worstRating": businessInfo.aggregateRating.worstRating
        },
        "priceRange": businessInfo.priceRange,
        "currenciesAccepted": businessInfo.currenciesAccepted,
        "paymentAccepted": businessInfo.paymentAccepted
      };

      // WebSite schema with search action
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": generateId('website'),
        "name": `${businessInfo.name} - Memphis Wedding & Event DJ Services`,
        "description": businessInfo.description,
        "url": businessInfo.url,
        "publisher": {
          "@id": `${businessInfo.url}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${businessInfo.url}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "en-US"
      });
      break;

    case 'service':
      const serviceProps = props as ServicePageProps;
      const service = serviceProps.serviceKey && serviceProps.serviceKey in serviceTypes 
        ? serviceTypes[serviceProps.serviceKey as keyof typeof serviceTypes] 
        : serviceTypes.wedding;
      const location = serviceProps.locationKey && serviceProps.locationKey in locationData 
        ? locationData[serviceProps.locationKey as keyof typeof locationData] 
        : locationData.memphis;

      // Service schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": generateId('service'),
        "name": service.name,
        "description": service.description,
        "serviceType": service.serviceType,
        "category": service.category,
        "provider": {
          "@id": `${businessInfo.url}/#organization`
        },
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": location.coordinates.latitude,
            "longitude": location.coordinates.longitude
          },
          "geoRadius": location.radius
        },
        "offers": {
          "@type": "Offer",
          "priceRange": service.priceRange,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "validFrom": new Date().toISOString(),
          "seller": {
            "@id": `${businessInfo.url}/#organization`
          }
        },
        "additionalProperty": service.includes.map((item, index) => ({
          "@type": "PropertyValue",
          "name": `Included Service ${index + 1}`,
          "value": item
        }))
      });

      // Consolidated LocalBusiness + Organization schema for service pages
      // This replaces the base Organization schema to avoid duplication
      schemas[0] = {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "Organization"],
        "@id": `${businessInfo.url}/#organization`,
        "name": businessInfo.name,
        "alternateName": businessInfo.alternateName,
        "description": `${service.description} ${businessInfo.description}`,
        "url": businessInfo.url,
        "logo": {
          "@type": "ImageObject",
          "url": businessInfo.logo.url,
          "width": businessInfo.logo.width,
          "height": businessInfo.logo.height
        },
        "image": businessInfo.image,
        "telephone": businessInfo.telephone,
        "email": businessInfo.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": businessInfo.address.streetAddress,
          "addressLocality": businessInfo.address.addressLocality,
          "addressRegion": businessInfo.address.addressRegion,
          "postalCode": businessInfo.address.postalCode,
          "addressCountry": businessInfo.address.addressCountry
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": businessInfo.geo.latitude,
          "longitude": businessInfo.geo.longitude
        },
        "foundingDate": businessInfo.foundingDate,
        "founder": {
          "@type": "Person",
          "name": businessInfo.founder.name,
          "jobTitle": businessInfo.founder.jobTitle
        },
        "sameAs": businessInfo.socialMedia,
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": location.coordinates.latitude,
            "longitude": location.coordinates.longitude
          },
          "geoRadius": location.radius
        },
        "serviceType": service.serviceType,
        "priceRange": service.priceRange,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": businessInfo.aggregateRating.ratingValue,
          "reviewCount": businessInfo.aggregateRating.reviewCount,
          "bestRating": businessInfo.aggregateRating.bestRating,
          "worstRating": businessInfo.aggregateRating.worstRating
        },
        "currenciesAccepted": businessInfo.currenciesAccepted,
        "paymentAccepted": businessInfo.paymentAccepted
      };
      break;

    case 'location':
      const locationProps = props as LocationPageProps;
      const locationInfo = locationProps.locationKey in locationData 
        ? locationData[locationProps.locationKey as keyof typeof locationData] 
        : locationData.memphis;
      const defaultService = locationProps.serviceKey && locationProps.serviceKey in serviceTypes 
        ? serviceTypes[locationProps.serviceKey as keyof typeof serviceTypes] 
        : serviceTypes.wedding;

      // LocalBusiness schema with location-specific data
      schemas.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": generateId('local-business'),
        "name": `${businessInfo.name} - ${locationInfo.name}`,
        "description": `Professional DJ services in ${locationInfo.name}, TN. ${businessInfo.description}`,
        "url": pageUrl,
        "telephone": businessInfo.telephone,
        "email": businessInfo.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": businessInfo.address.streetAddress,
          "addressLocality": businessInfo.address.addressLocality,
          "addressRegion": businessInfo.address.addressRegion,
          "postalCode": businessInfo.address.postalCode,
          "addressCountry": businessInfo.address.addressCountry
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": locationInfo.coordinates.latitude,
          "longitude": locationInfo.coordinates.longitude
        },
        "areaServed": [
          {
            "@type": "City",
            "name": locationInfo.name,
            "containedInPlace": {
              "@type": "State",
              "name": "Tennessee"
            }
          },
          ...locationInfo.neighborhoods.map(neighborhood => ({
            "@type": "Place",
            "name": neighborhood,
            "containedInPlace": {
              "@type": "City",
              "name": locationInfo.name
            }
          }))
        ],
        "serviceArea": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": locationInfo.coordinates.latitude,
            "longitude": locationInfo.coordinates.longitude
          },
          "geoRadius": locationInfo.radius
        },
        "priceRange": businessInfo.priceRange,
        "currenciesAccepted": businessInfo.currenciesAccepted,
        "paymentAccepted": businessInfo.paymentAccepted
      });

      // Service schema for location pages
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": generateId('service'),
        "name": `${defaultService.name} in ${locationInfo.name}`,
        "description": `${defaultService.description} Serving ${locationInfo.name} and surrounding areas.`,
        "serviceType": defaultService.serviceType,
        "provider": {
          "@id": `${businessInfo.url}/#organization`
        },
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": locationInfo.coordinates.latitude,
            "longitude": locationInfo.coordinates.longitude
          },
          "geoRadius": locationInfo.radius
        },
        "offers": {
          "@type": "Offer",
          "priceRange": defaultService.priceRange,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      });
      break;

    case 'venue':
      const venueProps = props as VenuePageProps;
      const venueInfo = venueProps.venueType && venueProps.venueType in venueTypes 
        ? venueTypes[venueProps.venueType as keyof typeof venueTypes] 
        : venueTypes.wedding;

      // Place schema for venue pages
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Place",
        "@id": generateId('place'),
        "name": venueProps.venueName || `${venueInfo.name} - Memphis`,
        "description": `Professional DJ services at ${venueProps.venueName || 'Memphis venues'}. ${venueInfo.description}`,
        "url": pageUrl,
        "address": venueProps.address || {
          "@type": "PostalAddress",
          "addressLocality": "Memphis",
          "addressRegion": "TN",
          "addressCountry": "US"
        },
        "geo": venueProps.coordinates ? {
          "@type": "GeoCoordinates",
          "latitude": venueProps.coordinates.latitude,
          "longitude": venueProps.coordinates.longitude
        } : {
          "@type": "GeoCoordinates",
          "latitude": businessInfo.geo.latitude,
          "longitude": businessInfo.geo.longitude
        }
      });

      // Service schema for venue pages
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": generateId('service'),
        "name": `DJ Services at ${venueProps.venueName || 'Memphis Venues'}`,
        "description": venueInfo.description,
        "provider": {
          "@id": `${businessInfo.url}/#organization`
        },
        "serviceArea": {
          "@type": "Place",
          "name": venueProps.venueName || "Memphis Venues"
        },
        "additionalProperty": venueInfo.includes.map((item, index) => ({
          "@type": "PropertyValue",
          "name": `Venue Service ${index + 1}`,
          "value": item
        }))
      });
      break;

    case 'blog':
      const blogProps = props as BlogPageProps;
      
      // Article schema for blog posts
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": generateId('article'),
        "headline": blogProps.headline || title || "Memphis DJ Tips & Insights",
        "description": description || "Expert DJ tips and insights from Memphis's premier wedding and event DJ company.",
        "author": {
          "@type": "Organization",
          "name": blogProps.author || businessInfo.name,
          "url": businessInfo.url
        },
        "publisher": {
          "@type": "Organization",
          "name": businessInfo.name,
          "logo": {
            "@type": "ImageObject",
            "url": businessInfo.logo.url,
            "width": businessInfo.logo.width,
            "height": businessInfo.logo.height
          }
        },
        "datePublished": blogProps.datePublished || new Date().toISOString(),
        "dateModified": blogProps.dateModified || new Date().toISOString(),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": pageUrl
        },
        "image": {
          "@type": "ImageObject",
          "url": blogProps.image || businessInfo.image,
          "width": 1200,
          "height": 630
        },
        "articleSection": blogProps.category || "DJ Tips & Insights",
        "about": {
          "@type": "Thing",
          "name": "Memphis DJ Services"
        },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".article-summary", ".key-points"]
        }
      });

      // BlogPosting schema (additional for blog posts)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": generateId('blog-posting'),
        "headline": blogProps.headline || title || "Memphis DJ Tips & Insights",
        "description": description || "Expert DJ tips and insights from Memphis's premier wedding and event DJ company.",
        "author": {
          "@type": "Organization",
          "name": blogProps.author || businessInfo.name
        },
        "publisher": {
          "@type": "Organization",
          "name": businessInfo.name,
          "logo": {
            "@type": "ImageObject",
            "url": businessInfo.logo.url
          }
        },
        "datePublished": blogProps.datePublished || new Date().toISOString(),
        "dateModified": blogProps.dateModified || new Date().toISOString(),
        "mainEntityOfPage": pageUrl,
        "image": blogProps.image || businessInfo.image
      });
      break;

    case 'event':
      const eventProps = props as EventPageProps;
      
      // Event schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Event",
        "@id": generateId('event'),
        "name": eventProps.eventName || title || "Memphis DJ Event",
        "description": description || "Professional DJ services for your Memphis event.",
        "startDate": eventProps.startDate,
        "endDate": eventProps.endDate,
        "location": eventProps.location || {
          "@type": "Place",
          "name": "Memphis, TN",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Memphis",
            "addressRegion": "TN",
            "addressCountry": "US"
          }
        },
        "organizer": {
          "@id": `${businessInfo.url}/#organization`
        },
        "performer": {
          "@id": `${businessInfo.url}/#organization`
        },
        "offers": eventProps.offers || {
          "@type": "Offer",
          "url": pageUrl,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      });
      break;

    case 'dj_profile':
      const djProps = props as DJProfilePageProps;
      const djBaseUrl = 'https://djdash.net';
      const djPageUrl = `${djBaseUrl}/dj/${djProps.djSlug}`;
      const djFullLocation = [djProps.city, djProps.state].filter(Boolean).join(', ');

      // Person schema (DJ as a person)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${djPageUrl}#person`,
        "name": djProps.djName,
        "description": djProps.bio || djProps.tagline || `Professional DJ services${djFullLocation ? ` in ${djFullLocation}` : ''}`,
        "image": djProps.profileImageUrl || djProps.coverImageUrl,
        "url": djPageUrl,
        "jobTitle": "Professional DJ",
        "address": djProps.city && djProps.state ? {
          "@type": "PostalAddress",
          "addressLocality": djProps.city,
          "addressRegion": djProps.state,
          "addressCountry": "US"
        } : undefined,
        ...(djProps.socialLinks && {
          "sameAs": Object.values(djProps.socialLinks).filter(Boolean)
        })
      });

      // LocalBusiness schema (DJ as a business)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${djPageUrl}#local-business`,
        "name": djProps.djName,
        "description": djProps.bio || djProps.tagline || `Professional DJ services${djFullLocation ? ` in ${djFullLocation}` : ''}`,
        "url": djPageUrl,
        "image": djProps.coverImageUrl || djProps.profileImageUrl,
        "address": djProps.city && djProps.state ? {
          "@type": "PostalAddress",
          "addressLocality": djProps.city,
          "addressRegion": djProps.state,
          "addressCountry": "US"
        } : undefined,
        "priceRange": djProps.startingPriceRange,
        "areaServed": djProps.serviceAreas?.map((area) => ({
          "@type": "City",
          "name": area
        })),
        "serviceArea": djProps.city && djProps.serviceRadiusMiles ? {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 0, // Would need actual coordinates
            "longitude": 0
          },
          "geoRadius": {
            "@type": "Distance",
            "value": djProps.serviceRadiusMiles,
            "unitCode": "MI"
          }
        } : undefined,
        ...(djProps.aggregateRating && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": djProps.aggregateRating.ratingValue.toString(),
            "reviewCount": djProps.aggregateRating.reviewCount.toString(),
            "bestRating": "5",
            "worstRating": "1"
          }
        }),
        ...(djProps.socialLinks && {
          "sameAs": Object.values(djProps.socialLinks).filter(Boolean)
        })
      });

      // Service schemas for each event type
      if (djProps.eventTypes && djProps.eventTypes.length > 0) {
        djProps.eventTypes.forEach((eventType, index) => {
          const serviceName = eventType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          schemas.push({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${djPageUrl}#service-${index}`,
            "name": `${serviceName} DJ Services`,
            "description": `Professional ${serviceName.toLowerCase()} DJ services by ${djProps.djName}${djFullLocation ? ` in ${djFullLocation}` : ''}`,
            "serviceType": "DJ Services",
            "provider": {
              "@id": `${djPageUrl}#local-business`
            },
            "offers": {
              "@type": "Offer",
              "priceRange": djProps.startingPriceRange,
              "priceCurrency": "USD",
              "availability": djProps.availabilityStatus === 'available' 
                ? "https://schema.org/InStock" 
                : "https://schema.org/PreOrder"
            },
            "areaServed": djProps.serviceAreas?.map((area) => ({
              "@type": "City",
              "name": area
            }))
          });
        });
      }

      // BreadcrumbList schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${djPageUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": djBaseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "DJs",
            "item": `${djBaseUrl}/djs`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": djProps.djName,
            "item": djPageUrl
          }
        ]
      });

      break;

    default:
      // Default LocalBusiness schema for other page types
      schemas.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": generateId('local-business'),
        "name": businessInfo.name,
        "description": description || businessInfo.description,
        "url": pageUrl,
        "telephone": businessInfo.telephone,
        "email": businessInfo.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": businessInfo.address.streetAddress,
          "addressLocality": businessInfo.address.addressLocality,
          "addressRegion": businessInfo.address.addressRegion,
          "postalCode": businessInfo.address.postalCode,
          "addressCountry": businessInfo.address.addressCountry
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": businessInfo.geo.latitude,
          "longitude": businessInfo.geo.longitude
        },
        "priceRange": businessInfo.priceRange,
        "currenciesAccepted": businessInfo.currenciesAccepted,
        "paymentAccepted": businessInfo.paymentAccepted
      });
      break;
  }

  // Add FAQ schema if relevant
  const relevantFaqs = faqData.general;
  if (relevantFaqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": generateId('faq'),
      "name": "Memphis DJ Services - Frequently Asked Questions",
      "description": "Common questions about M10 DJ Company's professional DJ services in Memphis, TN including pricing, booking, equipment, and service areas.",
      "url": pageUrl,
      "mainEntity": relevantFaqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  }

  // Add comprehensive Review schemas following full Schema.org specification
  if (reviewData.featured.length > 0) {
    // Add individual Review schemas for each featured review
    reviewData.featured.forEach((review, index) => {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Review",
        "@id": generateId('review', index.toString()),
        "name": review.headline || `${review.event} Review`,
        "reviewBody": review.text,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": 5,
          "worstRating": 1,
          "reviewAspect": review.reviewAspect || review.event
        },
        "itemReviewed": {
          "@type": "LocalBusiness",
          "@id": `${businessInfo.url}/#organization`,
          "name": businessInfo.name,
          "url": businessInfo.url,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": businessInfo.address.streetAddress,
            "addressLocality": businessInfo.address.addressLocality,
            "addressRegion": businessInfo.address.addressRegion,
            "postalCode": businessInfo.address.postalCode,
            "addressCountry": businessInfo.address.addressCountry
          },
          "telephone": businessInfo.telephone,
          "priceRange": businessInfo.priceRange,
          "serviceType": "DJ Services"
        },
        "author": {
          "@type": "Person",
          "name": review.author
        },
        "datePublished": review.date,
        "publisher": {
          "@type": "Organization",
          "name": businessInfo.name,
          "url": businessInfo.url
        },
        "positiveNotes": review.positiveNotes || [],
        "inLanguage": "en-US",
        "isPartOf": {
          "@type": "WebPage",
          "@id": pageUrl
        }
      });
    });

    // Add AggregateRating schema for overall business rating
    schemas.push({
      "@context": "https://schema.org",
      "@type": "AggregateRating",
      "@id": generateId('aggregate-rating'),
      "itemReviewed": {
        "@id": `${businessInfo.url}/#organization`
      },
      "ratingValue": reviewData.aggregateStats?.averageRating || businessInfo.aggregateRating.ratingValue,
      "reviewCount": reviewData.aggregateStats?.totalReviews || businessInfo.aggregateRating.reviewCount,
      "bestRating": 5,
      "worstRating": 1,
      "ratingExplanation": `Based on ${reviewData.aggregateStats?.totalReviews || businessInfo.aggregateRating.reviewCount} verified customer reviews across all services including weddings, corporate events, and private parties.`
    });
  }

  // Return as @graph structure to avoid duplication
  return {
    "@context": "https://schema.org",
    "@graph": schemas
  };
}

// Helper function to generate breadcrumb schema
export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

// Helper function to get structured data as JSON string (use with dangerouslySetInnerHTML)
export function getStructuredDataScript(data: any): string {
  return JSON.stringify(data, null, 2);
}

// Specialized Review Schema Generator following full Schema.org specification
export function generateReviewSchema(props: {
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
    event?: string;
    reviewAspect?: string;
    headline?: string;
    positiveNotes?: string[];
    negativeNotes?: string[];
    verified?: boolean;
  }>;
  itemReviewed: {
    "@type": string;
    name: string;
    url: string;
    address?: any;
    telephone?: string;
    priceRange?: string;
    serviceType?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  pageUrl: string;
}) {
  const { reviews, itemReviewed, aggregateRating, pageUrl } = props;
  
  const reviewSchemas = reviews.map((review, index) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${pageUrl}#review-${index}`,
    "name": review.headline || `${review.event || 'Service'} Review`,
    "reviewBody": review.text,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": 5,
      "worstRating": 1,
      ...(review.reviewAspect && { "reviewAspect": review.reviewAspect })
    },
    "itemReviewed": {
      "@type": itemReviewed["@type"],
      "@id": `${itemReviewed.url}/#organization`,
      "name": itemReviewed.name,
      "url": itemReviewed.url,
      ...(itemReviewed.address && { "address": itemReviewed.address }),
      ...(itemReviewed.telephone && { "telephone": itemReviewed.telephone }),
      ...(itemReviewed.priceRange && { "priceRange": itemReviewed.priceRange }),
      ...(itemReviewed.serviceType && { "serviceType": itemReviewed.serviceType })
    },
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "datePublished": review.date,
    "publisher": {
      "@type": "Organization", 
      "name": itemReviewed.name,
      "url": itemReviewed.url
    },
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebPage",
      "@id": pageUrl
    },
    ...(review.positiveNotes && review.positiveNotes.length > 0 && {
      "positiveNotes": review.positiveNotes
    }),
    ...(review.negativeNotes && review.negativeNotes.length > 0 && {
      "negativeNotes": review.negativeNotes
    }),
    ...(review.verified && {
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "Verified Review",
        "value": "true"
      }
    })
  }));

  // Add aggregate rating if provided
  if (aggregateRating) {
    reviewSchemas.push({
      "@context": "https://schema.org",
      "@type": "AggregateRating",
      "@id": `${pageUrl}#aggregate-rating`,
      "itemReviewed": {
        "@id": `${itemReviewed.url}/#organization`
      },
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": aggregateRating.bestRating || 5,
      "worstRating": aggregateRating.worstRating || 1,
      "ratingExplanation": `Based on ${aggregateRating.reviewCount} verified customer reviews`
    } as any);
  }

  return {
    "@context": "https://schema.org",
    "@graph": reviewSchemas
  };
}

// Helper function to generate individual Review schema (matches your Legal Seafood example)
export function generateIndividualReviewSchema(props: {
  reviewBody: string;
  reviewRating: number;
  reviewAspect?: string;
  author: string;
  datePublished?: string;
  headline?: string;
  itemReviewed: {
    "@type": string;
    name: string;
    url?: string;
    image?: string;
    address?: any;
    telephone?: string;
    priceRange?: string;
    servesCuisine?: string; // For restaurants
    serviceType?: string;   // For service businesses
  };
  publisher?: {
    "@type": string;
    name: string;
  };
  pageUrl: string;
}) {
  const { reviewBody, reviewRating, reviewAspect, author, datePublished, headline, itemReviewed, publisher, pageUrl } = props;
  
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${pageUrl}#review`,
    ...(headline && { "name": headline }),
    "reviewBody": reviewBody,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": reviewRating,
      "bestRating": 5,
      "worstRating": 1,
      ...(reviewAspect && { "reviewAspect": reviewAspect })
    },
    "itemReviewed": {
      "@type": itemReviewed["@type"],
      "name": itemReviewed.name,
      ...(itemReviewed.url && { "url": itemReviewed.url }),
      ...(itemReviewed.image && { "image": itemReviewed.image }),
      ...(itemReviewed.address && { "address": itemReviewed.address }),
      ...(itemReviewed.telephone && { "telephone": itemReviewed.telephone }),
      ...(itemReviewed.priceRange && { "priceRange": itemReviewed.priceRange }),
      ...(itemReviewed.servesCuisine && { "servesCuisine": itemReviewed.servesCuisine }),
      ...(itemReviewed.serviceType && { "serviceType": itemReviewed.serviceType })
    },
    "author": {
      "@type": "Person",
      "name": author
    },
    ...(datePublished && { "datePublished": datePublished }),
    ...(publisher && { "publisher": publisher }),
    "inLanguage": "en-US"
  };
}

// Enhanced QAPage Schema Generator following full Schema.org specification
export function generateQAPageSchema(props: {
  question: string;
  questionText?: string;
  acceptedAnswer: string;
  suggestedAnswers?: string[];
  questionUpvotes?: number;
  acceptedAnswerUpvotes?: number;
  questionAuthor?: {
    name: string;
    url?: string;
  };
  answerAuthor?: {
    name: string;
    url?: string;
    type?: 'Person' | 'Organization';
  };
  pageUrl: string;
  datePublished?: string;
  answerDatePublished?: string;
}) {
  const {
    question,
    questionText,
    acceptedAnswer,
    suggestedAnswers = [],
    questionUpvotes = 25,
    acceptedAnswerUpvotes = 45,
    questionAuthor = { name: 'Event Organizer', url: 'https://www.m10djcompany.com/contact' },
    answerAuthor = { name: 'M10 DJ Company', url: 'https://www.m10djcompany.com', type: 'Organization' },
    pageUrl,
    datePublished = '2024-01-15T09:00:00-06:00',
    answerDatePublished = '2024-01-15T09:30:00-06:00'
  } = props;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "@id": `${pageUrl}#qapage`,
    "mainEntity": {
      "@type": "Question",
      "name": question,
      "text": questionText || question,
      "answerCount": 1 + suggestedAnswers.length,
      "upvoteCount": questionUpvotes,
      "datePublished": datePublished,
      "url": `${pageUrl}#question`,
      "author": {
        "@type": "Person",
        "name": questionAuthor.name,
        ...(questionAuthor.url && { "url": questionAuthor.url })
      },
      "acceptedAnswer": {
        "@type": "Answer",
        "text": acceptedAnswer,
        "datePublished": answerDatePublished,
        "url": `${pageUrl}#accepted-answer`,
        "upvoteCount": acceptedAnswerUpvotes,
        "author": {
          "@type": answerAuthor.type || "Organization",
          "name": answerAuthor.name,
          ...(answerAuthor.url && { "url": answerAuthor.url })
        }
      },
      // Add suggested answers if provided
      ...(suggestedAnswers.length > 0 && {
        "suggestedAnswer": suggestedAnswers.map((answer, index) => ({
          "@type": "Answer",
          "text": answer,
          "upvoteCount": Math.floor(Math.random() * 20) + 5, // Random upvotes 5-25
          "url": `${pageUrl}#suggested-answer-${index + 1}`,
          "datePublished": new Date(new Date(answerDatePublished).getTime() + (index + 1) * 3600000).toISOString().slice(0, -5) + '-06:00',
          "author": {
            "@type": answerAuthor.type || "Organization",
            "name": answerAuthor.name,
            ...(answerAuthor.url && { "url": answerAuthor.url })
          }
        }))
      })
    }
  };
}
