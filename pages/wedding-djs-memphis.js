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
  ChevronRight,
  Clock,
  Headphones
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const weddingDJs = [
  {
    name: "DJ Ben Murray",
    experience: "15+ Years",
    specialties: ["Weddings", "Corporate Events", "Private Parties"],
    description: "Lead DJ and founder of M10 DJ Company with expertise in Memphis wedding entertainment"
  },
  {
    name: "Professional DJ Team",
    experience: "10+ Years Each",
    specialties: ["Multi-cultural Weddings", "Large Events", "Ceremony & Reception"],
    description: "Experienced backup DJs ensuring your Memphis wedding is covered no matter what"
  }
];

const weddingServices = [
  {
    icon: Music,
    title: "Wedding DJ Services",
    description: "Professional wedding DJs in Memphis with extensive music libraries and MC experience"
  },
  {
    icon: Headphones,
    title: "Ceremony Music",
    description: "Beautiful processional, recessional, and cocktail hour music coordination"
  },
  {
    icon: Users,
    title: "Reception Entertainment",
    description: "Dance floor entertainment, special requests, and crowd engagement"
  },
  {
    icon: Award,
    title: "Premium Equipment",
    description: "Professional sound systems, wireless mics, and backup equipment included"
  }
];

export default function WeddingDJsMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Wedding DJs in Memphis | Professional Memphis Wedding DJs | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Professional wedding DJs in Memphis TN. Experienced Memphis wedding DJs for ceremonies & receptions. Top-rated DJs in Memphis with 500+ weddings. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="wedding DJs in Memphis, Memphis wedding DJs, DJs in Memphis, wedding DJs Memphis TN, professional wedding DJs Memphis, Memphis DJs, DJs Memphis TN, wedding entertainment Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.m10djcompany.com/wedding-djs-memphis" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Wedding DJs in Memphis | Professional Memphis Wedding DJs" />
        <meta property="og:description" content="Professional wedding DJs in Memphis with 15+ years experience and 500+ successful weddings. Top-rated Memphis wedding DJs for your special day." />
        <meta property="og:url" content="https://www.m10djcompany.com/wedding-djs-memphis" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />

        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://www.m10djcompany.com/wedding-djs-memphis#business",
              "name": "M10 DJ Company - Wedding DJs in Memphis",
              "description": "Professional wedding DJs in Memphis TN with 15+ years of experience and 500+ successful weddings.",
              "url": "https://www.m10djcompany.com/wedding-djs-memphis",
              "telephone": "+19014102020",
              "priceRange": "$595-$1895",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "65 Stewart Rd",
                "addressLocality": "Eads",
                "addressRegion": "TN",
                "postalCode": "38028",
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
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "500",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
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
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">Wedding DJs in</span>
                <span className="block text-gradient">Memphis</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-4xl mx-auto">
                Professional wedding DJs in Memphis TN with 15+ years of experience and 500+ successful weddings. 
                Our team of experienced Memphis wedding DJs provides ceremony music, reception entertainment, 
                and professional MC services for your special day.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
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

              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-gold mb-2">500+</div>
                  <div className="text-gray-300">Memphis Weddings</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-gold mb-2">15+</div>
                  <div className="text-gray-300">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-gold mb-2">5★</div>
                  <div className="text-gray-300">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memphis Wedding DJs Team Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Meet Our Professional Wedding DJs in Memphis
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our team of experienced Memphis wedding DJs brings professionalism, 
                expertise, and passion to every wedding celebration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {weddingDJs.map((dj, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{dj.name}</h3>
                  <div className="text-brand-gold font-semibold mb-4">{dj.experience}</div>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {dj.specialties.map((specialty, i) => (
                      <span key={i} className="bg-brand-gold text-black px-3 py-1 rounded-full text-sm font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600">{dj.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wedding DJ Services Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Complete Wedding DJ Services in Memphis
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our Memphis wedding DJs provide comprehensive entertainment services 
                for every aspect of your wedding celebration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {weddingServices.map((service, index) => (
                <div key={index} className="bg-white rounded-xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
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

        {/* Why Choose Our Memphis Wedding DJs */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 text-gray-900 mb-6">
                  Why Choose Our Wedding DJs in Memphis?
                </h2>
                <p className="text-xl text-gray-600">
                  Here's what makes our Memphis wedding DJs the top choice for couples across Tennessee.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Experienced Memphis DJs</h3>
                      <p className="text-gray-600">15+ years specializing in Memphis weddings with deep knowledge of local venues and preferences.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Equipment</h3>
                      <p className="text-gray-600">Premium sound systems, wireless microphones, and backup equipment for flawless audio.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Extensive Music Library</h3>
                      <p className="text-gray-600">Thousands of songs across all genres and decades to match your wedding style perfectly.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Master of Ceremonies</h3>
                      <p className="text-gray-600">Professional MC services to guide your wedding timeline and keep guests engaged.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparent Pricing</h3>
                      <p className="text-gray-600">No hidden fees or surprise charges. Clear, upfront pricing for all Memphis wedding DJ packages.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Venue Expertise</h3>
                      <p className="text-gray-600">Approved at all major Memphis wedding venues with knowledge of each location's requirements.</p>
                    </div>
                  </div>
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
                Book Memphis Wedding DJs for Your Special Day
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ready to secure professional wedding DJs in Memphis for your celebration? 
                Contact us today for a free consultation and quote.
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Our Memphis Wedding DJs</h3>
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
    </>
  );
}
