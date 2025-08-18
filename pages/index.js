import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Calendar, Music, Headphones, Mic, Volume2, Award, Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
// Temporarily simplified imports to isolate infinite reload issue
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import SEO from '../components/SEO';
import { generateStructuredData } from '../utils/generateStructuredData';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
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
        jsonLd={structuredData}
      />

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
              
              {/* Simple Content Block */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-lg border border-brand/10 max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Looking for the best Memphis DJ?</h3>
                  <div className="prose prose-lg text-gray-800 leading-relaxed">
                    <p className="text-xl font-medium mb-4">
                      <strong>M10 DJ Company is Memphis's premier wedding and event entertainment service with 15+ years of experience and 500+ successful celebrations.</strong>
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      We specialize in weddings, corporate events, and celebrations throughout Memphis with expert venue knowledge at The Peabody Hotel, Memphis Botanic Garden, Graceland, and 27+ premier locations. Our professional-grade sound systems, elegant uplighting, and experienced MC services ensure flawless entertainment from ceremony to reception.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-brand-gold mb-1">15+</div>
                      <div className="text-sm text-gray-600 font-medium">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-brand-gold mb-1">500+</div>
                      <div className="text-sm text-gray-600 font-medium">Celebrations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-brand-gold mb-1">27+</div>
                      <div className="text-sm text-gray-600 font-medium">Premier Venues</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <button 
                  onClick={() => {
                    const contactForm = document.getElementById('contact');
                    if (contactForm) {
                      contactForm.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="btn-primary group"
                >
                  Get Your Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link 
                  href="/services" 
                  className="btn-secondary"
                >
                  View Our Services
                </Link>
                <Link 
                  href="/signin" 
                  className="btn-outline group"
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

        {/* Simple Contact Section */}
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
              
              {/* Simple Contact Form */}
              <div id="contact-form" className="modern-card bg-white">
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-sans">Get Your Free Quote</h3>
                  <p className="text-gray-600 font-inter">Tell us about your event and we'll provide a customized quote within 24 hours.</p>
                </div>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">Full Name *</label>
                      <input type="text" id="name" name="name" required className="modern-input" placeholder="Your full name" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">Email Address *</label>
                      <input type="email" id="email" name="email" required className="modern-input" placeholder="your.email@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">Phone Number *</label>
                      <input type="tel" id="phone" name="phone" required className="modern-input" placeholder="(901) 410-2020" />
                    </div>
                    <div>
                      <label htmlFor="eventType" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">Event Type *</label>
                      <select id="eventType" name="eventType" required className="modern-select">
                        <option value="">Select event type</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Corporate Event">Corporate Event</option>
                        <option value="Birthday Party">Birthday Party</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Holiday Party">Holiday Party</option>
                        <option value="School Dance">School Dance/Event</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">Additional Details</label>
                    <textarea id="message" name="message" rows="4" className="modern-textarea" placeholder="Tell us more about your event, special requests, or any questions you have..."></textarea>
                  </div>
                  <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                    <span>Get My Free Quote</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
} 