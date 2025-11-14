import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Calendar,
  User,
  Clock,
  DollarSign,
  Music,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Star,
  Award,
  ChevronRight,
  Heart,
  Lightbulb,
  Volume2,
  Mic
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const pricingFactors = [
  {
    icon: Clock,
    title: "Event Duration",
    description: "4-hour, 6-hour, or full-day packages",
    impact: "Most significant pricing factor"
  },
  {
    icon: Users,
    title: "Guest Count",
    description: "Determines sound system requirements",
    impact: "Equipment scaling affects costs"
  },
  {
    icon: MapPin,
    title: "Venue Location",
    description: "Travel distance from Memphis",
    impact: "Travel fees may apply"
  },
  {
    icon: Music,
    title: "Services Included",
    description: "DJ, MC, ceremony, lighting, etc.",
    impact: "Each service adds value"
  }
];

const packageComparison = [
  {
    name: "Ceremony Audio",
    duration: "2-3 Hours",
    ideal: "Ceremony only (50-150 guests)",
    includes: [
      "Professional sound system",
      "Wireless microphones",
      "Ceremony music",
      "Professional setup",
      "Sound technician",
      "Equipment breakdown"
    ],
    popular: false
  },
  {
    name: "Standard Wedding Package", 
    duration: "6 Hours",
    ideal: "Most Memphis weddings (75-150 guests)",
    includes: [
      "Professional DJ & MC",
      "Premium sound system",
      "Wireless microphones",
      "Dance floor lighting",
      "Music consultation",
      "Timeline coordination",
      "Setup & breakdown"
    ],
    popular: true
  },
  {
    name: "Enhanced Wedding Package",
    duration: "7 Hours",
    ideal: "Enhanced weddings (100-200 guests)",
    includes: [
      "Everything in Standard Package",
      "Extended coverage",
      "Enhanced lighting package",
      "Additional equipment",
      "Ceremony sound system",
      "Cocktail hour music",
      "Premium coordination"
    ],
    popular: false
  },
  {
    name: "Premium Wedding Package",
    duration: "8 Hours", 
    ideal: "Premium weddings (150+ guests)",
    includes: [
      "Everything in Enhanced Package",
      "Uplighting package",
      "Extended reception coverage",
      "Premium sound system",
      "Dedicated coordinator",
      "Emergency backup systems",
      "Post-event consultation"
    ],
    popular: false
  }
];

const venues = [
  { name: "The Peabody Memphis", notes: "Premium venue - Enhanced or Premium packages recommended" },
  { name: "Dixon Gallery & Gardens", notes: "Standard or Enhanced packages, ceremony sound available separately" },
  { name: "Memphis Hunt & Country Club", notes: "Preferred vendor rates available" },
  { name: "The Columns", notes: "Standard or Enhanced packages recommended" },
  { name: "Memphis Botanic Garden", notes: "Weather backup equipment recommended" },
  { name: "Graceland Wedding Chapel", notes: "Ceremony-only to full wedding packages available" }
];

const additionalServices = [
  { service: "Ceremony Music", description: "Professional ceremony sound system with wireless microphones" },
  { service: "Cocktail Hour DJ", description: "Separate cocktail area coverage for seamless transitions" },
  { service: "Uplighting Package", description: "8-12 LED lights in your wedding colors to transform your venue" },
  { service: "Photo Booth Integration", description: "Music coordination with photo booth for enhanced guest experience" },
  { service: "Late Night Snack Music", description: "Extended party atmosphere for late-night celebrations" },
  { service: "Brunch/Day-After Party", description: "Next-day celebration DJ for post-wedding events" }
];

