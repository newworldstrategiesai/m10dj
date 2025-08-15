import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  MapPin, 
  Globe, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  ExternalLink,
  ArrowLeft,
  Heart,
  Building,
  TreePine,
  Camera,
  Utensils,
  Home
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import SEO from '../../components/SEO';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate slug from venue name
const generateSlug = (venueName) => {
  return venueName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get venue type icon
const getVenueTypeIcon = (venueType) => {
  const icons = {
    wedding: Heart,
    corporate: Building,
    banquet_hall: Building,
    outdoor: TreePine,
    historic: Camera,
    hotel: Building,
    restaurant: Utensils,
    country_club: Home,
    other: Home
  };
  return icons[venueType] || Home;
};

// Get venue type label
const getVenueTypeLabel = (venueType) => {
  const labels = {
    wedding: 'Wedding Venue',
    corporate: 'Corporate Venue',
    banquet_hall: 'Banquet Hall',
    outdoor: 'Outdoor Venue',
    historic: 'Historic Venue',
    hotel: 'Hotel Venue',
    restaurant: 'Restaurant Venue',
    country_club: 'Country Club',
    other: 'Event Venue'
  };
  return labels[venueType] || 'Event Venue';
};

export default function VenuePage({ venue }) {
  const [scrollToContact, setScrollToContact] = useState(() => () => {});

  useEffect(() => {
    setScrollToContact(() => () => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, []);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
          <Link href="/venues" className="text-brand hover:text-brand-600">
            ← Back to All Venues
          </Link>
        </div>
      </div>
    );
  }

  const VenueIcon = getVenueTypeIcon(venue.venue_type);
  const venueTypeLabel = getVenueTypeLabel(venue.venue_type);

  return (
    <>
      <SEO
        title={`${venue.venue_name} DJ Services | Memphis Wedding DJ at ${venue.venue_name}`}
        description={`Professional DJ services at ${venue.venue_name} in ${venue.city}, ${venue.state}. ${venue.description} M10 DJ Company provides expert wedding and event entertainment with venue-specific expertise.`}
        keywords={[
          `${venue.venue_name} DJ`,
          `${venue.venue_name} wedding DJ`,
          `DJ services ${venue.venue_name}`,
          `${venue.city} wedding DJ`,
          `${venue.state} wedding DJ`,
          `${venue.venue_type} DJ services`,
          `Memphis DJ ${venue.venue_name}`,
          'wedding DJ services',
          'event DJ services',
          'professional DJ'
        ]}
        canonical={`/venues/${generateSlug(venue.venue_name)}`}
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Place",
              "name": venue.venue_name,
              "description": venue.description,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": venue.city,
                "addressRegion": venue.state,
                "addressCountry": "US"
              },
              "url": venue.website,
              "maximumAttendeeCapacity": venue.capacity_max,
              "minimumAttendeeCapacity": venue.capacity_min,
              "amenityFeature": venue.amenities?.map(amenity => ({
                "@type": "LocationFeatureSpecification",
                "name": amenity
              })) || []
            },
            {
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "description": `Professional DJ services at ${venue.venue_name}`,
              "url": "https://m10djcompany.com",
              "telephone": "+19014102020",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "65 Stewart Rd",
                "addressLocality": "Eads",
                "addressRegion": "TN",
                "postalCode": "38028",
                "addressCountry": "US"
              },
              "areaServed": {
                "@type": "Place",
                "name": `${venue.city}, ${venue.state}`
              },
              "serviceType": "DJ Services"
            }
          ]
        }}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-24">
          <div className="absolute inset-0 bg-black/20"></div>
          
          <div className="section-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Breadcrumb */}
              <div className="flex items-center justify-center text-sm text-gray-300 mb-6">
                <Link href="/" className="hover:text-white">Home</Link>
                <span className="mx-2">•</span>
                <Link href="/venues" className="hover:text-white">Venues</Link>
                <span className="mx-2">•</span>
                <span className="text-white">{venue.venue_name}</span>
              </div>

              {/* Venue Type Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-brand/20 rounded-full text-brand-light mb-6">
                <VenueIcon className="w-4 h-4 mr-2" />
                {venueTypeLabel}
              </div>

              <h1 className="heading-1 mb-6">
                <span className="text-white">Professional DJ Services at</span>
                <span className="block text-[#fcba00]">{venue.venue_name}</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Expert wedding and event entertainment at {venue.venue_name} in {venue.city}, {venue.state}. 
                Specialized DJ services tailored to this venue's unique atmosphere and acoustics.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary"
                >
                  Get Quote for {venue.venue_name}
                </button>
                {venue.website && (
                  <a 
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center"
                  >
                    Visit Venue Website
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Venue Details Section */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">About {venue.venue_name}</h2>
                    <p className="text-gray-600 leading-relaxed mb-8">
                      {venue.description}
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose M10 DJ Company for {venue.venue_name}?</h3>
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                          <span className="text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Venue-Specific Expertise</h4>
                          <p className="text-gray-600">We know {venue.venue_name}'s acoustics, layout, and requirements intimately, ensuring perfect sound coverage and atmosphere.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                          <span className="text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Professional Setup & Coordination</h4>
                          <p className="text-gray-600">Seamless coordination with {venue.venue_name} staff and timeline management for stress-free events.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                          <span className="text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Tailored Music & Entertainment</h4>
                          <p className="text-gray-600">Custom playlists and entertainment perfectly matched to {venue.venue_name}'s ambiance and your vision.</p>
                        </div>
                      </div>
                    </div>

                    {venue.amenities && venue.amenities.length > 0 && (
                      <>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Venue Amenities</h3>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                          {venue.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center text-gray-600">
                              <div className="w-2 h-2 bg-brand rounded-full mr-3"></div>
                              {amenity}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Venue Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-brand mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">Location</h4>
                          <p className="text-gray-600 text-sm">{venue.address}</p>
                        </div>
                      </div>

                      {(venue.capacity_min || venue.capacity_max) && (
                        <div className="flex items-start">
                          <Users className="w-5 h-5 text-brand mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-900">Capacity</h4>
                            <p className="text-gray-600 text-sm">
                              {venue.capacity_min && venue.capacity_max 
                                ? `${venue.capacity_min} - ${venue.capacity_max} guests`
                                : venue.capacity_max 
                                ? `Up to ${venue.capacity_max} guests`
                                : `From ${venue.capacity_min || 'varies'} guests`}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start">
                        <Building className="w-5 h-5 text-brand mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">Venue Type</h4>
                          <p className="text-gray-600 text-sm">{venueTypeLabel}</p>
                        </div>
                      </div>

                      {venue.website && (
                        <div className="flex items-start">
                          <Globe className="w-5 h-5 text-brand mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-900">Website</h4>
                            <a 
                              href={venue.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:text-brand-600 text-sm flex items-center"
                            >
                              Visit Venue
                              <ExternalLink className="ml-1 w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-3">Ready to Book?</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Get a custom quote for your event at {venue.venue_name}.
                      </p>
                      <button 
                        onClick={scrollToContact}
                        className="w-full btn-primary text-center"
                      >
                        Get Free Quote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Venues Section */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">More Memphis Area Venues</h2>
              <p className="text-xl text-gray-600 mb-12">
                Discover other premier wedding and event venues where we provide DJ services
              </p>
              
              <div className="flex justify-center">
                <Link 
                  href="/venues"
                  className="btn-secondary inline-flex items-center"
                >
                  View All Venues
                  <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <ContactForm />
      </main>

      <Footer />
    </>
  );
}

export async function getStaticPaths() {
  try {
    const { data: venues, error } = await supabase
      .from('preferred_venues')
      .select('venue_name')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching venues for static paths:', error);
      return {
        paths: [],
        fallback: 'blocking'
      };
    }

    const paths = venues.map(venue => ({
      params: { slug: generateSlug(venue.venue_name) }
    }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const { data: venues, error } = await supabase
      .from('preferred_venues')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching venue:', error);
      return {
        notFound: true
      };
    }

    // Find venue by matching slug
    const venue = venues.find(v => generateSlug(v.venue_name) === params.slug);

    if (!venue) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        venue
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true
    };
  }
}