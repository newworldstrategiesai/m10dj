'use client';

import { Product } from '@/components/marketing/types';

/**
 * Product-specific organization data for structured data
 */
const organizationData: Record<Product, {
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs: string[];
}> = {
  tipjar: {
    name: 'TipJar Live',
    description: 'The best tip jar app and song request app for DJs. Easy DJ tip collection with QR codes—no app downloads required.',
    url: 'https://www.tipjar.live',
    logo: 'https://www.tipjar.live/assets/TipJar-Logo-Icon.png',
    sameAs: [
      'https://twitter.com/tipjarlive',
      'https://instagram.com/tipjarlive',
    ],
  },
  djdash: {
    name: 'DJ Dash',
    description: 'The #1 DJ directory and booking software. Find 1,200+ verified professional DJs for weddings, parties, and events nationwide.',
    url: 'https://www.djdash.net',
    logo: 'https://www.djdash.net/assets/DJ-Dash-Logo-Black-1.PNG',
    sameAs: [
      'https://facebook.com/djdash',
      'https://twitter.com/djdash',
      'https://instagram.com/djdash',
    ],
  },
  m10dj: {
    name: 'M10 DJ Company',
    description: 'Memphis\'s premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations.',
    url: 'https://www.m10djcompany.com',
    logo: 'https://www.m10djcompany.com/logo-static.jpg',
    sameAs: [
      'https://www.facebook.com/m10djcompany',
      'https://www.instagram.com/m10djcompany',
      'https://www.linkedin.com/company/m10djcompany',
    ],
  },
};

interface OrganizationSchemaProps {
  product: Product;
  /** Override default values */
  overrides?: Partial<typeof organizationData.tipjar>;
}

/**
 * Organization Schema (JSON-LD)
 * 
 * Generates structured data for the organization based on product.
 */
export function OrganizationSchema({ product, overrides }: OrganizationSchemaProps) {
  const data = { ...organizationData[product], ...overrides };
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    description: data.description,
    url: data.url,
    logo: {
      '@type': 'ImageObject',
      url: data.logo,
      width: 300,
      height: 300,
    },
    sameAs: data.sameAs,
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface SoftwareApplicationSchemaProps {
  product: Product;
  name?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency?: string;
  };
  aggregateRating?: {
    ratingValue: string;
    reviewCount: string;
  };
}

/**
 * Software Application Schema (JSON-LD)
 * 
 * For SaaS products like TipJar and DJDash.
 */
export function SoftwareApplicationSchema({ 
  product,
  name,
  description,
  applicationCategory = 'BusinessApplication',
  operatingSystem = 'Web',
  offers,
  aggregateRating,
}: SoftwareApplicationSchemaProps) {
  const orgData = organizationData[product];
  
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name || orgData.name,
    description: description || orgData.description,
    applicationCategory,
    operatingSystem,
    url: orgData.url,
    publisher: {
      '@type': 'Organization',
      name: orgData.name,
      url: orgData.url,
    },
  };
  
  if (offers) {
    schema.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency || 'USD',
    };
  }
  
  if (aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * FAQ Schema (JSON-LD)
 * 
 * For FAQ sections on any product page.
 */
export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Breadcrumb Schema (JSON-LD)
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteSchemaProps {
  product: Product;
  searchAction?: {
    urlTemplate: string;
    queryInput: string;
  };
}

/**
 * Website Schema (JSON-LD)
 * 
 * With optional search action for products with search functionality.
 */
export function WebsiteSchema({ product, searchAction }: WebsiteSchemaProps) {
  const orgData = organizationData[product];
  
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: orgData.name,
    url: orgData.url,
    description: orgData.description,
  };
  
  if (searchAction) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchAction.urlTemplate,
      },
      'query-input': searchAction.queryInput,
    };
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Combined Structured Data Component
 * 
 * Renders all recommended structured data for a product homepage.
 */
interface ProductStructuredDataProps {
  product: Product;
  includeOrganization?: boolean;
  includeSoftwareApp?: boolean;
  includeWebsite?: boolean;
  faqQuestions?: FAQSchemaProps['questions'];
  breadcrumbs?: BreadcrumbSchemaProps['items'];
  softwareAppProps?: Partial<SoftwareApplicationSchemaProps>;
  websiteSearchAction?: WebsiteSchemaProps['searchAction'];
}

export function ProductStructuredData({
  product,
  includeOrganization = true,
  includeSoftwareApp = true,
  includeWebsite = true,
  faqQuestions,
  breadcrumbs,
  softwareAppProps,
  websiteSearchAction,
}: ProductStructuredDataProps) {
  return (
    <>
      {includeOrganization && <OrganizationSchema product={product} />}
      {includeSoftwareApp && (
        <SoftwareApplicationSchema 
          product={product} 
          {...softwareAppProps}
        />
      )}
      {includeWebsite && (
        <WebsiteSchema 
          product={product} 
          searchAction={websiteSearchAction}
        />
      )}
      {faqQuestions && faqQuestions.length > 0 && (
        <FAQSchema questions={faqQuestions} />
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <BreadcrumbSchema items={breadcrumbs} />
      )}
    </>
  );
}

export default ProductStructuredData;

