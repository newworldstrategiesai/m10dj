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
  
  const title = cityPage.meta_title || `Best DJs in ${cityPage.city_name} – Book Local DJs | DJ Dash`;
  const description = cityPage.meta_description || `Discover top-rated DJs in ${cityPage.city_name}. Verified reviews, availability, pricing, and online booking.`;
  
  return {
    title,
    description,
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
  
  // Generate structured data
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
    aggregateRating: cityPage.avg_rating ? {
      '@type': 'AggregateRating',
      ratingValue: cityPage.avg_rating.toString(),
      ratingCount: cityPage.total_reviews?.toString() || '0',
    } : undefined,
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: cityPage.total_djs || 0,
    },
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
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
        />
        <DJDashFooter />
      </div>
    </>
  );
}

