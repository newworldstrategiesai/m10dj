import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import Link from 'next/link';
import { 
  Music, 
  Heart, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Award,
  CheckCircle,
  Play,
  ChevronRight,
  Clock
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import Breadcrumbs, { generateBreadcrumbs } from '../components/Breadcrumbs';
import { AIAnswerBlock, AIFactBox, MemphisDJAIBlocks, AIContentSchema } from '../components/AIOverviewOptimization';
import { scrollToContact } from '../utils/scroll-helpers';

const weddingServices = [
  {
    icon: Music,
    title: "Professional Wedding DJ",
    description: "Expert Memphis wedding DJs with 10+ years experience creating unforgettable celebrations"
  },
  {
    icon: Users,
    title: "Master of Ceremonies",
    description: "Professional MC services to guide your Memphis wedding timeline seamlessly"
  },
  {
    icon: Calendar,
    title: "Ceremony Music",
    description: "Beautiful processional, recessional, and cocktail hour music for your Memphis wedding"
  },
  {
    icon: Award,
    title: "Premium Sound Systems",
    description: "Crystal-clear audio equipment ensuring every word and song is perfectly heard"
  }
];

const venues = [
  "The Peabody Memphis",
  "Dixon Gallery & Gardens", 
  "Memphis Hunt & Country Club",
  "The Columns",
  "Graceland Wedding Chapel",
  "Memphis Botanic Garden",
  "The Hallmark",
  "Lichterman Nature Center",
  "Memphis Zoo",
  "AutoZone Park"
];

const reviews = [
  {
    name: "Quade Nowlin",
    venue: "The Peabody Memphis",
    text: "Ben was absolutely amazing for our Memphis wedding! From the ceremony to the reception, everything was flawless. The music selection kept everyone on the dance floor, and his MC skills were professional and engaging. Worth every penny!",
    rating: 5
  },
  {
    name: "Alexis Cameron", 
    venue: "Dixon Gallery & Gardens",
    text: "M10 DJ Company exceeded all our expectations! Ben understood our vision perfectly and created the ideal atmosphere for our Memphis wedding. The sound quality was incredible and he kept the energy high all night long.",
    rating: 5
  },
  {
    name: "Chandler Keen",
    venue: "Memphis Hunt & Country Club", 
    text: "We couldn't have asked for a better DJ! Ben was professional, accommodating, and really listened to what we wanted. Our Memphis wedding was perfect thanks to his expertise and attention to detail.",
    rating: 5
  }
];

export default function MemphisWeddingDJ() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <SEO
        title="Memphis Wedding DJ | #1 Professional Wedding DJs in Memphis TN | M10 DJ Company"
        description="Top-rated Memphis wedding DJ services. Professional wedding DJs for Memphis weddings with 10+ years experience. Ceremony, reception & MC services. Call (901) 410-2020!"
        keywords={[
          'Memphis wedding DJ',
          'wedding DJ Memphis TN', 
          'Memphis wedding DJs',
          'best wedding DJ Memphis',
          'professional wedding DJ Memphis',
          'Memphis wedding entertainment',
          'wedding DJ services Memphis'
        ]}
        canonical="/memphis-wedding-dj"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://www.m10djcompany.com/memphis-wedding-dj#business",
          "name": "M10 DJ Company - Memphis Wedding DJ",
          "description": "Memphis's premier wedding DJ service with 10+ years of experience creating unforgettable celebrations. Professional ceremony, reception & MC services.",
          "url": "https://www.m10djcompany.com/memphis-wedding-dj",
          "telephone": "+19014102020",
          "priceRange": "$799-$1899",
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
            }
          ],
          "serviceType": "Wedding DJ Services",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Memphis Wedding DJ Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Wedding DJ Services",
                  "description": "Professional wedding DJ and MC services for Memphis weddings"
                }
              },
              {
                "@type": "Offer", 
                "itemOffered": {
                  "@type": "Service",
                  "name": "Wedding Ceremony Music",
                  "description": "Professional ceremony music and sound system services"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service", 
                  "name": "Wedding Reception Entertainment",
                  "description": "Full reception DJ services with dance floor entertainment"
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
          }
        }}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    <span className="block text-white">Memphis Wedding DJ</span>
                    <span className="block text-gradient">Excellence</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    Memphis's premier wedding DJ service with 10+ years of experience creating unforgettable 
                    celebrations. From intimate ceremonies to grand receptions, we bring your wedding vision to life.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button 
                      onClick={scrollToContact}
                      className="btn-primary text-lg px-8 py-4"
                    >
                      Get Free Wedding Quote
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </button>
                    <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                      <Phone className="mr-2 w-5 h-5" />
                      Call (901) 410-2020
                    </a>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">500+</div>
                      <div className="text-sm text-gray-300">Memphis Weddings</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">10+</div>
                      <div className="text-sm text-gray-300">Years Experience</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">5★</div>
                      <div className="text-sm text-gray-300">Average Rating</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6">Why Choose M10 DJ Company?</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Memphis's most trusted wedding DJ service</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Professional MC and ceremony services</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Premium sound systems and lighting</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Transparent pricing with no hidden fees</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>All major Memphis venues approved</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Breadcrumb Navigation */}
        <section className="py-6 bg-white">
          <div className="section-container">
            <Breadcrumbs 
              items={generateBreadcrumbs.service('Memphis Wedding DJ')}
            />
          </div>
        </section>

        {/* AI-Optimized Answer Blocks */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <AIAnswerBlock {...MemphisDJAIBlocks.experience} />
            <AIAnswerBlock {...MemphisDJAIBlocks.pricing} />
            
            <AIFactBox 
              title="Memphis Wedding DJ Expertise"
              facts={[
                "Exclusive partnerships with 27+ premier Memphis wedding venues",
                "Professional-grade sound systems and elegant uplighting included",
                "Experienced MC services for seamless ceremony and reception flow",
                "Backup equipment and contingency plans for every event",
                "Transparent pricing with no hidden fees or surprise charges",
                "15+ years specializing in Memphis weddings and celebrations"
              ]}
            />
          </div>
        </section>

        {/* Wedding DJ Services Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Complete Memphis Wedding DJ Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From your ceremony processional to the last dance, we provide comprehensive 
                wedding DJ services that make your Memphis wedding unforgettable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {weddingServices.map((service, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                    <service.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Memphis Wedding Venues Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Trusted at Memphis's Premier Wedding Venues
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're the preferred wedding DJ service at Memphis's most beautiful venues. 
                Our team knows the unique requirements of each location.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {venues.map((venue, index) => (
                <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-800 font-medium text-sm">{venue}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/venues" className="btn-secondary">
                View All Partner Venues
              </Link>
            </div>
          </div>
        </section>

        {/* Memphis Wedding DJ Reviews */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                What Memphis Couples Say About Our Wedding DJ Service
              </h2>
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-brand-gold fill-current" />
                  ))}
                </div>
                <span className="ml-3 text-gray-600 font-medium">5.0 out of 5 stars from 200+ Memphis weddings</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-brand-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{review.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    <p className="text-gray-600 text-sm">{review.venue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Memphis Wedding DJ Pricing Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 text-gray-900 mb-6">
                Transparent Memphis Wedding DJ Pricing
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                No hidden fees or surprise charges. Our Memphis wedding DJ packages 
                include everything you need for your special day.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-brand-gold text-4xl font-bold mb-2">$295</div>
                  <div className="text-gray-600 mb-4">Starting Price</div>
                  <div className="text-sm text-gray-500">4-hour reception package</div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-brand-gold">
                  <div className="text-brand-gold text-4xl font-bold mb-2">$595</div>
                  <div className="text-gray-600 mb-4">Most Popular</div>
                  <div className="text-sm text-gray-500">Ceremony + 6-hour reception</div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-brand-gold text-4xl font-bold mb-2">$795</div>
                  <div className="text-gray-600 mb-4">Premium Package</div>
                  <div className="text-sm text-gray-500">Full day with lighting</div>
                </div>
              </div>

              <Link href="/services" className="btn-primary text-lg">
                View Detailed Wedding DJ Packages
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section for Memphis Wedding DJ */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-gray-900 text-center mb-16">
                Memphis Wedding DJ Frequently Asked Questions
              </h2>
              
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    How far in advance should I book a Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600">
                    We recommend booking your Memphis wedding DJ 6-12 months in advance, especially for popular 
                    wedding dates like Saturday evenings and peak wedding season (May-October). This ensures 
                    you get your preferred DJ and have time for detailed planning.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Do you provide ceremony music for Memphis weddings?
                  </h3>
                  <p className="text-gray-600">
                    Yes! Our Memphis wedding DJ packages include ceremony music with professional sound systems, 
                    wireless microphones for your officiant and vows, and coordination of processional and 
                    recessional music timing.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What Memphis wedding venues do you work with?
                  </h3>
                  <p className="text-gray-600">
                    We're approved and experienced at all major Memphis wedding venues including The Peabody, 
                    Dixon Gallery & Gardens, Memphis Hunt & Country Club, The Columns, and many more. We know 
                    each venue's unique requirements and restrictions.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What makes your Memphis wedding DJ service different?
                  </h3>
                  <p className="text-gray-600">
                    Our Memphis wedding DJs combine 10+ years of local experience with professional-grade equipment, 
                    personalized service, and transparent pricing. We're not just DJs – we're wedding entertainment 
                    specialists who understand Memphis couples and venues.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Do you offer lighting for Memphis weddings?
                  </h3>
                  <p className="text-gray-600">
                    Yes! We offer uplighting, dance floor lighting, and special effects lighting to transform 
                    your Memphis wedding venue. Our lighting packages can match your wedding colors and create 
                    the perfect ambiance for your celebration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Ready to Book Memphis's Best Wedding DJ?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Let's discuss your Memphis wedding and create an unforgettable celebration. 
                Get your free quote and consultation today!
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Contact Info */}
              <div className="space-y-8">
                <div className="modern-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Our Memphis Wedding DJ Team</h3>
                      <p className="text-gray-600 mb-3">Ready to discuss your Memphis wedding? Give us a call!</p>
                      <a href="tel:+19014102020" className="text-brand font-semibold hover:text-brand-600 transition-colors text-lg">
                        (901) 410-2020
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="modern-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                      <p className="text-gray-600 mb-3">Send us your Memphis wedding details and questions</p>
                      <a href="mailto:info@m10djcompany.com" className="text-brand font-semibold hover:text-brand-600 transition-colors">
                        info@m10djcompany.com
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="modern-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Memphis Service Area</h3>
                      <p className="text-gray-600">Greater Memphis area and surrounding counties within 50 miles</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Form */}
              <div id="contact-form" className="modern-card bg-white">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* AI-Optimized FAQ Section */}
        <section className="py-section bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis Wedding DJ Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600">
                  Get answers to common questions about our Memphis wedding DJ services
                </p>
              </div>

              <div className="space-y-8">
                {/* FAQ Item 1 - AI Snippet Ready */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How much does a Memphis wedding DJ cost?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Memphis wedding DJ services typically range from $799-$1899 depending on package, venue requirements, and event duration. 
                    M10 DJ Company offers transparent pricing with no hidden fees. Our packages include professional-grade sound systems, 
                    wireless microphones, basic uplighting, and experienced MC services. Premium packages add ceremony music, 
                    enhanced lighting, and extended coverage.
                  </p>
                </div>

                {/* FAQ Item 2 - Local Authority */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What makes M10 DJ Company the best Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    M10 DJ Company stands out with 15+ years of Memphis wedding experience, 500+ successful celebrations, 
                    and exclusive partnerships with premier venues like The Peabody Hotel, Memphis Botanic Garden, and Graceland. 
                    Our professional-grade sound systems, elegant uplighting, and expert MC services ensure flawless wedding 
                    entertainment from ceremony to reception.
                  </p>
                </div>

                {/* FAQ Item 3 - Process/Timeline */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How far in advance should we book our Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We recommend booking your Memphis wedding DJ 6-12 months in advance, especially for peak wedding season 
                    (April-October) and popular venues. This ensures availability and allows time for detailed planning. 
                    However, we can accommodate shorter timelines based on availability. Contact us immediately for last-minute bookings.
                  </p>
                </div>

                {/* FAQ Item 4 - Service Coverage */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do you travel outside Memphis for weddings?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes! We serve the greater Memphis area including Germantown, Collierville, Bartlett, Cordova, Millington, 
                    and surrounding communities within 50 miles. Travel fees may apply for venues outside our standard service area. 
                    We're experienced with venues throughout Tennessee, Mississippi, and Arkansas.
                  </p>
                </div>

                {/* FAQ Item 5 - Equipment/Setup */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What equipment do you provide for Memphis weddings?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our Memphis wedding DJ packages include professional sound systems, wireless microphones for ceremony and toasts, 
                    basic uplighting, DJ booth setup, and backup equipment. Premium packages add enhanced lighting, additional speakers 
                    for larger venues, and ceremony sound systems. All equipment is professional-grade and regularly maintained.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Enhanced Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "M10 DJ Company - Memphis Wedding DJ",
            "description": "Memphis's premier wedding DJ service with 10+ years experience. Professional ceremony, reception and MC services for weddings throughout Memphis, TN.",
            "url": "https://m10djcompany.com/memphis-wedding-dj",
            "telephone": "+19014102020",
            "email": "info@m10djcompany.com",
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
            "openingHours": "Mo-Su 09:00-21:00",
            "priceRange": "$295-$795",
            "image": "https://m10djcompany.com/logo-static.jpg",
            "sameAs": [
              "https://www.facebook.com/m10djcompany",
              "https://www.instagram.com/m10djcompany"
            ],
            "serviceArea": {
              "@type": "City",
              "name": "Memphis, TN"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Memphis Wedding DJ Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service", 
                    "name": "Memphis Wedding DJ",
                    "description": "Professional wedding DJ services for Memphis weddings"
                  }
                },
                {
                  "@type": "Offer", 
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Wedding Ceremony Music",
                    "description": "Professional ceremony music and sound for Memphis weddings"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Wedding MC Services", 
                    "description": "Master of ceremonies services for Memphis weddings"
                  }
                }
              ]
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5.0",
              "reviewCount": "200"
            }
          })
        }}
      />

      {/* FAQ Schema for AI Overview */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How much does a Memphis wedding DJ cost?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Memphis wedding DJ services typically range from $799-$1899 depending on package, venue requirements, and event duration. M10 DJ Company offers transparent pricing with no hidden fees. Our packages include professional-grade sound systems, wireless microphones, basic uplighting, and experienced MC services."
                }
              },
              {
                "@type": "Question", 
                "name": "What makes M10 DJ Company the best Memphis wedding DJ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "M10 DJ Company stands out with 15+ years of Memphis wedding experience, 500+ successful celebrations, and exclusive partnerships with premier venues like The Peabody Hotel, Memphis Botanic Garden, and Graceland. Our professional-grade sound systems, elegant uplighting, and expert MC services ensure flawless wedding entertainment from ceremony to reception."
                }
              },
              {
                "@type": "Question",
                "name": "How far in advance should we book our Memphis wedding DJ?", 
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We recommend booking your Memphis wedding DJ 6-12 months in advance, especially for peak wedding season (April-October) and popular venues. This ensures availability and allows time for detailed planning. However, we can accommodate shorter timelines based on availability."
                }
              },
              {
                "@type": "Question",
                "name": "Do you travel outside Memphis for weddings?",
                "acceptedAnswer": {
                  "@type": "Answer", 
                  "text": "Yes! We serve the greater Memphis area including Germantown, Collierville, Bartlett, Cordova, Millington, and surrounding communities within 50 miles. Travel fees may apply for venues outside our standard service area. We're experienced with venues throughout Tennessee, Mississippi, and Arkansas."
                }
              },
              {
                "@type": "Question",
                "name": "What equipment do you provide for Memphis weddings?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our Memphis wedding DJ packages include professional sound systems, wireless microphones for ceremony and toasts, basic uplighting, DJ booth setup, and backup equipment. Premium packages add enhanced lighting, additional speakers for larger venues, and ceremony sound systems. All equipment is professional-grade and regularly maintained."
                }
              }
            ]
          })
        }}
      />

      {/* AI Content Schema */}
      <AIContentSchema 
        content={{
          headline: "Memphis Wedding DJ | #1 Professional Wedding DJs in Memphis TN",
          description: "Top-rated Memphis wedding DJ services with 15+ years of experience and 500+ successful celebrations. Professional ceremony, reception & MC services.",
          url: "https://www.m10djcompany.com/memphis-wedding-dj",
          datePublished: "2024-01-01T00:00:00Z",
          dateModified: new Date().toISOString()
        }}
      />
    </>
  );
}