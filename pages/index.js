import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Calendar, Music, Headphones, Mic, Volume2, Award, Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import FAQSection from '../components/company/FAQSection';
import { SEOHead } from '../components/ui/SEO';
import { trackLead, trackServiceInterest } from '../components/EnhancedTracking';
import { scrollToContact } from '../utils/scroll-helpers';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <SEOHead
        title="Memphis Wedding DJ | #1 Wedding DJ Memphis | M10 DJ Company"
        description="Memphis's #1 wedding DJ! M10 DJ Company delivers unforgettable wedding entertainment with 15+ years experience, 500+ weddings, and expert venue knowledge. From ceremony to reception, we make your Memphis wedding perfect. Call (901) 410-2020!"
        keywords={[
          'Memphis wedding DJ',
          'wedding DJ Memphis',
          'Memphis wedding DJ services',
          'best wedding DJ Memphis',
          'wedding DJ Memphis TN',
          'Memphis wedding entertainment',
          'wedding DJ near me Memphis',
          'Memphis wedding reception DJ',
          'Memphis ceremony DJ',
          'professional wedding DJ Memphis',
          'Memphis wedding music',
          'wedding DJ packages Memphis',
          'Memphis bridal DJ',
          'top wedding DJ Memphis',
          'Memphis wedding venue DJ',
          'luxury wedding DJ Memphis'
        ]}
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "M10 DJ Company",
          "description": "Memphis's premier wedding DJ company with 15+ years experience and 500+ successful weddings",
          "url": "https://m10djcompany.com",
          "telephone": "+19014102020",
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
              "name": "Bartlett",
              "containedInPlace": {
                "@type": "State",
                "name": "Tennessee"
              }
            }
          ],
          "serviceType": ["Wedding DJ Services", "Wedding Reception DJ", "Wedding Ceremony Music", "Bridal Entertainment"],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Wedding DJ Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Wedding DJ Package",
                  "description": "Complete wedding entertainment from ceremony to reception"
                }
              }
            ]
          },
          "openingHours": "Mo-Su 09:00-21:00",
          "priceRange": "$395-$1195",
          "image": "https://m10djcompany.com/logo-static.jpg",
          "sameAs": [
            "https://www.facebook.com/m10djcompany",
            "https://www.instagram.com/m10djcompany"
          ]
        }}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section id="home" className={`relative min-h-screen flex items-center justify-center bg-white text-gray-900 overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white">
            <div className="absolute top-20 right-10 w-96 h-96 bg-brand/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-32">
            <div className="max-w-5xl mx-auto">
              {/* Main Headline */}
              <h1 className="heading-1 mb-8 animate-fade-in-up">
                <span className="block text-gray-900">Memphis Wedding DJ</span>
                <span className="block text-gradient">#1 Choice for Your Perfect Day</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-inter">
                Memphis's premier wedding DJ with 15+ years of experience and 500+ unforgettable weddings. From intimate ceremonies to grand receptions, 
                we deliver flawless entertainment with expert venue knowledge, state-of-the-art sound systems, and personalized coordination that makes your wedding day perfect.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <button 
                  onClick={() => {
                    trackLead('quote_request_start', { source: 'hero_section' });
                    scrollToContact();
                  }}
                  className="btn-primary group"
                >
                  Get Your Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link 
                  href="/services" 
                  className="btn-secondary"
                  onClick={() => trackServiceInterest('all_services', 'hero_section')}
                >
                  View Our Services
                </Link>
                <Link 
                  href="/signin" 
                  className="btn-outline group"
                  onClick={() => trackLead('admin_signin_attempt', { source: 'hero_section' })}
                >
                  Sign In
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              {/* Key Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-brand text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="heading-3 mb-4 text-gray-900">15+ Years Wedding Experience</h3>
                  <p className="text-gray-600 font-inter">Trusted by 500+ Memphis couples with deep venue knowledge at The Peabody, Graceland, Memphis Botanic Garden, and 27+ premier wedding venues.</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-brand text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <h3 className="heading-3 mb-4 text-gray-900">Wedding-Grade Equipment</h3>
                  <p className="text-gray-600 font-inter">Crystal-clear sound systems, elegant uplighting, and wireless microphones for ceremony, cocktail hour, and reception perfection.</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-brand text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="heading-3 mb-4 text-gray-900">Your Perfect Wedding</h3>
                  <p className="text-gray-600 font-inter">Custom playlists, seamless timeline coordination, and MC services tailored to your love story and wedding vision.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-section bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-20">
              <h2 className="heading-2 mb-6 text-gray-900">Memphis Wedding Entertainment Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                From intimate ceremonies to grand receptions across Memphis's finest venues, we provide comprehensive 
                wedding entertainment with expert venue knowledge, flawless execution, and memories that last a lifetime.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Wedding Services */}
              <div className="premium-card group cursor-pointer">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Music className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 font-sans">Memphis Wedding DJ</h3>
                </div>
                <p className="text-gray-600 mb-6 font-inter">
                  Memphis's premier wedding DJ service with professional entertainment, MC services, and custom packages for your special day.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Professional Memphis wedding DJ</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Master of ceremonies services</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Premium sound & uplighting</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Ceremony to reception coverage</span>
                  </li>
                </ul>
                <div className="space-y-2">
                  <Link href="/memphis-wedding-dj" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors mb-2 block">
                    Memphis Wedding DJ Services <ChevronRight className="ml-1 w-4 h-4" />
                  </Link>
                  <Link href="/best-wedding-dj-memphis" className="inline-flex items-center text-gray-600 hover:text-brand transition-colors text-sm">
                    Why We're Memphis's Best Wedding DJ <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </div>
              </div>
              
              {/* Corporate Events */}
              <div className="premium-card group cursor-pointer">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 font-sans">Corporate Events</h3>
                </div>
                <p className="text-gray-600 mb-6 font-inter">
                  Professional entertainment solutions for corporate gatherings, conferences, and business celebrations.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Conference audio/visual</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Awards ceremony hosting</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Team building entertainment</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Holiday party coordination</span>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/memphis-event-dj-services" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                    Corporate DJ Services <ChevronRight className="ml-1 w-4 h-4" />
                  </Link>
                  <Link href="/services" className="inline-flex items-center text-gray-600 font-semibold hover:text-brand transition-colors text-sm">
                    All Services <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </div>
              </div>
              
              {/* Private Parties */}
              <div className="premium-card group cursor-pointer">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 font-sans">Private Parties</h3>
                </div>
                <p className="text-gray-600 mb-6 font-inter">
                  Celebrate life's special moments with customized entertainment for birthdays, anniversaries, and more.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Birthday celebrations</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Anniversary parties</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Graduation events</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Custom themed parties</span>
                  </li>
                </ul>
                <Link href="/services" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                  Learn More <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-section bg-gray-900 text-white">
          <div className="section-container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">500+</div>
                <div className="text-gray-300 font-inter">Memphis Weddings</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">15+</div>
                <div className="text-gray-300 font-inter">Years Wedding Experience</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">27+</div>
                <div className="text-gray-300 font-inter">Premium Venues</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">100%</div>
                <div className="text-gray-300 font-inter">Wedding Day Success</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialSlider />

        {/* FAQ Section */}
        <FAQSection />

        {/* Wedding Planning Resources Section */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planning Your Memphis Wedding?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get the expert guidance and resources you need to plan the perfect Memphis wedding celebration
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Pricing Guide */}
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Wedding DJ Pricing</h3>
                <p className="text-gray-600 mb-4">
                  Transparent wedding DJ pricing for Memphis couples. Compare packages and understand what makes your day perfect.
                </p>
                <Link href="/memphis-dj-pricing-guide" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                  View Pricing Guide <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
              
              {/* DJ Near Me */}
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Wedding Venues We Serve</h3>
                <p className="text-gray-600 mb-4">
                  Expert wedding DJ services at 27+ Memphis venues including The Peabody, Graceland, Memphis Botanic Garden, and more premier locations.
                </p>
                <Link href="/dj-near-me-memphis" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                  Find DJ Near Me <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
              
              {/* Ben Murray Profile */}
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Meet Your Wedding DJ</h3>
                <p className="text-gray-600 mb-4">
                  Meet DJ Ben Murray, Memphis wedding specialist with 15+ years experience and 500+ unforgettable celebrations.
                </p>
                <Link href="/dj-ben-murray" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                  Meet DJ Ben <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-section-lg bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-6 text-gray-900">Ready for Your Perfect Wedding Day?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Let's discuss your Memphis wedding and create an unforgettable celebration. Get your free wedding consultation and quote today.
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">Call Us Today</h3>
                      <p className="text-gray-600 mb-3 font-inter">Ready to discuss your event? Give us a call!</p>
                      <a href="tel:+19014102020" className="text-brand font-semibold hover:text-brand-600 transition-colors">
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">Email Us</h3>
                      <p className="text-gray-600 mb-3 font-inter">Send us your event details and questions</p>
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">Service Area</h3>
                      <p className="text-gray-600 font-inter">Memphis, TN and surrounding areas within 50 miles</p>
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