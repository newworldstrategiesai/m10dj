import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import CityInquiryForm from '@/components/djdash/city/CityInquiryForm';
import { 
  MapPin, 
  Star,
  CheckCircle,
  ArrowRight,
  Music,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { aggregateCityEventData, checkCityDataRequirements } from '@/utils/data/city-data-aggregator';
import { 
  generateDirectAnswerBlock, 
  generateMarketSnapshot, 
  generateLocalInsights, 
  generateFAQs 
} from '@/utils/content/city-content-assembler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Event type mapping
const EVENT_TYPES: Record<string, { type: string; display: string; slug: string; icon: string }> = {
  'wedding': { type: 'wedding', display: 'Wedding DJs', slug: 'wedding', icon: '💍' },
  'corporate': { type: 'corporate', display: 'Corporate Event DJs', slug: 'corporate', icon: '💼' },
  'birthday': { type: 'birthday', display: 'Birthday Party DJs', slug: 'birthday', icon: '🎂' },
  'school-dance': { type: 'school_dance', display: 'School Dance DJs', slug: 'school-dance', icon: '🎓' },
  'holiday-party': { type: 'holiday_party', display: 'Holiday Party DJs', slug: 'holiday-party', icon: '🎄' },
  'private-party': { type: 'private_party', display: 'Private Party DJs', slug: 'private-party', icon: '🎉' },
};

interface PageProps {
  params: {
    city: string;
    'event-type': string;
  };
}

// Generate static params for all city + event type combinations
export async function generateStaticParams() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get all published city event pages
  const { data: pages } = await supabase
    .from('city_event_pages')
    .select('city_slug, event_type_slug')
    .eq('is_published', true)
    .eq('product_context', 'djdash');
  
  if (pages && pages.length > 0) {
    return pages.map((page) => ({
      city: page.city_slug,
      'event-type': page.event_type_slug,
    }));
  }
  
  // Fallback: generate for common combinations
  const cities = ['memphis-tn', 'nashville-tn', 'atlanta-ga', 'new-york-ny', 'los-angeles-ca'];
  const eventTypes = Object.keys(EVENT_TYPES);
  
  return cities.flatMap(city => 
    eventTypes.map(eventType => ({
      city,
      'event-type': eventType,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const eventType = EVENT_TYPES[params['event-type']];
  
  if (!eventType) {
    return {
      title: 'DJ Services | DJ Dash',
    };
  }

  // Fetch page content from database
  const { data: pageContent } = await supabase
    .from('city_event_pages')
    .select('*')
    .eq('city_slug', params.city)
    .eq('event_type_slug', params['event-type'])
    .eq('is_published', true)
    .eq('product_context', 'djdash')
    .single();

  if (pageContent) {
    // Check data requirements for NOINDEX
    const requirements = await checkCityDataRequirements(pageContent.city_name, pageContent.state_abbr);
    const robots = requirements.meetsRequirements 
      ? undefined 
      : { index: false, follow: true };
    
    return {
      title: pageContent.seo_title || `${eventType.display} in ${pageContent.city_name || params.city}`,
      description: pageContent.seo_description || pageContent.meta_og_description || `Find the best ${eventType.display.toLowerCase()} in ${pageContent.city_name || params.city}`,
      robots,
      keywords: pageContent.seo_keywords || [],
      openGraph: {
        title: pageContent.meta_og_title || pageContent.seo_title || `${eventType.display} in ${pageContent.city_name || params.city}`,
        description: pageContent.meta_og_description || pageContent.seo_description || `Find the best ${eventType.display.toLowerCase()} in ${pageContent.city_name || params.city}`,
        url: `https://www.djdash.net/djdash/find-dj/${params.city}/${params['event-type']}`,
        siteName: 'DJ Dash',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: pageContent.meta_og_title || pageContent.seo_title || `${eventType.display} in ${pageContent.city_name || params.city}`,
        description: pageContent.meta_og_description || pageContent.seo_description || `Find the best ${eventType.display.toLowerCase()} in ${pageContent.city_name || params.city}`,
      },
    };
  }

  // Fallback metadata
  const cityName = params.city.split('-').slice(0, -1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateAbbr = params.city.split('-').pop()?.toUpperCase() || '';
  
  return {
    title: `${eventType.display} in ${cityName} ${stateAbbr} | DJ Dash`,
    description: `Find the best ${eventType.display.toLowerCase()} in ${cityName}, ${stateAbbr}. Browse verified DJs with reviews, portfolios, and pricing.`,
  };
}

export default async function CityEventTypePage({ params }: PageProps) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const eventType = EVENT_TYPES[params['event-type']];
  
  if (!eventType) {
    notFound();
  }

  // Fetch page content from database
  const { data: pageContent, error } = await supabase
    .from('city_event_pages')
    .select('*')
    .eq('city_slug', params.city)
    .eq('event_type_slug', params['event-type'])
    .eq('is_published', true)
    .eq('product_context', 'djdash')
    .single();

  // If no page content exists, show 404 or generate on-the-fly
  if (!pageContent || error) {
    // Could generate content on-the-fly here, but for now return 404
    notFound();
  }

  // Aggregate real data for data-driven content
  const cityEventStats = await aggregateCityEventData(
    pageContent.city_name, 
    eventType.type,
    pageContent.state_abbr
  );
  
  // Generate data-driven content blocks
  const directAnswer = generateDirectAnswerBlock(cityEventStats, pageContent.city_name, eventType.type);
  const marketSnapshot = generateMarketSnapshot(cityEventStats);
  const localInsights = generateLocalInsights(cityEventStats, pageContent.city_name, pageContent.state_abbr);
  const faqs = generateFAQs(cityEventStats, pageContent.city_name, eventType.type);

  // M10 DJ Company organization ID - always feature for Memphis
  const M10_DJ_COMPANY_ORG_ID = '2a10fa9f-c129-451d-bc4e-b669d42d521e';
  const isMemphis = (pageContent.city_name || params.city).toLowerCase().includes('memphis');

  // For Memphis: Always include M10 DJ Company profiles first
  let m10DJs: any[] = [];
  if (isMemphis) {
    const { data: m10Data } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        dj_slug,
        tagline,
        profile_image_url,
        starting_price_range,
        availability_status,
        event_types
      `)
      .eq('is_published', true)
      .eq('organization_id', M10_DJ_COMPANY_ORG_ID)
      .or(`city.ilike.%${pageContent.city_name || params.city}%,primary_city.ilike.%${pageContent.city_name || params.city}%`)
      .contains('event_types', [eventType.type])
      .in('availability_status', ['available', 'limited']);

    if (m10Data) {
      m10DJs = m10Data.map(dj => ({ ...dj, is_m10_dj_company: true }));
    }
  }

  // Fetch ALL DJs for this city and event type (for the selection form)
  const { data: featuredDJs } = await supabase
    .from('dj_profiles')
    .select(`
      id,
      dj_name,
      dj_slug,
      tagline,
      profile_image_url,
      starting_price_range,
      availability_status,
      event_types,
      organizations!inner(product_context)
    `)
    .eq('is_published', true)
    .eq('organizations.product_context', 'djdash')
    .or(`city.ilike.%${pageContent.city_name || params.city}%,primary_city.ilike.%${pageContent.city_name || params.city}%`)
    .contains('event_types', [eventType.type])
    .in('availability_status', ['available', 'limited'])
    .order('is_featured', { ascending: false })
    .order('page_views', { ascending: false })
    .limit(100); // Get all DJs for selection form

  // Combine: M10 DJ Company first, then DJ Dash profiles (excluding duplicates)
  const allFeaturedDJs = [
    ...m10DJs,
    ...(featuredDJs || []).filter(dj => !m10DJs.some(m10 => m10.id === dj.id))
  ];

  const {
    city_name,
    state_name,
    state_abbr,
    event_type_display,
    hero_title,
    hero_subtitle,
    hero_description,
    introduction_text,
    why_choose_section,
    pricing_section,
    venue_section,
    timeline_section,
    comprehensive_guide,
    local_insights,
    seasonal_trends,
    popular_songs,
    venue_recommendations,
    faqs: pageContentFaqs,
    structured_data,
    dj_count,
    average_rating,
    review_count,
    average_price_range
  } = pageContent || {};

  // Generate structured data if not present
  const finalStructuredData = structured_data || null;

  // Generate ItemList schema for DJ companies (for rich results)
  const djCompaniesList = allFeaturedDJs && allFeaturedDJs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${event_type_display} in ${city_name}, ${state_abbr}`,
    description: `List of professional ${event_type_display.toLowerCase()} in ${city_name}, ${state_abbr}`,
    numberOfItems: Math.min(allFeaturedDJs.length, 20), // Limit to top 20 for performance
    itemListElement: allFeaturedDJs.slice(0, 20).map((dj: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `https://www.djdash.net/dj/${dj.dj_slug}`,
        name: dj.dj_name || 'Professional DJ',
        description: dj.tagline || `${event_type_display} in ${city_name}`,
        url: `https://www.djdash.net/dj/${dj.dj_slug}`,
        image: dj.profile_image_url,
        address: {
          '@type': 'PostalAddress',
          addressLocality: dj.city || city_name,
          addressRegion: dj.state || state_abbr,
          addressCountry: 'US',
        },
        priceRange: dj.starting_price_range,
        areaServed: {
          '@type': 'City',
          name: city_name,
        },
        serviceType: `${event_type_display}`,
        ...(dj.event_types && dj.event_types.length > 0 && {
          knowsAbout: dj.event_types.map((type: string) => 
            type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' DJ Services'
          ),
        }),
      },
    })),
  } : null;

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      {finalStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(finalStructuredData) }}
        />
      )}
      {/* DJ Companies ItemList Schema (for rich results) */}
      {djCompaniesList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(djCompaniesList),
          }}
        />
      )}
      {/* FAQ Structured Data */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            }),
          }}
        />
      )}

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                <span>{event_type_display} in {city_name}, {state_abbr}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900 dark:text-white">{hero_title || `Find the Perfect ${event_type_display} in ${city_name}`}</span>
              </h1>
              
              {hero_subtitle && (
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  {hero_subtitle}
                </p>
              )}
              
              {hero_description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {hero_description}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a 
                  href="#inquiry-form"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Free Quotes from {city_name} DJs
                </a>
                <Link 
                  href={`/djdash/find-dj/${params.city}`}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                >
                  View All {city_name} DJs
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
                {dj_count > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{dj_count} {event_type_display}</span>
                  </div>
                )}
                {average_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span>{average_rating}★ Average Rating</span>
                  </div>
                )}
                {average_price_range && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span>Starting at {average_price_range}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Quotes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Direct Answer Block (Above the Fold) */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {directAnswer.question}
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              {directAnswer.answer}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Source: {directAnswer.dataSource}
            </p>
          </div>
        </section>

        {/* Data Requirements Notice (if not met) */}
        {!cityEventStats.meetsMinimumRequirements && (
          <section className="py-8 px-4 sm:px-6 lg:px-8 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Market Still Growing
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    The {event_type_display.toLowerCase()} market in {city_name} is still developing. We&apos;re actively adding more DJs and collecting data to provide comprehensive insights.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Market Snapshot (Data Table) */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              {event_type_display} Market Snapshot in {city_name}
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Average DJ Price</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{marketSnapshot.averagePrice}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Peak Booking Months</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{marketSnapshot.peakBookingMonths}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Typical Event Length</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{marketSnapshot.typicalEventLength}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Most Requested Genres</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{marketSnapshot.mostRequestedGenres}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Average Response Time</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{marketSnapshot.averageResponseTime}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Booking Lead Time</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{marketSnapshot.bookingLeadTime}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: What Locals Should Know (City-Specific) */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              What Locals Should Know About {event_type_display} in {city_name}
            </h2>
            <div className="space-y-6">
              {localInsights.venueTypes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Popular Venue Types</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Popular venues in {city_name} include {localInsights.venueTypes.slice(0, 3).join(', ')}.
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Noise Ordinances</h3>
                <p className="text-gray-700 dark:text-gray-300">{localInsights.noiseOrdinances}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Weather Considerations</h3>
                <p className="text-gray-700 dark:text-gray-300">{localInsights.weatherConsiderations}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Crowd Expectations</h3>
                <p className="text-gray-700 dark:text-gray-300">{localInsights.crowdExpectations}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Parking & Load-In</h3>
                <p className="text-gray-700 dark:text-gray-300">{localInsights.parkingLoadIn}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Facts Section - Inspired by The Bash */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Facts about {event_type_display} in {city_name}, {state_abbr}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Average Response Time */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  &lt;24hrs
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average response time from {city_name} DJs
                </div>
              </div>
              
              {/* Average Rating */}
              {average_rating && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center justify-center gap-1">
                    {average_rating}
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Average rating from verified reviews
                  </div>
                </div>
              )}
              
              {/* Average Price */}
              {average_price_range ? (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {average_price_range}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Average cost for {eventType.type.replace('_', ' ')} events
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Free
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Quotes available at no cost
                  </div>
                </div>
              )}
              
              {/* Booking Lead Time */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  30-90
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Days before event (recommended booking time)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction Section */}
        {introduction_text && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                  {introduction_text}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Section */}
        {why_choose_section && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Why Choose {event_type_display} from DJ Dash in {city_name}?
                </h2>
              </div>
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {why_choose_section}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Featured DJs Section */}
        {allFeaturedDJs && allFeaturedDJs.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Featured {event_type_display} in {city_name}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Browse verified DJs specializing in {eventType.type.replace('_', ' ')} events
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFeaturedDJs.map((dj) => (
                  <Card key={dj.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      {dj.profile_image_url && (
                        <img
                          src={dj.profile_image_url}
                          alt={dj.dj_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {dj.dj_name}
                        </h3>
                        {dj.tagline && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {dj.tagline}
                          </p>
                        )}
                        <Badge variant={dj.availability_status === 'available' ? 'default' : 'secondary'}>
                          {dj.availability_status}
                        </Badge>
                      </div>
                    </div>
                    {dj.starting_price_range && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Starting at {dj.starting_price_range}
                      </p>
                    )}
                    <Link
                      href={`/dj/${dj.dj_slug}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      View Profile →
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing Section */}
        {pricing_section && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  {event_type_display} Pricing in {city_name}
                </h2>
              </div>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {pricing_section}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Venue Section */}
        {venue_section && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Popular {event_type_display} Venues in {city_name}
                </h2>
              </div>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {venue_section}
                </p>
              </div>
              {venue_recommendations && Array.isArray(venue_recommendations) && venue_recommendations.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venue_recommendations.map((venue: any, idx: number) => (
                    <Card key={idx} className="p-6">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                        {venue.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {venue.description}
                      </p>
                      {venue.whyPopular && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {venue.whyPopular}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Comprehensive Guide Section (LLM-Optimized) */}
        {comprehensive_guide && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Complete Guide to {event_type_display} in {city_name}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Everything you need to know about hiring {event_type_display.toLowerCase()} in {city_name}
                </p>
              </div>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: comprehensive_guide.replace(/\n/g, '<br />') }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Local Insights */}
        {local_insights && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Local Insights: {event_type_display} in {city_name}
                </h2>
              </div>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {local_insights}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Seasonal Trends */}
        {seasonal_trends && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Seasonal Trends for {event_type_display} in {city_name}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(seasonal_trends).map(([season, trend]) => (
                  <Card key={season} className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 capitalize">
                      {season}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {trend as string}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: FAQ (LLM-Optimized) */}
        {faqs && faqs.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Common questions about {event_type_display.toLowerCase()} in {city_name}
                </p>
              </div>
              
              <div className="space-y-6">
                {faqs.map((faq, idx: number) => (
                  <details
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <summary className="font-semibold text-lg text-gray-900 dark:text-white cursor-pointer mb-3" itemProp="name">
                      {faq.question}
                    </summary>
                    <div 
                      className="text-gray-700 dark:text-gray-300 mt-3"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <p itemProp="text">{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Inquiry Form Section */}
        <section id="inquiry-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Get Free Quotes from {city_name} {event_type_display}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Select which DJ companies in {city_name} should receive your inquiry. Choose all, or pick specific DJs that match your style and budget.
              </p>
            </div>
            
            <CityInquiryForm
              city={city_name}
              state={state_abbr}
              featuredDJs={allFeaturedDJs || []}
            />
          </div>
        </section>

        {/* Related Event Types Section - Inspired by The Bash */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Explore Other Event Types in {city_name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.values(EVENT_TYPES).filter(et => et.slug !== params['event-type']).map((et) => (
                <Link
                  key={et.slug}
                  href={`/djdash/find-dj/${params.city}/${et.slug}`}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">{et.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {et.display}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Signals Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Plan, book, celebrate—with confidence
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Trusted DJs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All DJs are verified with reviews and ratings. Browse portfolios and pricing before booking.
                </p>
              </div>
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Free Quotes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get multiple quotes from verified DJs in {city_name}. No obligation, no hidden fees.
                </p>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4 fill-current" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Top-Rated Service
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our platform connects you with the best {event_type_display.toLowerCase()} in {city_name}, {state_abbr}.
                </p>
              </div>
            </div>
          </div>
        </section>

        <DJDashFooter />
      </div>
    </>
  );
}

