import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Building, 
  Users, 
  Calendar, 
  Award, 
  Phone, 
  Mail, 
  CheckCircle,
  ChevronRight,
  Volume2,
  Mic,
  Briefcase,
  Target,
  Trophy,
  Sparkles,
  Clock,
  DollarSign,
  Star,
  MapPin,
  Music,
  Headphones,
  Zap,
  Gift,
  GraduationCap,
  TreePine
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const eventTypes = [
  {
    icon: Building,
    title: "Corporate Events & Galas",
    description: "Professional Memphis corporate event DJ services for business conferences, company galas, and corporate celebrations",
    features: ["Company holiday parties", "Annual galas", "Awards ceremonies", "Business conferences", "Product launches"],
    price: "Starting at $595",
    popular: true,
    examples: ["FedEx corporate events", "St. Jude fundraising galas", "AutoZone leadership meetings"]
  },
  {
    icon: Briefcase,
    title: "Business Networking Events",
    description: "Professional background music and sound support for Memphis business networking events and mixers",
    features: ["Chamber of Commerce events", "Professional mixers", "Trade shows", "Business luncheons", "Industry conferences"],
    price: "Starting at $395",
    popular: true,
    examples: ["Memphis Chamber events", "Young Professionals mixers", "Industry trade shows"]
  },
  {
    icon: GraduationCap,
    title: "Educational Institution Events",
    description: "Event DJ services for Memphis schools, universities, and educational celebrations",
    features: ["University events", "Alumni gatherings", "Graduation parties", "School fundraisers", "Academic ceremonies"],
    price: "Starting at $495",
    popular: false,
    examples: ["University of Memphis events", "Rhodes College functions", "Memphis area school districts"]
  },
  {
    icon: Gift,
    title: "Milestone & Anniversary Celebrations",
    description: "Event entertainment for corporate milestones, business anniversaries, and company achievement celebrations",
    features: ["Company anniversaries", "Milestone celebrations", "Achievement awards", "Retirement parties", "Executive celebrations"],
    price: "Starting at $495",
    popular: false,
    examples: ["50th anniversary celebrations", "Executive retirement parties", "Achievement award ceremonies"]
  },
  {
    icon: Users,
    title: "Non-Profit & Fundraising Events",
    description: "Professional Memphis event DJ services for charitable organizations, fundraisers, and community events",
    features: ["Charity galas", "Fundraising dinners", "Silent auctions", "Community events", "Non-profit celebrations"],
    price: "Starting at $445",
    popular: true,
    examples: ["United Way events", "Le Bonheur fundraisers", "Local charity galas"]
  },
  {
    icon: TreePine,
    title: "Seasonal & Holiday Corporate Events",
    description: "Specialized Memphis holiday party DJ services for corporate Christmas parties, summer events, and seasonal celebrations",
    features: ["Christmas parties", "Summer company picnics", "New Year celebrations", "Halloween parties", "Spring events"],
    price: "Starting at $545",
    popular: true,
    examples: ["Corporate Christmas parties", "Summer outdoor events", "Holiday networking mixers"]
  }
];

const corporateVenues = [
  {
    name: "The Peabody Memphis",
    type: "Luxury Hotel",
    capacity: "500+ guests",
    specialty: "Corporate galas & conferences"
  },
  {
    name: "Memphis Cook Convention Center",
    type: "Convention Center", 
    capacity: "2,000+ guests",
    specialty: "Large corporate events & trade shows"
  },
  {
    name: "FedExForum",
    type: "Arena/Stadium",
    capacity: "18,000+ guests", 
    specialty: "Major corporate events & presentations"
  },
  {
    name: "Crosstown Concourse",
    type: "Creative Venue",
    capacity: "300+ guests",
    specialty: "Modern corporate events & networking"
  },
  {
    name: "Memphis Botanic Garden",
    type: "Outdoor Venue",
    capacity: "400+ guests",
    specialty: "Corporate picnics & outdoor events"
  },
  {
    name: "The Cotton Museum",
    type: "Historic Venue",
    capacity: "200+ guests", 
    specialty: "Executive dinners & intimate corporate events"
  }
];

