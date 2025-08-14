import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Calendar, Music, Headphones, Mic, Volume2, Award, Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import FAQSection from '../components/company/FAQSection';
import SEO from '../components/SEO';
import { HomepageSchema } from '../components/StandardSchema';
import { AIAnswerBlock, AIQuickFacts, AIContentSchema } from '../components/AIOverviewOptimization';
import { LazySection, OptimizedButton } from '../components/MobilePerformanceOptimizer';
import { trackLead, trackServiceInterest } from '../components/EnhancedTracking';
import { scrollToContact } from '../utils/scroll-helpers';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <SEO
        title="Memphis DJ Services | Professional DJ Memphis | M10 DJ Company"
        description="Memphis DJ • 500+ Events • Same-Day Quotes Available! Professional DJ services for weddings, corporate events & parties. #1 rated Memphis DJ company. Call (901) 410-2020 now!"
        keywords={[
          'Memphis DJ',
          'DJ Memphis',
          'professional DJ Memphis',
          'Memphis event DJ',
          'Memphis DJs',
          'DJ in Memphis',
          'Memphis DJ services',
          'DJ services Memphis',
          'best wedding DJ Memphis',
          'professional DJ Memphis',
          'wedding DJ Memphis TN',
          'Memphis event DJ',
          'party DJ Memphis',
          'DJ for hire Memphis',
          'Memphis wedding entertainment',
          'best DJs in Memphis'
        ]}
        canonical="/"
      />

      {/* Standardized Schema Markup */}
      <HomepageSchema />

      <Header />

      <main id="main-content">
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
                <span className="block text-gray-900">Memphis DJ Services</span>
                <span className="block text-gradient">Professional Wedding & Event Entertainment</span>
              </h1>
              
              {/* AI-Optimized Answer Block */}
              <AIAnswerBlock
                question="Looking for the best Memphis DJ?"
                answer="M10 DJ Company is Memphis's premier wedding and event entertainment service with 15+ years of experience and 500+ successful celebrations."
                context="We specialize in weddings, corporate events, and celebrations throughout Memphis with expert venue knowledge at The Peabody Hotel, Memphis Botanic Garden, Graceland, and 27+ premier locations. Our professional-grade sound systems, elegant uplighting, and experienced MC services ensure flawless entertainment from ceremony to reception."
                statistics={[
                  { value: "15+", label: "Years Experience" },
                  { value: "500+", label: "Celebrations" },
                  { value: "27+", label: "Premier Venues" }
                ]}
              />
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <OptimizedButton 
                  onClick={() => {
                    trackLead('quote_request_start', { source: 'hero_section' });
                    scrollToContact();
                  }}
                  className="btn-primary group"
                >
                  Get Your Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </OptimizedButton>
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
                  View Party Services <ChevronRight className="ml-1 w-4 h-4" />
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
        <LazySection>
          <TestimonialSlider />
        </LazySection>

        {/* FAQ Section */}
        <LazySection>
          <FAQSection />
        </LazySection>

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

        {/* AI Quick Facts */}
        <section className="py-16 bg-gray-900">
          <div className="section-container">
            <AIQuickFacts
              category="Memphis DJ Services"
              facts={[
                "15+ years serving Memphis weddings & events",
                "500+ successful celebrations completed", 
                "27+ premier venues in our network",
                "Professional-grade sound & lighting equipment",
                "Transparent pricing with no hidden fees",
                "Backup equipment & contingency plans included",
                "Experienced MC services & event coordination",
                "Serving Memphis, Germantown, Collierville & beyond"
              ]}
            />
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-section bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-6 text-gray-900">Memphis Metro Area Coverage</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto font-inter">
                We proudly serve Memphis and surrounding communities including East Memphis, Midtown, Germantown, Collierville, Cordova, Bartlett, Arlington, Lakeland, Southaven, and West Memphis with professional DJ services tailored to each area's unique venues and community preferences.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Link href="/memphis" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Memphis</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Downtown & Core</p>
              </Link>
              
              <Link href="/east-memphis" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">East Memphis</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Country Clubs</p>
              </Link>
              
              <Link href="/midtown-memphis" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Midtown</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Cultural District</p>
              </Link>
              
              <Link href="/germantown" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Germantown</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Elegant Venues</p>
              </Link>
              
              <Link href="/collierville" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Collierville</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Historic Charm</p>
              </Link>
              
              <Link href="/cordova" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Cordova</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Suburban Events</p>
              </Link>
              
              <Link href="/bartlett" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Bartlett</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Community Focus</p>
              </Link>
              
              <Link href="/lakeland" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Lakeland</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Exclusive Events</p>
              </Link>
              
              <Link href="/southaven" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">Southaven</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Mississippi Metro</p>
              </Link>
              
              <Link href="/west-memphis" className="group bg-gray-50 hover:bg-brand transition-all duration-300 rounded-lg p-4 text-center">
                <MapPin className="h-5 w-5 text-brand group-hover:text-white mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm">West Memphis</h3>
                <p className="text-xs text-gray-600 group-hover:text-white opacity-80">Arkansas Side</p>
              </Link>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">
                Each location receives specialized attention with local venue knowledge and community-focused service.
              </p>
              <Link 
                href="/dj-near-me-memphis" 
                className="btn-primary inline-flex items-center"
              >
                Find DJ Services Near You
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
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

      {/* Real Google Reviews JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "M10 DJ Company",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "10",
              "bestRating": "5",
              "worstRating": "1"
            },
            "review": [
              {
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": "Quade Nowlin"
                },
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": 5,
                  "bestRating": "5"
                },
                "reviewBody": "Ben was an excellent choice for my wedding. He played everything we asked and built a playlist based on those preferences. He had a better price than everyone else we contacted, and he was more responsive than anyone else we reached out to. He had a professional demeanor the entire time while also being able to have fun. Highly recommended, 10/10",
                "datePublished": "2024-11-01"
              },
              {
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": "Alexis Cameron"
                },
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": 5,
                  "bestRating": "5"
                },
                "reviewBody": "Ben DJ'd our wedding last weekend and I couldn't be more thankful. He was communicative, paid great attention to detail, and ensured everything went smoothly. He had a lapel mic for my officiant and some speeches that made it all seamless and convenient. We had younger kids, grandparents and all the others in between- the music was appropriate and also right up our alley. Ben went over the top to make sure the night went amazingly. Will be recommending to friends and family and highly do to anyone reading this now. Thank you, Ben!",
                "datePublished": "2024-10-01"
              },
              {
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": "Chandler Keen"
                },
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": 5,
                  "bestRating": "5"
                },
                "reviewBody": "Ben Murray DJ'd my wedding and could not have been more thoughtful in the planning process. He's extremely talented and all of the guests at our wedding raved about the song choices and DJ. I highly recommend Ben for any event, he will cater to your wants and needs and ensure that your event is filled with exciting music that fits your desires.",
                "datePublished": "2021-12-01"
              }
            ]
          })
        }}
      />

      {/* AI Content Schema */}
      <AIContentSchema 
        content={{
          headline: "Memphis DJ Services | Wedding & Event DJ | #1 DJ Memphis",
          description: "Memphis's premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations. Professional DJ services for weddings, corporate events, and parties.",
          url: "https://www.m10djcompany.com",
          datePublished: "2024-01-01T00:00:00Z",
          dateModified: new Date().toISOString()
        }}
      />
    </>
  );
} 