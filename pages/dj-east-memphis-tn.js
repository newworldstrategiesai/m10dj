import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Music, 
  Award, 
  Star, 
  Clock, 
  CheckCircle,
  ChevronRight,
  Volume2,
  Mic,
  Sparkles,
  Building,
  Heart,
  Trophy,
  Zap,
  GraduationCap,
  Gift
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const eastMemphisVenues = [
  {
    name: "The Racquet Club of Memphis",
    type: "Private Club",
    capacity: "300 guests",
    specialty: "Elegant wedding receptions",
    address: "5111 Sanderlin Ave, Memphis, TN",
    features: ["Grand ballroom", "Outdoor terrace", "Full bar service", "Valet parking"]
  },
  {
    name: "Memphis Country Club",
    type: "Country Club", 
    capacity: "200 guests",
    specialty: "Upscale weddings & corporate events",
    address: "4685 Chickasaw Country Club Dr, Memphis, TN",
    features: ["Clubhouse ballroom", "Golf course views", "Premium dining", "Professional service"]
  },
  {
    name: "White Station Tower",
    type: "Event Venue",
    capacity: "150 guests",
    specialty: "Corporate events & celebrations",
    address: "5050 Poplar Ave, Memphis, TN",
    features: ["City views", "Modern facilities", "A/V equipment", "Catering kitchen"]
  },
  {
    name: "The Peabody Memphis",
    type: "Luxury Hotel",
    capacity: "500+ guests",
    specialty: "Grand weddings & galas",
    address: "149 Union Ave, Memphis, TN",
    features: ["Multiple ballrooms", "Historic elegance", "Full-service planning", "Downtown convenience"]
  }
];

const eastMemphisNeighborhoods = [
  {
    name: "East Memphis",
    zipCodes: ["38119", "38120", "38125", "38138"],
    highlights: ["Poplar Corridor", "White Station area", "Mendenhall community"],
    description: "Upscale residential area with premier venues and country clubs"
  },
  {
    name: "Hickory Hill",
    zipCodes: ["38115", "38141"],
    highlights: ["Winchester Road", "Hickory Hill Mall area"],
    description: "Diverse community with various event spaces and venues"
  },
  {
    name: "Raleigh",
    zipCodes: ["38128", "38133"],
    highlights: ["Austin Peay Highway", "Raleigh Springs Mall area"],
    description: "Growing area with modern venues and event facilities"
  },
  {
    name: "Cordova",
    zipCodes: ["38016", "38018"],
    highlights: ["Germantown Parkway", "Cordova community centers"],
    description: "Family-friendly area with community centers and venues"
  }
];

const services = [
  {
    icon: Heart,
    title: "East Memphis Wedding DJ",
    description: "Professional wedding DJs for East Memphis venues including country clubs, hotels, and private venues.",
    features: ["Ceremony music", "Reception entertainment", "MC services", "Uplighting"]
  },
  {
    icon: Building,
    title: "Corporate Event Entertainment",
    description: "Professional DJ services for East Memphis corporate events, office parties, and business celebrations.",
    features: ["Background music", "Announcements", "Award ceremonies", "Team building events"]
  },
  {
    icon: Gift,
    title: "Private Party DJ",
    description: "Birthday parties, anniversaries, and celebrations throughout East Memphis neighborhoods.",
    features: ["Custom playlists", "Interactive entertainment", "All ages appropriate", "Professional setup"]
  },
  {
    icon: GraduationCap,
    title: "School & Community Events",
    description: "DJ services for East Memphis schools, community centers, and neighborhood events.",
    features: ["School dances", "Fundraisers", "Community festivals", "Family events"]
  }
];