const services = [
  {
    icon: Volume2,
    title: "Professional Sound Systems",
    description: "High-quality audio equipment for presentations, speeches, and background music"
  },
  {
    icon: Mic,
    title: "Microphone & PA Support",
    description: "Wireless microphones, podium setups, and full PA systems for corporate presentations"
  },
  {
    icon: Music,
    title: "Background Music Programming",
    description: "Curated playlists appropriate for professional environments and corporate atmospheres"
  },
  {
    icon: Headphones,
    title: "Event Coordination",
    description: "Timeline management, vendor coordination, and seamless event flow management"
  },
  {
    icon: Zap,
    title: "Lighting & Ambiance",
    description: "Professional uplighting, ambient lighting, and visual enhancement for corporate events"
  },
  {
    icon: Award,
    title: "Master of Ceremonies",
    description: "Professional MC services for award ceremonies, introductions, and event hosting"
  }
];

const testimonials = [
  {
    name: "Jamie Irby",
    title: "Entertainment Director - The Bluff",
    company: "The Bluff, Memphis TN",
    quote: "As entertainment director at The Bluff, I've worked with many DJs, but M10 DJ Company stands out. Ben is professional, reliable, and always delivers exceptional service for our Memphis events. Highly recommend!",
    rating: 5,
    eventType: "Venue Entertainment"
  },
  {
    name: "Sarah Mitchell",
    title: "Event Coordinator", 
    company: "Memphis Chamber of Commerce",
    quote: "M10 DJ Company has provided outstanding entertainment for our corporate networking events. Professional setup, perfect volume levels, and they understand the business environment perfectly.",
    rating: 5,
    eventType: "Corporate Networking"
  },
  {
    name: "David Thompson",
    title: "HR Director",
    company: "Local Memphis Corporation",
    quote: "Our annual company holiday party was a huge success thanks to M10 DJ Company. They struck the perfect balance between professional and fun, keeping everyone engaged throughout the evening.", 
    rating: 5,
    eventType: "Corporate Holiday Party"
  }
];

const faqs = [
  {
    question: "What makes your Memphis event DJ services different for corporate events?",
    answer: "We specialize in professional corporate atmospheres with appropriate music selection, professional equipment, and understanding of business etiquette. Our DJs are experienced in corporate settings and know how to maintain the right energy for professional environments."
  },
  {
    question: "Do you provide sound equipment for presentations and speeches?",
    answer: "Yes! We provide full PA systems, wireless microphones, podium setups, and presentation support. Our equipment is professional-grade and suitable for corporate presentations, award ceremonies, and business conferences."
  },
  {
    question: "Can you work with our event planner or venue coordinator?",
    answer: "Absolutely. We regularly collaborate with event planners, venue coordinators, and corporate teams to ensure seamless events. We're experienced in timeline coordination and working within professional event management structures."
  },
  {
    question: "What's included in your Memphis corporate event DJ packages?",
    answer: "Our packages include professional DJ services, sound system, microphones, basic lighting, music programming, and event coordination. We customize each package based on your specific corporate event needs and venue requirements."
  },
  {
    question: "Do you have liability insurance for corporate venues?",
    answer: "Yes, we carry comprehensive liability insurance and can provide certificates of insurance to venues and corporate clients as required. We're fully insured and professional for corporate events of any size."
  },
  {
    question: "How far in advance should we book for Memphis corporate events?",
    answer: "For corporate events, we recommend booking 4-8 weeks in advance, especially for popular dates like December holiday parties or summer corporate events. However, we can often accommodate shorter notice depending on availability."
  }
];

