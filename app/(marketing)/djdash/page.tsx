import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import FeaturedDJProfiles from '@/components/djdash/FeaturedDJProfiles';
import CitySearchBar from '@/components/djdash/CitySearchBar';
import { getPlatformStats, formatStatNumber, formatRevenue, getTrustDescription } from '@/utils/djdash/get-platform-stats';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Calendar,
  Music,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Award,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';

// Generate metadata dynamically with real stats
export async function generateMetadata(): Promise<Metadata> {
  const platformStats = await getPlatformStats();
  
  return {
    title: `DJ Dash - #1 DJ Directory & Booking Software | Find ${formatStatNumber(platformStats.totalDJs)} Professional DJs`,
    description: `Find the perfect DJ for your wedding, party, or event. Browse ${formatStatNumber(platformStats.totalDJs)} verified professional DJs nationwide. Get free quotes, read real reviews, and book instantly. The #1 DJ directory and booking software trusted by ${getTrustDescription(platformStats.totalOrganizations)}.`,
    keywords: [
      'DJ directory',
      'find a DJ',
      'DJ near me',
      'DJ booking software',
      'wedding DJ',
      'party DJ',
      'event DJ',
      'professional DJ',
      'DJ for hire',
      'hire a DJ',
      'DJ booking',
      'wedding DJs',
      'corporate DJs',
      'DJ services',
      'best DJ',
      'DJ for wedding',
      'DJ for party',
      'DJ for event',
      'DJ CRM',
      'DJ management software'
    ],
    openGraph: {
      title: 'DJ Dash - #1 DJ Directory & Booking Software | Find Professional DJs',
      description: `Find the perfect professional DJ for your wedding, party, or event. Browse ${formatStatNumber(platformStats.totalDJs)} verified DJs nationwide. Get free quotes, read real reviews, and book instantly. #1 DJ directory and booking software.`,
      url: 'https://www.djdash.net',
      siteName: 'DJ Dash',
      images: [
        {
          url: '/assets/djdash-og-image.png',
          width: 1200,
          height: 630,
          alt: 'DJ Dash - #1 DJ Directory & Booking Software',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'DJ Dash - #1 DJ Directory & Booking Software | Find Professional DJs',
      description: `Find the perfect professional DJ for your wedding, party, or event. Browse ${formatStatNumber(platformStats.totalDJs)} verified DJs nationwide. Get free quotes and book instantly.`,
      images: ['/assets/djdash-og-image.png'],
    },
    alternates: {
      canonical: 'https://www.djdash.net',
    },
  };
}

// Fetch featured DJ profiles for marketplace display
async function getFeaturedDJProfiles() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const M10_DJ_COMPANY_ORG_ID = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

    // Always include M10 DJ Company profiles first (Memphis-based)
    // Query without availability_status filter to be more lenient
    const { data: m10Profiles, error: m10Error } = await supabase
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
      .order('is_featured', { ascending: false })
      .limit(2); // Get up to 2 M10 DJ Company profiles

    if (m10Error) {
      console.error('Error fetching M10 DJ Company profiles:', m10Error);
    }

    // Log for debugging
    if (m10Profiles && m10Profiles.length > 0) {
      console.log('Found M10 DJ Company profiles:', m10Profiles.length);
    } else {
      console.log('No M10 DJ Company profiles found. Organization ID:', M10_DJ_COMPANY_ORG_ID);
    }

    // Get all published DJ Dash profiles
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
        organization_id
      `)
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12);

    if (profilesError) {
      console.error('Error fetching DJ profiles:', profilesError);
    }

    // Filter to only DJ Dash profiles by checking organizations
    const orgIds = Array.from(new Set((allProfiles || []).map(p => p.organization_id)));
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, product_context')
      .in('id', orgIds)
      .eq('product_context', 'djdash');

    const djdashOrgIds = new Set((orgs || []).map(o => o.id));
    const djdashProfiles = (allProfiles || []).filter(p => djdashOrgIds.has(p.organization_id));

    // Combine: M10 DJ Company first (always featured), then DJ Dash profiles
    const combinedProfiles = [
      ...(m10Profiles || []).map(p => ({ ...p, is_featured: true, is_m10_dj_company: true })),
      ...djdashProfiles.filter(p => !(m10Profiles || []).some(m10 => m10.id === p.id))
    ].slice(0, 8); // Limit to 8 total

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
          aggregate_rating,
          review_count
        };
      })
    );

    // Sort: M10 DJ Company first, then by featured status
    profilesWithRatings.sort((a, b) => {
      const aIsM10 = (a as any).is_m10_dj_company;
      const bIsM10 = (b as any).is_m10_dj_company;
      if (aIsM10 && !bIsM10) return -1;
      if (!aIsM10 && bIsM10) return 1;
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });

    return profilesWithRatings;
  } catch (error) {
    console.error('Error fetching DJ profiles:', error);
    return [];
  }
}

export default async function HomePage() {
  const featuredDJs = await getFeaturedDJProfiles();
  const platformStats = await getPlatformStats();

  return (
    <>
      {/* Organization Schema - Enhanced for better search appearance */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'DJ Dash',
            url: 'https://www.djdash.net',
            logo: {
              '@type': 'ImageObject',
              url: 'https://www.djdash.net/assets/DJ-Dash-Logo-Black-1.PNG',
              width: 300,
              height: 300
            },
            description: `The #1 DJ directory and booking software. Find ${formatStatNumber(platformStats.totalDJs)} verified professional DJs for weddings, parties, and events nationwide.`,
            sameAs: [
              'https://www.facebook.com/djdash',
              'https://www.twitter.com/djdash',
              'https://www.instagram.com/djdash',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              availableLanguage: 'English',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: platformStats.averageRating.toString(),
              reviewCount: platformStats.totalReviews.toString(),
              bestRating: '5',
              worstRating: '1',
            },
          }),
        }}
      />
      {/* WebSite Schema with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'DJ Dash',
            url: 'https://www.djdash.net',
            description: `Find the perfect professional DJ for your wedding, party, or event. Browse ${formatStatNumber(platformStats.totalDJs)} verified DJs nationwide.`,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://www.djdash.net/find-dj?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.djdash.net',
              },
            ],
          }),
        }}
      />
      {/* FAQ Schema for Featured Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How do I find a DJ near me?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Use DJ Dash to search for professional DJs in your city. Enter your location in the search bar, browse verified DJ profiles, read reviews, and get free quotes. We have ${formatStatNumber(platformStats.totalDJs)} verified professional DJs nationwide.`,
                },
              },
              {
                '@type': 'Question',
                name: 'Is DJ Dash free to use?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, finding and contacting DJs on DJ Dash is completely free. Get free quotes from multiple DJs, read reviews, and compare options at no cost.',
                },
              },
              {
                '@type': 'Question',
                name: 'How many DJs are on DJ Dash?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `DJ Dash has ${formatStatNumber(platformStats.totalDJs)} verified professional DJs nationwide. All DJs are verified and background checked for your peace of mind.`,
                },
              },
              {
                '@type': 'Question',
                name: 'Can I book a DJ instantly?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, you can get instant quotes from DJs and book directly through DJ Dash. Many DJs offer instant booking for available dates.',
                },
              },
            ],
          }),
        }}
      />
      {/* ItemList Schema for DJ Directory */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Professional DJ Directory',
            description: `Directory of ${formatStatNumber(platformStats.totalDJs)} verified professional DJs available for weddings, parties, and events`,
            numberOfItems: platformStats.totalDJs,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Wedding DJs',
                url: 'https://www.djdash.net/find-dj/memphis-tn/wedding-djs',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Corporate Event DJs',
                url: 'https://www.djdash.net/find-dj/memphis-tn',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Party DJs',
                url: 'https://www.djdash.net/find-dj/memphis-tn',
              },
            ],
          }),
        }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
      
        {/* Hero Section - Lead Generation Focused */}
        <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatStatNumber(platformStats.totalDJs)} Verified Professional DJs</span>
              </div>

              {/* Main Headline - SEO Optimized */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight mb-6">
                <span className="block text-gray-900 dark:text-white">Find the Perfect</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  Professional DJ Near Me
                  </span>
                <span className="block text-gray-900 dark:text-white">for Your Wedding, Party & Events</span>
                </h1>
                
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-3xl mx-auto">
                Browse {formatStatNumber(platformStats.totalDJs)} verified professional DJs nationwide. Get free quotes, read real reviews, and book instantly. The #1 DJ directory and booking software trusted by {getTrustDescription(platformStats.totalOrganizations)}.
              </p>

              {/* Search Bar - Primary CTA */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <CitySearchBar 
                      placeholder="Enter your city or zip code"
                      showSuggestions={true}
                    />
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Quotes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Verified DJs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Instant Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Real Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Featured DJ Profiles - Marketplace Showcase */}
        {featuredDJs.length > 0 && (
          <FeaturedDJProfiles 
            profiles={featuredDJs.slice(0, 8)}
            title="Featured Professional DJs"
            showViewAll={true}
          />
        )}

        {/* Trust & Social Proof Section */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why {getTrustDescription(platformStats.totalOrganizations).charAt(0).toUpperCase() + getTrustDescription(platformStats.totalOrganizations).slice(1)} Trust DJ Dash
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The #1 platform for finding and booking professional DJs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="inline-flex p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{formatStatNumber(platformStats.totalDJs)}</div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Verified DJs</div>
                <p className="text-gray-600 dark:text-gray-400">
                  All DJs are verified professionals with background checks
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="inline-flex p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
                  <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400 fill-current" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{platformStats.averageRating}/5</div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Average Rating</div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatStatNumber(platformStats.totalReviews)} real reviews from verified clients who booked these DJs
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">45,000+</div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Events Booked</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Successful events booked through our platform
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Search by Event Type */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Find DJs by Event Type
            </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Whether you're planning a wedding, corporate event, or party, we have the perfect DJ for you.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                {
                  title: 'Wedding DJs',
                  description: 'Professional DJs specializing in weddings and receptions',
                  icon: Music,
                  href: '/djdash/find-dj/memphis-tn/wedding-djs',
                  gradient: 'from-pink-500 to-rose-500',
                  count: '500+'
                },
                {
                  title: 'Corporate Event DJs',
                  description: 'Experienced DJs for corporate events and conferences',
                icon: Users,
                  href: '/djdash/find-dj/memphis-tn',
                  gradient: 'from-blue-500 to-cyan-500',
                  count: '300+'
              },
              {
                  title: 'Party DJs',
                  description: 'Fun, energetic DJs for birthdays, anniversaries, and celebrations',
                icon: Calendar,
                  href: '/djdash/find-dj/memphis-tn',
                  gradient: 'from-purple-500 to-pink-500',
                  count: '400+'
                },
              ].map((eventType, idx) => (
                <Link
                key={idx}
                  href={eventType.href}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${eventType.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <eventType.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {eventType.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {eventType.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {eventType.count} Available
                    </span>
                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
            ))}
          </div>
        </div>
      </section>

        {/* Find DJs by City */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Find DJs in Your City
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Browse professional DJs available in cities across the United States
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { city: 'Memphis', state: 'TN', slug: 'find-dj/memphis-tn' },
              { city: 'Nashville', state: 'TN', slug: 'find-dj/nashville-tn' },
              { city: 'Atlanta', state: 'GA', slug: 'find-dj/atlanta-ga' },
              { city: 'Los Angeles', state: 'CA', slug: 'find-dj/los-angeles-ca' },
              { city: 'New York', state: 'NY', slug: 'find-dj/new-york-ny' },
              { city: 'Chicago', state: 'IL', slug: 'find-dj/chicago-il' },
              { city: 'Houston', state: 'TX', slug: 'find-dj/houston-tx' },
              { city: 'Miami', state: 'FL', slug: 'find-dj/miami-fl' },
            ].map((location) => (
              <Link
                key={location.slug}
                href={`/djdash/${location.slug}`}
                  className="group p-6 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center hover:shadow-lg"
              >
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {location.city}, {location.state}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Find DJs in {location.city}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/djdash/find-dj/memphis-tn"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
                View All Cities
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

        {/* Why Choose DJ Dash Directory */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose DJ Dash?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The easiest way to find and book professional DJs for your event
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Verified Professionals',
                  description: 'All DJs are verified and background checked for your peace of mind',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: Star,
                  title: 'Real Reviews',
                  description: 'Read authentic reviews from real clients who booked these DJs',
                  gradient: 'from-yellow-500 to-orange-500'
                },
                {
                  icon: Clock,
                  title: 'Instant Quotes',
                  description: 'Get free quotes from multiple DJs instantly, no waiting required',
                  gradient: 'from-green-500 to-emerald-500'
                },
                {
                  icon: Award,
                  title: 'Top Rated DJs',
                  description: 'Only the best DJs make it into our directory—quality guaranteed',
                  gradient: 'from-purple-500 to-pink-500'
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="text-center group"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: formatStatNumber(platformStats.totalDJs), label: 'Professional DJs', icon: Users },
                { value: '45,000+', label: 'Events Booked', icon: Calendar },
                { value: `${platformStats.averageRating}/5`, label: 'Average Rating', icon: Star },
                { value: '98%', label: 'Satisfaction Rate', icon: TrendingUp },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="inline-flex p-4 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Lead Generation */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Ready to Find Your Perfect DJ?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Browse our directory of {formatStatNumber(platformStats.totalDJs)} verified professional DJs. Get free quotes and book instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/djdash/find-dj/memphis-tn"
                className="inline-flex items-center justify-center gap-2 px-8 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1"
              >
                <Search className="w-6 h-6" />
                Find DJs Now
              </Link>
              <Link
                href="/business"
                className="inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
              >
                Are you a DJ? Learn More
              </Link>
            </div>
          </div>
        </section>

      <DJDashFooter />
    </div>
    </>
  );
}