export default function DJEastMemphisTN() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>East Memphis DJ Services | Professional DJ East Memphis TN | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Professional DJ services in East Memphis, TN for weddings, corporate events, and celebrations. Serving Poplar Corridor, White Station, Hickory Hill, Raleigh & Cordova. Call (901) 410-2020 for your free quote!"
        />
        <meta name="keywords" content="East Memphis DJ, DJ East Memphis TN, East Memphis wedding DJ, East Memphis corporate DJ, DJ services East Memphis, East Memphis party DJ, Poplar Avenue DJ, White Station DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.m10djcompany.com/dj-east-memphis-tn" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="East Memphis DJ Services | Professional DJ East Memphis TN" />
        <meta property="og:description" content="Professional DJ services in East Memphis, TN for weddings, corporate events, and celebrations. Serving all East Memphis neighborhoods with premium entertainment." />
        <meta property="og:url" content="https://www.m10djcompany.com/dj-east-memphis-tn" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="East Memphis" />
        <meta name="ICBM" content="35.1174, -89.8711" />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-amber-600 to-amber-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-white/20 backdrop-blur rounded-full p-4">
                    <Music className="h-12 w-12" />
                  </div>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                  East Memphis DJ Services
                </h1>
                <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto">
                  Professional DJ and entertainment services for East Memphis, TN. Serving Poplar Corridor, White Station, Hickory Hill, Raleigh, and Cordova with premium event entertainment.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={scrollToContact}
                    className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Get Free Quote
                  </button>
                  <a 
                    href="tel:9014102020"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-amber-700 transition-colors"
                  >
                    (901) 410-2020
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* East Memphis Coverage Area */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Serving All East Memphis Neighborhoods
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We provide professional DJ services throughout East Memphis and surrounding areas, bringing premium entertainment to your doorstep.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {eastMemphisNeighborhoods.map((neighborhood, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-6 w-6 text-amber-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">{neighborhood.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{neighborhood.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Service Areas:</p>
                    {neighborhood.highlights.map((highlight, idx) => (
                      <span key={idx} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded mr-2 mb-2">
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Zip Codes: {neighborhood.zipCodes.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DJ Services for East Memphis */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Professional DJ Services in East Memphis
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                From intimate gatherings to grand celebrations, we provide full-service DJ entertainment for all types of events in East Memphis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-6">
                    <div className="bg-amber-100 rounded-lg p-3 mr-4">
                      <service.icon className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">{service.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* East Memphis Venues */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Premier East Memphis Venues We Serve
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We're experienced with East Memphis's top venues and understand the unique requirements of each location.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {eastMemphisVenues.map((venue, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{venue.name}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="text-sm">{venue.type}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="text-sm">{venue.capacity}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{venue.specialty}</p>
                  <div className="flex items-center text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{venue.address}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Venue Features:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {venue.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose M10 for East Memphis Events */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Choose M10 DJ Company for East Memphis?
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We understand East Memphis venues, neighborhoods, and community preferences. Here's what sets us apart.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-amber-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Local East Memphis Knowledge</h3>
                <p className="text-gray-600">
                  We know East Memphis venues inside and out, from The Racquet Club to Memphis Country Club. Our local expertise ensures smooth setup and optimal sound coverage.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-amber-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Award className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Premium Equipment</h3>
                <p className="text-gray-600">
                  Professional sound systems, wireless microphones, and LED uplighting perfect for East Memphis's upscale venues and sophisticated events.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-amber-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Reliable Service</h3>
                <p className="text-gray-600">
                  Quick response times throughout East Memphis. We arrive early, set up professionally, and ensure your event runs smoothly from start to finish.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Book Your East Memphis DJ Today
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Ready to make your East Memphis event unforgettable? Contact us for a free consultation and quote.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get Your Free Quote</h3>
                  <ContactForm />
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-6 w-6 text-amber-600 mr-4" />
                      <div>
                        <p className="font-semibold">Call or Text</p>
                        <a href="tel:9014102020" className="text-amber-600 hover:text-amber-700">
                          (901) 410-2020
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-6 w-6 text-amber-600 mr-4" />
                      <div>
                        <p className="font-semibold">Email</p>
                        <a href="mailto:m10djcompany@gmail.com" className="text-amber-600 hover:text-amber-700">
                          m10djcompany@gmail.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-amber-600 mr-4 mt-1" />
                      <div>
                        <p className="font-semibold">Service Area</p>
                        <p className="text-gray-600">
                          All of East Memphis including Poplar Corridor, White Station, Hickory Hill, Raleigh, and Cordova
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Response Promise</h3>
                  <p className="text-gray-600 mb-4">
                    We respond to all East Memphis inquiries within 2 hours during business hours. Need immediate assistance?
                  </p>
                  <a 
                    href="tel:9014102020"
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold"
                  >
                    Call (901) 410-2020 now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Local Business Schema for East Memphis */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "M10 DJ Company - East Memphis",
            "description": "Professional DJ services in East Memphis, TN for weddings, corporate events, and celebrations",
            "url": "https://m10djcompany.com/dj-east-memphis-tn",
            "telephone": "(901) 410-2020",
            "email": "m10djcompany@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "East Memphis",
              "addressRegion": "TN",
              "addressCountry": "US",
              "postalCode": "38119"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "35.1174",
              "longitude": "-89.8711"
            },
            "areaServed": [
              {
                "@type": "City",
                "name": "East Memphis, TN"
              },
              {
                "@type": "Place",
                "name": "Poplar Corridor, Memphis, TN"
              },
              {
                "@type": "Place", 
                "name": "White Station, Memphis, TN"
              },
              {
                "@type": "Place",
                "name": "Hickory Hill, Memphis, TN"
              },
              {
                "@type": "Place",
                "name": "Raleigh, Memphis, TN"
              },
              {
                "@type": "Place",
                "name": "Cordova, Memphis, TN"
              }
            ],
            "serviceType": ["Wedding DJ Services", "Corporate Event DJ", "Private Party DJ", "Event Entertainment"],
            "sameAs": [
              "https://facebook.com/m10djcompany",
              "https://instagram.com/m10djcompany"
            ],
            "priceRange": "$$",
            "paymentAccepted": ["Cash", "Check", "Credit Card"],
            "openingHours": "Mo-Su 09:00-21:00"
          })
        }}
      />
    </>
  );
}