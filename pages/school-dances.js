import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
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
  Trophy,
  Heart,
  Music
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';

export default function SchoolDances() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const schoolEvents = [
    {
      title: 'Homecoming Dances',
      description: 'Create lasting memories with professional DJ services for your homecoming celebration',
      features: ['Current hit music', 'Traditional homecoming songs', 'Royal court announcements', 'Photo-worthy lighting'],
      price: 'Starting at $595',
      icon: Trophy
    },
    {
      title: 'Prom Night',
      description: 'Make prom magical with elegant entertainment and dance floor perfection',
      features: ['Sophisticated sound system', 'Romantic slow songs', 'High-energy dance music', 'Special lighting effects'],
      price: 'Starting at $795',
      icon: Heart
    },
    {
      title: 'Winter Formal',
      description: 'Elegant entertainment for your winter dance with holiday spirit',
      features: ['Formal dance music', 'Holiday favorites', 'Elegant presentation', 'Professional MC services'],
      price: 'Starting at $645',
      icon: Sparkles
    },
    {
      title: 'Graduation Parties',
      description: 'Celebrate achievements with music that honors the graduating class',
      features: ['Class year favorites', 'Achievement recognition', 'Senior class traditions', 'Memory lane music'],
      price: 'Starting at $525',
      icon: GraduationCap
    },
    {
      title: 'School Fundraisers',
      description: 'Support your school with entertaining events that bring the community together',
      features: ['Family-friendly music', 'Community engagement', 'Fundraising announcements', 'Interactive activities'],
      price: 'Starting at $495',
      icon: Users
    },
    {
      title: 'Spirit Week Events',
      description: 'Pump up school spirit with high-energy entertainment for pep rallies and events',
      features: ['School fight songs', 'Pump-up music', 'Spirit chants', 'Athletic event coordination'],
      price: 'Starting at $395',
      icon: Award
    }
  ];

  const musicStyles = [
    {
      category: 'Current Hits',
      description: 'Latest chart-toppers and TikTok favorites that students love',
      examples: ['Billboard Top 40', 'Viral social media songs', 'Current pop hits', 'Trending dance tracks']
    },
    {
      category: 'Dance Classics',
      description: 'Timeless songs that fill the dance floor every time',
      examples: ['Classic party anthems', 'Dance floor favorites', '90s and 2000s hits', 'Sing-along classics']
    },
    {
      category: 'Clean Versions',
      description: 'Age-appropriate music that maintains the energy while staying school-appropriate',
      examples: ['Radio edits', 'Clean hip-hop', 'Appropriate pop music', 'Family-friendly favorites']
    },
    {
      category: 'Slow Dance Songs',
      description: 'Romantic ballads perfect for those special moments',
      examples: ['Modern love songs', 'Classic slow dance hits', 'Contemporary ballads', 'Romantic favorites']
    }
  ];

  return (
    <>
      <Head>
        <title>School Dance DJ Services Memphis | M10 DJ Company | Prom, Homecoming & School Events</title>
        <meta name="description" content="Professional school dance DJ services in Memphis. Expert entertainment for prom, homecoming, winter formal, and all school events with age-appropriate music." />
        <meta name="keywords" content="Memphis school dance DJ, prom DJ Memphis, homecoming dance entertainment, school event DJ Memphis TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="School Dance DJ Services Memphis | M10 DJ Company" />
        <meta property="og:description" content="Professional school dance DJ services in Memphis for prom, homecoming, and all school events." />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="og:url" content="https://m10djcompany.com/school-dances" />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "School Dance DJ Services",
            "description": "Professional DJ and entertainment services for school dances and events in Memphis, TN",
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
            "serviceType": "School Event Entertainment"
          })}
        </script>
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-indigo-50 text-gray-900 overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-100 to-brand/10 rounded-full blur-2xl opacity-40"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-32">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center mb-8">
                <GraduationCap className="w-16 h-16 text-indigo-600 mr-4" />
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 font-sans">
                  School Dances
                </h1>
                <Music className="w-16 h-16 text-indigo-600 ml-4" />
              </div>
              
              <p className="text-2xl md:text-3xl text-indigo-600 font-semibold font-inter mb-6">
                Making School Events Unforgettable
              </p>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-inter">
                From prom night magic to homecoming spirit, we create the perfect soundtrack for your school's most memorable moments. Age-appropriate music that keeps everyone dancing all night long.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="#events" className="btn-primary group text-lg px-8 py-4">
                  View School Events
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
                  <div className="w-16 h-16 bg-indigo-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">School-Appropriate Music</h3>
                  <p className="text-gray-600 font-inter">Clean versions and age-appropriate selections that administrators approve</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-indigo-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Student Engagement</h3>
                  <p className="text-gray-600 font-inter">We know how to read the crowd and keep students excited and dancing</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-indigo-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Memphis Schools Trust Us</h3>
                  <p className="text-gray-600 font-inter">Trusted by Memphis area schools for over 10 years of successful events</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* School Events Section */}
        <section id="events" className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">School Event Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Professional entertainment for all your school's special events and celebrations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schoolEvents.map((event, index) => (
                <div key={index} className="modern-card p-6 hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center mb-6">
                    <event.icon className="w-8 h-8" />
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
                  
                  <div className="text-brand font-semibold text-lg mb-4">{event.price}</div>
                  
                  <Link href="#contact" className="btn-outline w-full text-center">
                    Book This Event
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Music Styles Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Our Music Selection</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                We curate the perfect mix of music that students love while maintaining school-appropriate content.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {musicStyles.map((style, index) => (
                <div key={index} className="modern-card p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">{style.category}</h3>
                  <p className="text-gray-600 mb-4 font-inter">{style.description}</p>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 font-inter">Includes:</h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {style.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <Star className="w-3 h-3 text-brand mr-2 flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Schools Choose Us Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Why Memphis Schools Choose M10</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <Volume2 className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Professional Equipment</h3>
                <p className="text-gray-600 font-inter text-sm">High-quality sound systems sized appropriately for school venues and gymnasiums</p>
              </div>
              
              <div className="text-center">
                <CheckCircle className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Administrator Approved</h3>
                <p className="text-gray-600 font-inter text-sm">We work closely with school administrators to ensure all content is appropriate</p>
              </div>
              
              <div className="text-center">
                <Clock className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Reliable & Punctual</h3>
                <p className="text-gray-600 font-inter text-sm">We arrive early for setup and are ready before students arrive</p>
              </div>
              
              <div className="text-center">
                <Users className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Student Focused</h3>
                <p className="text-gray-600 font-inter text-sm">We know how to engage teenagers and keep the energy high all night</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Ready to Book Your School Event?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let's make your school dance or event one that students will remember for years to come.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <a href="tel:(901)410-2020" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="mailto:info@m10djcompany.com" className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Us Today
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">All School Levels</h3>
                  <p className="opacity-80">Middle school, high school, and college events welcome</p>
                </div>
                <div>
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
                  <p className="opacity-80">Simple contracts and payment options for schools</p>
                </div>
                <div>
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Satisfaction Guaranteed</h3>
                  <p className="opacity-80">We're committed to making your event a success</p>
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
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Get Your School Event Quote</h2>
                <p className="text-lg text-gray-600 font-inter">
                  Tell us about your school event and we'll provide a detailed quote and event plan.
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