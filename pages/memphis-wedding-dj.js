import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import Link from 'next/link';
import { 
  Music, 
  Heart, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Award,
  CheckCircle,
  Play,
  ChevronRight,
  Clock,
  Sparkles,
  Camera
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import ClientLogoCarousel from '../components/company/ClientLogoCarousel';
import Breadcrumbs, { generateBreadcrumbs } from '../components/Breadcrumbs';
import AuthorByline from '../components/AuthorByline';
import { AIAnswerBlock, AIFactBox, MemphisDJAIBlocks } from '../components/AIOverviewOptimization';
import { generateStructuredData } from '../utils/generateStructuredData';
import { businessInfo } from '../utils/seoConfig';
import { scrollToContact } from '../utils/scroll-helpers';

const weddingServices = [
  {
    icon: Music,
    title: "Professional Wedding DJ",
    description: "Memphis wedding DJs with 15+ years experience – we've DJed 500+ weddings and know what works"
  },
  {
    icon: Users,
    title: "Master of Ceremonies",
    description: "MC services that actually coordinate with your venue and vendors, not just make announcements"
  },
  {
    icon: Calendar,
    title: "Ceremony Music",
    description: "Beautiful processional, recessional, and cocktail hour music for your Memphis wedding"
  },
  {
    icon: Award,
    title: "Premium Sound Systems",
    description: "Crystal-clear audio equipment ensuring every word and song is perfectly heard"
  }
];

const venues = [
  "The Peabody Memphis",
  "Dixon Gallery & Gardens", 
  "Memphis Hunt & Country Club",
  "The Columns",
  "Graceland Wedding Chapel",
  "Memphis Botanic Garden",
  "The Hallmark",
  "Lichterman Nature Center",
  "Memphis Zoo",
  "AutoZone Park"
];

const reviews = [
  {
    name: "Quade Nowlin",
    venue: "The Peabody Memphis",
    text: "Ben was absolutely amazing for our Memphis wedding! From the ceremony to the reception, everything was flawless. The music selection kept everyone on the dance floor, and his MC skills were professional and engaging. Worth every penny!",
    rating: 5
  },
  {
    name: "Alexis Cameron", 
    venue: "Dixon Gallery & Gardens",
    text: "M10 DJ Company exceeded all our expectations! Ben understood our vision perfectly and created the ideal atmosphere for our Memphis wedding. The sound quality was incredible and he kept the energy high all night long.",
    rating: 5
  },
  {
    name: "Chandler Keen",
    venue: "Memphis Hunt & Country Club", 
    text: "We couldn't have asked for a better DJ! Ben was professional, accommodating, and really listened to what we wanted. Our Memphis wedding was perfect thanks to his expertise and attention to detail.",
    rating: 5
  }
];

export default function MemphisWeddingDJ() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Generate consolidated structured data using new system
  const structuredData = generateStructuredData({
    pageType: 'service',
    serviceKey: 'wedding',
    locationKey: 'memphis',
    canonical: '/memphis-wedding-dj',
    title: 'Memphis Wedding DJ | Wedding DJ Memphis | Professional Wedding Entertainment',
        description: 'Memphis wedding DJ service with 15+ years and 500+ weddings. We handle ceremonies, receptions, and MC services at The Peabody, Graceland, Memphis Botanic Garden, and 27+ Memphis venues.'
  });

  // Enhanced LocalBusiness schema optimized for AI search engines (Perplexity, ChatGPT)
  const enhancedLocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.m10djcompany.com/memphis-wedding-dj#localbusiness",
    "name": "M10 DJ Company",
    "alternateName": "M10 DJ",
    "description": "Memphis-based wedding DJ company with 15+ years of experience and 500+ successful Memphis weddings. Professional wedding DJ services covering Memphis, North Mississippi, and Eastern Arkansas. Specializes in ceremony and reception coverage, MC services, and venue coordination at The Peabody, Graceland, Memphis Botanic Garden, and 27+ Memphis venues.",
    "url": "https://www.m10djcompany.com/memphis-wedding-dj",
    "telephone": "+19014102020",
    "email": "info@m10djcompany.com",
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
    "areaServed": [
      {
        "@type": "City",
        "name": "Memphis",
        "containedInPlace": {
          "@type": "State",
          "name": "Tennessee"
        }
      },
      {
        "@type": "State",
        "name": "Mississippi"
      },
      {
        "@type": "State",
        "name": "Arkansas"
      }
    ],
    "serviceType": "Wedding DJ Services",
    "priceRange": "$1,200-$3,500",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": businessInfo.aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "5"
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": review.text,
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": "M10 DJ Company",
        "serviceType": "Wedding DJ Services"
      }
    })),
    "knowsAbout": [
      "Memphis Wedding DJ Services",
      "Wedding Ceremony Music",
      "Wedding Reception Entertainment",
      "MC Services for Weddings",
      "Memphis Wedding Venues",
      "The Peabody Memphis",
      "Graceland Wedding Chapel",
      "Memphis Botanic Garden"
    ],
    "award": "5-Star Google Reviews",
    "founder": {
      "@type": "Person",
      "name": "Ben Murray",
      "jobTitle": "Professional DJ & Entertainment Director"
    },
    "foundingDate": "2009",
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": "1-10"
    }
  };

  // Combine structured data arrays
  const allStructuredData = Array.isArray(structuredData) 
    ? [...structuredData, enhancedLocalBusinessSchema]
    : [structuredData, enhancedLocalBusinessSchema];

  return (
    <>
      <SEO
        title="Memphis Wedding DJ | M10 DJ Company | 500+ Weddings"
        description="Memphis wedding DJ for 500+ celebrations. Professional wedding DJ Memphis for ceremonies & receptions. MC services, premium lighting. Same-day quotes! Call (901) 410-2020!"
        keywords={[
          'memphis wedding dj',
          'wedding dj memphis',
          'wedding djs in memphis',
          'memphis wedding djs',
          'professional wedding DJ Memphis',
          'Memphis wedding entertainment',
          'wedding DJ services Memphis',
          'memphis wedding dj companies',
          'wedding dj companies memphis'
        ]}
        canonical="/memphis-wedding-dj"
        jsonLd={allStructuredData}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    <span className="block text-white">Memphis Wedding DJ</span>
                    <span className="block text-gradient">Professional Wedding Entertainment | 500+ Celebrations</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    <strong>Memphis Wedding DJ - M10 DJ Company</strong> has been DJing Memphis weddings since 2014. We've learned what works at The Peabody's ballroom (where the acoustics need careful mic placement), what songs get Memphis crowds moving at Graceland, and how to handle outdoor ceremonies at Memphis Botanic Garden when the weather turns. After 500+ weddings, we know how to read a room and keep people dancing – whether that's a 50-person intimate celebration or a 300-guest party.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button 
                      onClick={scrollToContact}
                      className="btn-primary text-lg px-8 py-4"
                    >
                      Get Free Wedding Quote
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </button>
                    <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                      <Phone className="mr-2 w-5 h-5" />
                      Call (901) 410-2020
                    </a>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">500+</div>
                      <div className="text-sm text-gray-300">Memphis Weddings</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">10+</div>
                      <div className="text-sm text-gray-300">Years Experience</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">5★</div>
                      <div className="text-sm text-gray-300">Average Rating</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6">Why Choose M10 DJ Company?</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0" />
                        <span>500+ Memphis weddings since 2014 – we know the venues, the vendors, and what works</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0" />
                        <span>MC services that actually help – we coordinate with your venue coordinator, not just announce</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0" />
                        <span>Backup equipment on every job (learned this the hard way at an outdoor wedding in 2018)</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0" />
                        <span>Pricing is upfront – you'll know the total before you book, no surprise fees</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0" />
                        <span>Approved at The Peabody, Graceland, Memphis Botanic Garden, and 24+ other Memphis venues</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Breadcrumb Navigation */}
        <section className="py-6 bg-white">
          <div className="section-container">
            <Breadcrumbs 
              items={generateBreadcrumbs.service('Memphis Wedding DJ')}
            />
            <AuthorByline 
              lastUpdated="December 2025"
              showDate={true}
              className="mt-4"
            />
          </div>
        </section>

        {/* Memphis Wedding DJ Packages - Value-Focused (No Public Pricing) */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Memphis Wedding DJ Packages - Customized for Your Celebration
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Every Memphis wedding is different – some need ceremony audio, some don't. Some want uplighting, others prefer natural light. We build packages around what you actually need, not a one-size-fits-all template. <strong>Get your custom quote in 24 hours.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Essential Package */}
              <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-brand-gold">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Essential Package</h3>
                  <p className="text-gray-600 mb-4">Reception Only</p>
                  <div className="text-lg font-semibold text-brand mb-2">Perfect for Intimate Weddings</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>4 hours</strong> professional DJ/MC services</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Premium sound system & wireless mics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Multi-color LED dance floor lighting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Up to 16 uplighting fixtures (we'll match your wedding colors)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Expert crowd reading & music curation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Online planning portal & consultation</span>
                  </li>
                </ul>
                <button 
                  onClick={scrollToContact}
                  className="w-full btn-secondary py-3"
                >
                  Get Custom Quote
                </button>
              </div>

              {/* Complete Package - Most Popular */}
              <div className="bg-brand text-white rounded-2xl p-8 shadow-2xl transform scale-105 relative border-4 border-brand-gold">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-brand-gold text-black px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ MOST POPULAR ⭐
                  </span>
                </div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Complete Package</h3>
                  <p className="text-white/80 mb-4">Ceremony + Reception</p>
                  <div className="text-lg font-semibold text-brand-gold mb-2">Most Memphis Couples Choose This</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Everything in Essential, PLUS:</strong></span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>5 hours</strong> of complete coverage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span>Professional ceremony audio system</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span>Custom ceremony music programming</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span>Personalized monogram projection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span>Coordinated ceremony-to-reception transition (we handle the equipment move so you don't have to)</span>
                  </li>
                </ul>
                <button 
                  onClick={scrollToContact}
                  className="w-full bg-brand-gold text-black py-3 rounded-lg font-bold hover:bg-brand-gold/90 transition-colors shadow-lg"
                >
                  Request Most Popular Package
                </button>
              </div>

              {/* Premium Package */}
              <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-brand-gold">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Package</h3>
                  <p className="text-gray-600 mb-4">Full Service Luxury</p>
                  <div className="text-lg font-semibold text-brand mb-2">Ultimate Wedding Experience</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Everything in Complete, PLUS:</strong></span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">"Dancing on the Clouds" effect</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Dramatic dry ice first dance cloud</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Cold spark fountain effects available</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Professional photo-ready special effects</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">VIP concierge-level service</span>
                  </li>
                </ul>
                <button 
                  onClick={scrollToContact}
                  className="w-full btn-secondary py-3"
                >
                  Explore Premium Options
                </button>
              </div>
            </div>

            {/* Value Proposition + CTA */}
            <div className="mt-16 bg-gradient-to-br from-brand to-brand-600 rounded-2xl p-8 md:p-12 text-white text-center">
              <h3 className="text-3xl font-bold mb-4">Why Memphis Couples Choose M10 DJ Company</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-4xl font-bold text-brand-gold mb-2">500+</div>
                  <p className="text-white/90">Successful Memphis Weddings</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-brand-gold mb-2">5.0 ⭐</div>
                  <p className="text-white/90">Average Rating from Real Couples</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-brand-gold mb-2">27+</div>
                  <p className="text-white/90">Premier Memphis Venue Partnerships</p>
                </div>
              </div>
              <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
                <strong>All packages include:</strong> DJ/MC services, sound system, wireless mics, backup equipment, liability insurance, online planning portal, and unlimited music requests. <strong>No hidden fees – the price we quote is what you pay.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-brand-gold text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-gold/90 transition-colors inline-flex items-center shadow-xl"
                >
                  Get Your Custom Quote
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <a 
                  href="tel:9014102020"
                  className="bg-white text-brand px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center shadow-xl"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  (901) 410-2020
                </a>
              </div>
              <p className="mt-6 text-sm text-white/80">
                📅 Same-day quotes available | 💬 Free consultation | 🎵 Custom playlist planning
              </p>
            </div>

            {/* Market Education - SEO Gold */}
            <div className="mt-16 bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Understanding Memphis Wedding DJ Pricing</h3>
              <p className="text-gray-700 mb-6 text-center max-w-3xl mx-auto">
                Professional Memphis wedding DJ services typically range from <strong>$1,200-$3,500+</strong> depending on experience, equipment quality, and services included. <strong>Most Memphis couples invest $1,800-$2,500</strong> for complete ceremony and reception coverage with a professional DJ. Here's what affects pricing:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Event Duration</h4>
                  <p className="text-sm text-gray-600">4-8 hours typical, ceremony adds 1-2 hours</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-black" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Experience Level</h4>
                  <p className="text-sm text-gray-600">15+ years & 500+ weddings = premium value</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music className="w-6 h-6 text-black" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Equipment Quality</h4>
                  <p className="text-sm text-gray-600">Professional sound, lighting & backup systems</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-black" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Venue Expertise</h4>
                  <p className="text-sm text-gray-600">Knowledge of Memphis venues saves time & stress</p>
                </div>
              </div>
              <div className="text-center mt-8">
                <p className="text-gray-700 mb-4">
                  <strong>M10 DJ Company</strong> offers professional Memphis wedding DJ services with transparent, all-inclusive quotes and no hidden fees. Our pricing reflects 15+ years of experience, 500+ successful weddings, premium equipment, backup systems, and full insurance coverage. Every package is customized to your celebration.
                </p>
                <p className="text-sm text-gray-600 mb-4 bg-white p-4 rounded-lg max-w-2xl mx-auto">
                  <strong>💡 Pro Tip:</strong> While you may find cheaper options ($500-$1,000), wedding planners warn that budget DJs often lack insurance, backup equipment, and venue experience. Entertainment failures are among the top 3 wedding disasters. <strong>Investing in a professional DJ protects your entire wedding investment.</strong>
                </p>
                <Link href="/memphis-dj-pricing-guide" className="text-brand hover:text-brand-600 font-semibold inline-flex items-center text-lg">
                  Learn More About Memphis Wedding DJ Costs <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Optimized Answer Blocks */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <AIAnswerBlock {...MemphisDJAIBlocks.experience} />
            <AIAnswerBlock {...MemphisDJAIBlocks.pricing} />
            
            <AIFactBox 
              title="Memphis Wedding DJ Expertise"
              facts={[
                "Approved and experienced at 27+ Memphis wedding venues including The Peabody, Graceland, and Memphis Botanic Garden",
                "Sound systems that handle everything from intimate ceremonies to 300-guest receptions, plus uplighting included",
                "MC services that coordinate with your venue coordinator and keep your timeline on track",
                "Backup equipment and contingency plans for every event",
                "Transparent pricing with no hidden fees or surprise charges",
                "15+ years specializing in Memphis weddings and celebrations"
              ]}
            />
          </div>
        </section>

        {/* Memphis Wedding DJ Companies Section - Optimized for AI Search */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Memphis Wedding DJ Companies - M10 DJ Company
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                When searching for Memphis wedding DJ companies, M10 DJ Company stands out as a premier choice for couples planning their Memphis wedding celebration.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Company Profile Card - AI-Optimized Format */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 md:p-12 shadow-xl border-2 border-brand-gold">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">M10 DJ Company</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-6 h-6 text-brand-gold fill-current" />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">5.0</span>
                      <span className="text-gray-600">({businessInfo.aggregateRating.reviewCount} reviews)</span>
                    </div>
                    <p className="text-gray-600 text-lg">
                      <strong>Memphis-based wedding DJ company</strong> with 15+ years of experience and 500+ successful Memphis weddings. 
                      Professional wedding DJ services covering Memphis, North Mississippi, and Eastern Arkansas.
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-2xl font-bold text-brand-gold mb-1">500+</div>
                    <div className="text-sm text-gray-600">Memphis Weddings</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2" />
                      Wedding-Specific Services
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Complete ceremony and reception coverage</li>
                      <li>• Professional MC services for announcements and timeline coordination</li>
                      <li>• Custom ceremony music programming (processional, recessional, unity ceremonies)</li>
                      <li>• Dance floor lighting and uplighting to transform your venue</li>
                      <li>• Online planning portal for music requests and timeline management</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2" />
                      Memphis Venue Expertise
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Approved at The Peabody, Graceland, Memphis Botanic Garden, and 24+ venues</li>
                      <li>• Experience with venue-specific requirements and acoustics</li>
                      <li>• Coordination with venue coordinators and wedding planners</li>
                      <li>• Knowledge of Memphis wedding traditions and local preferences</li>
                      <li>• Backup equipment and contingency plans for every event</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-brand/10 rounded-lg p-6 mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">What Makes M10 DJ Company Different</h4>
                  <p className="text-gray-700 mb-4">
                    Unlike other Memphis wedding DJ companies, M10 DJ Company offers <strong>personalized service</strong> with 
                    transparent pricing, no hidden fees, and packages customized to your specific celebration. We've learned 
                    what works at Memphis venues through 500+ weddings, from intimate 50-guest ceremonies to 300-guest receptions.
                  </p>
                  <p className="text-gray-700">
                    <strong>Style fit:</strong> We specialize in reading the room and mixing tracks live to keep all ages dancing. 
                    Whether you want throwback hip-hop, country, top 40, or a sophisticated mix, we curate music that matches your vision.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={scrollToContact}
                    className="btn-primary text-lg px-8 py-4 flex-1"
                  >
                    Request Quote & Check Availability
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                  <a 
                    href="tel:9014102020"
                    className="btn-outline text-lg px-8 py-4 flex-1 text-center"
                  >
                    <Phone className="mr-2 w-5 h-5 inline" />
                    (901) 410-2020
                  </a>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    <strong>Pricing transparency:</strong> Request a written quote covering setup, breakdown, overtime, and travel. 
                    All packages include professional equipment, backup systems, liability insurance, and unlimited music requests.
                  </p>
                </div>
              </div>

              {/* Comparison Note */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                <h4 className="font-bold text-gray-900 mb-2">Choosing Among Memphis Wedding DJ Companies</h4>
                <p className="text-gray-700 text-sm mb-3">
                  When comparing Memphis wedding DJ companies, check:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ <strong>Date availability</strong> and whether they include MC duties, ceremony audio, and lighting</li>
                  <li>✓ <strong>Style fit:</strong> Ask for sample mixes or videos from recent weddings at similar venues</li>
                  <li>✓ <strong>Pricing transparency:</strong> Request a written quote that covers setup, breakdown, overtime, and travel</li>
                  <li>✓ <strong>Experience level:</strong> Look for DJs with proven track records at Memphis venues</li>
                  <li>✓ <strong>Equipment quality:</strong> Professional sound systems, backup equipment, and liability insurance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Wedding DJ Services Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Complete Memphis Wedding DJ Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From your ceremony processional to the last dance, we provide comprehensive 
                wedding DJ services that keep your Memphis wedding on track and your guests dancing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {weddingServices.map((service, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                    <service.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Memphis Wedding Venues Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Trusted at Memphis Wedding Venues
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're the preferred wedding DJ service at Memphis's most beautiful venues. 
                Our team knows the unique requirements of each location.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {venues.map((venue, index) => (
                <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-800 font-medium text-sm">{venue}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/venues" className="btn-secondary">
                View All Partner Venues
              </Link>
            </div>
          </div>
        </section>

        {/* Memphis Wedding DJ Team Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Best Wedding DJs in Memphis TN - Professional Team Approach
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Looking for the best wedding DJs in Memphis? Our professional team of experienced Memphis wedding DJs 
                includes backup DJs and specialized entertainers so your wedding runs smoothly even if something unexpected happens, 
                no matter the size or complexity. We're Memphis's most trusted wedding DJ company with 500+ successful celebrations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Lead DJ + Backup</h3>
                <p className="text-gray-600">Primary DJ with backup DJ available for large weddings and peace of mind</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">15+ Years Experience</h3>
                <p className="text-gray-600">Each Memphis wedding DJ brings extensive experience and professional training</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Team Approach</h3>
                <p className="text-gray-600">Multiple DJs available for large venues, destination weddings, and extended coverage</p>
              </div>
            </div>
          </div>
        </section>

        {/* DJs Near Me Memphis Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                DJs Near Me Memphis TN | Professional DJ Services Throughout Memphis
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Looking for DJs near me in Memphis? M10 DJ Company serves all Memphis neighborhoods including Downtown Memphis, Midtown Memphis, East Memphis, South Memphis, and North Memphis. We're Memphis's most experienced DJ company with 15+ years serving the Memphis community and 500+ successful events.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Downtown Memphis DJs</h3>
                <p className="text-gray-600 mb-4">Professional DJ services for Downtown Memphis weddings and events at The Peabody Hotel, Memphis Cook Convention Center, and historic venues.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• The Peabody Hotel weddings</li>
                  <li>• Convention Center events</li>
                  <li>• Historic venue expertise</li>
                  <li>• Downtown Memphis parking knowledge</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">East Memphis DJs</h3>
                <p className="text-gray-600 mb-4">Experienced DJs for East Memphis venues including Memphis Country Club, The Racquet Club, and upscale residential events.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Memphis Country Club</li>
                  <li>• The Racquet Club events</li>
                  <li>• Upscale residential parties</li>
                  <li>• Poplar Corridor venues</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Midtown Memphis DJs</h3>
                <p className="text-gray-600 mb-4">Creative DJ services for Midtown Memphis's vibrant venues including Memphis Botanic Garden, Dixon Gallery, and cultural events.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Memphis Botanic Garden</li>
                  <li>• Dixon Gallery & Gardens</li>
                  <li>• Cultural event expertise</li>
                  <li>• Midtown venue knowledge</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-600 mb-6">
                <strong>Memphis DJs Near Me:</strong> We serve all Memphis zip codes including 38103, 38104, 38105, 38106, 38107, 38108, 38109, 38111, 38112, 38114, 38115, 38116, 38117, 38118, 38119, 38120, 38122, 38125, 38126, 38127, 38128, 38133, 38134, 38135, 38141, and 38152.
              </p>
              <button 
                onClick={scrollToContact}
                className="btn-primary text-lg px-8 py-4"
              >
                Find DJs Near Me in Memphis
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Memphis Wedding DJ Reviews */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                What Memphis Couples Say About Our Wedding DJ Service
              </h2>
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-brand-gold fill-current" />
                  ))}
                </div>
                <span className="ml-3 text-gray-600 font-medium">5.0 out of 5 stars from 200+ Memphis weddings</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-brand-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{review.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    <p className="text-gray-600 text-sm">{review.venue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wedding Add-Ons & Enhancements */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Enhance Your Memphis Wedding with Premium Add-Ons
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Take your celebration to the next level with professional uplighting, photo booths, and special effects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              <Link href="/dj-uplighting-memphis" className="modern-card group hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Uplighting</h3>
                <p className="text-gray-600 mb-4">Transform your venue with elegant LED uplighting that matches your wedding colors. Packages from $200.</p>
                <span className="text-brand font-semibold inline-flex items-center group-hover:gap-2 gap-1 transition-all">
                  Learn More <ChevronRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/photo-booth-rental-memphis" className="modern-card group hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Photo Booth Rental</h3>
                <p className="text-gray-600 mb-4">Keep guests entertained with professional photo booth rental. Instant prints and digital gallery. Packages from $500.</p>
                <span className="text-brand font-semibold inline-flex items-center group-hover:gap-2 gap-1 transition-all">
                  Learn More <ChevronRight className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/cold-sparks-memphis" className="modern-card group hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-600 text-white rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cold Spark Machines</h3>
                <p className="text-gray-600 mb-4">Dramatic indoor-safe spark effects for grand entrances and special moments. Packages from $500.</p>
                <span className="text-brand font-semibold inline-flex items-center group-hover:gap-2 gap-1 transition-all">
                  Learn More <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            <div className="text-center">
              <Link href="/wedding-dj-packages-memphis" className="btn-secondary text-lg px-8 py-4">
                View Complete Wedding Packages
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Memphis Wedding DJ Pricing Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 text-gray-900 mb-6">
                Transparent Memphis Wedding DJ Pricing
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                No hidden fees or surprise charges. Our Memphis wedding DJ packages 
                include everything you need for your special day.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-brand-gold text-4xl font-bold mb-2">$295</div>
                  <div className="text-gray-600 mb-4">Starting Price</div>
                  <div className="text-sm text-gray-500">4-hour reception package</div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-brand-gold">
                  <div className="text-brand-gold text-4xl font-bold mb-2">$595</div>
                  <div className="text-gray-600 mb-4">Most Popular</div>
                  <div className="text-sm text-gray-500">Ceremony + 6-hour reception</div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-brand-gold text-4xl font-bold mb-2">$795</div>
                  <div className="text-gray-600 mb-4">Premium Package</div>
                  <div className="text-sm text-gray-500">Full day with lighting</div>
                </div>
              </div>

              <Link href="/services" className="btn-primary text-lg">
                View Detailed Wedding DJ Packages
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section for Memphis Wedding DJ */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-gray-900 text-center mb-16">
                Memphis Wedding DJ Frequently Asked Questions
              </h2>
              
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    How far in advance should I book a Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600">
                    We recommend booking your Memphis wedding DJ 6-12 months in advance, especially for popular 
                    wedding dates like Saturday evenings and peak wedding season (May-October). This ensures 
                    you get your preferred DJ and have time for detailed planning.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Do you provide ceremony music for Memphis weddings?
                  </h3>
                  <p className="text-gray-600">
                    Yes! Our Memphis wedding DJ packages include ceremony music with professional sound systems, 
                    wireless microphones for your officiant and vows, and coordination of processional and 
                    recessional music timing.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What Memphis wedding venues do you work with?
                  </h3>
                  <p className="text-gray-600">
                    We're approved and experienced at all major Memphis wedding venues including The Peabody, 
                    Dixon Gallery & Gardens, Memphis Hunt & Country Club, The Columns, and many more. We know 
                    each venue's unique requirements and restrictions.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What makes your Memphis wedding DJ service different?
                  </h3>
                  <p className="text-gray-600">
                    Our Memphis wedding DJs combine 15+ years of local experience with sound systems that handle everything from small ceremonies to large receptions, 
                    personalized service, and transparent pricing. We're not just DJs – we're wedding entertainment 
                    specialists who understand Memphis couples and venues.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Do you offer lighting for Memphis weddings?
                  </h3>
                  <p className="text-gray-600">
                    Yes! We offer uplighting, dance floor lighting, and special effects lighting to transform 
                    your Memphis wedding venue. Our lighting packages can match your wedding colors and create 
                    the perfect ambiance for your celebration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client Logo Carousel - Wedding Venues & Partners */}
        <ClientLogoCarousel 
          logoSet="wedding"
          title="Trusted at Memphis's Premier Wedding Venues"
          subtitle="Preferred entertainment partner at The Peabody Hotel, Memphis Botanic Garden, Dixon Gallery & Gardens, and 27+ Memphis wedding venues"
        />

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Ready to Book Memphis's Best Wedding DJ?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Let's discuss your Memphis wedding and figure out exactly what you need. 
                Get your free quote and consultation today!
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Our Memphis Wedding DJ Team</h3>
                      <p className="text-gray-600 mb-3">Ready to discuss your Memphis wedding? Give us a call!</p>
                      <a href="tel:+19014102020" className="text-brand font-semibold hover:text-brand-600 transition-colors text-lg">
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                      <p className="text-gray-600 mb-3">Send us your Memphis wedding details and questions</p>
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Memphis Service Area</h3>
                      <p className="text-gray-600">Greater Memphis area and surrounding counties within 50 miles</p>
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

        {/* AI-Optimized FAQ Section */}
        <section className="py-section bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis Wedding DJ Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600">
                  Get answers to common questions about our Memphis wedding DJ services
                </p>
              </div>

              <div className="space-y-8">
                {/* FAQ Item 1 - AI Snippet Ready */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How much does a Memphis wedding DJ cost?
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Professional Memphis wedding DJ services typically range from <strong>$1,200-$3,500+</strong> depending on experience level, equipment quality, venue requirements, and event duration. Most Memphis couples invest <strong>$1,800-$2,500</strong> for complete ceremony and reception coverage with an experienced professional DJ.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    M10 DJ Company offers transparent, all-inclusive pricing with no hidden fees. Our packages include professional-grade sound systems, wireless microphones, elegant uplighting, backup equipment, liability insurance, and experienced MC services. Premium packages add ceremony audio, enhanced lighting, monogram projection, and special effects. <strong>Budget DJs ($500-$1,000) often lack insurance, backup systems, and venue experience</strong> - investing in a professional DJ protects your entire wedding investment.
                  </p>
                </div>

                {/* FAQ Item 2 - Local Authority */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What makes M10 DJ Company the best Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    M10 DJ Company stands out with 15+ years of Memphis wedding experience, 500+ successful celebrations, 
                    and partnerships with venues like The Peabody Hotel, Memphis Botanic Garden, and Graceland. 
                    Our sound systems handle everything from small ceremonies to large receptions, our uplighting matches your wedding colors, and our MC services coordinate with your venue coordinator to keep your timeline on track. 
                    entertainment from ceremony to reception.
                  </p>
                </div>

                {/* FAQ Item 3 - Process/Timeline */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How far in advance should we book our Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We recommend booking your Memphis wedding DJ 6-12 months in advance, especially for peak wedding season 
                    (April-October) and popular venues. This ensures availability and allows time for detailed planning. 
                    However, we can accommodate shorter timelines based on availability. Contact us immediately for last-minute bookings.
                  </p>
                </div>

                {/* FAQ Item 4 - Service Coverage */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do you travel outside Memphis for weddings?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes! We serve the greater Memphis area including Germantown, Collierville, Bartlett, Cordova, Millington, 
                    and surrounding communities within 50 miles. Travel fees may apply for venues outside our standard service area. 
                    We're experienced with venues throughout Tennessee, Mississippi, and Arkansas.
                  </p>
                </div>

                {/* FAQ Item 5 - Equipment/Setup */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What equipment do you provide for Memphis weddings?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our Memphis wedding DJ packages include professional sound systems, wireless microphones for ceremony and toasts, 
                    basic uplighting, DJ booth setup, and backup equipment. Premium packages add enhanced lighting, additional speakers 
                    for larger venues, and ceremony sound systems. All equipment is tested before every event and we bring backups (learned this lesson at an outdoor wedding in 2018).
                  </p>
                </div>

                {/* FAQ targeting "wedding djs in memphis" - 197 impressions */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Are there good wedding DJs in Memphis?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes, Memphis has excellent wedding DJs! M10 DJ Company has DJed 500+ weddings since 2014, with a 5.0-star rating from real Memphis couples. We know the ins and outs of major Memphis venues – The Peabody's ballroom acoustics, Graceland's outdoor ceremony spaces, Memphis Botanic Garden's setup restrictions. We bring equipment that works in these spaces, MC services that coordinate with venue staff, and music selection that gets Memphis crowds dancing.
                  </p>
                </div>

                {/* FAQ targeting "djs near me" - 152 impressions */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Where can I find DJs near me in Memphis?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    M10 DJ Company serves all Memphis neighborhoods including Downtown Memphis, Midtown Memphis, East Memphis, South Memphis, Germantown, Collierville, Bartlett, and Cordova within 25 miles. We're locally based and know every Memphis venue, neighborhood, and wedding location. Call (901) 410-2020 for same-day quotes or visit m10djcompany.com to request a free consultation and check availability for your date.
                  </p>
                </div>

                {/* FAQ targeting "wedding dj memphis" - 130 impressions */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What should I look for in a Memphis wedding DJ?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Look for a Memphis wedding DJ with actual local venue experience (ask which venues they've worked at), equipment with backup systems (ask what happens if something breaks), MC expertise (not just someone who makes announcements), transparent pricing (get the total in writing), proper insurance and licensing, reviews from real Memphis couples, and a planning process that actually helps. M10 DJ Company offers all of these – 500+ Memphis weddings, approved at 27+ venues, and a 5.0-star rating from couples who've actually used us.
                  </p>
                </div>

                {/* FAQ for venue expertise */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What Memphis wedding venues does M10 DJ Company work with?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We're approved and experienced at all major Memphis wedding venues including The Peabody Hotel, Dixon Gallery & Gardens, Memphis Hunt & Country Club, The Columns, Graceland Wedding Chapel, Memphis Botanic Garden, The Hallmark, Lichterman Nature Center, Historic Elmwood Cemetery, AutoZone Park, Memphis Zoo, Annesdale Mansion, and 15+ additional premier Memphis locations. We know each venue's unique acoustic requirements, setup restrictions, and preferred vendor relationships.
                  </p>
                </div>

                {/* FAQ for ceremony services */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do Memphis wedding DJs provide ceremony music?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes! Professional Memphis wedding DJs provide complete ceremony music services. M10 DJ Company includes ceremony sound systems, wireless microphones for your officiant and vows, processional and recessional music coordination, and cocktail hour entertainment in our wedding packages. We'll work with you to select meaningful ceremony music and ensure perfect audio quality for your Memphis wedding ceremony.
                  </p>
                </div>

                {/* FAQ for lighting services */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do wedding DJs in Memphis include lighting?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Many Memphis wedding DJs include basic lighting, and M10 DJ Company includes uplighting in all wedding packages at no extra charge. Our uplighting matches your wedding colors (we'll coordinate with your florist or planner). Premium packages add enhanced dance floor lighting, monogram projection, and special effects lighting. We design lighting that works with your venue's layout – we know which rooms need more fixtures and which ones have tricky corners.
                  </p>
                </div>

                {/* FAQ for MC services */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do Memphis wedding DJs provide MC services?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes, professional Memphis wedding DJs provide MC (Master of Ceremonies) services. M10 DJ Company includes MC services in all packages – we coordinate with your venue coordinator (not just make announcements), keep your timeline on track, introduce the wedding party, facilitate special dances, and handle transitions. We've learned that good MC work means talking to your coordinator before the event, knowing when to speed things up or slow them down, and reading the room to keep energy where it needs to be.
                  </p>
                </div>

                {/* FAQ for music customization */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Can Memphis wedding DJs play specific songs and take requests?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes! Professional Memphis wedding DJs play specific songs and take guest requests. M10 DJ Company works with you to create a custom playlist including must-play songs for special moments (first dance, parent dances, cake cutting), do-not-play lists, and takes appropriate guest requests during your reception while maintaining your preferred music style, energy level, and atmosphere. Our extensive music library covers all genres and decades for your Memphis wedding.
                  </p>
                </div>

                {/* FAQ for package inclusions */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    What's included in Memphis wedding DJ packages?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    M10 DJ Company's Memphis wedding DJ packages include professional DJ for 4-8 hours, premium sound system for ceremony and reception, wireless microphones for toasts and vows, MC services for timeline coordination, elegant uplighting matching your wedding colors, online planning portal, unlimited music requests, backup equipment, liability insurance, and detailed coordination meeting. All packages have transparent pricing with no hidden fees or surprise charges.
                  </p>
                </div>

                {/* FAQ for backup/reliability */}
                <div className="bg-white rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Do Memphis wedding DJs have backup equipment?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Professional Memphis wedding DJs always have backup equipment. M10 DJ Company brings redundant sound systems, backup mixers, extra microphones, and duplicate music libraries to every Memphis wedding. We're fully insured and have contingency plans to ensure your wedding entertainment is flawless regardless of any technical issues. Your celebration is too important to risk with DJs who don't have professional backup systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />






    </>
  );
}