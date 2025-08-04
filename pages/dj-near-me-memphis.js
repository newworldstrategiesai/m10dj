import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  MapPin, 
  Phone,
  Clock,
  Star,
  Navigation,
  Users,
  Music,
  Award,
  CheckCircle,
  ChevronRight,
  Search,
  Calendar,
  Volume2,
  Mic,
  Heart,
  Building,
  GraduationCap,
  Sparkles,
  Mail
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const serviceAreas = [
  {
    area: "Downtown Memphis",
    neighborhoods: ["South Main", "Cooper-Young", "Medical District", "Pinch District"],
    driveTime: "5-15 minutes",
    popular: true
  },
  {
    area: "East Memphis", 
    neighborhoods: ["Germantown Parkway", "Poplar Corridor", "White Station", "Mendenhall"],
    driveTime: "10-20 minutes",
    popular: true
  },
  {
    area: "Midtown Memphis",
    neighborhoods: ["Overton Park", "Evergreen", "University District", "Central Gardens"],
    driveTime: "5-15 minutes",
    popular: true
  },
  {
    area: "Germantown",
    neighborhoods: ["Forest Hill", "Riverdale", "Farmington"],
    driveTime: "15-25 minutes",
    popular: true
  },
  {
    area: "Collierville", 
    neighborhoods: ["Historic Collierville", "Schilling Farms", "Bailey Station"],
    driveTime: "20-30 minutes",
    popular: true
  },
  {
    area: "Bartlett",
    neighborhoods: ["Bartlett Station", "Wolfchase", "Elmore Park"],
    driveTime: "15-25 minutes",
    popular: false
  },
  {
    area: "Cordova",
    neighborhoods: ["Cordova Station", "Appling", "Dexter"],
    driveTime: "15-25 minutes", 
    popular: false
  },
  {
    area: "Southaven, MS",
    neighborhoods: ["Southbrook", "Heritage", "Greenbrook"],
    driveTime: "20-30 minutes",
    popular: true
  },
  {
    area: "Olive Branch, MS", 
    neighborhoods: ["Chickasaw Trails", "Olive Branch City Center"],
    driveTime: "25-35 minutes",
    popular: false
  }
];

const djServices = [
  {
    icon: Heart,
    title: "Wedding DJ Near You",
    description: "Professional Memphis wedding DJ services with ceremony, reception, and MC services",
    link: "/memphis-wedding-dj",
    popular: true
  },
  {
    icon: Building,
    title: "Corporate Event DJ",
    description: "Business event entertainment for Memphis companies and organizations", 
    link: "/memphis-dj-services",
    popular: true
  },
  {
    icon: Users,
    title: "Private Party DJ",
    description: "Birthday parties, anniversaries, and personal celebrations",
    link: "/memphis-dj-services",
    popular: true
  },
  {
    icon: GraduationCap,
    title: "School Event DJ",
    description: "Prom, homecoming, and school dance entertainment",
    link: "/memphis-dj-services",
    popular: false
  },
  {
    icon: Sparkles,
    title: "Holiday Party DJ", 
    description: "Christmas parties, New Year's events, and seasonal celebrations",
    link: "/memphis-dj-services",
    popular: false
  },
  {
    icon: Music,
    title: "Karaoke & Interactive",
    description: "DJ with karaoke, games, and interactive entertainment",
    link: "/services",
    popular: false
  }
];

const quickStats = [
  {
    number: "500+",
    label: "Events Completed",
    subtext: "Across Memphis area"
  },
  {
    number: "5★",
    label: "Average Rating", 
    subtext: "From local clients"
  },
  {
    number: "15+",
    label: "Years Experience",
    subtext: "Memphis DJ services"
  },
  {
    number: "24hr",
    label: "Response Time",
    subtext: "For quotes & bookings"
  }
];

const faqs = [
  {
    question: "How do I find the best DJ near me in Memphis?",
    answer: "Look for a DJ company with strong local reviews, extensive experience in Memphis venues, and professional equipment. M10 DJ Company has 15+ years serving Memphis with 500+ successful events and 5-star ratings."
  },
  {
    question: "What areas of Memphis do you serve?",
    answer: "We serve all of Memphis and surrounding areas including Germantown, Collierville, Bartlett, Cordova, Southaven MS, and Olive Branch MS. Our average drive time is 15-30 minutes to most locations."
  },
  {
    question: "How quickly can you respond to DJ requests near me?",
    answer: "We typically respond to all inquiries within 2-4 hours during business hours, and within 24 hours on weekends. For urgent last-minute requests, call us directly at (901) 410-2020."
  },
  {
    question: "Do you provide DJ services for same-day events?",
    answer: "When possible, yes! While we recommend booking in advance, we maintain backup equipment and can often accommodate same-day requests depending on availability and location."
  },
  {
    question: "What makes you different from other Memphis DJs?",
    answer: "We're locally owned with deep Memphis roots, professional-grade equipment, comprehensive insurance, and a track record of 500+ successful events. We know Memphis venues, audiences, and what works in our city."
  }
];

