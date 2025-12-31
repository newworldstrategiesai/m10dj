import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import CityPageClient from '@/components/djdash/city/CityPageClient';
import { 
  MapPin, 
  Calendar, 
  Star,
  CheckCircle,
  ArrowRight,
  Users,
  Music,
  Phone,
  Mail,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';
import { aggregateCityData, checkCityDataRequirements } from '@/utils/data/city-data-aggregator';
import { 
  generateDirectAnswerBlock, 
  generateMarketSnapshot, 
  generateLocalInsights, 
  generateFAQs 
} from '@/utils/content/city-content-assembler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PageProps {
  params: {
    city: string;
  };
}

// Generate static params for major cities
export async function generateStaticParams() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: cities } = await supabase
    .from('city_pages')
    .select('city_slug')
    .eq('is_published', true)
    .eq('product_context', 'djdash');
  
  // Fallback to common cities if no data
  const fallbackCities = [
    'memphis-tn',
    'nashville-tn',
    'atlanta-ga',
    'los-angeles-ca',
    'new-york-ny',
    'chicago-il',
    'houston-tx',
    'dallas-tx',
    'austin-tx',
    'miami-fl'
  ];
  
  if (cities && cities.length > 0) {
    return cities.map((city) => ({
      city: city.city_slug,
    }));
  }
  
  return fallbackCities.map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: cityPage } = await supabase
    .from('city_pages')
    .select('*')
    .eq('city_slug', params.city)
    .eq('is_published', true)
    .eq('product_context', 'djdash')
    .single();
  
  if (!cityPage) {
    return {
      title: `DJs in ${params.city} | DJ Dash`,
      description: `Find professional DJs in ${params.city}. Verified reviews, availability, pricing, and online booking.`,
    };
  }
  
  // Check data requirements for NOINDEX
  const requirements = await checkCityDataRequirements(cityPage.city_name, cityPage.state_abbr);
  const robots = requirements.meetsRequirements 
    ? undefined 
    : { index: false, follow: true };
  
  const title = cityPage.meta_title || `Best DJs in ${cityPage.city_name} – Book Local DJs | DJ Dash`;
  const description = cityPage.meta_description || `Discover top-rated DJs in ${cityPage.city_name}. Verified reviews, availability, pricing, and online booking.`;
  
  return {
    title,
    description,
    robots,
    keywords: [
      `DJs in ${cityPage.city_name}`,
      `${cityPage.city_name} DJ`,
      `DJ ${cityPage.city_name} ${cityPage.state_abbr}`,
      `wedding DJ ${cityPage.city_name}`,
      `corporate DJ ${cityPage.city_name}`,
      `best DJs ${cityPage.city_name}`,
      `DJ services ${cityPage.city_name}`,
    ],
    openGraph: {
      title: cityPage.meta_title || title,
      description: cityPage.meta_description || description,
      url: `https://www.djdash.net/cities/${params.city}`,
      siteName: 'DJ Dash',
      images: cityPage.og_image_url ? [
        {
          url: cityPage.og_image_url,
          width: 1200,
          height: 630,
          alt: `${cityPage.city_name} DJs - DJ Dash`,
        },
      ] : [
        {
          url: '/assets/DJ-Dash-Logo-Black-1.PNG',
          width: 1200,
          height: 630,
          alt: `${cityPage.city_name} DJs - DJ Dash`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: cityPage.meta_title || title,
      description: cityPage.meta_description || description,
      images: cityPage.og_image_url ? [cityPage.og_image_url] : ['/assets/DJ-Dash-Logo-Black-1.PNG'],
    },
  };
}

async function getCityPageData(citySlug: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get city page data
  const { data: cityPage, error: cityError } = await supabase
    .from('city_pages')
    .select('*')
    .eq('city_slug', citySlug)
    .eq('is_published', true)
    .eq('product_context', 'djdash')
    .single();
  
  if (cityError || !cityPage) {
    return null;
  }
  
  // Get featured DJs
  let featuredDJs = [];
  if (cityPage.featured_dj_ids && cityPage.featured_dj_ids.length > 0) {
    const { data: djs } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        dj_slug,
        tagline,
        profile_image_url,
        city,
        state,
        starting_price_range,
        availability_status,
        event_types,
        organizations!inner(product_context)
      `)
      .in('id', cityPage.featured_dj_ids)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash')
      .limit(6);
    
    featuredDJs = djs || [];
  } else {
    // Fallback: Get top DJs in the city
    const { data: djs } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        dj_slug,
        tagline,
        profile_image_url,
        city,
        state,
        starting_price_range,
        availability_status,
        event_types,
        organizations!inner(product_context)
      `)
      .or(`city.ilike.%${cityPage.city_name}%,primary_city.ilike.%${cityPage.city_name}%`)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash')
      .order('is_featured', { ascending: false })
      .order('page_views', { ascending: false })
      .limit(6);
    
    featuredDJs = djs || [];
  }
  
  // Get venue spotlights
  const { data: venues } = await supabase
    .from('city_venue_spotlights')
    .select('*')
    .eq('city_page_id', cityPage.id)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(6);
  
  // Get city reviews (aggregate from DJ reviews in the city)
  const { data: reviews } = await supabase
    .from('dj_reviews')
    .select(`
      *,
      dj_profiles!inner(
        id,
        city,
        organizations!inner(product_context)
      )
    `)
    .eq('is_approved', true)
    .eq('is_verified', true)
    .eq('dj_profiles.organizations.product_context', 'djdash')
    .or(`dj_profiles.city.ilike.%${cityPage.city_name}%,dj_profiles.primary_city.ilike.%${cityPage.city_name}%`)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Get city analytics summary
  const { data: analytics } = await supabase
    .from('city_analytics')
    .select('*')
    .eq('city_page_id', cityPage.id)
    .order('date', { ascending: false })
    .limit(30)
    .single();
  
  return {
    cityPage,
    featuredDJs,
    venues: venues || [],
    reviews: reviews || [],
    analytics,
  };
}

