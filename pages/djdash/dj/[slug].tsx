import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { 
  MapPin, 
  Calendar, 
  Music, 
  Star, 
  Award, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook,
  Youtube,
  Headphones,
  DollarSign,
  Users,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import DJInquiryForm from '@/components/djdash/DJInquiryForm';
import DJReviews from '@/components/djdash/DJReviews';
import DJPhoneNumber from '@/components/djdash/DJPhoneNumber';
import DJDashHeader from '@/components/djdash/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { generateStructuredData } from '@/utils/generateStructuredData';

interface DJProfile {
  id: string;
  dj_name: string;
  dj_slug: string;
  tagline: string | null;
  bio: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  city: string | null;
  state: string | null;
  service_radius_miles: number;
  service_areas: string[] | null;
  event_types: string[] | null;
  starting_price_range: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  availability_status: string;
  availability_message: string | null;
  photo_gallery_urls: string[] | null;
  video_highlights: any;
  soundcloud_url: string | null;
  mixcloud_url: string | null;
  social_links: any;
  organization_id: string;
}

interface DJBadge {
  id: string;
  badge_type: string;
  badge_label: string;
  badge_icon: string | null;
}

interface DJHostedPageProps {
  profile: DJProfile | null;
  badges: DJBadge[];
  aggregateRating: { ratingValue: number; reviewCount: number } | null;
  error?: string;
}

export default function DJHostedPage({ profile, badges, aggregateRating, error }: DJHostedPageProps) {
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center p-8">
          <div className="mb-6 inline-block p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <Zap className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            DJ Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {error || 'This DJ profile does not exist or is not published.'}
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    );
  }

  const pageUrl = `https://djdash.net/dj/${profile.dj_slug}`;
  const fullLocation = [profile.city, profile.state]
    .filter(Boolean)
    .join(', ');

  // Generate comprehensive structured data
  const structuredData = generateStructuredData({
    pageType: 'dj_profile',
    canonical: `/dj/${profile.dj_slug}`,
    title: `${profile.dj_name} | ${fullLocation ? `DJ in ${fullLocation}` : 'Professional DJ'}`,
    description: profile.bio || profile.tagline || `Book ${profile.dj_name} for your event${fullLocation ? ` in ${fullLocation}` : ''}. ${profile.starting_price_range ? `Starting at ${profile.starting_price_range}.` : ''}`,
    djName: profile.dj_name,
    djSlug: profile.dj_slug,
    bio: profile.bio || undefined,
    tagline: profile.tagline || undefined,
    profileImageUrl: profile.profile_image_url || undefined,
    coverImageUrl: profile.cover_image_url || undefined,
    city: profile.city || undefined,
    state: profile.state || undefined,
    serviceRadiusMiles: profile.service_radius_miles || undefined,
    serviceAreas: profile.service_areas || undefined,
    eventTypes: profile.event_types || undefined,
    startingPriceRange: profile.starting_price_range || undefined,
    priceRangeMin: profile.price_range_min || undefined,
    priceRangeMax: profile.price_range_max || undefined,
    availabilityStatus: profile.availability_status || undefined,
    socialLinks: profile.social_links || undefined,
    aggregateRating: aggregateRating || undefined
  });

  return (
    <>
      <DJDashHeader />
      <Head>
        <title>
          {`${profile.dj_name} | ${fullLocation ? 'DJ in ' + fullLocation : 'Professional DJ'} | DJ Dash`}
        </title>
        <meta
          name="description"
          content={
            profile.bio ||
            profile.tagline ||
            `Book ${profile.dj_name} for your event${fullLocation ? ` in ${fullLocation}` : ''}. ${profile.starting_price_range ? `Starting at ${profile.starting_price_range}.` : ''} Professional DJ services with verified reviews.`
          }
        />
        <meta name="keywords" content={`${profile.dj_name}, DJ ${fullLocation}, ${profile.event_types?.join(', ') || 'DJ'} services, professional DJ, event DJ`} />
        <meta property="og:title" content={`${profile.dj_name} | Professional DJ${fullLocation ? ` in ${fullLocation}` : ''}`} />
        <meta property="og:description" content={profile.tagline || profile.bio || `Professional DJ services by ${profile.dj_name}`} />
        <meta property="og:image" content={profile.cover_image_url || profile.profile_image_url || ''} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${profile.dj_name} | Professional DJ`} />
        <meta name="twitter:description" content={profile.tagline || profile.bio || ''} />
        <meta name="twitter:image" content={profile.cover_image_url || profile.profile_image_url || ''} />
        <link rel="canonical" href={pageUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16">
        {/* Futuristic Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90 dark:opacity-95">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          </div>
          
          {/* Cover Image Overlay */}
          {profile.cover_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.cover_image_url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
          )}
          
          {/* Glassmorphism Content Container */}
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8">
              {/* Profile Image with Glow Effect */}
              {profile.profile_image_url && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative">
                    <img
                      src={profile.profile_image_url}
                      alt={profile.dj_name}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl object-cover relative z-10"
                    />
                  </div>
                </div>
              )}
              
              {/* Profile Info with Glassmorphism */}
              <div className="flex-1 backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 rounded-2xl p-6 sm:p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
                    {profile.dj_name}
                  </h1>
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {badges.slice(0, 3).map((badge) => (
                        <Badge
                          key={badge.id}
                          className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all"
                        >
                          <Award className="w-3 h-3 mr-1" />
                          {badge.badge_label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {profile.tagline && (
                  <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-4 drop-shadow-md">
                    {profile.tagline}
                  </p>
                )}
                
                {/* Rating Display */}
                {aggregateRating && aggregateRating.reviewCount > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(aggregateRating.ratingValue)
                              ? 'text-yellow-400 fill-current'
                              : 'text-white/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-white font-semibold text-lg">
                      {aggregateRating.ratingValue}
                    </span>
                    <span className="text-white/80">
                      ({aggregateRating.reviewCount} {aggregateRating.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                
                {/* Location & Service Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90">
                  {fullLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">{fullLocation}</span>
                    </div>
                  )}
                  {profile.service_radius_miles && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Serves {profile.service_radius_miles} mile radius</span>
                    </div>
                  )}
                  {profile.starting_price_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold">Starting at {profile.starting_price_range}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Modern Cards */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Availability Status Card */}
              {profile.availability_status && (
                <Card className="p-6 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Availability
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant={
                        profile.availability_status === 'available'
                          ? 'default'
                          : profile.availability_status === 'limited'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-base px-4 py-2"
                    >
                      {profile.availability_status === 'available' && <CheckCircle className="w-4 h-4 mr-1" />}
                      {profile.availability_status.charAt(0).toUpperCase() +
                        profile.availability_status.slice(1)}
                    </Badge>
                    {profile.availability_message && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {profile.availability_message}
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Bio Card */}
              {profile.bio && (
                <Card className="p-6 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      About {profile.dj_name}
                    </h2>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </Card>
              )}

              {/* Event Types Card */}
              {profile.event_types && profile.event_types.length > 0 && (
                <Card className="p-6 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Event Types
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {profile.event_types.map((type) => (
                      <Badge 
                        key={type} 
                        variant="outline" 
                        className="text-base sm:text-lg px-4 sm:px-5 py-2 sm:py-2.5 border-2 hover:scale-105 transition-transform bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600"
                      >
                        <Music className="w-4 h-4 mr-2" />
                        {type
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Photo Gallery Card */}
              {profile.photo_gallery_urls && profile.photo_gallery_urls.length > 0 && (
                <Card className="p-6 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    Photo Gallery
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {profile.photo_gallery_urls.slice(0, 6).map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group overflow-hidden rounded-lg aspect-square"
                      >
                        <img
                          src={url}
                          alt={`${profile.dj_name} event photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar - Sticky on Desktop */}
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* CTA Card with Gradient */}
              <Card className="p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl border-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Book?</h3>
                  <p className="mb-6 text-white/90 text-base sm:text-lg">
                    Get a custom quote for your event. {profile.dj_name} will respond within 24 hours.
                  </p>
                  <div className="space-y-3">
                    {/* Phone Number - Only shows proxy/virtual numbers for call tracking */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <DJPhoneNumber 
                        djProfileId={profile.id}
                        // Removed fallbackNumber - we NEVER show real phone numbers
                        // Only proxy/virtual numbers are displayed for call tracking
                      />
                    </div>
                    <Button
                      asChild
                      className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold text-base sm:text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      <a href="#inquiry-form">Request a Quote</a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-2 border-white text-white hover:bg-white/10 font-semibold text-base sm:text-lg py-6 backdrop-blur-sm"
                      size="lg"
                    >
                      <a href="#reviews">View Reviews</a>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Pricing Card */}
              {profile.starting_price_range && (
                <Card className="p-6 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Starting Price
                  </h3>
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {profile.starting_price_range}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Final pricing depends on event details, duration, and equipment needs.
                  </p>
                </Card>
              )}

              {/* Social Links Card */}
              {profile.social_links && (
                <Card className="p-6 sm:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Connect
                  </h3>
                  <div className="space-y-3">
                    {profile.social_links.instagram && (
                      <a
                        href={profile.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all group"
                      >
                        <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Instagram</span>
                      </a>
                    )}
                    {profile.social_links.facebook && (
                      <a
                        href={profile.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                      >
                        <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Facebook</span>
                      </a>
                    )}
                    {profile.social_links.youtube && (
                      <a
                        href={profile.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all group"
                      >
                        <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">YouTube</span>
                      </a>
                    )}
                    {profile.soundcloud_url && (
                      <a
                        href={profile.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all group"
                      >
                        <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">SoundCloud</span>
                      </a>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Reviews Section - Full Width on Desktop */}
          <div id="reviews" className="w-full -mx-4 sm:-mx-6 lg:-mx-8 mt-12 sm:mt-16">
            <DJReviews
              djProfileId={profile.id}
              djName={profile.dj_name}
              djUrl={pageUrl}
            />
          </div>

          {/* Inquiry Form Section */}
          <div id="inquiry-form" className="mt-12 sm:mt-16">
            <DJInquiryForm
              djProfileId={profile.id}
              djName={profile.dj_name}
              minimumBudget={profile.price_range_min || undefined}
              eventTypes={profile.event_types || undefined}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params!;
  
  // Log for debugging
  console.log('[DJ Profile] Fetching profile for slug:', slug);
  
  const supabase = createServerSupabaseClient(context);

  try {
    // Fetch DJ profile
    const { data: profile, error: profileError } = await supabase
      .from('dj_profiles')
      .select('*')
      .eq('dj_slug', slug)
      .eq('is_published', true)
      .single();
    
    console.log('[DJ Profile] Query result:', { 
      hasProfile: !!profile, 
      error: profileError?.message,
      slug 
    });

    if (profileError || !profile) {
      return {
        props: {
          profile: null,
          badges: [],
          aggregateRating: null,
          error: 'DJ profile not found'
        }
      };
    }

    // Verify organization is DJ Dash
    const { data: org } = await supabase
      .from('organizations')
      .select('product_context')
      .eq('id', profile.organization_id)
      .single();

    if (!org || org.product_context !== 'djdash') {
      return {
        props: {
          profile: null,
          badges: [],
          aggregateRating: null,
          error: 'Invalid profile'
        }
      };
    }

    // Fetch badges
    const { data: badges } = await supabase
      .from('dj_badges')
      .select('*')
      .eq('dj_profile_id', profile.id)
      .eq('is_active', true)
      .order('earned_at', { ascending: false });

    // Fetch aggregate rating from verified reviews
    const { data: reviews } = await supabase
      .from('dj_reviews')
      .select('rating')
      .eq('dj_profile_id', profile.id)
      .eq('is_verified', true)
      .eq('is_approved', true);

    let aggregateRating = null;
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;
      aggregateRating = {
        ratingValue: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length
      };
    }

    // Track page view (async, don't wait)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/djdash/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dj_profile_id: profile.id,
        event_type: 'page_view'
      })
    }).catch(() => {}); // Ignore errors

    return {
      props: {
        profile,
        badges: badges || [],
        aggregateRating
      }
    };
  } catch (error) {
    console.error('Error fetching DJ profile:', error);
    return {
      props: {
        profile: null,
        badges: [],
        error: 'Failed to load profile'
      }
    };
  }
};
