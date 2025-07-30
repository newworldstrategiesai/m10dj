import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { supabase } from '../../utils/company_lib/supabase';

// Fallback testimonials in case database is unavailable
const fallbackTestimonials = [
  {
    client_name: "Sarah & Michael Johnson",
    event_type: "Wedding Reception", 
    location: "Germantown, TN",
    rating: 5,
    testimonial_text: "M10 DJ Company made our wedding absolutely perfect! They played exactly what we wanted and kept everyone dancing all night long. Professional, responsive, and truly cared about making our day special.",
    event_date: "2024-01-15"
  },
  {
    client_name: "Jennifer Martinez",
    event_type: "Corporate Holiday Party",
    location: "Downtown Memphis",
    rating: 5,
    testimonial_text: "We hired M10 for our company's annual holiday party and they exceeded all expectations. The music selection was perfect for our diverse group, and they handled all the announcements professionally.",
    event_date: "2023-12-10"
  },
  {
    client_name: "David Thompson",
    event_type: "50th Birthday Party",
    location: "Midtown Memphis",
    rating: 5,
    testimonial_text: "From start to finish, M10 DJ Company was fantastic. They helped us plan the perfect playlist that had guests from all generations dancing. Highly recommend for any celebration!",
    event_date: "2024-02-20"
  },
  {
    client_name: "Lisa & James Wilson",
    event_type: "Wedding Reception",
    location: "Collierville, TN",
    rating: 5,
    testimonial_text: "Our wedding wouldn't have been the same without M10 DJ Company. They were so easy to work with, took all our requests, and created the perfect atmosphere. Dance floor was packed all night!",
    event_date: "2023-11-05"
  },
  {
    client_name: "Memphis High School",
    event_type: "Homecoming Dance",
    location: "Arlington, TN",
    rating: 5,
    testimonial_text: "M10 DJ Company knows how to work with teenagers! They played all the current hits while keeping everything appropriate. The students had an amazing time and we'll definitely book them again.",
    event_date: "2023-10-28"
  },
  {
    client_name: "Rachel & Chris Adams",
    event_type: "Anniversary Party",
    location: "Bartlett, TN",
    rating: 5,
    testimonial_text: "For our 25th anniversary party, M10 DJ Company created the perfect mix of our favorite songs from over the years. They even surprised us with our wedding song at the perfect moment. Truly magical!",
    event_date: "2024-03-12"
  }
];

export default function TestimonialSlider({ className = '', showSchema = true, useDatabase = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  const [loading, setLoading] = useState(false);

  // Load testimonials from Supabase
  useEffect(() => {
    if (!useDatabase) return;

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, using fallback testimonial data');
      return;
    }

    const loadTestimonials = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error loading testimonials:', error);
          // Keep fallback data
        } else if (data && data.length > 0) {
          setTestimonials(data);
        }
      } catch (error) {
        console.error('Error loading testimonials:', error);
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };

    loadTestimonials();
  }, [useDatabase]);

  // Auto-advance testimonials
  useEffect(() => {
    if (!isAutoPlaying || loading) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length, loading]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Generate Review Schema markup
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "M10 DJ Company",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "reviewCount": testimonials.length,
      "bestRating": "5",
      "worstRating": "5"
    },
    "review": testimonials.map(testimonial => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": testimonial.client_name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": testimonial.rating,
        "bestRating": "5"
      },
      "reviewBody": testimonial.testimonial_text,
      "datePublished": testimonial.event_date
    }))
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-5 h-5 ${i < rating ? 'text-brand-gold fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <section className={`py-16 bg-white dark:bg-gray-900 ${className}`}>
        <div className="section-container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {showSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}
      
      <section className={`py-16 bg-white dark:bg-gray-900 ${className}`}>
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="heading-2 text-gray-900 dark:text-white mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what our satisfied clients have to say about their experience with M10 DJ Company.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Main testimonial display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg">
              <Quote className="w-12 h-12 text-brand-gold mb-6 mx-auto" />
              
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {renderStars(testimonials[currentIndex].rating)}
                </div>
                
                <blockquote className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 font-medium leading-relaxed">
                  "{testimonials[currentIndex].testimonial_text}"
                </blockquote>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                    {testimonials[currentIndex].client_name}
                  </div>
                  <div className="text-brand-gold font-medium mb-1">
                    {testimonials[currentIndex].event_type}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    {testimonials[currentIndex].location}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-gold/30"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-gold/30"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Dots indicator */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold/50 ${
                    index === currentIndex 
                      ? 'bg-brand-gold scale-125' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ready to create your own amazing event experience?
            </p>
            <a 
              href="#contact" 
              className="btn-primary inline-flex items-center"
            >
              Get Your Free Quote
            </a>
          </div>
        </div>
      </section>
    </>
  );
} 