export default function DJNearMemphis() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>DJ Near Me | Wedding DJ Near Me | Memphis Local DJs | M10 DJ Company</title>
        <meta 
          name="description" 
          content="DJ near me in Memphis? Wedding DJ near me? M10 DJ Company provides local DJ services throughout Memphis with same-day quotes. Professional DJs near you for weddings, events & parties. Call (901) 410-2020!"
        />
        <meta name="keywords" content="DJ near me, wedding DJ near me, DJ near me Memphis, Memphis DJ near me, local DJ Memphis, event DJ near me, find DJ near me, Memphis area DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/dj-near-me-memphis" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ Near Me Memphis | Local Wedding & Event DJs" />
        <meta property="og:description" content="Professional DJ services near you in Memphis. Wedding, corporate, and party entertainment with 15+ years experience and 5-star ratings." />
        <meta property="og:url" content="https://m10djcompany.com/dj-near-me-memphis" />
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
              "name": "M10 DJ Company",
              "description": "Professional DJ services near you in Memphis and surrounding areas",
              "url": "https://m10djcompany.com/dj-near-me-memphis",
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
              "areaServed": [
                {
                  "@type": "City",
                  "name": "Memphis",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "City", 
                  "name": "Germantown",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "City",
                  "name": "Collierville", 
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "City",
                  "name": "Southaven",
                  "containedInPlace": {
                    "@type": "State", 
                    "name": "Mississippi"
                  }
                }
              ],
              "openingHours": "Mo-Su 09:00-21:00",
              "priceRange": "$$",
              "image": "https://m10djcompany.com/logo-static.jpg",
              "serviceType": ["Wedding DJ", "Corporate Event DJ", "Party DJ", "Event Entertainment"],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "DJ Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Wedding DJ Services",
                      "description": "Professional wedding DJ and MC services"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Corporate Event DJ",
                      "description": "Business event and corporate party entertainment"
                    }
                  }
                ]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "200",
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
                  <Navigation className="w-8 h-8 text-brand-gold mr-3" />
                  <span className="text-brand-gold font-semibold text-lg">Find Local Memphis DJs</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                  <span className="block">DJ Near Me</span>
                  <span className="block text-brand-gold">Memphis, TN</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Professional wedding & event DJ services throughout Memphis and surrounding areas. 
                  Locally owned, 15+ years experience, serving your neighborhood.
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
                    href="#service-areas" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Find My Area
                  </a>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {quickStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-brand-gold">{stat.number}</div>
                      <div className="text-white font-semibold">{stat.label}</div>
                      <div className="text-gray-300 text-sm">{stat.subtext}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <section id="service-areas" className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Memphis Area DJ Services</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  We proudly serve Memphis and all surrounding communities with professional DJ services. 
                  Click on your area to see neighborhoods we cover and estimated drive times.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {serviceAreas.map((area, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-xl p-6 cursor-pointer transition-all ${
                      area.popular 
                        ? 'border-brand bg-brand/5 hover:bg-brand/10' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'
                    } ${selectedArea === index ? 'ring-2 ring-brand' : ''}`}
                    onClick={() => setSelectedArea(selectedArea === index ? null : index)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{area.area}</h3>
                      {area.popular && (
                        <span className="bg-brand-gold text-black px-3 py-1 rounded-full text-sm font-bold">
                          Popular
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">{area.driveTime} drive time</span>
                    </div>

                    {selectedArea === index && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Neighborhoods:</h4>
                        <div className="flex flex-wrap gap-2">
                          {area.neighborhoods.map((neighborhood, nIndex) => (
                            <span key={nIndex} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                              {neighborhood}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Don't see your area listed? We travel throughout the greater Memphis region.
                </p>
                <button 
                  onClick={scrollToContact}
                  className="btn-primary"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Ask About Your Area
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* DJ Services Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Local DJ Services Near You</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Whatever your event type, we have the experience and equipment to make it memorable. 
                  Click on a service to learn more about our offerings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {djServices.map((service, index) => (
                  <Link 
                    key={index} 
                    href={service.link}
                    className={`block bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                      service.popular ? 'ring-2 ring-brand/20' : ''
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <service.icon className="w-10 h-10 text-brand mr-4" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{service.title}</h3>
                        {service.popular && (
                          <span className="text-brand text-sm font-semibold">Most Popular</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center text-brand font-semibold">
                      <span>Learn More</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Why Choose Local Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              
              <h2 className="text-4xl font-bold mb-8">Why Choose a Local Memphis DJ?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">Know Memphis Venues</h3>
                  <p className="text-gray-200">
                    We've performed at every major Memphis venue and know the acoustics, logistics, and requirements.
                  </p>
                </div>
                
                <div className="text-center">
                  <Users className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">Understand Local Crowds</h3>
                  <p className="text-gray-200">
                    15+ years entertaining Memphis audiences means we know what gets your guests dancing.
                  </p>
                </div>
                
                <div className="text-center">
                  <Clock className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">Quick Response Times</h3>
                  <p className="text-gray-200">
                    Being local means faster response times for quotes, meetings, and emergency support.
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Memphis Born & Raised</h3>
                <p className="text-xl mb-6">
                  M10 DJ Company is proudly locally owned and operated. We're not a national chain - 
                  we're your Memphis neighbors who understand what makes our city special.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/dj-ben-murray"
                    className="bg-brand-gold text-black hover:bg-yellow-400 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                  >
                    <Award className="w-5 h-5 mr-2" />
                    Meet DJ Ben Murray
                  </Link>
                  <Link 
                    href="/memphis-dj-services"
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    View All Services
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Common questions about finding and booking a DJ near you in Memphis
                </p>
              </div>

              <div className="space-y-8">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-start">
                      <Search className="w-6 h-6 text-brand mr-3 mt-1 flex-shrink-0" />
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
                  Have more questions? We're here to help!
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
                    Send Message
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