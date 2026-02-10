import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import FeaturedDJProfiles from '@/components/djdash/FeaturedDJProfiles';
import { 
  MapPin, 
  Calendar, 
  Star,
  CheckCircle,
  ArrowRight,
  Users,
  Music,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Major US cities for DJ directory
const cities = {
  'memphis-tn': { name: 'Memphis', state: 'Tennessee', stateAbbr: 'TN', population: '630K+', djCount: '150+' },
  'nashville-tn': { name: 'Nashville', state: 'Tennessee', stateAbbr: 'TN', population: '690K+', djCount: '200+' },
  'atlanta-ga': { name: 'Atlanta', state: 'Georgia', stateAbbr: 'GA', population: '500K+', djCount: '180+' },
  'los-angeles-ca': { name: 'Los Angeles', state: 'California', stateAbbr: 'CA', population: '4M+', djCount: '500+' },
  'new-york-ny': { name: 'New York', state: 'New York', stateAbbr: 'NY', population: '8M+', djCount: '600+' },
  'chicago-il': { name: 'Chicago', state: 'Illinois', stateAbbr: 'IL', population: '2.7M+', djCount: '400+' },
  'houston-tx': { name: 'Houston', state: 'Texas', stateAbbr: 'TX', population: '2.3M+', djCount: '350+' },
  'phoenix-az': { name: 'Phoenix', state: 'Arizona', stateAbbr: 'AZ', population: '1.6M+', djCount: '250+' },
  'philadelphia-pa': { name: 'Philadelphia', state: 'Pennsylvania', stateAbbr: 'PA', population: '1.6M+', djCount: '280+' },
  'san-antonio-tx': { name: 'San Antonio', state: 'Texas', stateAbbr: 'TX', population: '1.5M+', djCount: '220+' },
  'san-diego-ca': { name: 'San Diego', state: 'California', stateAbbr: 'CA', population: '1.4M+', djCount: '200+' },
  'dallas-tx': { name: 'Dallas', state: 'Texas', stateAbbr: 'TX', population: '1.3M+', djCount: '300+' },
  'austin-tx': { name: 'Austin', state: 'Texas', stateAbbr: 'TX', population: '950K+', djCount: '180+' },
  'jacksonville-fl': { name: 'Jacksonville', state: 'Florida', stateAbbr: 'FL', population: '950K+', djCount: '150+' },
  'charlotte-nc': { name: 'Charlotte', state: 'North Carolina', stateAbbr: 'NC', population: '880K+', djCount: '140+' },
  'san-francisco-ca': { name: 'San Francisco', state: 'California', stateAbbr: 'CA', population: '870K+', djCount: '200+' },
  'seattle-wa': { name: 'Seattle', state: 'Washington', stateAbbr: 'WA', population: '750K+', djCount: '180+' },
  'denver-co': { name: 'Denver', state: 'Colorado', stateAbbr: 'CO', population: '720K+', djCount: '160+' },
  'washington-dc': { name: 'Washington', state: 'District of Columbia', stateAbbr: 'DC', population: '700K+', djCount: '170+' },
  'boston-ma': { name: 'Boston', state: 'Massachusetts', stateAbbr: 'MA', population: '690K+', djCount: '150+' },
  'detroit-mi': { name: 'Detroit', state: 'Michigan', stateAbbr: 'MI', population: '630K+', djCount: '120+' },
  'portland-or': { name: 'Portland', state: 'Oregon', stateAbbr: 'OR', population: '650K+', djCount: '140+' },
  'las-vegas-nv': { name: 'Las Vegas', state: 'Nevada', stateAbbr: 'NV', population: '640K+', djCount: '250+' },
  'miami-fl': { name: 'Miami', state: 'Florida', stateAbbr: 'FL', population: '440K+', djCount: '200+' },
  'minneapolis-mn': { name: 'Minneapolis', state: 'Minnesota', stateAbbr: 'MN', population: '430K+', djCount: '130+' },
  'tucson-az': { name: 'Tucson', state: 'Arizona', stateAbbr: 'AZ', population: '540K+', djCount: '100+' },
  'sacramento-ca': { name: 'Sacramento', state: 'California', stateAbbr: 'CA', population: '520K+', djCount: '120+' },
  'kansas-city-mo': { name: 'Kansas City', state: 'Missouri', stateAbbr: 'MO', population: '510K+', djCount: '110+' },
  'raleigh-nc': { name: 'Raleigh', state: 'North Carolina', stateAbbr: 'NC', population: '470K+', djCount: '100+' },
  'virginia-beach-va': { name: 'Virginia Beach', state: 'Virginia', stateAbbr: 'VA', population: '460K+', djCount: '90+' },
  'oakland-ca': { name: 'Oakland', state: 'California', stateAbbr: 'CA', population: '430K+', djCount: '110+' },
  'tulsa-ok': { name: 'Tulsa', state: 'Oklahoma', stateAbbr: 'OK', population: '410K+', djCount: '80+' },
  'cleveland-oh': { name: 'Cleveland', state: 'Ohio', stateAbbr: 'OH', population: '390K+', djCount: '100+' },
  'wichita-ks': { name: 'Wichita', state: 'Kansas', stateAbbr: 'KS', population: '400K+', djCount: '70+' },
  'arlington-tx': { name: 'Arlington', state: 'Texas', stateAbbr: 'TX', population: '400K+', djCount: '90+' },
};

type CityKey = keyof typeof cities;

interface PageProps {
  params: {
    city: string;
  };
}

export async function generateStaticParams() {
  return Object.keys(cities).map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityData = cities[params.city as CityKey];
  
  if (!cityData) {
    return {
      title: 'Find a DJ | DJ Dash',
    };
  }

  const { name, state, stateAbbr } = cityData;
  const title = `DJs in ${name} ${stateAbbr} | Find a DJ in ${name} | Professional DJ Directory | DJ Dash`;
  const description = `Find professional DJs in ${name}, ${state}. Browse verified DJs for weddings, corporate events, parties, and more. Get free quotes from ${cityData.djCount} professional DJs in ${name}.`;

  return {
    title,
    description,
    keywords: [
      `DJs in ${name}`,
      `DJs in ${name} ${stateAbbr}`,
      `find a DJ in ${name}`,
      `DJ ${name}`,
      `${name} DJ`,
      `wedding DJs ${name}`,
      `corporate DJs ${name}`,
      `DJ services ${name}`,
      `hire a DJ ${name}`,
      `DJ directory ${name}`,
      `best DJs ${name}`,
      `professional DJs ${name}`,
    ],
    openGraph: {
      title: `DJs in ${name} ${stateAbbr} | Find a Professional DJ | DJ Dash`,
      description: `Find professional DJs in ${name}, ${state}. Browse ${cityData.djCount} verified DJs for weddings, corporate events, and parties.`,
      url: `https://www.djdash.net/find-dj/${params.city}`,
      siteName: 'DJ Dash',
      images: [
        {
          url: '/assets/djdash-og-image.png',
          width: 1200,
          height: 630,
          alt: `DJs in ${name} ${stateAbbr} - DJ Dash`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `DJs in ${name} ${stateAbbr} | Find a Professional DJ | DJ Dash`,
      description: `Find professional DJs in ${name}, ${state}. Browse ${cityData.djCount} verified DJs.`,
      images: ['/assets/djdash-og-image.png'],
    },
  };
}

async function getCityDJs(cityName: string, stateAbbr: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const M10_DJ_COMPANY_ORG_ID = '2a10fa9f-c129-451d-bc4e-b669d42d521e';
    const isMemphis = cityName.toLowerCase().includes('memphis');

    // For Memphis: Always include M10 DJ Company profiles first
    let m10Profiles: any[] = [];
    if (isMemphis) {
      const { data: m10Data, error: m10Error } = await supabase
        .from('dj_profiles')
        .select(`
          id,
          dj_name,
          dj_slug,
          tagline,
          profile_image_url,
          cover_image_url,
          city,
          state,
          starting_price_range,
          event_types,
          is_featured,
          organization_id
        `)
        .eq('is_published', true)
        .eq('organization_id', M10_DJ_COMPANY_ORG_ID)
        .or(`city.ilike.%${cityName}%,primary_city.ilike.%${cityName}%`)
        .in('availability_status', ['available', 'limited']);

      if (!m10Error && m10Data) {
        m10Profiles = m10Data;
      }
    }

    // Get DJ Dash profiles for this city
    const { data: allProfiles, error: profilesError } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        dj_slug,
        tagline,
        profile_image_url,
        cover_image_url,
        city,
        state,
        starting_price_range,
        event_types,
        is_featured,
        organization_id,
        organizations!inner(product_context)
      `)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash')
      .or(`city.ilike.%${cityName}%,primary_city.ilike.%${cityName}%`)
      .in('availability_status', ['available', 'limited'])
      .order('is_featured', { ascending: false })
      .order('page_views', { ascending: false })
      .limit(12);

    if (profilesError) {
      console.error('Error fetching DJ profiles:', profilesError);
    }

    // Combine profiles: M10 DJ Company first (always featured), then DJ Dash profiles
    const combinedProfiles = [
      ...m10Profiles.map(p => ({ ...p, is_featured: true, is_m10_dj_company: true })),
      ...(allProfiles || []).filter(p => !m10Profiles.some(m10 => m10.id === p.id))
    ];

    // Get aggregate ratings for each profile
    const profilesWithRatings = await Promise.all(
      combinedProfiles.map(async (profile) => {
        const { data: reviews } = await supabase
          .from('dj_reviews')
          .select('rating')
          .eq('dj_profile_id', profile.id)
          .eq('is_verified', true)
          .eq('is_approved', true);

        let aggregate_rating: number | undefined = undefined;
        let review_count = 0;

        if (reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
          aggregate_rating = totalRating / reviews.length;
          review_count = reviews.length;
        }

        return {
          ...profile,
          is_featured: profile.is_featured ?? false,
          aggregate_rating,
          review_count
        };
      })
    );

    // Sort: M10 DJ Company first (always), then by featured status, then by page views
    profilesWithRatings.sort((a, b) => {
      // M10 DJ Company always first
      const aIsM10 = (a as any).is_m10_dj_company;
      const bIsM10 = (b as any).is_m10_dj_company;
      if (aIsM10 && !bIsM10) return -1;
      if (!aIsM10 && bIsM10) return 1;

      // Then by featured status
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;

      // Then by rating
      if ((a.aggregate_rating || 0) > (b.aggregate_rating || 0)) return -1;
      if ((a.aggregate_rating || 0) < (b.aggregate_rating || 0)) return 1;

      return 0;
    });

    return profilesWithRatings.slice(0, 12); // Limit to 12 total
  } catch (error) {
    console.error('Error fetching DJ profiles:', error);
    return [];
  }
}

export default async function FindDJCityPage({ params }: PageProps) {
  const cityData = cities[params.city as CityKey];
  
  if (!cityData) {
    notFound();
  }

  const { name, state, stateAbbr, population, djCount } = cityData;
  
  // Fetch DJ profiles for this city
  const cityDJs = await getCityDJs(name, stateAbbr);

  // Generate ItemList schema for DJ companies (for rich results)
  const djCompaniesList = cityDJs && cityDJs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `DJ Companies in ${name}, ${state}`,
    description: `List of professional DJ companies and DJs in ${name}, ${state}`,
    numberOfItems: Math.min(cityDJs.length, 20), // Limit to top 20 for performance
    itemListElement: cityDJs.slice(0, 20).map((dj: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `https://www.djdash.net/dj/${dj.dj_slug}`,
        name: dj.dj_name || 'Professional DJ',
        description: dj.tagline || `Professional DJ services in ${name}`,
        url: `https://www.djdash.net/dj/${dj.dj_slug}`,
        image: dj.profile_image_url,
        address: {
          '@type': 'PostalAddress',
          addressLocality: dj.city || name,
          addressRegion: dj.state || stateAbbr,
          addressCountry: 'US',
        },
        priceRange: dj.starting_price_range,
        areaServed: {
          '@type': 'City',
          name: name,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `DJ Directory - ${name}, ${state}`,
            description: `Professional DJ directory for ${name}, ${state}. Find verified DJs for weddings, corporate events, and parties.`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: name,
              addressRegion: stateAbbr,
              addressCountry: 'US',
            },
            areaServed: {
              '@type': 'City',
              name: name,
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: djCount,
            },
          }),
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
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                <span>{name}, {state}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900 dark:text-white">Find Professional</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  DJs in {name}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Browse {djCount} verified professional DJs in {name}, {state}. Get free quotes for weddings, corporate events, parties, and more.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a 
                  href="#find-dj-form"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Free Quotes
                </a>
                <Link 
                  href={`/djdash/find-dj/${params.city}/wedding-djs`}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                >
                  Browse Wedding DJs
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{djCount} Verified DJs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Quotes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Same-Day Response</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{djCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Verified DJs in {name}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">4.9★</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Events Booked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">24hr</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured DJs Section */}
        {cityDJs && cityDJs.length > 0 && (
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Featured DJs in {name}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Browse verified professional DJs available in {name}, {state}
                </p>
              </div>
              <FeaturedDJProfiles 
                profiles={cityDJs} 
                title={`Featured DJs in ${name}`}
                showViewAll={false}
              />
            </div>
          </section>
        )}

        {/* Event Types */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Find DJs for Any Event in {name}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Browse DJs by event type to find the perfect match for your occasion
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Wedding DJs', icon: '💒', slug: 'wedding-djs', count: '80+' },
                { name: 'Corporate DJs', icon: '🏢', slug: 'corporate-djs', count: '60+' },
                { name: 'Birthday Party DJs', icon: '🎂', slug: 'birthday-djs', count: '50+' },
                { name: 'School Dance DJs', icon: '🎓', slug: 'school-dance-djs', count: '40+' },
                { name: 'Holiday Party DJs', icon: '🎄', slug: 'holiday-djs', count: '35+' },
                { name: 'Bar & Club DJs', icon: '🍺', slug: 'bar-djs', count: '45+' },
                { name: 'Festival DJs', icon: '🎪', slug: 'festival-djs', count: '30+' },
                { name: 'Private Event DJs', icon: '🏠', slug: 'private-djs', count: '55+' },
              ].map((event) => (
                <Link
                  key={event.slug}
                  href={`/djdash/find-dj/${params.city}/${event.slug}`}
                  className="p-6 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center group"
                >
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{event.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{event.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.count} DJs available</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Lead Capture Form */}
        <section id="find-dj-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Get Free Quotes from {name} DJs
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Tell us about your event and we&apos;ll connect you with the best DJs in {name}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-8 border border-blue-100 dark:border-gray-700">
              <form className="space-y-6" action="/api/djdash/lead-capture" method="POST">
                <input type="hidden" name="city" value={name} />
                <input type="hidden" name="state" value={stateAbbr} />
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(901) 555-1234"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Type *
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select event type</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="Birthday Party">Birthday Party</option>
                      <option value="School Dance">School Dance</option>
                      <option value="Holiday Party">Holiday Party</option>
                      <option value="Private Party">Private Party</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      id="guests"
                      name="guests"
                      min="1"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Venue name"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tell us about your event
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests, music preferences, or details about your event..."
                  ></textarea>
                </div>
                
                <Button
                  type="submit"
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Free Quotes from {djCount} {name} DJs
                  <ArrowRight className="ml-2 w-5 h-5 inline" />
                </Button>
                
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  By submitting, you agree to receive quotes from verified DJs in {name}. We&apos;ll never share your information.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Why Choose DJ Dash Directory */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why Use DJ Dash to Find a DJ in {name}?
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verified DJs Only</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All DJs in our {name} directory are verified professionals with reviews, portfolios, and insurance.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free Quotes</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get multiple quotes from {name} DJs instantly. Compare prices, reviews, and availability—all for free.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Same-Day Response</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Most {name} DJs respond within 24 hours. Get matched with available DJs for your event date.
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

