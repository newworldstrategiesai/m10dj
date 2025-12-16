'use client';

import React from 'react';
import Link from 'next/link';
// Note: Using regular img tag instead of Next.js Image for external URLs
import { Star, MapPin, DollarSign, Award, CheckCircle, Music, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DJProfile {
  id: string;
  dj_name: string;
  dj_slug: string;
  tagline: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  city: string | null;
  state: string | null;
  starting_price_range: string | null;
  event_types: string[] | null;
  is_featured: boolean;
  aggregate_rating?: number;
  review_count?: number;
}

interface FeaturedDJProfilesProps {
  profiles: DJProfile[];
  title?: string;
  showViewAll?: boolean;
}

export default function FeaturedDJProfiles({ 
  profiles, 
  title = 'Featured Professional DJs',
  showViewAll = true 
}: FeaturedDJProfilesProps) {
  if (!profiles || profiles.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.round(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Browse verified professional DJs with real reviews and ratings
            </p>
          </div>
          {showViewAll && (
            <Link
              href="/djdash/find-dj/memphis-tn"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              View All DJs
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/dj/${profile.dj_slug}`}
              className="group"
            >
              <Card className="h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                  {profile.cover_image_url ? (
                    <img
                      src={profile.cover_image_url}
                      alt={profile.dj_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Profile Image */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden shadow-xl">
                      {profile.profile_image_url ? (
                        <img
                          src={profile.profile_image_url}
                          alt={profile.dj_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Music className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {profile.is_featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-yellow-500 text-white border-0">
                        <Award className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="pt-16 pb-6 px-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {profile.dj_name}
                  </h3>
                  
                  {profile.tagline && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 line-clamp-2">
                      {profile.tagline}
                    </p>
                  )}

                  {/* Location */}
                  {(profile.city || profile.state) && (
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {[profile.city, profile.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {profile.aggregate_rating && profile.review_count && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {renderStars(profile.aggregate_rating)}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {profile.aggregate_rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({profile.review_count} reviews)
                      </span>
                    </div>
                  )}

                  {/* Price Range */}
                  {profile.starting_price_range && (
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Starting at {profile.starting_price_range}
                      </span>
                    </div>
                  )}

                  {/* Event Types */}
                  {profile.event_types && profile.event_types.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {profile.event_types.slice(0, 3).map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="text-xs"
                        >
                          <Music className="w-3 h-3 mr-1" />
                          {type
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Verified Badge */}
                  <div className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified Professional</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {showViewAll && (
          <div className="text-center mt-12 md:hidden">
            <Link
              href="/djdash/find-dj/memphis-tn"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              View All DJs
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

