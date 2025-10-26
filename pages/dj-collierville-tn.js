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
  Gift,
  Home,
  TreePine
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const colliervilleVenues = [
  {
    name: "Historic Collierville Town Square",
    type: "Historic Venue",
    capacity: "300+ guests",
    specialty: "Outdoor ceremonies & receptions",
    address: "Town Square, Collierville, TN",
    features: ["Historic courthouse backdrop", "Gazebo ceremony site", "Open square space", "Downtown charm"]
  },
  {
    name: "Collierville Country Club",
    type: "Private Club",
    capacity: "200 guests",
    specialty: "Family-friendly celebrations",
    address: "Collierville, TN",
    features: ["Golf course views", "Family atmosphere", "Full catering", "Indoor/outdoor options"]
  },
  {
    name: "The Columns at Schilling Farms",
    type: "Event Venue",
    capacity: "150 guests",
    specialty: "Modern celebrations",
    address: "Schilling Farms, Collierville, TN",
    features: ["Contemporary design", "Built-in sound", "Bridal suite", "Reception hall"]
  },
  {
    name: "Collierville Community Center",
    type: "Community Venue",
    capacity: "250 guests",
    specialty: "Community events & receptions",
    address: "Collierville, TN",
    features: ["Affordable pricing", "Full kitchen", "Large dance floor", "Parking available"]
  },
  {
    name: "Morton Museum of Collierville History",
    type: "Historic Museum",
    capacity: "100 guests",
    specialty: "Intimate historic celebrations",
    address: "196 Main St, Collierville, TN",
    features: ["Historic ambiance", "Unique setting", "Museum exhibits", "Downtown location"]
  }
];

const services = [
  {
    icon: Heart,
    title: "Collierville Wedding DJ",
    description: "Classic wedding entertainment for Collierville's historic charm and family celebrations",
    features: ["Historic venue experience", "Family-friendly music", "Ceremony & reception", "Traditional wedding coordination"],
    price: "Starting at $695",
    popular: true
  },
  {
    icon: Building,
    title: "Corporate Event DJ",
    description: "Professional business entertainment for Collierville companies and corporate gatherings",
    features: ["Business meeting support", "Corporate celebration music", "Professional presentations", "Team building events"],
    price: "Starting at $495",
    popular: true
  },
  {
    icon: Users,
    title: "Community Event DJ",
    description: "Engaging entertainment for Collierville community celebrations and local festivals",
    features: ["Town square events", "Community festivals", "School fundraisers", "Neighborhood parties"],
    price: "Starting at $395",
    popular: false
  },
  {
    icon: GraduationCap,
    title: "Family Celebration DJ",
    description: "Memorable entertainment for family milestones and generational celebrations",
    features: ["Anniversary parties", "Birthday celebrations", "Family reunions", "Graduation parties"],
    price: "Starting at $395",
    popular: false
  }
];

const neighborhoods = [
  {
    name: "Historic Collierville",
    description: "The heart of Collierville with historic charm and traditional event venues",
    venues: ["Town square venues", "Historic buildings", "Community centers"],
    specialties: ["Historic wedding ceremonies", "Community celebrations", "Traditional receptions"]
  },
  {
    name: "Schilling Farms",
    description: "Modern residential area with contemporary event spaces and family-friendly venues",
    venues: ["The Columns", "Clubhouses", "Modern event centers"],
    specialties: ["Contemporary weddings", "Family celebrations", "Corporate meetings"]
  },
  {
    name: "Forest Hill Area",
    description: "Established neighborhood with mature trees and elegant private event spaces",
    venues: ["Private residences", "Garden venues", "Country club facilities"],
    specialties: ["Intimate gatherings", "Garden parties", "Anniversary celebrations"]
  },
  {
    name: "Byhalia Road Corridor",
    description: "Growing commercial area with modern business venues and corporate event spaces",
    venues: ["Business centers", "Hotels", "Corporate facilities"],
    specialties: ["Corporate events", "Business meetings", "Professional gatherings"]
  }
];

const testimonials = [
  {
    name: "Rebecca Thompson",
    event: "Wedding Reception",
    venue: "Historic Collierville Town Square",
    quote: "M10 DJ Company made our Collierville town square wedding absolutely magical! Ben understood our vision for a classic celebration and delivered perfectly. The music brought three generations together on the dance floor.",
    rating: 5,
    date: "June 2024"
  },
  {
    name: "Michael Davis", 
    event: "Corporate Anniversary",
    venue: "Collierville Country Club",
    quote: "Professional, reliable, and exactly what we needed for our company's 25th anniversary celebration. Ben coordinated perfectly with our timeline and kept the atmosphere both professional and fun.",
    rating: 5,
    date: "August 2024"
  },
  {
    name: "Sarah Williams",
    event: "Family Reunion",
    venue: "Collierville Community Center",
    quote: "Ben was fantastic for our family reunion! He played music that spanned five decades and kept everyone engaged. His knowledge of Collierville venues made everything run smoothly.",
    rating: 5,
    date: "July 2024"
  }
];