export default function MemphisEventDJServices() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Memphis Event DJ Services | Corporate Event Entertainment | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Professional Memphis event DJ services for corporate events, business galas, networking events & company celebrations. Experienced corporate DJs with professional equipment. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="event DJ Memphis, corporate event DJ Memphis, Memphis corporate DJ, business event DJ Memphis, company party DJ Memphis, Memphis event entertainment, corporate DJ services Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/memphis-event-dj-services" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis Event DJ Services | Corporate Event Entertainment" />
        <meta property="og:description" content="Professional Memphis corporate event DJ services for business events, galas, and company celebrations. Experienced DJs with professional equipment and corporate expertise." />
        <meta property="og:url" content="https://m10djcompany.com/memphis-event-dj-services" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "M10 DJ Company - Event DJ Services",
              "description": "Professional corporate event DJ services in Memphis, TN",
              "url": "https://m10djcompany.com/memphis-event-dj-services",
              "telephone": "+19014102020",
              "email": "booking@m10djcompany.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Memphis",
                "addressRegion": "TN",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 35.1495,
                "longitude": -90.0490
              },
              "serviceType": ["Corporate Event DJ", "Business Event Entertainment", "Corporate Party DJ", "Event DJ Services"],
              "areaServed": {
                "@type": "City",
                "name": "Memphis",
                "containedInPlace": {
                  "@type": "State",
                  "name": "Tennessee"
                }
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Corporate Event DJ Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Corporate Event DJ",
                      "description": "Professional DJ services for corporate events and business celebrations"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Business Networking Event DJ",
                      "description": "DJ services for professional networking events and business mixers"
                    }
                  }
                ]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "150",
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
                  <Building className="w-8 h-8 text-brand-gold mr-3" />
                  <span className="text-brand-gold font-semibold text-lg">Corporate Event Specialists</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                  <span className="block">Memphis Event DJ</span>
                  <span className="block text-brand-gold">Services</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Professional corporate event DJ services for Memphis businesses. From networking events to company galas, 
                  we deliver sophisticated entertainment with professional equipment and business expertise.
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
                    href="#event-types" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    View Services
                  </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">200+</div>
                    <div className="text-white font-semibold">Corporate Events</div>
                    <div className="text-gray-300 text-sm">Successfully completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">5★</div>
                    <div className="text-white font-semibold">Client Rating</div>
                    <div className="text-gray-300 text-sm">Professional service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">15+</div>
                    <div className="text-white font-semibold">Years Experience</div>
                    <div className="text-gray-300 text-sm">Memphis market</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">24hr</div>
                    <div className="text-white font-semibold">Response Time</div>
                    <div className="text-gray-300 text-sm">For event quotes</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Event Types Section */}
        <section id="event-types" className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Memphis Corporate Event DJ Services</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Specialized event entertainment for Memphis businesses, organizations, and professional events. 
                  Every service is tailored to maintain the appropriate atmosphere for your corporate environment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {eventTypes.map((eventType, index) => (
                  <div 
                    key={index} 
                    className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                      eventType.popular ? 'ring-2 ring-brand/20' : ''
                    }`}
                  >
                    <div className="flex items-center mb-6">
                      <eventType.icon className="w-12 h-12 text-brand mr-4" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{eventType.title}</h3>
                        {eventType.popular && (
                          <span className="text-brand text-sm font-semibold">Most Popular</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {eventType.description}
                    </p>
                    
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">Services Include:</h4>
                      <ul className="space-y-2">
                        {eventType.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-brand mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Recent Memphis Events:</h4>
                      <div className="flex flex-wrap gap-2">
                        {eventType.examples.map((example, eIndex) => (
                          <span key={eIndex} className="bg-brand/10 text-brand px-2 py-1 rounded text-xs">
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-brand font-bold text-lg">{eventType.price}</div>
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

        {/* Services Included Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Professional Event Services</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Comprehensive entertainment and technical services designed specifically for corporate environments
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center hover:shadow-lg transition-all">
                    <service.icon className="w-12 h-12 text-brand mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{service.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{service.description}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Memphis Venues Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Memphis Corporate Event Venues We Serve</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Experienced at Memphis's premier corporate event venues with knowledge of their technical requirements and acoustics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {corporateVenues.map((venue, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <MapPin className="w-6 h-6 text-brand mr-3" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{venue.name}</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{venue.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{venue.capacity}</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Specialty:</span>
                        <p className="text-gray-900 dark:text-white text-sm font-medium">{venue.specialty}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Don't see your venue listed? We work with all Memphis corporate event venues.
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

        {/* Testimonials Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">What Memphis Businesses Say</h2>
                <p className="text-xl text-gray-200">
                  Trusted by Memphis corporations, venues, and event professionals
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-brand-gold fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className="text-lg mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="border-t border-white/20 pt-4">
                      <div className="font-bold">{testimonial.name}</div>
                      <div className="text-gray-300 text-sm">{testimonial.title}</div>
                      <div className="text-gray-300 text-sm">{testimonial.company}</div>
                      <div className="text-brand-gold text-xs mt-1">{testimonial.eventType}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Common questions about our Memphis corporate event DJ services
                </p>
              </div>

              <div className="space-y-8">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-start">
                      <Briefcase className="w-6 h-6 text-brand mr-3 mt-1 flex-shrink-0" />
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
                  Have specific questions about your Memphis corporate event?
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
                    <Mail className="w-5 h-5 mr-2" />
                    Get Event Quote
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-24 bg-white dark:bg-gray-900">
          <ContactForm />
        </section>

      </main>

      <Footer />
    </>
  );
}