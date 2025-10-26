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

const germantownVenues = [
  {
    name: "Germantown Country Club",
    type: "Private Club",
    capacity: "250 guests",
    specialty: "Elegant wedding receptions",
    address: "7555 Poplar Ave, Germantown, TN",
    features: ["Ballroom", "Outdoor ceremony space", "Full bar service", "Valet parking"]
  },
  {
    name: "Germantown Performing Arts Centre",
    type: "Performance Venue",
    capacity: "400+ guests",
    specialty: "Corporate events & galas",
    address: "1801 Exeter Rd, Germantown, TN",
    features: ["State-of-the-art sound", "Professional lighting", "Large stage", "Premium seating"]
  },
  {
    name: "The Dixon Gallery & Gardens",
    type: "Museum & Gardens",
    capacity: "200 guests",
    specialty: "Sophisticated wedding ceremonies",
    address: "4339 Park Ave, Memphis, TN (Near Germantown)",
    features: ["Garden ceremony sites", "Museum galleries", "Catering kitchen", "Historic charm"]
  },
  {
    name: "Saddle Creek",
    type: "Event Venue",
    capacity: "150 guests",
    specialty: "Intimate celebrations",
    address: "Germantown Area",
    features: ["Indoor/outdoor options", "Full service bar", "Dance floor", "Bridal suite"]
  },
  {
    name: "River Oaks",
    type: "Country Club",
    capacity: "300 guests",
    specialty: "Luxury wedding receptions",
    address: "Germantown, TN",
    features: ["Golf course views", "Multiple event spaces", "Premium catering", "Valet service"]
  }
];

const services = [
  {
    icon: Heart,
    title: "Germantown Wedding DJ",
    description: "Premium wedding DJ services for Germantown's most elegant celebrations and luxury venues",
    features: ["Ceremony & reception music", "Professional MC services", "Premium sound systems", "Uplighting packages"],
    price: "Starting at $795",
    popular: true
  },
  {
    icon: Building,
    title: "Corporate Event DJ",
    description: "Professional corporate entertainment for Germantown businesses and executive events",
    features: ["Business presentation support", "Corporate gala entertainment", "Networking event music", "Award ceremony audio"],
    price: "Starting at $595",
    popular: true
  },
  {
    icon: Users,
    title: "Private Party DJ",
    description: "Sophisticated entertainment for Germantown private celebrations and milestone events",
    features: ["Anniversary celebrations", "Birthday parties", "Retirement parties", "Family reunions"],
    price: "Starting at $495",
    popular: false
  },
  {
    icon: GraduationCap,
    title: "School & Community Events",
    description: "Professional DJ services for Germantown schools and community organizations",
    features: ["School dance entertainment", "Community fundraisers", "Graduation parties", "Educational events"],
    price: "Starting at $445",
    popular: false
  }
];

const neighborhoods = [
  {
    name: "Forest Hill Irene",
    description: "Prestigious residential area with luxury homes and private event spaces",
    venues: ["Private estates", "Garden venues", "Exclusive clubs"],
    specialties: ["High-end weddings", "Executive parties", "Luxury celebrations"]
  },
  {
    name: "Germantown Hills",
    description: "Upscale community known for sophisticated events and country club lifestyle",
    venues: ["Country clubs", "Golf course venues", "Private residences"],
    specialties: ["Country club weddings", "Corporate golf events", "Anniversary celebrations"]
  },
  {
    name: "Thornwood",
    description: "Elite neighborhood featuring some of Germantown's finest event venues",
    venues: ["Historic venues", "Boutique event spaces", "Private clubs"],
    specialties: ["Intimate weddings", "Business dinners", "Milestone celebrations"]
  },
  {
    name: "Poplar Corridor",
    description: "Business district with modern venues and corporate event spaces",
    venues: ["Business centers", "Hotels", "Conference facilities"],
    specialties: ["Corporate events", "Business meetings", "Professional gatherings"]
  }
];

