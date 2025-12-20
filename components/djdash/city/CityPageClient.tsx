'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Clock,
  DollarSign,
  Heart,
  Building2,
  GraduationCap,
  Cake,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CityInquiryForm from '@/components/djdash/city/CityInquiryForm';
import DJPhoneNumber from '@/components/djdash/DJPhoneNumber';
import { CityDataSnapshot } from '@/utils/data/city-data-aggregator';
import { DirectAnswerBlock, MarketSnapshot, LocalInsights } from '@/utils/content/city-content-assembler';

interface CityPage {
  id: string;
  city_slug: string;
  city_name: string;
  state: string;
  state_abbr: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  content_html: string | null;
  ai_generated_content: any;
  featured_dj_ids: string[] | null;
  event_type_demand: any;
  local_tips: string[] | null;
  seasonal_trends: any;
  total_djs: number;
  total_reviews: number;
  avg_rating: number | null;
  total_bookings: number;
}

interface DJProfile {
  id: string;
  dj_name: string;
  dj_slug: string;
  tagline: string | null;
  profile_image_url: string | null;
  city: string | null;
  state: string | null;
  starting_price_range: string | null;
  availability_status: string;
  event_types: string[] | null;
}

interface VenueSpotlight {
  id: string;
  venue_name: string;
  venue_address: string | null;
  venue_type: string | null;
  venue_image_url: string | null;
  description: string | null;
  dj_count: number;
  featured_dj_ids: string[] | null;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  headline: string | null;
  event_type: string | null;
  event_date: string | null;
  venue_name: string | null;
}

interface CityPageClientProps {
  cityPage: CityPage;
  featuredDJs: DJProfile[];
  venues: VenueSpotlight[];
  reviews: Review[];
  analytics: any;
  cityStats: CityDataSnapshot;
  directAnswer: DirectAnswerBlock;
  marketSnapshot: MarketSnapshot;
  localInsights: LocalInsights;
  faqs: Array<{ question: string; answer: string }>;
}

const eventTypeIcons: Record<string, any> = {
  wedding: Heart,
  corporate: Building2,
  school_dance: GraduationCap,
  birthday: Cake,
  private_party: PartyPopper,
  holiday_party: Sparkles,
};

