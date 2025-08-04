import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Users,
  Car,
  Utensils,
  Accessibility,
  Wine,
  Home,
  Building,
  TreePine,
  Camera,
  Filter
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import { db } from '../utils/company_lib/supabase';

const venueTypeIcons = {
  wedding: Home,
  corporate: Building,
  banquet_hall: Building,
  outdoor: TreePine,
  historic: Camera,
  hotel: Building,
  restaurant: Utensils,
  country_club: Home,
  other: Home
};

const venueTypeLabels = {
  wedding: 'Wedding Venues',
  corporate: 'Corporate Venues',
  banquet_hall: 'Banquet Halls',
  outdoor: 'Outdoor Venues',
  historic: 'Historic Venues',
  hotel: 'Hotels',
  restaurant: 'Restaurants',
  country_club: 'Country Clubs',
  other: 'Other Venues'
};

export default function PreferredVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const data = await db.getPreferredVenues();
      setVenues(data);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = selectedType === 'all' 
    ? venues 
    : venues.filter(venue => venue.venue_type === selectedType);

  const venueTypes = [...new Set(venues.map(v => v.venue_type))];

  const renderPriceRange = (range) => {
    if (!range) return null;
    return (
      <div className="flex items-center">
        <span className="text-brand-gold font-medium">{range}</span>
        <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
          {range === '$' && 'Budget-friendly'}
          {range === '$$' && 'Moderate'}
          {range === '$$$' && 'Premium'}
          {range === '$$$$' && 'Luxury'}
        </span>
      </div>
    );
  };

  const VenueCard = ({ venue }) => {
    const IconComponent = venueTypeIcons[venue.venue_type] || Home;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {venue.main_image_url && (
          <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <img 
              src={venue.main_image_url} 
              alt={`${venue.venue_name}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center mr-3">
                <IconComponent className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {venue.venue_name}
                </h3>
                <p className="text-brand-gold font-medium capitalize">
                  {venueTypeLabels[venue.venue_type] || venue.venue_type}
                </p>
              </div>
            </div>
            {venue.is_featured && (
              <span className="bg-brand-gold text-black text-xs font-bold px-2 py-1 rounded-full">
                FEATURED
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {venue.description}
          </p>

          {/* Venue Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 text-brand-gold mr-2" />
              {venue.address}, {venue.city}, {venue.state}
            </div>
            
            {(venue.capacity_min || venue.capacity_max) && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4 text-brand-gold mr-2" />
                Capacity: {venue.capacity_min && venue.capacity_max 
                  ? `${venue.capacity_min} - ${venue.capacity_max} guests`
                  : venue.capacity_max 
                    ? `Up to ${venue.capacity_max} guests`
                    : `${venue.capacity_min}+ guests`
                }
              </div>
            )}

            {venue.indoor_outdoor && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Home className="w-4 h-4 text-brand-gold mr-2" />
                <span className="capitalize">{venue.indoor_outdoor.replace('_', ' & ')}</span>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-3 mb-4">
            {venue.parking_available && (
              <div className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                <Car className="w-3 h-3 mr-1" />
                Parking
              </div>
            )}
            {venue.wheelchair_accessible && (
              <div className="flex items-center text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                                        <Accessibility className="w-3 h-3 mr-1" />
                Accessible
              </div>
            )}
            {venue.alcohol_allowed && (
              <div className="flex items-center text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                <Wine className="w-3 h-3 mr-1" />
                Bar Service
              </div>
            )}
            {venue.catering_options && (
              <div className="flex items-center text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full">
                <Utensils className="w-3 h-3 mr-1" />
                <span className="capitalize">{venue.catering_options.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">            
            {venue.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-brand-gold mr-2" />
                <a 
                  href={`tel:${venue.phone}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
                >
                  {venue.phone}
                </a>
              </div>
            )}
            
            {venue.email && (
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-brand-gold mr-2" />
                <a 
                  href={`mailto:${venue.email}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
                >
                  {venue.email}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {renderPriceRange(venue.price_range)}
              
              <div className="flex items-center space-x-2">
                {venue.events_hosted > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                    {venue.events_hosted} events hosted
                  </span>
                )}
                
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-brand-gold hover:text-brand-gold-dark transition-colors"
                    title="Visit venue website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            
            {/* DJ Services Link */}
            <Link 
              href={`/venues/${venue.venue_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
              className="block w-full text-center py-2 px-4 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
            >
              DJ Services at {venue.venue_name}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Preferred Wedding Venues in Memphis | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Discover the best wedding venues in Memphis, TN recommended by M10 DJ Company. From historic mansions to modern ballrooms, find your perfect venue." 
        />
        <meta name="keywords" content="Memphis wedding venues, wedding venues Memphis TN, reception halls Memphis, outdoor wedding venues Memphis, historic wedding venues Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/venues" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Preferred Wedding Venues in Memphis | M10 DJ Company" />
        <meta property="og:description" content="Discover the best wedding venues in Memphis, TN recommended by M10 DJ Company." />
        <meta property="og:url" content="https://m10djcompany.com/venues" />
        <meta property="og:type" content="website" />
        
        {/* Additional SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="heading-1 mb-6">
                <span className="block text-white">Preferred Wedding Venues</span>
                <span className="block text-[#fcba00]">in Memphis, Tennessee</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover Memphis's most beautiful wedding venues where we've created unforgettable celebrations. 
                These venues are personally recommended based on our experience and the magical moments we've helped create there.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">{venues.length}+</div>
                  <div className="text-sm text-gray-300">Preferred Venues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">300+</div>
                  <div className="text-sm text-gray-300">Events Hosted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">50-500</div>
                  <div className="text-sm text-gray-300">Guest Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">5★</div>
                  <div className="text-sm text-gray-300">Client Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Venues Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            {/* Filter Section */}
            <div className="mb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedType === 'all'
                      ? 'bg-brand-gold text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Venues ({venues.length})
                </button>
                {venueTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors capitalize ${
                      selectedType === type
                        ? 'bg-brand-gold text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {venueTypeLabels[type] || type} ({venues.filter(v => v.venue_type === type).length})
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading our preferred venues...</p>
              </div>
            ) : filteredVenues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No venues found for the selected category.
                </p>
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-16 text-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Planning Your Memphis Wedding?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Let M10 DJ Company help you create the perfect celebration at any of these amazing venues. 
                We know each location inside and out and can help make your event truly special.
              </p>
              <Link 
                href="#contact"
                className="btn-primary text-lg mr-4"
              >
                Get Free Quote
              </Link>
              <Link 
                href="/vendors"
                className="btn-outline text-lg"
              >
                View Our Vendors
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Local Business Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Preferred Wedding Venues in Memphis",
            "description": "Top wedding venues in Memphis, TN recommended by M10 DJ Company",
            "url": "https://m10djcompany.com/venues",
            "isPartOf": {
              "@type": "WebSite",
              "url": "https://m10djcompany.com"
            },
            "about": {
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "telephone": "(901) 410-2020",
              "email": "m10djcompany@gmail.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Memphis",
                "addressRegion": "TN",
                "addressCountry": "US"
              }
            }
          })
        }}
      />
    </>
  );
} 