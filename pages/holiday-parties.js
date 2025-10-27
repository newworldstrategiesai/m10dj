import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Gift, 
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
  Sparkles,
  TreePine,
  Heart,
  Music,
  Snowflake
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';

export default function HolidayParties() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const holidayPackages = [
    {
      title: 'Just the Basics',
      description: 'Essential DJ services for smaller holiday gatherings',
      duration: '3 hours',
      features: ['Professional DJ/MC services', 'Premium sound system', 'Wireless microphone', 'Holiday music library', 'Festive lighting', 'Professional setup & coordination'],
      price: '$850',
      bestFor: 'Small office parties, family gatherings, intimate celebrations'
    },
    {
      title: 'Package #1',
      description: 'Complete entertainment for most holiday celebrations',
      duration: '4 hours',
      features: ['Professional DJ/MC services', 'Premium sound system & microphones', 'Multi-color LED dance floor lighting', 'Holiday atmosphere lighting', 'Extensive holiday music collection', 'Professional setup & coordination', 'Backup equipment'],
      price: '$1,095',
      bestFor: 'Company Christmas parties, New Year\'s Eve events, holiday fundraisers',
      popular: true
    },
    {
      title: 'Package #2',
      description: 'Premium holiday celebration experience',
      duration: '4 hours',
      features: ['Everything in Package #1, PLUS:', 'Up to 16 elegant uplighting fixtures', 'Enhanced venue ambiance', 'Professional lighting design', 'Complete A/V support', 'Special holiday effects options'],
      price: '$1,345',
      bestFor: 'Large corporate parties, New Year\'s Eve galas, premier holiday events'
    }
  ];

  const holidayEvents = [
    {
      title: 'Christmas Parties',
      description: 'Spread holiday cheer with festive music and professional entertainment',
      features: ['Christmas classics & carols', 'Modern holiday hits', 'Corporate-friendly music', 'Holiday lighting effects'],
      icon: TreePine,
      season: 'December'
    },
    {
      title: 'New Year\'s Eve Celebrations',
      description: 'Ring in the new year with countdown excitement and party music',
      features: ['Countdown coordination', 'Party anthems', 'Midnight celebration music', 'Champagne toast coordination'],
      icon: Sparkles,
      season: 'December 31st'
    },
    {
      title: 'Thanksgiving Gatherings',
      description: 'Family-friendly entertainment for your Thanksgiving celebration',
      features: ['Grateful heart music', 'Family sing-alongs', 'Autumn classics', 'Dinner background music'],
      icon: Gift,
      season: 'November'
    },
    {
      title: 'Valentine\'s Day Events',
      description: 'Romantic entertainment for couples celebrations and singles parties',
      features: ['Love song classics', 'Romantic slow dances', 'Anti-Valentine music options', 'Couple-friendly activities'],
      icon: Heart,
      season: 'February'
    },
    {
      title: 'Halloween Parties',
      description: 'Spook-tacular entertainment with themed music and fun activities',
      features: ['Halloween classics', 'Monster mash music', 'Costume contest coordination', 'Spooky sound effects'],
      icon: Award,
      season: 'October'
    },
    {
      title: 'Fourth of July Celebrations',
      description: 'Patriotic entertainment for your Independence Day festivities',
      features: ['Patriotic classics', 'American favorites', 'Fireworks coordination', 'BBQ background music'],
      icon: Star,
      season: 'July'
    }
  ];

  const addOnServices = [
    { name: 'Additional Hour', price: '$150', description: 'Extend your celebration beyond package hours' },
    { name: 'Holiday Decor Lighting', price: '$200', description: 'Seasonal colored uplighting to match your holiday theme' },
    { name: 'Flat Screen TV w/ Stand', price: '$300', description: '65" TV for holiday photos or video messages' },
    { name: 'Additional Speaker', price: '$150', description: 'Extra speaker for separate party areas' },
    { name: 'Cold Spark Fountain Effect', price: '$500', description: 'Dramatic indoor-safe spark effects for midnight countdowns or grand entrances' },
    { name: 'Snow Machine', price: '$400', description: 'Create a winter wonderland with safe indoor "snow"' }
  ];

  const musicByHoliday = [
    {
      holiday: 'Christmas & Winter Holidays',
      traditional: ['Silent Night', 'Jingle Bells', 'White Christmas', 'The Christmas Song'],
      modern: ['All I Want for Christmas Is You', 'Last Christmas', 'Wonderful Christmastime', 'Feliz Navidad'],
      special: 'Multi-cultural holiday music available including Hanukkah and Kwanzaa songs'
    },
    {
      holiday: 'New Year\'s Eve',
      traditional: ['Auld Lang Syne', 'What Are You Doing New Year\'s Eve', 'Celebration', 'Happy New Year'],
      modern: ['Party Like It\'s 1999', 'New Year\'s Day', 'Confetti', 'Good as Hell'],
      special: 'Synchronized countdown with music and lighting effects'
    },
    {
      holiday: 'Valentine\'s Day',
      traditional: ['My Funny Valentine', 'L-O-V-E', 'The Way You Look Tonight', 'At Last'],
      modern: ['Perfect', 'Thinking Out Loud', 'All of Me', 'Make You Feel My Love'],
      special: 'Both romantic couple songs and fun anti-Valentine singles anthems'
    }
  ];

  return (
    <>
      <Head>
        <title>Holiday Party DJ Services Memphis | M10 DJ Company | Christmas, New Year & Seasonal Events</title>
        <meta name="description" content="Professional holiday party DJ services in Memphis. Expert entertainment for Christmas parties, New Year's Eve, and all seasonal celebrations throughout the year." />
        <meta name="keywords" content="Memphis holiday party DJ, Christmas party entertainment Memphis, New Year's Eve DJ Memphis, holiday event services Memphis TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Holiday Party DJ Services Memphis | M10 DJ Company" />
        <meta property="og:description" content="Professional holiday party DJ services in Memphis for Christmas, New Year's Eve, and all seasonal celebrations." />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="og:url" content="https://m10djcompany.com/holiday-parties" />
        
        {/* Schema.org */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Holiday Party DJ Services",
              "description": "Professional DJ and entertainment services for holiday parties and seasonal celebrations in Memphis, TN",
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
              "serviceType": "Holiday Event Entertainment"
            })
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-green-50 text-gray-900 overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-red-100 to-green-100 rounded-full blur-2xl opacity-40"></div>
            <div className="absolute top-10 left-20 w-40 h-40 bg-red-100 rounded-full blur-xl opacity-30"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-32">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center mb-8">
                <Gift className="w-16 h-16 text-green-600 mr-4" />
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 font-sans">
                  Holiday Parties
                </h1>
                <Snowflake className="w-16 h-16 text-blue-500 ml-4" />
              </div>
              
              <p className="text-2xl md:text-3xl text-green-600 font-semibold font-inter mb-6">
                Celebrate Every Season with Style
              </p>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-inter">
                From cozy Christmas gatherings to exciting New Year's Eve countdowns, we bring the perfect festive atmosphere to your seasonal celebrations. Holiday music, special effects, and memories that last all year long.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="#holidays" className="btn-primary group text-lg px-8 py-4">
                  View Holiday Services
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="tel:(901)410-2020" className="btn-secondary text-lg px-8 py-4">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                </a>
              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-green-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Music className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Holiday Music Library</h3>
                  <p className="text-gray-600 font-inter">Extensive collection of holiday classics and modern seasonal favorites</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-red-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Festive Lighting</h3>
                  <p className="text-gray-600 font-inter">Holiday-themed lighting and effects to transform your venue</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-blue-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Year-Round Availability</h3>
                  <p className="text-gray-600 font-inter">Expert in all holidays and seasonal celebrations throughout the year</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="holidays" className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Holiday Party DJ Packages</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Transparent pricing for professional holiday entertainment. All packages include premium equipment, festive music, and backup systems.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {holidayPackages.map((pkg, index) => (
                <div key={index} className={`rounded-2xl p-8 transition-all ${
                  pkg.popular 
                    ? 'bg-gradient-to-br from-green-600 to-red-600 text-white shadow-2xl transform scale-105 relative' 
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
                    pkg.popular ? 'bg-white/10' : 'bg-green-50'
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
                <h3 className="text-3xl font-bold text-gray-900 mb-4 font-sans">Holiday Add-On Services</h3>
                <p className="text-lg text-gray-600 font-inter">
                  Enhance your celebration with these festive add-ons
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

        {/* Holiday Events We Serve Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Holidays We Celebrate</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Professional entertainment for every holiday and seasonal celebration throughout the year.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {holidayEvents.map((event, index) => (
                <div key={index} className="modern-card p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-red-500 text-white rounded-xl flex items-center justify-center">
                      <event.icon className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {event.season}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">{event.title}</h3>
                  <p className="text-gray-600 mb-4 font-inter">{event.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {event.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="#contact" className="btn-outline w-full text-center">
                    Book This Holiday
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Music Selection Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Holiday Music Selection</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                We blend traditional holiday favorites with modern seasonal hits to create the perfect festive atmosphere.
              </p>
            </div>
            
            <div className="space-y-8">
              {musicByHoliday.map((holiday, index) => (
                <div key={index} className="modern-card p-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6 font-sans text-center">{holiday.holiday}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 font-inter flex items-center">
                        <Award className="w-4 h-4 text-green-500 mr-2" />
                        Traditional Classics
                      </h4>
                      <ul className="space-y-1">
                        {holiday.traditional.map((song, idx) => (
                          <li key={idx} className="text-gray-600 font-inter text-sm flex items-center">
                            <Star className="w-3 h-3 text-brand mr-2 flex-shrink-0" />
                            {song}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 font-inter flex items-center">
                        <Music className="w-4 h-4 text-red-500 mr-2" />
                        Modern Favorites
                      </h4>
                      <ul className="space-y-1">
                        {holiday.modern.map((song, idx) => (
                          <li key={idx} className="text-gray-600 font-inter text-sm flex items-center">
                            <Star className="w-3 h-3 text-brand mr-2 flex-shrink-0" />
                            {song}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <p className="text-blue-800 font-inter text-sm">
                      <strong>Special Note:</strong> {holiday.special}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Why Choose M10 for Holiday Parties</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <TreePine className="w-16 h-16 bg-gradient-to-br from-green-500 to-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Holiday Expertise</h3>
                <p className="text-gray-600 font-inter text-sm">10+ years of experience creating magical holiday atmospheres for Memphis celebrations</p>
              </div>
              
              <div className="text-center">
                <Sparkles className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Festive Lighting</h3>
                <p className="text-gray-600 font-inter text-sm">Holiday-themed lighting packages to transform any venue into a winter wonderland</p>
              </div>
              
              <div className="text-center">
                <Users className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">All Ages Entertainment</h3>
                <p className="text-gray-600 font-inter text-sm">Family-friendly holiday entertainment that brings generations together</p>
              </div>
              
              <div className="text-center">
                <Clock className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Special Moments</h3>
                <p className="text-gray-600 font-inter text-sm">Countdown coordination, special announcements, and memorable holiday traditions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Planning Tips Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Holiday Party Planning Tips</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="modern-card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Book Early for Peak Seasons</h3>
                <p className="text-gray-600 mb-4 font-inter">
                  Holiday parties are in high demand, especially December events. We recommend booking 2-3 months in advance for Christmas and New Year's Eve parties.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Christmas parties: Book by October
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    New Year's Eve: Book by September
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Other holidays: 4-6 weeks advance
                  </li>
                </ul>
              </div>

              <div className="modern-card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Consider Your Audience</h3>
                <p className="text-gray-600 mb-4 font-inter">
                  Different crowds have different holiday music preferences. We'll help you find the perfect balance for your specific group.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Corporate: Professional but festive
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Family: Multi-generational appeal
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Friends: Party atmosphere with traditions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 bg-gradient-to-br from-green-600 to-red-600 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Ready to Celebrate the Holidays?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let's make your holiday celebration magical with the perfect music, lighting, and festive atmosphere your guests will love.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <a href="tel:(901)410-2020" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="mailto:info@m10djcompany.com" className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Us Today
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <Gift className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">All Holidays Covered</h3>
                  <p className="opacity-80">Christmas, New Year's, Valentine's, Halloween, and more</p>
                </div>
                <div>
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Memphis Holiday Expert</h3>
                  <p className="opacity-80">Over a decade of creating Memphis holiday magic</p>
                </div>
                <div>
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Any Size Celebration</h3>
                  <p className="opacity-80">Intimate gatherings to large corporate holiday parties</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Get Your Holiday Party Quote</h2>
                <p className="text-lg text-gray-600 font-inter">
                  Tell us about your holiday celebration and we'll create the perfect festive atmosphere.
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