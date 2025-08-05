import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Music, 
  Users, 
  Star, 
  Calendar, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  CheckCircle, 
  Play,
  Clock,
  Volume2,
  Mic2,
  Headphones,
  Music2,
  Sparkles,
  Camera
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import { BreadcrumbListSchema } from '../components/StandardSchema';

export default function Weddings() {
  const [isVisible, setIsVisible] = useState(false);
  const [activePackage, setActivePackage] = useState('premium');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const weddingPackages = [
    {
      id: 'essential',
      name: 'Essential Wedding',
      price: '$799',
      duration: '6 hours',
      description: 'Perfect for intimate celebrations',
      features: [
        'Professional DJ for 6 hours',
        'Ceremony sound system',
        'Reception DJ services',
        'Wireless microphones (2)',
        'Basic uplighting',
        'Music consultation',
        'Online planning portal'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium Wedding',
      price: '$1,299',
      duration: '8 hours',
      description: 'Our most popular package',
      features: [
        'Professional DJ for 8 hours',
        'Ceremony & cocktail music',
        'Full reception DJ services',
        'Wireless microphones (4)',
        'Premium uplighting package',
        'Dance floor lighting',
        'Music consultation & timeline',
        'Online planning portal',
        'MC services',
        'Backup equipment'
      ],
      popular: true
    },
    {
      id: 'luxury',
      name: 'Luxury Wedding',
      price: '$1,899',
      duration: 'Up to 10 hours',
      description: 'The ultimate wedding experience',
      features: [
        'Professional DJ for up to 10 hours',
        'Ceremony, cocktail & reception',
        'Premium sound system',
        'Wireless microphones (6)',
        'Custom uplighting design',
        'Dance floor & venue lighting',
        'Detailed music consultation',
        'Wedding timeline coordination',
        'Professional MC services',
        'Backup DJ & equipment',
        'Special effects lighting',
        'Custom monogram projection'
      ],
      popular: false
    }
  ];

  const weddingProcess = [
    {
      step: '1',
      title: 'Initial Consultation',
      description: 'We discuss your vision, venue, and musical preferences over coffee or a call.',
      icon: Heart
    },
    {
      step: '2',
      title: 'Planning & Preparation',
      description: 'Access our online portal to build playlists, timelines, and special requests.',
      icon: Calendar
    },
    {
      step: '3',
      title: 'Your Wedding Day',
      description: 'We arrive early, handle setup, and ensure your celebration flows perfectly.',
      icon: Music
    },
    {
      step: '4',
      title: 'Dance the Night Away',
      description: 'Professional MC services and expert music selection keep everyone celebrating.',
      icon: Users
    }
  ];

  const venues = [
    'The Peabody Memphis',
    'Dixon Gallery and Gardens',
    'Elmwood Cemetery Chapel',
    'The Columns',
    'Memphis Hunt and Polo Club',
    'Shelby Farms Park',
    'Historic Elmwood Hall',
    'The Ballroom at Church Street'
  ];

  return (
    <>
      <Head>
        <title>Memphis Wedding Entertainment | Professional Wedding DJs | M10 DJ Company</title>
        <meta name="description" content="Memphis's premier wedding DJ service. Professional entertainment, personalized music, and flawless execution for your special day. Serving Memphis and surrounding areas since 2014." />
        <meta name="keywords" content="Memphis wedding DJ, wedding DJ Memphis TN, wedding entertainment Memphis, Memphis DJ service, wedding music Memphis, professional wedding DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Memphis Wedding DJ | M10 DJ Company" />
        <meta property="og:description" content="Memphis's premier wedding DJ service. Professional entertainment for your special day." />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="og:url" content="https://m10djcompany.com/weddings" />
        <meta property="og:type" content="website" />
        
        {/* Schema.org Wedding Business */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["MusicGroup", "EntertainmentBusiness"],
            "name": "M10 DJ Company - Wedding DJ Services",
            "description": "Professional wedding DJ services in Memphis, TN with 15+ years experience and 500+ successful celebrations",
            "url": "https://m10djcompany.com/weddings",
            "telephone": "(901) 410-2020",
            "email": "info@m10djcompany.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Memphis, TN",
              "addressLocality": "Memphis",
              "addressRegion": "TN",
              "postalCode": "38119",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 35.1495,
              "longitude": -90.0490
            },
            "openingHours": [
              "Mo-Su 09:00-22:00"
            ],
            "serviceArea": {
              "@type": "GeoCircle",
              "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": 35.1495,
                "longitude": -90.0490
              },
              "geoRadius": "50000"
            },
            "priceRange": "$799-$1899",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5.0",
              "reviewCount": "150",
              "bestRating": "5",
              "worstRating": "1"
            },
            "review": [
              {
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": "Sarah & Michael Johnson"
                },
                "datePublished": "2024-01-15",
                "reviewBody": "M10 DJ Company made our wedding absolutely perfect! They played exactly what we wanted and kept everyone dancing all night long. Professional, responsive, and truly cared about making our day special.",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5",
                  "bestRating": "5",
                  "worstRating": "1"
                }
              },
              {
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": "Emily & David Chen"
                },
                "datePublished": "2024-03-22",
                "reviewBody": "Outstanding wedding DJ service! Ben and his team exceeded our expectations with perfect music selection and seamless event coordination. Highly recommend for Memphis weddings!",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5",
                  "bestRating": "5",
                  "worstRating": "1"
                }
              }
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Wedding DJ Packages",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Essential Wedding Package",
                    "description": "Professional DJ services for intimate wedding celebrations"
                  },
                  "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "799",
                    "priceCurrency": "USD",
                    "valueAddedTaxIncluded": true
                  },
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01"
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Premium Wedding Package", 
                    "description": "Complete wedding entertainment with uplighting and MC services"
                  },
                  "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "1299",
                    "priceCurrency": "USD",
                    "valueAddedTaxIncluded": true
                  },
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01"
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Luxury Wedding Package",
                    "description": "Ultimate wedding experience with custom lighting and effects"
                  },
                  "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "1899",
                    "priceCurrency": "USD",
                    "valueAddedTaxIncluded": true
                  },
                  "availability": "https://schema.org/InStock",
                  "validFrom": "2024-01-01"
                }
              ]
            }
          })}
        </script>

        {/* Breadcrumb Schema */}
        <BreadcrumbListSchema 
          breadcrumbs={[
            { name: "Home", url: "https://m10djcompany.com" },
            { name: "Wedding DJ Services", url: "https://m10djcompany.com/weddings" }
          ]}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-rose-50 text-gray-900 overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-rose-100 to-brand/10 rounded-full blur-2xl opacity-40"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-32">
            <div className="max-w-5xl mx-auto">
              {/* Main Headline */}
              <div className="mb-8">
                <div className="flex items-center justify-center mb-6">
                  <Heart className="w-12 h-12 text-rose-500 mr-4" />
                  <h1 className="text-5xl md:text-7xl font-bold text-gray-900 font-sans">
                    Your Perfect
                  </h1>
                  <Heart className="w-12 h-12 text-rose-500 ml-4" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-gradient font-sans mb-4">
                  Memphis Wedding
                </h1>
                <p className="text-2xl md:text-3xl text-rose-600 font-semibold font-inter">
                  Starts with the Perfect DJ
                </p>
              </div>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-inter">
                For over 10 years, we've been creating magical moments for Memphis couples. From your first dance to the last song, 
                we'll make your wedding celebration everything you've dreamed of and more.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="#packages" className="btn-primary group text-lg px-8 py-4">
                  View Wedding Packages
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#contact" className="btn-secondary text-lg px-8 py-4">
                  Get Your Free Quote
                </Link>
                <a href="tel:(901)410-2020" className="btn-outline group text-lg px-8 py-4">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                </a>
              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">500+ Weddings</h3>
                  <p className="text-gray-600 font-inter">Memphis couples trust us with their most important day</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">5-Star Reviews</h3>
                  <p className="text-gray-600 font-inter">Consistently rated as Memphis's top wedding DJ service</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Personalized Service</h3>
                  <p className="text-gray-600 font-inter">Every wedding is unique - we tailor our service to your vision</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wedding Packages Section */}
        <section id="packages" className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Wedding Packages</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Choose the perfect package for your special day. All packages include professional equipment, 
                music consultation, and our commitment to making your wedding unforgettable.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {weddingPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className={`relative modern-card p-8 transition-all duration-300 ${
                    pkg.popular 
                      ? 'ring-2 ring-brand transform scale-105 bg-gradient-to-br from-white to-brand/5' 
                      : 'hover:shadow-xl'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">{pkg.name}</h3>
                    <div className="text-4xl font-bold text-brand mb-2">{pkg.price}</div>
                    <p className="text-gray-600 font-semibold">{pkg.duration}</p>
                    <p className="text-gray-500 text-sm mt-2">{pkg.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 font-inter">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href="#contact" 
                    className={`w-full text-center block py-3 px-6 rounded-lg font-semibold transition-colors ${
                      pkg.popular 
                        ? 'bg-brand text-white hover:bg-brand-600' 
                        : 'bg-gray-100 text-gray-900 hover:bg-brand hover:text-white'
                    }`}
                  >
                    Choose This Package
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Why Memphis Couples Choose M10</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Your wedding day deserves more than just someone who plays music. You deserve a professional 
                who understands the flow of your celebration and knows how to keep your guests engaged all night long.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="modern-card p-6 text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Music2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Music For Every Moment</h3>
                <p className="text-gray-600 font-inter">From your ceremony processional to the last dance, we curate the perfect soundtrack for each part of your celebration.</p>
              </div>
              
              <div className="modern-card p-6 text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Mic2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Professional MC Services</h3>
                <p className="text-gray-600 font-inter">We handle all announcements with elegance and keep your timeline flowing smoothly so you can focus on celebrating.</p>
              </div>
              
              <div className="modern-card p-6 text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Volume2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Premium Sound Systems</h3>
                <p className="text-gray-600 font-inter">Crystal-clear audio for your ceremony, toasts, and dancing. Plus backup equipment to ensure everything goes perfectly.</p>
              </div>
              
              <div className="modern-card p-6 text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Stunning Lighting</h3>
                <p className="text-gray-600 font-inter">Transform your venue with professional uplighting and dance floor effects that create the perfect ambiance.</p>
              </div>
              
              <div className="modern-card p-6 text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Timeline Coordination</h3>
                <p className="text-gray-600 font-inter">We work with your other vendors to ensure seamless transitions from cocktails to dinner to dancing.</p>
              </div>
              
              <div className="modern-card p-6 text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Personal Touch</h3>
                <p className="text-gray-600 font-inter">Every wedding is unique. We take time to understand your story and incorporate personal elements that make your day special.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">How We Make Magic Happen</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                From our first conversation to your last dance, we're with you every step of the way to ensure your wedding is flawless.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {weddingProcess.map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-600 text-white rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <item.icon className="w-10 h-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">{item.title}</h3>
                  <p className="text-gray-600 font-inter">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-rose-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Real Memphis Couples, Real Stories</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Don't just take our word for it. Here's what Memphis couples say about their M10 DJ Company experience.
              </p>
            </div>
            
            <TestimonialSlider />
          </div>
        </section>

        {/* Memphis Venues Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">We Know Memphis Venues</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter mb-8">
                We've performed at Memphis's most beautiful wedding venues and know exactly how to make each space shine.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {venues.map((venue, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-brand/5 transition-colors">
                  <p className="text-gray-700 font-semibold font-inter text-sm">{venue}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link href="/venues" className="btn-secondary">
                View All Memphis Wedding Venues
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Wedding FAQ</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Planning your first wedding? We've got answers to the most common questions Memphis couples ask.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="modern-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">How far in advance should we book?</h3>
                  <p className="text-gray-600 font-inter">We recommend booking 6-12 months in advance, especially for peak wedding season (May-October). However, we understand some couples need last-minute help - just give us a call!</p>
                </div>
                
                <div className="modern-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Do you take music requests from guests?</h3>
                  <p className="text-gray-600 font-inter">Absolutely! We love taking requests and reading the crowd. We'll work with you beforehand to understand any songs you absolutely want or don't want played.</p>
                </div>
                
                <div className="modern-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">What's included in wedding packages?</h3>
                  <p className="text-gray-600 font-inter">All packages include professional DJ services, sound system, microphones, basic lighting, music consultation, and MC services. Premium packages add uplighting and special effects.</p>
                </div>
                
                <div className="modern-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Do you provide backup equipment?</h3>
                  <p className="text-gray-600 font-inter">Yes! We bring backup equipment to every event and have contingency plans in place. We've never had to cancel a wedding due to equipment failure.</p>
                </div>
                
                <div className="modern-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Can you handle different age groups?</h3>
                  <p className="text-gray-600 font-inter">Definitely! We're experts at reading the room and playing music that appeals to all ages - from grandparents to young cousins, everyone will find something to dance to.</p>
                </div>
                
                <div className="modern-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">What if our timeline changes?</h3>
                  <p className="text-gray-600 font-inter">Wedding days rarely go exactly as planned, and that's okay! We're flexible and experienced at adapting to timeline changes while keeping your celebration on track.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="contact" className="py-20 bg-gradient-to-br from-brand to-brand-600 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Ready to Book Your Memphis Wedding DJ?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let's chat about your vision and see how we can make your wedding day absolutely perfect. 
                Your dream celebration is just one conversation away.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <a href="tel:(901)410-2020" className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="mailto:info@m10djcompany.com" className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Us Today
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Quick Response</h3>
                  <p className="opacity-80">We respond to all inquiries within 24 hours</p>
                </div>
                <div>
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">No Pressure</h3>
                  <p className="opacity-80">Friendly consultation with no obligation</p>
                </div>
                <div>
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Satisfaction Guaranteed</h3>
                  <p className="opacity-80">Your happiness is our top priority</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memphis Wedding Resources Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Memphis Wedding DJ Resources</h2>
              <p className="text-lg text-gray-600 font-inter max-w-3xl mx-auto">
                Planning your Memphis wedding? Explore our comprehensive guides to help you make the best decisions 
                for your Tennessee celebration.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Link href="/best-wedding-dj-memphis" className="modern-card p-6 text-center group hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Best Memphis Wedding DJ</h3>
                <p className="text-gray-600 font-inter mb-4">
                  Discover why M10 is consistently rated the best wedding DJ in Memphis with 5-star reviews and 500+ successful weddings.
                </p>
                <span className="text-brand font-semibold group-hover:underline">Learn Why We're #1 →</span>
              </Link>

              <Link href="/blog/memphis-wedding-dj-cost-guide-2025" className="modern-card p-6 text-center group hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Memphis Wedding DJ Costs</h3>
                <p className="text-gray-600 font-inter mb-4">
                  Complete 2025 pricing guide for Memphis wedding DJ services, packages, and tips to save money on your celebration.
                </p>
                <span className="text-brand font-semibold group-hover:underline">View Pricing Guide →</span>
              </Link>

              <Link href="/blog/memphis-wedding-songs-2025" className="modern-card p-6 text-center group hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Music2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Memphis Wedding Songs</h3>
                <p className="text-gray-600 font-inter mb-4">
                  Discover the best Memphis wedding songs for 2025, including local favorites and proven crowd-pleasers for your playlist.
                </p>
                <span className="text-brand font-semibold group-hover:underline">Get Song Ideas →</span>
              </Link>
            </div>

            <div className="text-center mt-12">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/memphis-dj-pricing-guide" className="btn-primary">
                  View Transparent Pricing
                </Link>
                <Link href="/wedding-dj-memphis-tn" className="btn-secondary">
                  Memphis Wedding DJ Services
                </Link>
                <Link href="/dj-near-me-memphis" className="btn-secondary">
                  Find DJ Near Me
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Get Your Free Wedding Quote</h2>
                <p className="text-lg text-gray-600 font-inter">
                  Fill out the form below and we'll send you a personalized quote within 24 hours.
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