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

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <SEOHead
        title="Premium Event Entertainment in Memphis"
        description="Memphis's premier DJ and entertainment company. Professional event services for weddings, corporate events, and private parties. Unforgettable experiences with cutting-edge technology. Call (901) 410-2020 for your free quote!"
        keywords={[
          'Memphis DJ',
          'wedding DJ Memphis',
          'corporate events Memphis',
          'party DJ Memphis',
          'event entertainment Memphis',
          'Memphis events',
          'professional DJ services',
          'sound system rental Memphis',
          'uplighting Memphis'
        ]}
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "M10 DJ Company",
          "description": "Memphis's premier DJ and entertainment company",
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
          "openingHours": "Mo-Su 09:00-21:00",
          "priceRange": "$$",
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
                <span className="block text-gray-900">Unforgettable Memphis Events</span>
                <span className="block text-gradient">Start with M10 DJ Company</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-inter">
                Memphis's premier entertainment company, delivering exceptional experiences with professional DJ services, 
                state-of-the-art sound systems, and personalized event coordination.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="#contact" className="btn-primary group">
                  Get Your Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/services" className="btn-secondary">
                  View Our Services
                </Link>
                <Link href="/signin" className="btn-outline group">
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
                  <h3 className="heading-3 mb-4 text-gray-900">15+ Years Experience</h3>
                  <p className="text-gray-600 font-inter">Trusted by thousands of clients across Memphis with a proven track record of exceptional events.</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-brand text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <h3 className="heading-3 mb-4 text-gray-900">Professional Equipment</h3>
                  <p className="text-gray-600 font-inter">State-of-the-art sound systems, lighting, and entertainment technology for flawless events.</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-brand text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="heading-3 mb-4 text-gray-900">Personalized Service</h3>
                  <p className="text-gray-600 font-inter">Customized entertainment solutions tailored to your unique vision and event requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-section bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-20">
              <h2 className="heading-2 mb-6 text-gray-900">Premium Entertainment Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                From intimate gatherings to grand celebrations, we provide comprehensive entertainment solutions 
                that exceed expectations and create lasting memories.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Wedding Services */}
              <div className="premium-card group cursor-pointer">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Music className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 font-sans">Wedding Entertainment</h3>
                </div>
                <p className="text-gray-600 mb-6 font-inter">
                  Make your special day unforgettable with our comprehensive wedding DJ and entertainment packages.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Ceremony & reception music</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Professional MC services</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Custom lighting & sound</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 font-inter">Dance floor coordination</span>
                  </li>
                </ul>
                <Link href="/services" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                  Learn More <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
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
                <Link href="/services" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors">
                  Learn More <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
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
                <div className="text-gray-300 font-inter">Events Completed</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">15+</div>
                <div className="text-gray-300 font-inter">Years Experience</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">100%</div>
                <div className="text-gray-300 font-inter">Client Satisfaction</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-brand mb-2 font-sans">24/7</div>
                <div className="text-gray-300 font-inter">Support Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialSlider />

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <section id="contact" className="py-section-lg bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-6 text-gray-900">Ready to Create Something Amazing?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Let's discuss your event and create an unforgettable experience. Get your free consultation and quote today.
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
              <div className="modern-card bg-white">
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