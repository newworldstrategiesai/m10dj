import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Calendar, Music, Headphones, Mic, Volume2, Award, Phone, Mail, MapPin, ChevronRight, Sparkles, Radio, Zap } from 'lucide-react';
// Temporarily simplified imports to isolate infinite reload issue
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import SEO from '../components/SEO';
import ContactForm from '../components/company/ContactForm';
import ContactFormModal from '../components/company/ContactFormModal';
import ClientLogoCarousel from '../components/company/ClientLogoCarousel';
import TestimonialSlider from '../components/company/TestimonialSlider';
import { generateStructuredData } from '../utils/generateStructuredData';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Listen for global modal open event
    const handleOpenModal = () => setIsContactModalOpen(true);
    window.addEventListener('openContactModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openContactModal', handleOpenModal);
    };
  }, []);

  // Generate structured data for SEO
  const structuredData = generateStructuredData({
    pageType: 'homepage',
    canonical: '/',
    title: 'Memphis DJ Services | Professional DJ Memphis | M10 DJ Company',
    description: 'Memphis DJ • 500+ Events • Same-Day Quotes Available! Professional DJ services for weddings, corporate events & parties. #1 rated Memphis DJ company. Call (901) 410-2020 now!'
  });

  return (
    <>
      <SEO
        title="Best Wedding DJs in Memphis TN | M10 DJ Company | 500+ Weddings | Same-Day Quotes"
        description="Memphis's #1 Wedding DJ Company ⭐ 500+ Successful Weddings ⭐ Same-Day Quotes Available! Professional Memphis wedding DJs for ceremonies & receptions. Call (901) 410-2020 now!"
        keywords={[
          'wedding djs in memphis',
          'djs near me',
          'wedding dj memphis',
          'djs in memphis',
          'memphis wedding dj',
          'best wedding DJ Memphis',
          'Memphis DJs',
          'DJ Memphis',
          'professional DJ Memphis',
          'Memphis event DJ',
          'DJ in Memphis',
          'Memphis DJ services',
          'DJ services Memphis',
          'wedding DJ Memphis TN',
          'party DJ Memphis',
          'DJ for hire Memphis',
          'Memphis wedding entertainment',
          'best DJs in Memphis',
          'memphis djs',
          'djs memphis tn',
          'memphis tn djs'
        ]}
        canonical="/"
        jsonLd={structuredData}
      />

      <Header />

      <main id="main-content">
        {/* Hero Section */}
        <section id="home" className={`relative min-h-[90vh] md:min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {/* Enhanced Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-brand/10 dark:bg-brand/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-10 w-64 h-64 md:w-80 md:h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-500/5 dark:bg-blue-500/3 rounded-full blur-3xl"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-16 md:py-24 lg:py-32">
            <div className="max-w-5xl mx-auto">
              {/* Main Headline - SEO Optimized H1 */}
              <h1 className="heading-1 mb-6 md:mb-8 animate-fade-in-up px-4">
                <span className="block text-gray-900 dark:text-white">Memphis DJ Services</span>
                <span className="block text-gradient bg-gradient-to-r from-brand via-amber-400 to-brand bg-clip-text">Professional Wedding & Event Entertainment</span>
              </h1>
              
              {/* Enhanced Content Block with Better Shadows */}
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-10 mb-8 md:mb-12 shadow-2xl border border-brand/20 dark:border-brand/10 max-w-4xl mx-auto relative overflow-hidden">
                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent"></div>
                
                <div className="mb-4 md:mb-6">
                  <h3 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center justify-center gap-2 flex-wrap">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand animate-pulse flex-shrink-0" />
                    <span className="text-center">Looking for the best Memphis DJ?</span>
                  </h3>
                  <div className="prose prose-lg text-gray-800 dark:text-gray-200 leading-relaxed max-w-none">
                    <p className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
                      M10 DJ Company is Memphis's premier wedding and event entertainment service with 15+ years of experience and 500+ successful celebrations.
                    </p>
                    <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                      We specialize in weddings, corporate events, and celebrations throughout Memphis with expert venue knowledge at The Peabody Hotel, Memphis Botanic Garden, Graceland, and 27+ premier locations. Our professional-grade sound systems, elegant uplighting, and experienced MC services ensure flawless entertainment from ceremony to reception.
                    </p>
                  </div>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="text-center p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 border border-amber-100 dark:border-slate-600">
                      <div className="text-2xl md:text-4xl font-bold text-brand mb-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                        <Award className="w-5 h-5 md:w-8 md:h-8" />
                        <span>15+</span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-semibold">Years Experience</div>
                    </div>
                    <div className="text-center p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 border border-amber-100 dark:border-slate-600">
                      <div className="text-2xl md:text-4xl font-bold text-brand mb-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                        <Sparkles className="w-5 h-5 md:w-8 md:h-8" />
                        <span>500+</span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-semibold">Celebrations</div>
                    </div>
                    <div className="text-center p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 border border-amber-100 dark:border-slate-600">
                      <div className="text-2xl md:text-4xl font-bold text-brand mb-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                        <MapPin className="w-5 h-5 md:w-8 md:h-8" />
                        <span>27+</span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-semibold">Premier Venues</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center mb-12 md:mb-16 px-4">
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="btn-primary group shadow-lg hover:shadow-2xl w-full sm:w-auto min-h-[48px]"
                >
                  <Star className="mr-2 w-4 h-4 md:w-5 md:h-5 fill-current flex-shrink-0" />
                  <span className="text-sm md:text-base">Get Your Free Quote</span>
                  <ChevronRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
                <Link 
                  href="/services" 
                  className="btn-secondary shadow-md hover:shadow-lg w-full sm:w-auto min-h-[48px]"
                >
                  <Music className="mr-2 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="text-sm md:text-base">View Our Services</span>
                </Link>
              </div>
              
              {/* Enhanced Key Benefits with Better Icons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-20 px-4">
                <div className="modern-card text-center group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-brand to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brand to-amber-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Award className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">15+ Years Wedding Experience</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-inter leading-relaxed mb-3 md:mb-4">Trusted by 500+ Memphis couples with deep venue knowledge at The Peabody, Graceland, Memphis Botanic Garden, and 27+ premier wedding venues.</p>
                  <Link href="/memphis-wedding-dj" className="text-brand hover:text-amber-600 dark:hover:text-amber-400 font-semibold mt-2 md:mt-4 inline-flex items-center group-hover:gap-2 gap-1 transition-all text-sm md:text-base">
                    View Wedding DJs <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="modern-card text-center group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Radio className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Wedding-Grade Equipment</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-inter leading-relaxed mb-3 md:mb-4">Crystal-clear sound systems, elegant uplighting, and wireless microphones for ceremony, cocktail hour, and reception perfection.</p>
                  <Link href="/services" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold mt-2 md:mt-4 inline-flex items-center group-hover:gap-2 gap-1 transition-all text-sm md:text-base">
                    View All Services <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="modern-card text-center group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Zap className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Your Perfect Wedding</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-inter leading-relaxed mb-3 md:mb-4">Custom playlists, seamless timeline coordination, and MC services tailored to your love story and wedding vision.</p>
                  <Link href="/dj-near-me-memphis" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold mt-2 md:mt-4 inline-flex items-center group-hover:gap-2 gap-1 transition-all text-sm md:text-base">
                    Find DJs Near You <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client Logo Carousel - Enhanced */}
        <section className="py-section bg-white dark:bg-slate-900">
        <ClientLogoCarousel 
          logoSet="general"
          title="Trusted by Memphis's Premier Organizations"
          subtitle="Proudly serving 500+ weddings, corporate events, and celebrations at Memphis's top venues"
        />
        </section>

        {/* Testimonials Section */}
        <TestimonialSlider className="bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900" />

        {/* Enhanced Contact Section */}
        <section id="contact" className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-amber-50/20 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 right-10 w-48 h-48 md:w-72 md:h-72 bg-brand/10 dark:bg-brand/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-64 h-64 md:w-96 md:h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="section-container relative z-10">
            <div className="text-center mb-10 md:mb-16 px-4">
              <div className="inline-flex items-center justify-center gap-2 bg-brand/10 dark:bg-brand/20 text-brand px-3 md:px-4 py-2 rounded-full font-semibold text-xs md:text-sm mb-4 md:mb-6">
                <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                Same-Day Quotes Available
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Ready for Your Perfect Wedding Day?</h2>
              <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-inter leading-relaxed">
                Let's discuss your Memphis wedding and create an unforgettable celebration. Get your free wedding consultation and quote today.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-6xl mx-auto">
              {/* Enhanced Contact Info */}
              <div className="space-y-4 md:space-y-6 px-4 lg:px-0">
                <div className="modern-card bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-brand to-amber-500 text-white rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Phone className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 font-inter">Call Us Today</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-2 md:mb-3 font-inter">Ready to discuss your event? Give us a call!</p>
                      <a href="tel:+19014102020" className="text-brand text-base md:text-lg font-bold hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1 md:gap-2 group">
                        (901) 410-2020
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="modern-card bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Mail className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 font-inter">Email Us</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-2 md:mb-3 font-inter">Send us your event details and questions</p>
                      <a href="mailto:info@m10djcompany.com" className="text-blue-600 dark:text-blue-400 text-sm md:text-lg font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors break-all inline-flex items-center gap-1 md:gap-2 group flex-wrap">
                        <span>info@m10djcompany.com</span>
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="modern-card bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow">
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MapPin className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 font-inter">Service Area</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-inter">Memphis, TN and surrounding areas within 50 miles</p>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 md:pt-6">
                  <div className="text-center p-3 md:p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-xl md:text-2xl font-bold text-brand mb-1">500+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Events</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-xl md:text-2xl font-bold text-brand mb-1 flex flex-col md:flex-row items-center justify-center gap-1">
                      <span>5</span><Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Rating</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-xl md:text-2xl font-bold text-brand mb-1">15+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Years</div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Contact Form */}
              <div id="contact-form" className="modern-card bg-white dark:bg-slate-800 shadow-2xl relative overflow-hidden mx-4 lg:mx-0">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-amber-400 to-brand"></div>
                <div className="p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Get Your Free Quote</h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-inter leading-relaxed">
                      Fill out the form below and we&apos;ll get back to you within 24 hours with a personalized quote.
                    </p>
                  </div>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </>
  );
} 