const whyChooseCollierville = [
  {
    icon: TreePine,
    title: "Historic Collierville Expertise",
    description: "Deep knowledge of Collierville's unique venues from the historic town square to modern event centers"
  },
  {
    icon: Heart,
    title: "Community-Focused Service",
    description: "Specializing in family-friendly celebrations that bring generations together in Collierville's welcoming atmosphere"
  },
  {
    icon: Music,
    title: "Versatile Entertainment",
    description: "From traditional wedding ceremonies to modern celebrations, we adapt to Collierville's diverse event needs"
  },
  {
    icon: Home,
    title: "Local Community Connection",
    description: "Understanding Collierville's close-knit community values and creating events that feel like home"
  }
];

const faqs = [
  {
    question: "Do you provide DJ services throughout Collierville, Tennessee?",
    answer: "Yes, we provide professional DJ services throughout all of Collierville, TN including Historic Collierville, Schilling Farms, Forest Hill, and the Byhalia Road corridor. We're familiar with all major Collierville venues and the town's unique character."
  },
  {
    question: "What makes your Collierville DJ services special?",
    answer: "We specialize in community-focused celebrations that honor Collierville's historic charm and family values. Our experience with venues like the Historic Town Square and local community centers means we understand how to create memorable events that bring generations together."
  },
  {
    question: "Do you work with Historic Collierville Town Square events?",
    answer: "Absolutely! We have extensive experience with outdoor events at the Historic Town Square, including weddings, community festivals, and celebrations. We understand the unique requirements for historic venue events and outdoor sound systems."
  },
  {
    question: "What are your rates for Collierville DJ services?",
    answer: "Our Collierville DJ packages start at $395 for community events and $695 for weddings. Pricing varies based on event duration, guest count, and specific venue requirements. We offer competitive rates that reflect Collierville's community values."
  },
  {
    question: "How far in advance should we book for a Collierville event?",
    answer: "For Collierville events, especially at popular venues like the Historic Town Square or Collierville Country Club, we recommend booking 4-8 months in advance. Spring and fall are particularly popular for outdoor events at historic venues."
  },
  {
    question: "Do you provide both ceremony and reception DJ services in Collierville?",
    answer: "Yes, we provide complete wedding day coverage including ceremony music at venues like the Historic Town Square gazebo, cocktail hour entertainment, and reception DJ services. This is especially popular for Collierville's outdoor wedding venues."
  }
];