export default function MemphisWeddingDJPrices2025() {
  const [activeTab, setActiveTab] = useState('packages');

  return (
    <>
      <Head>
        <title>Memphis Wedding DJ Prices 2025: Complete Pricing Guide | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Complete guide to Memphis wedding DJ services in 2025. Learn about package options, pricing factors, and what to expect when hiring a professional wedding DJ in Memphis." 
        />
        <meta name="keywords" content="Memphis wedding DJ prices, wedding DJ cost Memphis, Memphis DJ pricing 2025, how much does a wedding DJ cost Memphis, Memphis wedding DJ packages, affordable wedding DJ Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/memphis-wedding-dj-prices-2025" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis Wedding DJ Prices 2025: Complete Pricing Guide" />
        <meta property="og:description" content="Comprehensive guide to Memphis wedding DJ services for 2025. Learn about packages, services, and what to consider when planning your wedding entertainment." />
        <meta property="og:url" content="https://m10djcompany.com/memphis-wedding-dj-prices-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="article:published_time" content="2025-01-01" />
        <meta property="article:modified_time" content="2025-01-01" />
        <meta property="article:author" content="M10 DJ Company" />
        <meta property="article:section" content="Wedding Planning" />
        <meta property="article:tag" content="Memphis Wedding DJ" />
        <meta property="article:tag" content="Wedding Pricing" />
        <meta property="article:tag" content="Memphis Weddings" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Memphis Wedding DJ Prices 2025: Complete Pricing Guide" />
        <meta name="twitter:description" content="Comprehensive guide to Memphis wedding DJ services for 2025. Learn about packages, services, and what to consider when planning your wedding entertainment." />
        <meta name="twitter:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />
      </Head>

      <Header />

      <main>
        {/* Article Header */}
        <section className="py-24 bg-white pt-32">
          <div className="section-container max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
              <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-brand-gold transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-gray-900">Memphis Wedding DJ Prices 2025</span>
            </nav>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="bg-brand-gold text-black px-3 py-1 rounded-full text-sm font-medium">
                Wedding Planning
              </span>
              
              <div className="flex items-center text-gray-600 text-sm">
                <User className="w-4 h-4 mr-1" />
                M10 DJ Company Team
              </div>
              
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                January 1, 2025
              </div>
              
              <div className="flex items-center text-gray-600 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                12 min read
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Memphis Wedding DJ Prices 2025: Complete Pricing Guide
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Planning a Memphis wedding and wondering about DJ services? This comprehensive guide covers 
              everything you need to know about Memphis wedding DJ services for 2025, helping you understand 
              your options and make informed decisions for your celebration.
            </p>

            {/* Key Points */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What to Know About Memphis Wedding DJ Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Multiple Package Options</div>
                    <div className="text-sm text-gray-600">From ceremony-only to full wedding packages</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Transparent Pricing</div>
                    <div className="text-sm text-gray-600">No hidden fees or surprise charges</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Customizable Services</div>
                    <div className="text-sm text-gray-600">Add-ons available to enhance your celebration</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Venue Expertise</div>
                    <div className="text-sm text-gray-600">Preferred vendor at top Memphis venues</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-8 bg-gray-50">
          <div className="section-container max-w-4xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What's in This Guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li><a href="#average-costs" className="text-brand hover:text-brand-600 transition-colors">• Understanding DJ Services</a></li>
                  <li><a href="#pricing-factors" className="text-brand hover:text-brand-600 transition-colors">• What Affects Pricing</a></li>
                  <li><a href="#package-comparison" className="text-brand hover:text-brand-600 transition-colors">• Package Comparisons</a></li>
                </ul>
                <ul className="space-y-2">
                  <li><a href="#venue-pricing" className="text-brand hover:text-brand-600 transition-colors">• Venue-Specific Guide</a></li>
                  <li><a href="#additional-services" className="text-brand hover:text-brand-600 transition-colors">• Add-On Services</a></li>
                  <li><a href="#budgeting-tips" className="text-brand hover:text-brand-600 transition-colors">• Budgeting Tips</a></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Understanding Wedding DJ Services Section */}
        <section id="average-costs" className="py-16 bg-white">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Understanding Memphis Wedding DJ Services in 2025</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Planning your Memphis wedding involves many decisions, and choosing the right DJ service is crucial for 
              creating the perfect atmosphere. Understanding what's included in different packages and how various factors 
              affect your options will help you make the best choice for your celebration.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-semibold text-blue-800">What Professional DJ Services Include</span>
              </div>
              <p className="text-blue-700">
                Professional Memphis wedding DJ services typically include experienced DJ and MC services, premium sound 
                equipment, wireless microphones, basic lighting, music consultation, timeline coordination, and professional 
                setup and breakdown. The exact package depends on your wedding size, duration, and specific needs.
              </p>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Package Options by Wedding Size</h3>
            
            <div className="space-y-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Ceremony-Only Services</h4>
                <p className="text-gray-700 mb-2">
                  <strong>Ideal for:</strong> 25-150 guests, ceremony-only events
                </p>
                <p className="text-gray-600">
                  Perfect for couples who want professional sound for their ceremony but are handling reception music 
                  separately. Includes sound system, wireless microphones, and ceremony music coordination.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Standard Wedding Packages</h4>
                <p className="text-gray-700 mb-2">
                  <strong>Ideal for:</strong> 75-150 guests, 6-hour coverage
                </p>
                <p className="text-gray-600">
                  The most popular choice for Memphis weddings. Includes full DJ and MC services, premium sound system, 
                  dance floor lighting, music consultation, and timeline coordination. Perfect for most traditional wedding receptions.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Enhanced Wedding Packages</h4>
                <p className="text-gray-700 mb-2">
                  <strong>Ideal for:</strong> 100-200 guests, 7-hour coverage
                </p>
                <p className="text-gray-600">
                  Builds on the standard package with extended coverage, enhanced lighting, ceremony sound system, 
                  cocktail hour music, and premium coordination services. Great for larger celebrations.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Premium Wedding Packages</h4>
                <p className="text-gray-700 mb-2">
                  <strong>Ideal for:</strong> 150+ guests, 8+ hour coverage
                </p>
                <p className="text-gray-600">
                  The ultimate wedding entertainment experience. Includes everything in enhanced packages plus uplighting, 
                  premium sound systems, dedicated coordinator, backup equipment, and post-event consultation. Perfect for 
                  large, elaborate celebrations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Factors Section */}
        <section id="pricing-factors" className="py-16 bg-gray-50">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">What Affects Memphis Wedding DJ Pricing?</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Understanding these key factors will help you budget appropriately and make informed decisions 
              about your Memphis wedding DJ services:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {pricingFactors.map((factor, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center flex-shrink-0">
                      <factor.icon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{factor.title}</h3>
                      <p className="text-gray-600 mb-3">{factor.description}</p>
                      <p className="text-sm text-brand font-medium">{factor.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <div className="flex items-center mb-2">
                <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="font-semibold text-yellow-800">Money-Saving Tip</span>
              </div>
              <p className="text-yellow-700">
                Book your Memphis wedding DJ during off-peak months (January-March, November-December) for potential 
                savings of 10-15%. Weekday weddings also typically cost less than Saturday evening events.
              </p>
            </div>
          </div>
        </section>

        {/* Package Comparison Section */}
        <section id="package-comparison" className="py-16 bg-white">
          <div className="section-container max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Memphis Wedding DJ Package Comparison</h2>
            
            <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
              Explore our comprehensive package options designed specifically for Memphis weddings. 
              Each package is tailored to different wedding sizes and needs, ensuring you get exactly 
              what you need for your special day.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
              {packageComparison.map((pkg, index) => (
                <div key={index} className={`rounded-xl p-8 ${pkg.popular ? 'bg-brand text-white ring-4 ring-brand-gold shadow-xl' : 'bg-white border-2 border-gray-200'} relative`}>
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-brand-gold text-black px-4 py-1 rounded-full text-sm font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${pkg.popular ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h3>
                    <div className={`text-sm mb-1 ${pkg.popular ? 'text-white/80' : 'text-gray-600'}`}>{pkg.duration}</div>
                    <div className={`text-sm ${pkg.popular ? 'text-white/80' : 'text-gray-600'}`}>{pkg.ideal}</div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.includes.map((item, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${pkg.popular ? 'text-brand-gold' : 'text-green-500'}`} />
                        <span className={`text-sm ${pkg.popular ? 'text-white' : 'text-gray-700'}`}>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={scrollToContact}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      pkg.popular 
                        ? 'bg-brand-gold text-black hover:bg-yellow-400' 
                        : 'bg-brand text-white hover:bg-brand-600'
                    }`}
                  >
                    Get This Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Venue-Specific Pricing */}
        <section id="venue-pricing" className="py-16 bg-gray-50">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Memphis Wedding Venue Guide</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Different Memphis wedding venues have unique requirements and characteristics. Here's what 
              to know about popular Memphis venues and their DJ service needs:
            </p>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900">Venue</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900">Package Recommendations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {venues.map((venue, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{venue.name}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{venue.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-6">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 text-green-400 mr-2" />
                <span className="font-semibold text-green-800">Preferred Vendor Advantage</span>
              </div>
              <p className="text-green-700">
                M10 DJ Company is a preferred vendor at most major Memphis wedding venues, which means we know 
                each location's specific requirements and often offer better rates due to our established relationships.
              </p>
            </div>
          </div>
        </section>

        {/* Additional Services */}
        <section id="additional-services" className="py-16 bg-white">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Additional Memphis Wedding DJ Services</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Enhance your Memphis wedding with these popular add-on services. Each service is professionally 
              executed and seamlessly integrated with your main DJ package:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {additionalServices.map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.service}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-semibold text-blue-800">Package Bundling</span>
              </div>
              <p className="text-blue-700">
                Bundling additional services with your main DJ package often provides better value. Many couples 
                find that combining services offers convenience and cost savings compared to booking individual add-ons.
              </p>
            </div>
          </div>
        </section>

        {/* Budgeting Tips Section */}
        <section id="budgeting-tips" className="py-16 bg-gray-50">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Memphis Wedding DJ Budgeting Tips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Budget Wisely</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Allocate 8-10% of total wedding budget to entertainment</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Book early for better rates and preferred dates</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Consider off-peak dates for significant savings</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Bundle services for maximum value</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Ask about military/educator discounts</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Red Flags to Avoid</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Prices significantly below market average</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">No contract or vague service descriptions</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Hidden fees or surprise charges</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Lack of insurance or venue approval</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">No backup equipment or contingency plans</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-brand text-white rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Your Memphis Wedding DJ Quote?</h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Get a personalized quote for your Memphis wedding. Our transparent pricing means no surprises – 
                just exceptional DJ service for your special day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-brand-gold text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Get Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
                <a href="tel:(901)410-2020" className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  <Phone className="mr-2 w-5 h-5 inline" />
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Memphis Wedding DJ Service FAQs</h2>
            
            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  What's included in your Memphis wedding DJ packages?
                </h3>
                <p className="text-gray-700">
                  Our packages include professional DJ service, MC duties, premium sound system, wireless microphones, 
                  dance lighting, music consultation, setup/breakdown, and liability insurance. We offer ceremony-only 
                  services as well as comprehensive wedding packages. All pricing is transparent with no hidden fees!
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Do you charge extra for Memphis venue travel?
                </h3>
                <p className="text-gray-700">
                  Travel within Memphis and the immediate metro area is typically included in our packages. For venues 
                  outside our standard service area, travel arrangements can be discussed during your consultation.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Can I get a discount for off-peak Memphis wedding dates?
                </h3>
              <p className="text-gray-700">
                Yes! We offer discounts for January-March and November-December weddings. Weekday and 
                Sunday weddings also qualify for reduced pricing. Contact us to learn about current promotions 
                and seasonal discounts.
              </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  What's the payment schedule for Memphis wedding DJ services?
                </h3>
              <p className="text-gray-700">
                We typically require a deposit to secure your date, with the balance due according to a payment 
                schedule that works for you. We accept cash, check, and all major credit cards. Specific payment 
                terms are outlined in your contract.
              </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Do you offer package deals for Memphis wedding weekends?
                </h3>
              <p className="text-gray-700">
                Absolutely! We offer special pricing for rehearsal dinners, welcome parties, and post-wedding 
                brunches when booked with your main wedding reception. Bundling multiple events often provides 
                significant savings and ensures consistent quality across all your celebrations.
              </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Get Your Custom Memphis Wedding DJ Quote
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ready to secure Memphis's best wedding DJ service? Get your personalized quote with transparent 
                pricing and no hidden fees. Let's make your wedding celebration unforgettable!
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Call for Immediate Quote</h3>
                      <p className="text-gray-600 mb-3">Speak directly with our Memphis wedding DJ team</p>
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Your Details</h3>
                      <p className="text-gray-600 mb-3">Send us your Memphis wedding information</p>
                      <a href="mailto:info@m10djcompany.com" className="text-brand font-semibold hover:text-brand-600 transition-colors">
                        info@m10djcompany.com
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="modern-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Why Choose M10 DJ Company</h3>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 500+ successful Memphis weddings</li>
                        <li>• Transparent, no-surprise pricing</li>
                        <li>• Preferred vendor at top Memphis venues</li>
                        <li>• 5-star average customer rating</li>
                      </ul>
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

        {/* Related Articles */}
        <section className="py-16 bg-white">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Related Memphis Wedding Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Memphis Wedding Venues</h3>
                <p className="text-gray-600 mb-4">Discover the best Memphis wedding venues and their DJ requirements.</p>
                <Link href="/venues" className="text-brand font-semibold hover:text-brand-600 transition-colors">
                  Read More →
                </Link>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Memphis Wedding DJ Services</h3>
                <p className="text-gray-600 mb-4">Complete guide to our professional Memphis wedding DJ services.</p>
                <Link href="/memphis-wedding-dj" className="text-brand font-semibold hover:text-brand-600 transition-colors">
                  Read More →
                </Link>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wedding Planning Tips</h3>
                <p className="text-gray-600 mb-4">Expert advice for planning your perfect Memphis wedding celebration.</p>
                <Link href="/blog" className="text-brand font-semibold hover:text-brand-600 transition-colors">
                  Read More →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Enhanced Schema Markup for Blog Post */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "Memphis Wedding DJ Prices 2025: Complete Pricing Guide",
            "description": "Complete guide to Memphis wedding DJ services in 2025. Learn about package options, pricing factors, and what to expect when hiring a professional wedding DJ in Memphis.",
            "image": "https://m10djcompany.com/logo-static.jpg",
            "url": "https://m10djcompany.com/memphis-wedding-dj-prices-2025",
            "datePublished": "2025-01-01",
            "dateModified": "2025-01-01",
            "author": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "url": "https://m10djcompany.com"
            },
            "publisher": {
              "@type": "Organization", 
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://m10djcompany.com/logo-static.jpg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://m10djcompany.com/memphis-wedding-dj-prices-2025"
            },
            "keywords": "Memphis wedding DJ prices, wedding DJ cost Memphis, Memphis DJ pricing 2025, Memphis wedding DJ packages",
            "about": {
              "@type": "Thing",
              "name": "Memphis Wedding DJ Pricing"
            }
          })
        }}
      />

      {/* QA Schema (Google-compliant alternative) */}
      <script
        type="application/ld+json" 
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
              "@type": "Question",
              "name": "What's included in your Memphis wedding DJ pricing?",
              "text": "I'm comparing Memphis wedding DJ services and want to understand exactly what's included in your pricing packages. What services and equipment do you provide?",
              "answerCount": 1,
              "datePublished": "2024-01-12T14:00:00-06:00",
              "author": {
                "@type": "Person",
                "name": "Memphis Bride"
              },
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our packages include professional DJ service, MC duties, premium sound system, wireless microphones, dance lighting, music consultation, setup/breakdown, and liability insurance. We offer ceremony-only services as well as comprehensive wedding packages. All pricing is transparent with no hidden fees!",
                "datePublished": "2024-01-12T14:30:00-06:00",
                "url": "https://www.m10djcompany.com/memphis-wedding-dj-prices-2025#pricing-details",
                "upvoteCount": 28,
                "author": {
                  "@type": "Organization", 
                  "name": "M10 DJ Company",
                  "url": "https://www.m10djcompany.com"
                }
              }
            }
          })
        }}
      />
    </>
  );
}