const testimonials = [
  {
    name: "Elizabeth Morrison",
    event: "Wedding Reception",
    venue: "Germantown Country Club",
    quote: "M10 DJ Company made our Germantown wedding absolutely perfect! Ben understood our vision for an elegant celebration and delivered flawlessly. The music selection was sophisticated and kept our guests dancing all evening.",
    rating: 5,
    date: "September 2024"
  },
  {
    name: "David Richardson", 
    event: "Corporate Gala",
    venue: "Germantown Performing Arts Centre",
    quote: "Professional, reliable, and exactly what we needed for our annual corporate gala. The sound quality was exceptional and Ben coordinated perfectly with our event timeline. Highly recommended for business events in Germantown.",
    rating: 5,
    date: "October 2024"
  },
  {
    name: "Catherine Williams",
    event: "50th Anniversary Party",
    venue: "The Dixon Gallery & Gardens",
    quote: "Ben created the perfect atmosphere for our parents' 50th anniversary celebration. The music spanned five decades beautifully, and he handled all the special announcements with class and professionalism.",
    rating: 5,
    date: "August 2024"
  }
];

const whyChooseGermantown = [
  {
    icon: Award,
    title: "Germantown Venue Expertise",
    description: "Extensive experience with Germantown's premier venues including country clubs, performing arts centers, and private estates"
  },
  {
    icon: Users,
    title: "Upscale Event Specialization",
    description: "Specialized in sophisticated celebrations that match Germantown's refined atmosphere and high expectations"
  },
  {
    icon: Music,
    title: "Premium Equipment & Service",
    description: "Professional-grade sound systems and lighting designed for Germantown's luxury venues and discerning clientele"
  },
  {
    icon: Clock,
    title: "Local Accessibility",
    description: "Based in Memphis with quick response times and intimate knowledge of Germantown's event landscape"
  }
];

const faqs = [
  {
    question: "Do you provide DJ services throughout Germantown, Tennessee?",
    answer: "Yes, we provide professional DJ services throughout all of Germantown, TN including Forest Hill Irene, Germantown Hills, Thornwood, and the Poplar Corridor business district. We're familiar with all major Germantown venues and can serve any location within the city."
  },
  {
    question: "What makes your Germantown DJ services different?",
    answer: "We specialize in upscale events that match Germantown's sophisticated atmosphere. Our experience with luxury venues like Germantown Country Club and the Performing Arts Centre means we understand the higher expectations and refined entertainment needs of Germantown celebrations."
  },
  {
    question: "Do you work with Germantown Country Club and other exclusive venues?",
    answer: "Absolutely! We have extensive experience at Germantown Country Club, River Oaks, Saddle Creek, and the Germantown Performing Arts Centre. We're familiar with their technical requirements, policies, and preferred vendor relationships."
  },
  {
    question: "What are your rates for Germantown DJ services?",
    answer: "Our Germantown DJ packages start at $495 for private parties and $795 for weddings. Pricing varies based on event duration, guest count, and specific venue requirements. We offer premium packages designed for Germantown's luxury event market."
  },
  {
    question: "How far in advance should we book for a Germantown event?",
    answer: "For Germantown events, especially at popular venues like country clubs, we recommend booking 6-12 months in advance. Peak wedding season (May-October) dates fill up quickly, particularly for Saturday evenings at premium Germantown venues."
  },
  {
    question: "Do you provide both ceremony and reception DJ services in Germantown?",
    answer: "Yes, we provide complete wedding day coverage including ceremony music, cocktail hour entertainment, and reception DJ services. This is particularly popular for Germantown venues that offer both indoor and outdoor spaces for comprehensive celebrations."
  }
];

