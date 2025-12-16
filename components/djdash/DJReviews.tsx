'use client';

import React, { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateReviewSchema } from '@/utils/generateStructuredData';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  headline?: string;
  event_type?: string;
  event_date?: string;
  venue_name?: string;
  is_verified: boolean;
  positive_notes?: string[];
  review_aspects?: string[];
  created_at: string;
}

interface DJReviewsProps {
  djProfileId: string;
  djName: string;
  djUrl: string;
  className?: string;
  showSchema?: boolean;
}

export default function DJReviews({
  djProfileId,
  djName,
  djUrl,
  className = '',
  showSchema = true
}: DJReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregateRating, setAggregateRating] = useState({ rating: 0, count: 0 });

  useEffect(() => {
    fetchReviews();
  }, [djProfileId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/djdash/reviews?dj_profile_id=${djProfileId}`);
      const data = await response.json();
      
      if (data.reviews) {
        setReviews(data.reviews);
        
        // Calculate aggregate rating
        if (data.reviews.length > 0) {
          const totalRating = data.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0);
          const avgRating = totalRating / data.reviews.length;
          setAggregateRating({
            rating: Math.round(avgRating * 10) / 10,
            count: data.reviews.length
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Quote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to leave a review after your event!
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Generate schema markup
  const reviewSchema = showSchema
    ? generateReviewSchema({
        reviews: reviews.map((review) => ({
          author: review.reviewer_name,
          rating: review.rating,
          text: review.review_text,
          date: review.event_date || review.created_at,
          event: review.event_type,
          reviewAspect: review.review_aspects?.join(', '),
          headline: review.headline,
          positiveNotes: review.positive_notes,
          verified: review.is_verified
        })),
        itemReviewed: {
          '@type': 'LocalBusiness',
          name: djName,
          url: djUrl
        },
        aggregateRating: {
          ratingValue: aggregateRating.rating,
          reviewCount: aggregateRating.count
        },
        pageUrl: djUrl
      })
    : null;

  return (
    <>
      {reviewSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}

      <section className={`py-16 bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4">
          {/* Header with Aggregate Rating */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Verified Reviews
            </h2>
            {aggregateRating.count > 0 && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(aggregateRating.rating))}
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {aggregateRating.rating}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{aggregateRating.count}</span> verified review
                  {aggregateRating.count !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All reviews are verified from completed events. Only clients who have booked and
              completed events with {djName} can leave reviews.
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {review.reviewer_name}
                    </h4>
                    {review.event_type && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {review.event_type
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </p>
                    )}
                  </div>
                  {review.is_verified && (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {renderStars(review.rating)}
                </div>

                {/* Headline */}
                {review.headline && (
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {review.headline}
                  </h5>
                )}

                {/* Review Text */}
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{review.review_text}"
                </p>

                {/* Event Details */}
                {(review.venue_name || review.event_date) && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {review.venue_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Venue:</span> {review.venue_name}
                      </p>
                    )}
                    {review.event_date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(review.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Positive Notes */}
                {review.positive_notes && review.positive_notes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Highlights:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {review.positive_notes.map((note, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

