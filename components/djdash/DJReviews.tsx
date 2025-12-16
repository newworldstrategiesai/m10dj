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

  // Generate comprehensive schema markup optimized for Google Rich Results and LLM retrieval
  let reviewSchema = null;
  if (showSchema && reviews.length > 0) {
    reviewSchema = generateReviewSchema({
      reviews: reviews.map((review) => ({
        author: review.reviewer_name,
        rating: review.rating,
        text: review.review_text,
        date: review.event_date || review.created_at,
        event: review.event_type,
        reviewAspect: review.review_aspects?.join(', ') || review.event_type || 'DJ Services',
        headline: review.headline,
        positiveNotes: review.positive_notes,
        verified: review.is_verified
      })),
      itemReviewed: {
        '@type': 'LocalBusiness',
        name: djName,
        url: djUrl
      },
      aggregateRating: aggregateRating.count > 0 ? {
        ratingValue: aggregateRating.rating,
        reviewCount: aggregateRating.count,
        bestRating: 5,
        worstRating: 1
      } : undefined,
      pageUrl: djUrl
    });
  }

  return (
    <>
      {reviewSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}

      <section className={`py-16 bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="w-full">
          {/* Header with Aggregate Rating */}
          <div className="container mx-auto px-4 text-center mb-12">
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
            
            {/* FAQ Section for LLM Retrieval - Answers common questions about reviews */}
            {aggregateRating.count > 0 && (
              <div className="mt-8 max-w-3xl mx-auto text-left">
                <details className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                    Frequently Asked Questions About {djName}'s Reviews
                  </summary>
                  <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <strong>What is {djName}'s average rating?</strong>
                      <p>{djName} has an average rating of {aggregateRating.rating} out of 5 stars based on {aggregateRating.count} verified review{aggregateRating.count !== 1 ? 's' : ''} from completed events.</p>
                    </div>
                    <div>
                      <strong>Are these reviews verified?</strong>
                      <p>Yes, all reviews are verified from completed events. Only clients who have booked and completed events with {djName} can leave reviews.</p>
                    </div>
                    <div>
                      <strong>What types of events has {djName} DJ'd?</strong>
                      <p>{djName} has provided DJ services for various event types including {reviews.map(r => r.event_type).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map(et => et?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ') || 'weddings, corporate events, and private parties'}.</p>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Reviews Carousel - Full Width on Desktop */}
          <div className="relative w-full overflow-hidden">
            {/* Desktop: Auto-scrolling carousel */}
            <div className="hidden lg:block">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes reviewScroll {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }
                .review-carousel-track {
                  display: flex;
                  animation: reviewScroll 60s linear infinite;
                  width: fit-content;
                }
                .review-carousel-track:hover {
                  animation-play-state: paused;
                }
                .review-carousel-item {
                  flex: 0 0 auto;
                  width: 500px;
                  margin-right: 24px;
                }
              `}} />
              <div className="review-carousel-track">
                {/* Duplicate reviews for seamless loop */}
                {[...reviews, ...reviews].map((review, index) => (
                  <article 
                    key={`${review.id}-${index}`} 
                    className="review-carousel-item"
                    itemScope 
                    itemType="https://schema.org/Review"
                    id={`review-${review.id}-${index}`}
                  >
                    <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-full">
                      {/* Header - Semantic HTML for LLM */}
                      <header className="flex items-start justify-between mb-4">
                        <div itemScope itemType="https://schema.org/Person">
                          <h4 className="font-bold text-gray-900 dark:text-white" itemProp="name">
                            {review.reviewer_name}
                          </h4>
                          {review.event_type && (
                            <p className="text-sm text-gray-600 dark:text-gray-400" itemProp="jobTitle">
                              {review.event_type
                                .split('_')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')} Event
                            </p>
                          )}
                        </div>
                        {review.is_verified && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </header>

                      {/* Rating - Semantic HTML with structured data */}
                      <div 
                        className="flex items-center gap-1 mb-3" 
                        itemProp="reviewRating" 
                        itemScope 
                        itemType="https://schema.org/Rating"
                      >
                        <meta itemProp="ratingValue" content={review.rating.toString()} />
                        <meta itemProp="bestRating" content="5" />
                        <meta itemProp="worstRating" content="1" />
                        {renderStars(review.rating)}
                        <span className="sr-only">Rating: {review.rating} out of 5 stars</span>
                      </div>

                      {/* Headline */}
                      {review.headline && (
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2" itemProp="name">
                          {review.headline}
                        </h5>
                      )}

                      {/* Review Text - Semantic HTML for LLM understanding */}
                      <blockquote 
                        itemProp="reviewBody" 
                        className="text-gray-700 dark:text-gray-300 mb-4 italic border-l-4 border-blue-500 pl-4"
                        cite={`${djUrl}#review-${review.id}`}
                      >
                        <p className="mb-2">{review.review_text}</p>
                        {review.review_aspects && review.review_aspects.length > 0 && (
                          <div className="mt-3 text-sm">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">Review aspects: </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {review.review_aspects.join(', ')}
                            </span>
                          </div>
                        )}
                      </blockquote>

                      {/* Event Details - Semantic HTML for context */}
                      {(review.venue_name || review.event_date) && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          {review.venue_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Venue:</span>{' '}
                              <span itemProp="itemReviewed" itemScope itemType="https://schema.org/Place">
                                <span itemProp="name">{review.venue_name}</span>
                              </span>
                            </p>
                          )}
                          {review.event_date && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Event Date:</span>{' '}
                              <time 
                                itemProp="datePublished" 
                                dateTime={new Date(review.event_date).toISOString()}
                              >
                                {new Date(review.event_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </time>
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

                      {/* Hidden structured data for LLM retrieval */}
                      <div className="sr-only" aria-hidden="true">
                        <span itemProp="author" itemScope itemType="https://schema.org/Person">
                          <span itemProp="name">{review.reviewer_name}</span>
                        </span>
                        <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                          <span itemProp="name">DJ Dash</span>
                        </span>
                        {review.is_verified && (
                          <meta itemProp="additionalProperty" content="verified:true" />
                        )}
                        {review.review_aspects && review.review_aspects.length > 0 && (
                          <meta itemProp="reviewAspect" content={review.review_aspects.join(', ')} />
                        )}
                      </div>
                    </Card>
                  </article>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet: Static grid */}
            <div className="lg:hidden container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    itemScope 
                    itemType="https://schema.org/Review"
                    id={`review-${review.id}`}
                    className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow rounded-lg"
                  >
                    {/* Header - Semantic HTML */}
                    <header className="flex items-start justify-between mb-4">
                      <div itemScope itemType="https://schema.org/Person">
                        <h4 className="font-bold text-gray-900 dark:text-white" itemProp="name">
                          {review.reviewer_name}
                        </h4>
                        {review.event_type && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {review.event_type
                              .split('_')
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')} Event
                          </p>
                        )}
                      </div>
                      {review.is_verified && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </header>

                    {/* Rating - Semantic HTML */}
                    <div 
                      className="flex items-center gap-1 mb-3" 
                      itemProp="reviewRating" 
                      itemScope 
                      itemType="https://schema.org/Rating"
                    >
                      <meta itemProp="ratingValue" content={review.rating.toString()} />
                      <meta itemProp="bestRating" content="5" />
                      <meta itemProp="worstRating" content="1" />
                      {renderStars(review.rating)}
                      <span className="sr-only">Rating: {review.rating} out of 5 stars</span>
                    </div>

                    {/* Headline */}
                    {review.headline && (
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2" itemProp="name">
                        {review.headline}
                      </h5>
                    )}

                    {/* Review Text - Semantic HTML for LLM */}
                    <blockquote 
                      itemProp="reviewBody" 
                      className="text-gray-700 dark:text-gray-300 mb-4 italic border-l-4 border-blue-500 pl-4"
                      cite={`${djUrl}#review-${review.id}`}
                    >
                      <p className="mb-2">{review.review_text}</p>
                      {review.review_aspects && review.review_aspects.length > 0 && (
                        <div className="mt-3 text-sm">
                          <span className="font-semibold text-gray-600 dark:text-gray-400">Review aspects: </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {review.review_aspects.join(', ')}
                          </span>
                        </div>
                      )}
                    </blockquote>

                    {/* Event Details - Semantic HTML */}
                    {(review.venue_name || review.event_date) && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        {review.venue_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Venue:</span>{' '}
                            <span itemProp="itemReviewed" itemScope itemType="https://schema.org/Place">
                              <span itemProp="name">{review.venue_name}</span>
                            </span>
                          </p>
                        )}
                        {review.event_date && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Event Date:</span>{' '}
                            <time 
                              itemProp="datePublished" 
                              dateTime={new Date(review.event_date).toISOString()}
                            >
                              {new Date(review.event_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </time>
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
                        <div className="flex flex-wrap gap-2" itemProp="positiveNotes">
                          {review.positive_notes.map((note, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidden structured data for LLM retrieval */}
                    <div className="sr-only" aria-hidden="true">
                      <span itemProp="author" itemScope itemType="https://schema.org/Person">
                        <span itemProp="name">{review.reviewer_name}</span>
                      </span>
                      <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                        <span itemProp="name">DJ Dash</span>
                        <span itemProp="url">https://djdash.net</span>
                      </span>
                      {review.is_verified && (
                        <meta itemProp="additionalProperty" content="verified:true" />
                      )}
                      {review.review_aspects && review.review_aspects.length > 0 && (
                        <meta itemProp="reviewAspect" content={review.review_aspects.join(', ')} />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