export default function DJGermantownTN() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeNeighborhood, setActiveNeighborhood] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Best DJ Germantown TN | Wedding DJ Germantown | Professional DJ Services | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Memphis's Best DJ Germantown TN ⭐ Luxury Wedding DJ Services ⭐ Germantown Country Club & GPAC Expert! Professional Germantown DJ for weddings & events. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="DJ Germantown TN, Germantown DJ services, wedding DJ Germantown Tennessee, DJ services Germantown TN, Germantown wedding DJ, corporate DJ Germantown TN, Germantown event DJ, DJ Germantown Tennessee, best DJ Germantown, professional DJ Germantown" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/dj-germantown-tn" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ Germantown TN | Wedding & Event DJ Services | Germantown Tennessee" />
        <meta property="og:description" content="Professional DJ services in Germantown, TN for weddings, corporate events, and celebrations. Experienced with luxury venues and upscale events." />
        <meta property="og:url" content="https://m10djcompany.com/dj-germantown-tn" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Germantown, Tennessee" />
        <meta name="ICBM" content="35.0868, -89.8101" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "M10 DJ Company - Germantown TN Services",
              "description": "Professional DJ services in Germantown, Tennessee for weddings, corporate events, and celebrations",
              "url": "https://m10djcompany.com/dj-germantown-tn",
              "telephone": "+19014102020",
              "email": "booking@m10djcompany.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Germantown",
                "addressRegion": "TN",
                "postalCode": "38138",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 35.0868,
                "longitude": -89.8101
              },
              "areaServed": [
                {
                  "@type": "City",
                  "name": "Germantown",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                }
              ],
              "serviceType": ["Wedding DJ", "Corporate Event DJ", "Party DJ", "Event Entertainment"],
              "priceRange": "$495-$1195",
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
                  <span className="text-brand-gold font-semibold text-lg">Serving Germantown, Tennessee</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                  <span className="block">DJ Germantown TN</span>
                  <span className="block text-brand-gold">Premium Event Services</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Professional DJ services for Germantown, Tennessee weddings, corporate events, and upscale celebrations. 
                  Experienced with luxury venues and sophisticated entertainment for discerning clients.
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
                    href="#germantown-services" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    View Services
                  </a>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">50+</div>
                    <div className="text-white font-semibold">Germantown Events</div>
                    <div className="text-gray-300 text-sm">Successfully completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">5★</div>
                    <div className="text-white font-semibold">Client Rating</div>
                    <div className="text-gray-300 text-sm">Consistent excellence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">15+</div>
                    <div className="text-white font-semibold">Years Experience</div>
                    <div className="text-gray-300 text-sm">Memphis area expertise</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">30min</div>
                    <div className="text-white font-semibold">Response Time</div>
                    <div className="text-gray-300 text-sm">Local accessibility</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="germantown-services" className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Professional DJ Services in Germantown, TN</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Specialized entertainment services designed for Germantown's sophisticated venues and upscale celebrations
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

        {/* Germantown Venues Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Germantown, TN Wedding & Event Venues We Serve</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Extensive experience with Germantown's premier event venues, from luxury country clubs to sophisticated performance spaces
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {germantownVenues.map((venue, index) => (
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
                  Planning an event at a different Germantown venue? We work with all event spaces throughout the city.
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

        {/* Germantown Neighborhoods Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Germantown Neighborhoods We Serve</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  From Forest Hill Irene to Thornwood, we provide professional DJ services throughout all of Germantown's prestigious communities
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
                <h2 className="text-4xl font-bold mb-6">Why Choose M10 DJ Company for Germantown Events?</h2>
                <p className="text-xl text-gray-200">
                  Specialized expertise in Germantown's upscale event market with a proven track record of sophisticated celebrations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {whyChooseGermantown.map((reason, index) => (
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
                  <h3 className="text-2xl font-bold mb-4">Ready to Plan Your Germantown Event?</h3>
                  <p className="text-xl mb-6">
                    Get a custom quote for your Germantown, TN celebration with our experienced DJ team
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
                <h2 className="heading-2 mb-6">Germantown Client Testimonials</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  What Germantown clients say about our DJ services and event expertise
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
                <h2 className="heading-2 mb-6">Germantown DJ Services FAQ</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Common questions about DJ services in Germantown, Tennessee
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
                  Have specific questions about your Germantown event?
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