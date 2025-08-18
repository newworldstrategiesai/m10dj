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
    testimonial_text: "Ben was an excellent choice for my wedding. He played everything we asked and built a playlist based on those preferences. He had a better price than everyone else we contacted, and he was more responsive than anyone else we reached out to. He had a professional demeanor the entire time while also being able to have fun. Highly recommended, 10/10",
    event_date: "2024-11-01"
  },
  {
    client_name: "Alexis Cameron",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben DJ'd our wedding last weekend and I couldn't be more thankful. He was communicative, paid great attention to detail, and ensured everything went smoothly. He had a lapel mic for my officiant and some speeches that made it all seamless and convenient. We had younger kids, grandparents and all the others in between- the music was appropriate and also right up our alley. Ben went over the top to make sure the night went amazingly. Will be recommending to friends and family and highly do to anyone reading this now. Thank you, Ben!",
    event_date: "2024-10-01"
  },
  {
    client_name: "Chandler Keen",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben Murray DJ'd my wedding and could not have been more thoughtful in the planning process. He's extremely talented and all of the guests at our wedding raved about the song choices and DJ. I highly recommend Ben for any event, he will cater to your wants and needs and ensure that your event is filled with exciting music that fits your desires.",
    event_date: "2021-12-01"
  },
  {
    client_name: "Dan Roberts",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben worked as the DJ at my fairly large (200-250 people) wedding. He was extremely professional with his communication and knew the right questions to ask us about specific music for planned dances and also about what kind of music we thought our attendees would like. I've never been to a wedding where the DJ mixes his own tracks throughout the open dance time, but Ben made that work extremely well! He read the room and knew when to switch to keep the energy up on the dancefloor.",
    event_date: "2021-12-01"
  },
  {
    client_name: "Brad Eiseman",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "This company is professional, courteous, and kind! Easily one of the best DJs we could have chosen for our wedding which was obviously one of the most important moments in our lives! DJ Ben Murray is a great person and a great DJ and we were lucky to have him as our DJ for our wedding!- Brad & Sarah",
    event_date: "2021-12-01"
  },
  {
    client_name: "Steven Gordon",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben is the best DJ in Memphis. We had him DJ our wedding, very easy to work with and the reception music, lighting, etc was perfect…made sure everybody was enjoying the vibe and accommodated requests. From prior experience, he's also a great party/club, etc DJ.",
    event_date: "2021-12-01"
  },
  {
    client_name: "Mary Nguyen", 
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben is AMAZING! He's professional and knows what he's doing. He got us to put together our playlist and combined it with his and made the night magical! I don't know if he's ever done a Vietnamese wedding before, but he rocked it for my brother's.",
    event_date: "2021-12-01"
  },
  {
    client_name: "Haley Blalock",
    event_type: "Wedding Reception", 
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Great!!!!! He did the music at the ceremony and Dj the reception! He did a fantastic job and it was a day not many people will forget.",
    event_date: "2021-12-01"
  },
  {
    client_name: "AK Warmus",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Would have another wedding just to have Ben DJ for us again.",
    event_date: "2022-12-01"
  },
  {
    client_name: "Jamie Irby",
    event_type: "Corporate Event",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Super professional and punctual. Took care of our every need and want, would use again!",
    event_date: "2021-12-01"
  }
];

export default function TestimonialSlider({ className = '', showSchema = true, useDatabase = false }) {
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