export default function DJColliervilleTN() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeNeighborhood, setActiveNeighborhood] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Best DJ Collierville TN | Wedding DJ Collierville | Professional DJ Services | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Memphis's Best DJ Collierville TN ⭐ Historic Town Square Expert ⭐ Family-Friendly Wedding DJ Services! Professional Collierville DJ for weddings & community events. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="DJ Collierville TN, Collierville DJ services, wedding DJ Collierville Tennessee, DJ services Collierville TN, Collierville wedding DJ, corporate DJ Collierville TN, Collierville event DJ, DJ Collierville Tennessee, best DJ Collierville, professional DJ Collierville" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/dj-collierville-tn" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ Collierville TN | Wedding & Event DJ Services | Collierville Tennessee" />
        <meta property="og:description" content="Professional DJ services in Collierville, TN for weddings, corporate events, and community celebrations. Historic venues and family-focused entertainment." />
        <meta property="og:url" content="https://m10djcompany.com/dj-collierville-tn" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Collierville, Tennessee" />
        <meta name="ICBM" content="35.0420, -89.6645" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "M10 DJ Company - Collierville TN Services",
              "description": "Professional DJ services in Collierville, Tennessee for weddings, corporate events, and community celebrations",
              "url": "https://m10djcompany.com/dj-collierville-tn",
              "telephone": "+19014102020",
              "email": "booking@m10djcompany.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Collierville",
                "addressRegion": "TN",
                "postalCode": "38017",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 35.0420,
                "longitude": -89.6645
              },
              "areaServed": [
                {
                  "@type": "City",
                  "name": "Collierville",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                }
              ],
              "serviceType": ["Wedding DJ", "Corporate Event DJ", "Community Event DJ", "Family Celebration Entertainment"],
              "priceRange": "$395-$995",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "50", 
                "bestRating": "5",
                "worstRating": "5"
              },
              "sameAs": [
                "https://www.facebook.com/m10djcompany",
                "https://www.instagram.com/m10djcompany"
              ]
            }),
          }}
        />
      </Head>

      <Header />

      <main className="min-h-screen">
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-brand via-brand-dark to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="section-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              
              <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <div className="flex items-center justify-center mb-6">
                  <MapPin className="w-8 h-8 text-brand-gold mr-3" />
                  <span className="text-brand-gold font-semibold text-lg">Serving Collierville, Tennessee</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                  <span className="block">DJ Collierville TN</span>
                  <span className="block text-brand-gold">Historic Charm & Community Celebrations</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Professional DJ services for Collierville, Tennessee weddings, community events, and family celebrations. 
                  From the Historic Town Square to modern venues, creating memorable experiences rooted in community tradition.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                  <button 
                    onClick={scrollToContact}
                    className="bg-brand-gold text-black hover:bg-yellow-400 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call (901) 410-2020
                  </button>
                  <a 
                    href="#collierville-services" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    View Services
                  </a>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">40+</div>
                    <div className="text-white font-semibold">Collierville Events</div>
                    <div className="text-gray-300 text-sm">Historic & modern venues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">5★</div>
                    <div className="text-white font-semibold">Community Rating</div>
                    <div className="text-gray-300 text-sm">Family-focused service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">15+</div>
                    <div className="text-white font-semibold">Years Experience</div>
                    <div className="text-gray-300 text-sm">Memphis area expertise</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">25min</div>
                    <div className="text-white font-semibold">From Memphis</div>
                    <div className="text-gray-300 text-sm">Quick local access</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="collierville-services" className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Professional DJ Services in Collierville, TN</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Community-focused entertainment services designed for Collierville's historic charm and family-centered celebrations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {services.map((service, index) => (
                  <div 
                    key={index} 
                    className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                      service.popular ? 'ring-2 ring-brand/20' : ''
                    }`}
                  >
                    <div className="flex items-center mb-6">
                      <service.icon className="w-12 h-12 text-brand mr-4" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{service.title}</h3>
                        {service.popular && (
                          <span className="text-brand text-sm font-semibold">Most Popular</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">Services Include:</h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-brand mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-brand font-bold text-lg">{service.price}</div>
                      <button 
                        onClick={scrollToContact}
                        className="btn-primary flex items-center"
                      >
                        Get Quote
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Collierville Venues Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Collierville, TN Wedding & Event Venues We Serve</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  From the Historic Town Square to modern event centers, we know Collierville's diverse venues and how to make each celebration special
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {colliervilleVenues.map((venue, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <Building className="w-6 h-6 text-brand mr-3" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{venue.name}</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{venue.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{venue.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Specialty:</span>
                        <span className="text-gray-900 dark:text-white font-semibold text-right">{venue.specialty}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Venue Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {venue.features.map((feature, fIndex) => (
                          <span key={fIndex} className="bg-brand/10 text-brand px-2 py-1 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {venue.address && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {venue.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Planning an event at a different Collierville venue? We work with all event spaces throughout the community.
                </p>
                <button 
                  onClick={scrollToContact}
                  className="btn-primary"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Ask About Your Venue
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Collierville Neighborhoods Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Collierville Neighborhoods We Serve</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  From Historic Collierville to Schilling Farms, we provide professional DJ services throughout all of Collierville's distinctive communities
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {neighborhoods.map((neighborhood, index) => (
                  <div 
                    key={index}
                    className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                      activeNeighborhood === index ? 'ring-2 ring-brand' : ''
                    }`}
                    onClick={() => setActiveNeighborhood(activeNeighborhood === index ? null : index)}
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{neighborhood.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {neighborhood.description}
                    </p>
                    
                    {activeNeighborhood === index && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Common Venues:</h4>
                            <ul className="space-y-1">
                              {neighborhood.venues.map((venue, vIndex) => (
                                <li key={vIndex} className="text-gray-600 dark:text-gray-300 text-sm">• {venue}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Event Specialties:</h4>
                            <ul className="space-y-1">
                              {neighborhood.specialties.map((specialty, sIndex) => (
                                <li key={sIndex} className="text-gray-600 dark:text-gray-300 text-sm">• {specialty}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">Why Choose M10 DJ Company for Collierville Events?</h2>
                <p className="text-xl text-gray-200">
                  Community-focused expertise that honors Collierville's historic charm while creating modern, memorable celebrations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {whyChooseCollierville.map((reason, index) => (
                  <div key={index} className="flex items-start">
                    <reason.icon className="w-12 h-12 text-brand-gold mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                      <p className="text-gray-200 leading-relaxed">{reason.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Ready to Plan Your Collierville Event?</h3>
                  <p className="text-xl mb-6">
                    Get a custom quote for your Collierville, TN celebration with our community-focused DJ team
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="tel:(901) 410-2020"
                      className="bg-brand-gold text-black hover:bg-yellow-400 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call (901) 410-2020
                    </a>
                    <button 
                      onClick={scrollToContact}
                      className="border-2 border-white text-white hover:bg-white hover:text-brand px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Get Free Quote
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Collierville Client Testimonials</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  What Collierville families and businesses say about our DJ services and community expertise
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-brand-gold fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.event}</div>
                      <div className="text-brand text-sm">{testimonial.venue}</div>
                      <div className="text-gray-500 text-xs mt-1">{testimonial.date}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Collierville DJ Services FAQ</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Common questions about DJ services in Collierville, Tennessee
                </p>
              </div>

              <div className="space-y-8">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-start">
                      <MapPin className="w-6 h-6 text-brand mr-3 mt-1 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-9">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Have specific questions about your Collierville event?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="tel:(901) 410-2020"
                    className="btn-primary flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call (901) 410-2020
                  </a>
                  <button 
                    onClick={scrollToContact}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Consultation
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-800">
          <ContactForm />
        </section>

      </main>

      <Footer />
    </>
  );
}