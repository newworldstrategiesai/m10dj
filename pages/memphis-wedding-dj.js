import { useState, useEffect } from 'react';
import Head from 'next/head';
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
    name: "Sarah & Michael",
    venue: "Dixon Gallery & Gardens",
    text: "M10 DJ Company made our Memphis wedding absolutely perfect! They read the room perfectly and kept everyone dancing all night long.",
    rating: 5
  },
  {
    name: "Ashley & David", 
    venue: "The Peabody Memphis",
    text: "Professional, responsive, and incredibly talented. Our Memphis wedding DJ exceeded all expectations. Highly recommend!",
    rating: 5
  },
  {
    name: "Jennifer & Chris",
    venue: "Memphis Hunt & Country Club", 
    text: "From ceremony to reception, they handled everything flawlessly. The best Memphis wedding DJ service we could have chosen!",
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
      <Head>
        <title>Memphis Wedding DJ | #1 Professional Wedding DJs in Memphis TN | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Top-rated Memphis wedding DJ services. Professional wedding DJs for Memphis weddings with 10+ years experience. Ceremony, reception & MC services. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="Memphis wedding DJ, wedding DJ Memphis TN, Memphis wedding DJs, best wedding DJ Memphis, professional wedding DJ Memphis, Memphis wedding entertainment, wedding DJ services Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/memphis-wedding-dj" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis Wedding DJ | #1 Professional Wedding DJs in Memphis TN" />
        <meta property="og:description" content="Top-rated Memphis wedding DJ services with 10+ years experience. Professional ceremony, reception & MC services." />
        <meta property="og:url" content="https://m10djcompany.com/memphis-wedding-dj" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />
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
    </>
  );
}