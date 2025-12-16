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
  CheckCircle
} from 'lucide-react';
import DJInquiryForm from '@/components/djdash/DJInquiryForm';
import DJReviews from '@/components/djdash/DJReviews';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { generateReviewSchema } from '@/utils/generateStructuredData';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            DJ Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error || 'This DJ profile does not exist or is not published.'}
          </p>
          <Button asChild>
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

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.dj_name,
    description: profile.bio || profile.tagline || `Professional DJ services in ${fullLocation}`,
    url: pageUrl,
    image: profile.profile_image_url || profile.cover_image_url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.city,
      addressRegion: profile.state
    },
    priceRange: profile.starting_price_range || undefined,
    areaServed: profile.service_areas?.map((area) => ({
      '@type': 'City',
      name: area
    })),
    ...(profile.social_links && {
      sameAs: Object.values(profile.social_links).filter(Boolean)
    }),
    // Add aggregate rating for SEO
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toString(),
        reviewCount: aggregateRating.reviewCount.toString(),
        bestRating: '5',
        worstRating: '1'
      }
    })
  };

  return (
    <>
      <Head>
        <title>
          {profile.dj_name} | {fullLocation ? `DJ in ${fullLocation}` : 'Professional DJ'}
        </title>
        <meta
          name="description"
          content={
            profile.bio ||
            profile.tagline ||
            `Book ${profile.dj_name} for your event${fullLocation ? ` in ${fullLocation}` : ''}. ${profile.starting_price_range ? `Starting at ${profile.starting_price_range}.` : ''}`
          }
        />
        <meta property="og:title" content={`${profile.dj_name} | Professional DJ`} />
        <meta property="og:description" content={profile.tagline || profile.bio || ''} />
        <meta property="og:image" content={profile.cover_image_url || profile.profile_image_url || ''} />
        <meta property="og:url" content={pageUrl} />
        <link rel="canonical" href={pageUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section with Cover Image */}
        <div className="relative h-[60vh] min-h-[400px] bg-gradient-to-br from-purple-600 to-blue-600">
          {profile.cover_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.cover_image_url})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}
          
          <div className="relative container mx-auto px-4 h-full flex items-end pb-12">
            <div className="flex items-end gap-6 w-full">
              {/* Profile Image */}
              {profile.profile_image_url && (
                <div className="relative">
                  <img
                    src={profile.profile_image_url}
                    alt={profile.dj_name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                </div>
              )}
              
              {/* Profile Info */}
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold">{profile.dj_name}</h1>
                  {badges.length > 0 && (
                    <div className="flex gap-2">
                      {badges.slice(0, 3).map((badge) => (
                        <Badge
                          key={badge.id}
                          className="bg-white/20 text-white border-white/30"
                        >
                          <Award className="w-3 h-3 mr-1" />
                          {badge.badge_label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {profile.tagline && (
                  <p className="text-xl md:text-2xl text-white/90 mb-4">{profile.tagline}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  {fullLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{fullLocation}</span>
                    </div>
                  )}
                  {profile.service_radius_miles && (
                    <span className="text-white/80">
                      Serves {profile.service_radius_miles} mile radius
                    </span>
                  )}
                  {profile.starting_price_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Starting at {profile.starting_price_range}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-12">
              {/* Availability Status */}
              {profile.availability_status && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Availability
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        profile.availability_status === 'available'
                          ? 'default'
                          : profile.availability_status === 'limited'
                          ? 'secondary'
                          : 'outline'
                      }
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

              {/* Bio */}
              {profile.bio && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    About {profile.dj_name}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {profile.bio}
                  </p>
                </Card>
              )}

              {/* Event Types */}
              {profile.event_types && profile.event_types.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Event Types
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {profile.event_types.map((type) => (
                      <Badge key={type} variant="outline" className="text-lg px-4 py-2">
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

              {/* Photo Gallery */}
              {profile.photo_gallery_urls && profile.photo_gallery_urls.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Photo Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.photo_gallery_urls.slice(0, 6).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`${profile.dj_name} event photo ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* Reviews */}
              <DJReviews
                djProfileId={profile.id}
                djName={profile.dj_name}
                djUrl={pageUrl}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CTA Card */}
              <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Book?</h3>
                <p className="mb-6 text-white/90">
                  Get a custom quote for your event. {profile.dj_name} will respond within 24 hours.
                </p>
                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full bg-white text-blue-600 hover:bg-gray-100"
                    size="lg"
                  >
                    <a href="#inquiry-form">Request a Quote</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-white text-white hover:bg-white/10"
                    size="lg"
                  >
                    <a href="#reviews">View Reviews</a>
                  </Button>
                </div>
              </Card>

              {/* Pricing */}
              {profile.starting_price_range && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Starting Price
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {profile.starting_price_range}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Final pricing depends on event details, duration, and equipment needs.
                  </p>
                </Card>
              )}

              {/* Social Links */}
              {profile.social_links && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Connect
                  </h3>
                  <div className="space-y-3">
                    {profile.social_links.instagram && (
                      <a
                        href={profile.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400"
                      >
                        <Instagram className="w-5 h-5" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {profile.social_links.facebook && (
                      <a
                        href={profile.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Facebook className="w-5 h-5" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {profile.social_links.youtube && (
                      <a
                        href={profile.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Youtube className="w-5 h-5" />
                        <span>YouTube</span>
                      </a>
                    )}
                    {profile.soundcloud_url && (
                      <a
                        href={profile.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
                      >
                        <Headphones className="w-5 h-5" />
                        <span>SoundCloud</span>
                      </a>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Inquiry Form Section */}
          <div id="inquiry-form" className="mt-12">
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

