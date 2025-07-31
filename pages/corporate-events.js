import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building, 
  Users, 
  Star, 
  Calendar, 
  ChevronRight, 
  Phone, 
  Mail, 
  Award, 
  CheckCircle, 
  Clock,
  Volume2,
  Mic2,
  Presentation,
  Trophy,
  Globe,
  Coffee
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';

export default function CorporateEvents() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const corporateServices = [
    {
      title: 'Company Holiday Parties',
      description: 'Professional entertainment for your annual holiday celebration',
      features: ['DJ & MC services', 'Professional sound system', 'Holiday music playlists', 'Microphones for speeches'],
      price: 'Starting at $695'
    },
    {
      title: 'Product Launch Events',
      description: 'Create buzz and excitement for your new product unveiling',
      features: ['Background music', 'Presentation audio support', 'Wireless microphones', 'Professional lighting'],
      price: 'Starting at $595'
    },
    {
      title: 'Awards Ceremonies',
      description: 'Elegant entertainment for recognition events and award shows',
      features: ['Ceremonial music', 'Award presentation support', 'Multiple microphones', 'Professional MC'],
      price: 'Starting at $795'
    },
    {
      title: 'Team Building Events',
      description: 'Fun, engaging entertainment for company retreats and team activities',
      features: ['Interactive DJ services', 'Team activity music', 'Sound system rental', 'Event coordination'],
      price: 'Starting at $495'
    },
    {
      title: 'Conference & Meetings',
      description: 'Professional audio support for presentations and breakout sessions',
      features: ['Presentation audio', 'Wireless microphones', 'Background music', 'Technical support'],
      price: 'Starting at $395'
    },
    {
      title: 'Networking Events',
      description: 'Sophisticated background music for professional networking',
      features: ['Ambient background music', 'Professional sound system', 'Volume control', 'Elegant presentation'],
      price: 'Starting at $450'
    }
  ];

  const venues = [
    'Memphis Cook Convention Center',
    'The Peabody Memphis',
    'Crosstown Concourse',
    'FedExForum',
    'Memphis Country Club',
    'Dixon Gallery and Gardens',
    'Elmwood Cemetery',
    'Historic Elmwood Hall'
  ];

  return (
    <>
      <Head>
        <title>Corporate Event DJ Services Memphis | M10 DJ Company | Professional Business Entertainment</title>
        <meta name="description" content="Professional corporate event DJ services in Memphis. Expert entertainment for company parties, product launches, conferences, and business celebrations." />
        <meta name="keywords" content="Memphis corporate DJ, business event entertainment Memphis, company party DJ, corporate event services Memphis TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Corporate Event DJ Services Memphis | M10 DJ Company" />
        <meta property="og:description" content="Professional corporate event DJ services in Memphis for all your business entertainment needs." />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="og:url" content="https://m10djcompany.com/corporate-events" />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Corporate Event DJ Services",
            "description": "Professional DJ and entertainment services for corporate events in Memphis, TN",
            "provider": {
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "telephone": "(901) 410-2020",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Memphis",
                "addressRegion": "TN"
              }
            },
            "areaServed": "Memphis, TN",
            "serviceType": "Corporate Event Entertainment"
          })}
        </script>
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-blue-50 text-gray-900 overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-32">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center mb-8">
                <Building className="w-16 h-16 text-blue-600 mr-4" />
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 font-sans">
                  Corporate Events
                </h1>
              </div>
              
              <p className="text-2xl md:text-3xl text-blue-600 font-semibold font-inter mb-6">
                Professional Entertainment for Memphis Businesses
              </p>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-inter">
                From holiday parties to product launches, we provide sophisticated entertainment that reflects your company's professionalism while keeping your team engaged and celebrating.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="#services" className="btn-primary group text-lg px-8 py-4">
                  View Corporate Services
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="tel:(901)410-2020" className="btn-secondary text-lg px-8 py-4">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Corporate Event Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Professional entertainment solutions tailored to your business needs and company culture.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {corporateServices.map((service, index) => (
                <div key={index} className="modern-card p-6 hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center mb-6">
                    <Building className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">{service.title}</h3>
                  <p className="text-gray-600 mb-4 font-inter">{service.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="text-brand font-semibold text-lg mb-4">{service.price}</div>
                  
                  <Link href="#contact" className="btn-outline w-full text-center">
                    Get Quote
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Why Memphis Businesses Choose M10</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="modern-card p-6 text-center">
                <Presentation className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Professional Presentation</h3>
                <p className="text-gray-600 font-inter">Our team arrives professionally dressed and conducts themselves with the highest level of business etiquette.</p>
              </div>
              
              <div className="modern-card p-6 text-center">
                <Volume2 className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Audio/Visual Support</h3>
                <p className="text-gray-600 font-inter">Complete A/V support for presentations, speeches, and announcements with backup equipment guaranteed.</p>
              </div>
              
              <div className="modern-card p-6 text-center">
                <Clock className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Timeline Management</h3>
                <p className="text-gray-600 font-inter">We work with your event coordinator to ensure seamless transitions and perfect timing throughout your event.</p>
              </div>
              
              <div className="modern-card p-6 text-center">
                <Coffee className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Appropriate Music Selection</h3>
                <p className="text-gray-600 font-inter">Sophisticated background music during networking and high-energy entertainment when it's time to celebrate.</p>
              </div>
              
              <div className="modern-card p-6 text-center">
                <Trophy className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Corporate Experience</h3>
                <p className="text-gray-600 font-inter">Over 10 years of experience providing entertainment for Memphis's top companies and organizations.</p>
              </div>
              
              <div className="modern-card p-6 text-center">
                <Globe className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Venue Expertise</h3>
                <p className="text-gray-600 font-inter">Familiar with Memphis's premier corporate venues and their specific technical requirements.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Venues Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Memphis Corporate Venues</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                We've provided professional entertainment at Memphis's top corporate event venues.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {venues.map((venue, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-brand/5 transition-colors">
                  <p className="text-gray-700 font-semibold font-inter text-sm">{venue}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Ready to Elevate Your Corporate Event?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let's discuss your corporate entertainment needs and create an event your team will remember.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a href="tel:(901)410-2020" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                </a>
                <a href="mailto:info@m10djcompany.com" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Us Today
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Get Your Corporate Event Quote</h2>
                <p className="text-lg text-gray-600 font-inter">
                  Tell us about your event and we'll provide a customized quote within 24 hours.
                </p>
              </div>
              
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}