export default function CityPageClient({
  cityPage,
  featuredDJs,
  venues,
  reviews,
  analytics,
  cityStats,
  directAnswer,
  marketSnapshot,
  localInsights,
  faqs,
}: CityPageClientProps) {
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  
  const eventTypes = [
    { slug: 'wedding', name: 'Weddings', icon: Heart },
    { slug: 'corporate', name: 'Corporate Events', icon: Building2 },
    { slug: 'birthday', name: 'Birthday Parties', icon: Cake },
    { slug: 'school_dance', name: 'School Dances', icon: GraduationCap },
    { slug: 'holiday_party', name: 'Holiday Parties', icon: Sparkles },
    { slug: 'private_party', name: 'Private Parties', icon: PartyPopper },
  ];
  
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
        {cityPage.hero_image_url && (
          <div className="absolute inset-0 z-0 opacity-10">
            <Image
              src={cityPage.hero_image_url}
              alt={`${cityPage.city_name} DJs`}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              <span>{cityPage.city_name}, {cityPage.state}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">
                {cityPage.hero_title || `Best DJs in ${cityPage.city_name}`}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {cityPage.hero_subtitle || `Discover top-rated DJs in ${cityPage.city_name}. Verified reviews, availability, pricing, and online booking.`}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a 
                href="#find-dj-form"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Book Now
              </a>
              <a 
                href="#check-availability"
                className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
              >
                Check Availability
              </a>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{cityStats.totalDJs || cityPage.total_djs || 0} Verified DJs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{cityStats.totalReviews || cityPage.total_reviews || 0} Reviews</span>
              </div>
              {(cityStats.averageRating || cityPage.avg_rating) && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span>{(cityStats.averageRating || cityPage.avg_rating)?.toFixed(1)}★ Average</span>
                </div>
              )}
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
      {!cityStats.meetsMinimumRequirements && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Market Still Growing
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The DJ market in {cityPage.city_name} is still developing. We're actively adding more DJs and collecting data to provide comprehensive insights.
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
            {cityPage.city_name} DJ Market Snapshot
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

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {cityPage.total_djs || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Verified DJs in {cityPage.city_name}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {cityPage.avg_rating ? `${cityPage.avg_rating.toFixed(1)}★` : '4.9★'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                {cityPage.total_bookings || 0}+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Events Booked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">24hr</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: What Locals Should Know (City-Specific) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            What Locals Should Know About Hiring a DJ in {cityPage.city_name}
          </h2>
          <div className="space-y-6">
            {localInsights.venueTypes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Popular Venue Types</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Popular venues in {cityPage.city_name} include {localInsights.venueTypes.slice(0, 3).join(', ')}.
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

      {/* SECTION 4: Featured DJs in [City] */}
      {featuredDJs.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Featured DJs in {cityPage.city_name}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Verified DJs with high response rates and positive reviews
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDJs.map((dj) => (
                <Card
                  key={dj.id}
                  className="p-6 hover:shadow-xl transition-all border-2 hover:border-blue-500 dark:hover:border-blue-500"
                >
                  <Link href={`/dj/${dj.dj_slug}`}>
                    <div className="flex items-start gap-4">
                      {dj.profile_image_url ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={dj.profile_image_url}
                            alt={dj.dj_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {dj.dj_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                          {dj.dj_name}
                        </h3>
                        {dj.tagline && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {dj.tagline}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {dj.starting_price_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {dj.starting_price_range}
                            </span>
                          )}
                          <Badge
                            variant={dj.availability_status === 'available' ? 'default' : 'secondary'}
                          >
                            {dj.availability_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button asChild size="lg" variant="outline">
                <Link href={`/djdash/find-dj/${cityPage.city_slug}`}>
                  View All {cityPage.city_name} DJs
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Event Types Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Find DJs for Any Event in {cityPage.city_name}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Browse DJs by event type to find the perfect match for your occasion
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((eventType) => {
              const Icon = eventType.icon;
              const demand = cityPage.event_type_demand?.[eventType.slug];
              const djCount = demand?.dj_count || 0;
              
              return (
                <Link
                  key={eventType.slug}
                  href={`/djdash/find-dj/${cityPage.city_slug}/${eventType.slug}`}
                  className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {eventType.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {djCount > 0 ? `${djCount}+ DJs available` : 'DJs available'}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Venue Spotlights */}
      {venues.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Popular Venues in {cityPage.city_name}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                DJs who have performed at these popular {cityPage.city_name} venues
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <Card key={venue.id} className="overflow-hidden hover:shadow-xl transition-all">
                  {venue.venue_image_url && (
                    <div className="relative w-full h-48">
                      <Image
                        src={venue.venue_image_url}
                        alt={venue.venue_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {venue.venue_name}
                    </h3>
                    {venue.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {venue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Music className="w-4 h-4" />
                      <span>{venue.dj_count} DJs have performed here</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Verified Reviews from {cityPage.city_name} Events
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Real reviews from real events in {cityPage.city_name}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.slice(0, 6).map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {review.reviewer_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {review.reviewer_name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.headline && (
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">
                          {review.headline}
                        </p>
                      )}
                      {review.event_type && review.venue_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {review.event_type} at {review.venue_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{review.review_text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: How DJ Dash Works (Short) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            How DJ Dash Works
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              DJ Dash is a marketplace that connects event planners with verified DJs. Submit one inquiry form and receive responses from multiple available DJs in {cityPage.city_name}. All DJs are availability-aware, meaning you'll only hear from DJs who are free on your event date. Pricing is transparent, and you won't receive spam calls—DJs respond through the platform.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>One inquiry form sends your event details to multiple DJs</li>
              <li>DJs respond directly through the platform (no spam calls)</li>
              <li>Compare pricing, reviews, and portfolios in one place</li>
              <li>Book directly with your chosen DJ</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="find-dj-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Get Free Quotes from {cityPage.city_name} DJs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Tell us about your event and we'll connect you with the best DJs in {cityPage.city_name}
            </p>
          </div>
          
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-gray-700">
            <CityInquiryForm
              city={cityPage.city_name}
              state={cityPage.state_abbr}
              featuredDJs={featuredDJs}
            />
          </Card>
        </div>
      </section>

      {/* SECTION 6: FAQ (LLM-Optimized) */}
      {faqs.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Common questions about hiring DJs in {cityPage.city_name}
              </p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index: number) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

