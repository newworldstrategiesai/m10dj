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
import ClientLogoCarousel from '../components/company/ClientLogoCarousel';

export default function CorporateEvents() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const corporatePackages = [
    {
      title: 'Just the Basics',
      description: 'Essential DJ services for smaller corporate events',
      duration: '3 hours',
      features: ['Professional DJ/MC services', 'Premium sound system', 'Wireless microphone', 'Professional setup & coordination'],
      price: '$850',
      bestFor: 'Small meetings, networking events, brief celebrations'
    },
    {
      title: 'Package #1',
      description: 'Complete entertainment for most corporate events',
      duration: '4 hours',
      features: ['Professional DJ/MC services', 'Premium sound system & microphones', 'Multi-color LED dance floor lighting', 'Professional setup & coordination', 'Backup equipment'],
      price: '$1,095',
      bestFor: 'Holiday parties, team building, awards ceremonies',
      popular: true
    },
    {
      title: 'Package #2',
      description: 'Premium corporate event experience',
      duration: '4 hours',
      features: ['Everything in Package #1, PLUS:', 'Up to 16 elegant uplighting fixtures', 'Enhanced venue ambiance', 'Professional lighting design', 'Complete A/V support'],
      price: '$1,345',
      bestFor: 'Product launches, large company parties, high-profile events'
    }
  ];

  const addOnServices = [
    { name: 'Additional Hour', price: '$150', description: 'Extend your event beyond package hours' },
    { name: 'Monogram/Logo Projection', price: '$300', description: 'Company logo or custom graphic projection' },
    { name: 'Flat Screen TV w/ Stand', price: '$300', description: '65" TV for presentations or slideshows' },
    { name: 'Additional Speaker', price: '$150', description: 'Extra speaker for cocktail hour or breakout rooms' },
    { name: 'Cold Spark Fountain Effect', price: '$500', description: 'Dramatic indoor-safe spark effects for grand entrances' }
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
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
                  "streetAddress": "65 Stewart Rd",
                  "addressLocality": "Eads", 
                  "addressRegion": "TN",
                  "postalCode": "38028",
                  "addressCountry": "US"
                }
              },
              "areaServed": "Memphis, TN",
              "serviceType": "Corporate Event Entertainment"
            })
          }}
        />
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

        {/* Packages Section */}
        <section id="services" className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Corporate Event DJ Packages</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Transparent pricing for professional Memphis corporate event entertainment. All packages include premium equipment, professional MC services, and backup systems.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {corporatePackages.map((pkg, index) => (
                <div key={index} className={`rounded-2xl p-8 transition-all ${
                  pkg.popular 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl transform scale-105 relative' 
                    : 'bg-gray-50 hover:shadow-xl'
                }`}>
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-brand-gold text-black px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        ⭐ MOST POPULAR ⭐
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 font-sans ${pkg.popular ? 'text-white' : 'text-gray-900'}`}>
                      {pkg.title}
                    </h3>
                    <p className={`mb-4 font-inter ${pkg.popular ? 'text-white/90' : 'text-gray-600'}`}>
                      {pkg.description}
                    </p>
                    <div className={`text-4xl font-bold mb-2 ${pkg.popular ? 'text-brand-gold' : 'text-brand'}`}>
                      {pkg.price}
                    </div>
                    <p className={`text-sm ${pkg.popular ? 'text-white/70' : 'text-gray-500'}`}>
                      {pkg.duration} of service
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                          pkg.popular ? 'text-brand-gold' : 'text-green-500'
                        }`} />
                        <span className={pkg.popular ? 'text-white' : 'text-gray-700'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className={`text-sm mb-6 p-3 rounded-lg ${
                    pkg.popular ? 'bg-white/10' : 'bg-blue-50'
                  }`}>
                    <p className={`font-semibold mb-1 ${pkg.popular ? 'text-white' : 'text-gray-900'}`}>
                      Best For:
                    </p>
                    <p className={pkg.popular ? 'text-white/90' : 'text-gray-600'}>
                      {pkg.bestFor}
                    </p>
                  </div>
                  
                  <Link href="#contact" className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    pkg.popular 
                      ? 'bg-brand-gold text-black hover:bg-brand-gold/90' 
                      : 'bg-brand text-white hover:bg-brand/90'
                  }`}>
                    Get Started
                  </Link>
                </div>
              ))}
            </div>

            {/* Add-On Services */}
            <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 font-sans">Add-On Services & Enhancements</h3>
                <p className="text-lg text-gray-600 font-inter">
                  Customize your package with these popular add-ons
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addOnServices.map((addon, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-900 font-sans">{addon.name}</h4>
                      <span className="text-brand font-bold text-lg">{addon.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-inter">{addon.description}</p>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8 p-6 bg-white rounded-xl">
                <p className="text-gray-700 mb-4">
                  <strong>All packages include:</strong> Professional setup & teardown, backup equipment, liability insurance, pre-event consultation, and professional attire
                </p>
                <p className="text-lg text-brand font-semibold">
                  📞 Call (901) 410-2020 for custom quotes | ⚐ Serving Memphis & surrounding areas
                </p>
              </div>
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

        {/* Client Logo Carousel - Corporate Clients */}
        <ClientLogoCarousel 
          logoSet="corporate"
          title="Trusted by Memphis's Leading Businesses"
          subtitle="Proudly serving corporate events for FedEx, AutoZone, International Paper, St. Jude, and Memphis's premier organizations"
        />

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Corporate Event DJ - Frequently Asked Questions</h2>
                <p className="text-lg text-gray-600 font-inter">
                  Get answers to common questions about Memphis corporate event entertainment
                </p>
              </div>

              <div className="space-y-6">
                {/* FAQ 1 - Pricing */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How much does a corporate event DJ cost in Memphis?
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    M10 DJ Company offers <strong>transparent corporate event pricing</strong> starting at <strong>$850 for 3 hours</strong> (Just the Basics package). Our most popular Package #1 is <strong>$1,095 for 4 hours</strong> and includes DJ/MC services, professional sound system, microphones, and dance floor lighting. Premium Package #2 is <strong>$1,345 for 4 hours</strong> with added uplighting (up to 16 fixtures) for enhanced venue ambiance.
                  </p>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    <strong>All packages include:</strong> Professional equipment, backup systems, liability insurance, professional attire, setup/teardown, and pre-event consultation. Additional hours are $150/hour. See our complete pricing above with add-on services available.
                  </p>
                </div>

                {/* FAQ 2 - What's Included */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What's included in corporate event DJ services?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    M10 DJ Company's corporate event packages include professional DJ services, premium sound system, wireless microphones for presentations and speeches, background music programming, MC services for announcements, professional attire, setup and teardown, backup equipment, liability insurance, and pre-event consultation. We customize services based on your specific corporate event needs, venue requirements, and company culture.
                  </p>
                </div>

                {/* FAQ 3 - Corporate Experience */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do you have experience with Memphis corporate events?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes! M10 DJ Company has 10+ years of professional corporate event experience serving Memphis businesses. We've provided entertainment for company holiday parties, product launches, awards ceremonies, team building events, networking events, and conferences at premier Memphis venues including The Peabody Memphis, Memphis Cook Convention Center, Crosstown Concourse, and FedExForum. We understand corporate professionalism, appropriate music selection, and seamless event coordination.
                  </p>
                </div>

                {/* FAQ 4 - Technical Support */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Can you provide audio/visual support for presentations?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Absolutely! We provide complete audio support for corporate presentations including wireless microphones, presentation audio connectivity, speaker systems for large venues, and technical coordination. Our team arrives early for setup and sound checks, ensures seamless audio for speeches and presentations, and has backup equipment on-site. We work closely with your event coordinator and venue technical staff to ensure flawless execution.
                  </p>
                </div>

                {/* FAQ 5 - Booking Timeline */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How far in advance should we book corporate event entertainment?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We recommend booking corporate event entertainment 2-6 months in advance, especially for popular dates like December holiday parties and spring/summer corporate events. However, we can often accommodate shorter timelines based on availability. For last-minute events, contact us immediately - we'll do our best to support your corporate entertainment needs with professional service Memphis businesses trust.
                  </p>
                </div>
              </div>
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