export default async function CityPage({ params }: PageProps) {
  const cityData = await getCityPageData(params.city);
  
  if (!cityData || !cityData.cityPage) {
    notFound();
  }
  
  const { cityPage, featuredDJs, venues, reviews, analytics } = cityData;
  
  // Aggregate real data for data-driven content
  const cityStats = await aggregateCityData(cityPage.city_name, cityPage.state_abbr);
  
  // Generate data-driven content blocks
  const directAnswer = generateDirectAnswerBlock(cityStats, cityPage.city_name);
  const marketSnapshot = generateMarketSnapshot(cityStats);
  const localInsights = generateLocalInsights(cityStats, cityPage.city_name, cityPage.state_abbr);
  const faqs = generateFAQs(cityStats, cityPage.city_name);
  
  // Generate comprehensive structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `DJ Directory - ${cityPage.city_name}, ${cityPage.state}`,
    description: cityPage.meta_description || `Professional DJ directory for ${cityPage.city_name}, ${cityPage.state}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityPage.city_name,
      addressRegion: cityPage.state_abbr,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: cityPage.city_name,
    },
    aggregateRating: cityStats.averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: cityStats.averageRating.toString(),
      ratingCount: cityStats.totalReviews.toString(),
    } : cityPage.avg_rating ? {
      '@type': 'AggregateRating',
      ratingValue: cityPage.avg_rating.toString(),
      ratingCount: cityPage.total_reviews?.toString() || '0',
    } : undefined,
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: cityStats.totalDJs || cityPage.total_djs || 0,
    },
    priceRange: cityStats.priceRange ? 
      `$${cityStats.priceRange.min}-$${cityStats.priceRange.max}` : 
      undefined,
  };

  // Generate ItemList schema for DJ companies (for rich results)
  const djCompaniesList = featuredDJs && featuredDJs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `DJ Companies in ${cityPage.city_name}, ${cityPage.state}`,
    description: `List of professional DJ companies and DJs in ${cityPage.city_name}, ${cityPage.state}`,
    numberOfItems: featuredDJs.length,
    itemListElement: featuredDJs.map((dj: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `https://www.djdash.net/dj/${dj.dj_slug}`,
        name: dj.dj_name || 'Professional DJ',
        description: dj.tagline || `Professional DJ services in ${cityPage.city_name}`,
        url: `https://www.djdash.net/dj/${dj.dj_slug}`,
        image: dj.profile_image_url,
        address: {
          '@type': 'PostalAddress',
          addressLocality: dj.city || cityPage.city_name,
          addressRegion: dj.state || cityPage.state_abbr,
          addressCountry: 'US',
        },
        priceRange: dj.starting_price_range,
        areaServed: {
          '@type': 'City',
          name: cityPage.city_name,
        },
        serviceType: 'DJ Services',
        ...(dj.event_types && dj.event_types.length > 0 && {
          knowsAbout: dj.event_types.map((type: string) => 
            type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' DJ Services'
          ),
        }),
      },
    })),
  } : null;
  
  // FAQ structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {djCompaniesList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(djCompaniesList),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
        <CityPageClient
          cityPage={cityPage}
          featuredDJs={featuredDJs}
          venues={venues}
          reviews={reviews}
          analytics={analytics}
          cityStats={cityStats}
          directAnswer={directAnswer}
          marketSnapshot={marketSnapshot}
          localInsights={localInsights}
          faqs={faqs}
        />
        <DJDashFooter />
      </div>
    </>
  );
}

