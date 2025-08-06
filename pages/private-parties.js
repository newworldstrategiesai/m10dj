import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PartyPopper, 
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
  Gift,
  Cake,
  Music
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';

export default function PrivateParties() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const partyTypes = [
    {
      title: 'Birthday Parties',
      description: 'Celebrate life with music that spans all ages and keeps everyone dancing',
      features: ['Age-appropriate music', 'Interactive DJ services', 'Party games & activities', 'Special birthday announcements'],
      price: 'Starting at $395',
      icon: Cake
    },
    {
      title: 'Anniversary Celebrations',
      description: 'Honor your milestone with romantic music and elegant entertainment',
      features: ['Romantic music selection', 'Special dedication announcements', 'Dance floor lighting', 'Memory lane music'],
      price: 'Starting at $495',
      icon: Award
    },
    {
      title: 'Graduation Parties',
      description: 'Celebrate achievements with upbeat music for the new graduate',
      features: ['Current hits & classics', 'Graduation ceremony music', 'Photo booth coordination', 'Achievement announcements'],
      price: 'Starting at $445',
      icon: PartyPopper
    },
    {
      title: 'Retirement Parties',
      description: 'Send off your retiree with their favorite music from through the years',
      features: ['Music from their era', 'Career milestone recognition', 'Elegant presentation', 'Special tribute music'],
      price: 'Starting at $425',
      icon: Gift
    },
    {
      title: 'Family Reunions',
      description: 'Bring generations together with music everyone can enjoy',
      features: ['Multi-generational playlists', 'Family activity music', 'Group photo coordination', 'Cultural music options'],
      price: 'Starting at $525',
      icon: Users
    },
    {
      title: 'Backyard Parties',
      description: 'Transform your outdoor space into the perfect party venue',
      features: ['Weather-resistant equipment', 'Outdoor sound optimization', 'Ambient lighting options', 'Neighbor-friendly volume'],
      price: 'Starting at $375',
      icon: Sparkles
    }
  ];

  const ageGroups = [
    {
      title: 'Kids Parties (Ages 5-12)',
      music: 'Disney hits, clean pop songs, dance music, interactive games',
      specialties: ['Musical games', 'Dance-alongs', 'Freeze dance', 'Birthday sing-alongs']
    },
    {
      title: 'Teen Parties (Ages 13-17)',
      music: 'Current hits, TikTok favorites, clean versions, dance challenges',
      specialties: ['Current trending music', 'Dance challenges', 'Social media moments', 'Interactive requests']
    },
    {
      title: 'Adult Parties (Ages 18+)',
      music: 'All genres, decades spanning from 70s to current, dancing classics',
      specialties: ['Decade themes', 'Karaoke options', 'Couples dancing', 'Party game music']
    },
    {
      title: 'Mixed Age Groups',
      music: 'Carefully curated playlists that appeal to all generations',
      specialties: ['Cross-generational hits', 'Family-friendly content', 'Activity coordination', 'Volume management']
    }
  ];

  return (
    <>
      <Head>
        <title>Private Party DJ Services Memphis | M10 DJ Company | Birthday, Anniversary & Family Celebrations</title>
        <meta name="description" content="Professional private party DJ services in Memphis. Perfect entertainment for birthdays, anniversaries, family reunions, and all your personal celebrations." />
        <meta name="keywords" content="Memphis private party DJ, birthday party DJ Memphis, anniversary party entertainment, family reunion DJ Memphis TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Private Party DJ Services Memphis | M10 DJ Company" />
        <meta property="og:description" content="Professional private party DJ services in Memphis for birthdays, anniversaries, and all your personal celebrations." />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="og:url" content="https://m10djcompany.com/private-parties" />
        
        {/* Schema.org */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Private Party DJ Services",
              "description": "Professional DJ and entertainment services for private parties in Memphis, TN",
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
              "serviceType": "Private Party Entertainment"
            })
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-purple-50 text-gray-900 overflow-hidden ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-100 to-brand/10 rounded-full blur-2xl opacity-40"></div>
          </div>
          
          <div className="section-container relative z-10 text-center py-32">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center mb-8">
                <PartyPopper className="w-16 h-16 text-purple-600 mr-4" />
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 font-sans">
                  Private Parties
                </h1>
                <PartyPopper className="w-16 h-16 text-purple-600 ml-4" />
              </div>
              
              <p className="text-2xl md:text-3xl text-purple-600 font-semibold font-inter mb-6">
                Celebrate Life's Special Moments
              </p>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-inter">
                From intimate family gatherings to milestone celebrations, we create the perfect atmosphere for your personal moments. Every party is unique, and your music should be too.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="#party-types" className="btn-primary group text-lg px-8 py-4">
                  Explore Party Options
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
                  <div className="w-16 h-16 bg-purple-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Music className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">All Ages Welcome</h3>
                  <p className="text-gray-600 font-inter">From toddlers to grandparents, we know how to keep everyone entertained</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-purple-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Interactive Entertainment</h3>
                  <p className="text-gray-600 font-inter">Games, activities, and audience participation to keep the energy high</p>
                </div>
                
                <div className="modern-card text-center group">
                  <div className="w-16 h-16 bg-purple-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">Personal Touch</h3>
                  <p className="text-gray-600 font-inter">Custom announcements and special dedications for your celebration</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Party Types Section */}
        <section id="party-types" className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Types of Private Parties</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                Whatever you're celebrating, we have the experience and music to make it memorable.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partyTypes.map((party, index) => (
                <div key={index} className="modern-card p-6 hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center mb-6">
                    <party.icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">{party.title}</h3>
                  <p className="text-gray-600 mb-4 font-inter">{party.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {party.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="text-brand font-semibold text-lg mb-4">{party.price}</div>
                  
                  <Link href="#contact" className="btn-outline w-full text-center">
                    Book This Party
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Age Groups Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">Music for Every Age Group</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
                We understand that different ages have different musical tastes. Here's how we cater to each group.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ageGroups.map((group, index) => (
                <div key={index} className="modern-card p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">{group.title}</h3>
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 font-inter">Music Style:</h4>
                    <p className="text-gray-600 font-inter">{group.music}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 font-inter">Specialties:</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {group.specialties.map((specialty, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <Star className="w-3 h-3 text-brand mr-2 flex-shrink-0" />
                          {specialty}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">What's Included in Every Private Party</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <Volume2 className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Professional Sound System</h3>
                <p className="text-gray-600 font-inter text-sm">High-quality speakers and equipment sized for your venue and guest count</p>
              </div>
              
              <div className="text-center">
                <Mic2 className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Wireless Microphones</h3>
                <p className="text-gray-600 font-inter text-sm">For toasts, speeches, karaoke, or special announcements</p>
              </div>
              
              <div className="text-center">
                <Sparkles className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Party Lighting</h3>
                <p className="text-gray-600 font-inter text-sm">Colorful dance floor lighting to create the perfect party atmosphere</p>
              </div>
              
              <div className="text-center">
                <Music className="w-16 h-16 bg-gradient-to-br from-brand to-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-sans">Custom Playlist</h3>
                <p className="text-gray-600 font-inter text-sm">Pre-event consultation to create the perfect music mix for your celebration</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Ready to Plan Your Perfect Party?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let's chat about your celebration and create an event that your guests will be talking about for years to come.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <a href="tel:(901)410-2020" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (901) 410-2020
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="mailto:info@m10djcompany.com" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg flex items-center group transition-colors">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Us Today
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Flexible Scheduling</h3>
                  <p className="opacity-80">Day, evening, or weekend parties - we work with your schedule</p>
                </div>
                <div>
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">All Venues Welcome</h3>
                  <p className="opacity-80">Home, park, community center, or private venue - we come to you</p>
                </div>
                <div>
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Any Size Party</h3>
                  <p className="opacity-80">Intimate gatherings of 15 to large celebrations of 150+</p>
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
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-sans">Get Your Private Party Quote</h2>
                <p className="text-lg text-gray-600 font-inter">
                  Tell us about your celebration and we'll create a custom quote just for you.
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