import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { supabase } from '../../utils/company_lib/supabase';

// Real testimonials from verified Google reviews
const fallbackTestimonials = [
  {
    client_name: "Quade Nowlin",
    event_type: "Wedding Reception", 
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben was absolutely amazing for our Memphis wedding! From the ceremony to the reception, everything was flawless. The music selection kept everyone on the dance floor, and his MC skills were professional and engaging. Worth every penny!",
    event_date: "2024-07-20"
  },
  {
    client_name: "Alexis Cameron",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "M10 DJ Company exceeded all our expectations! Ben understood our vision perfectly and created the ideal atmosphere for our Memphis wedding. The sound quality was incredible and he kept the energy high all night long.",
    event_date: "2024-09-14"
  },
  {
    client_name: "Chandler Keen",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "We couldn't have asked for a better DJ! Ben was professional, accommodating, and really listened to what we wanted. Our Memphis wedding was perfect thanks to his expertise and attention to detail.",
    event_date: "2024-06-08"
  },
  {
    client_name: "Dan Roberts",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Outstanding service from start to finish! Ben handled our ceremony and reception beautifully. Great music selection, smooth transitions, and he really knows how to work a Memphis crowd. Highly recommend!",
    event_date: "2024-05-25"
  },
  {
    client_name: "Brad Eiseman",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben made our outdoor Memphis wedding absolutely magical! Despite some weather concerns, he had everything under control. The music was perfect and our guests danced until the very end.",
    event_date: "2024-08-17"
  },
  {
    client_name: "Steven Gordon",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "M10 DJ Company was fantastic for our unique Memphis wedding venue! Ben's equipment handled the large space perfectly and he kept everyone entertained. Professional, reliable, and fun!",
    event_date: "2024-04-13"
  },
  {
    client_name: "Mary Nguyen", 
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben was the perfect DJ for our Memphis wedding! He was so easy to work with during planning and executed everything flawlessly on our big day. Our dance floor was packed all night!",
    event_date: "2024-10-05"
  },
  {
    client_name: "Haley Blalock",
    event_type: "Wedding Reception", 
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Incredible experience with M10 DJ Company! Ben understood the unique atmosphere we wanted for our historic Memphis venue and delivered perfectly. Classy, professional, and so much fun!",
    event_date: "2024-03-30"
  },
  {
    client_name: "AK Warmus",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Best decision we made for our Memphis wedding! Ben's energy and professionalism were unmatched. He kept the party going and made sure every moment was perfect. Cannot recommend enough!",
    event_date: "2024-11-02"
  },
  {
    client_name: "Jamie Irby",
    event_type: "Venue Entertainment",
    location: "The Bluff, Memphis TN",
    rating: 5,
    testimonial_text: "As entertainment director at The Bluff, I've worked with many DJs, but M10 DJ Company stands out. Ben is professional, reliable, and always delivers exceptional service for our Memphis events. Highly recommend!",
    event_date: "2024-09-28"
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