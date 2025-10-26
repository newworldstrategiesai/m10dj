import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle,
  ChevronRight,
  Volume2,
  Mic,
  Heart,
  Building,
  Music,
  Award,
  Star,
  TrendingUp,
  Info,
  Calculator,
  Target,
  Zap,
  Sparkles,
  Gift,
  AlertCircle,
  User,
  MapPin,
  Lightbulb
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const marketPricing = [
  {
    category: "Budget DJs",
    priceRange: "$200-400",
    description: "Part-time or amateur DJs with basic equipment",
    includes: ["Basic sound system", "Limited music library", "Minimal experience"],
    considerations: ["May lack backup equipment", "Limited event coordination", "No insurance coverage"]
  },
  {
    category: "Mid-Range Professional DJs",
    priceRange: "$400-800",
    description: "Experienced DJs with quality equipment and professional service",
    includes: ["Professional sound system", "Extensive music library", "MC services", "Event coordination"],
    considerations: ["Good balance of cost and quality", "Reliable service", "Professional equipment"],
    popular: true
  },
  {
    category: "Premium DJ Services",
    priceRange: "$800-1,500",
    description: "Top-tier DJs with premium equipment and comprehensive services",
    includes: ["High-end sound systems", "Full lighting packages", "Multiple DJs", "Complete event coordination"],
    considerations: ["Highest quality service", "Premium equipment", "Comprehensive coverage"]
  }
];

const pricingFactors = [
  {
    icon: Clock,
    title: "Event Duration",
    description: "Most events range from 4-8 hours",
    impact: "Primary Factor",
    details: "Each additional hour typically adds $75-150 to the total cost"
  },
  {
    icon: Users,
    title: "Guest Count",
    description: "Determines sound system requirements",
    impact: "Significant Factor", 
    details: "Larger events require more powerful sound systems and additional equipment"
  },
  {
    icon: Calendar,
    title: "Date & Season",
    description: "Peak wedding season affects pricing",
    impact: "Moderate Factor",
    details: "May-October typically sees 15-25% higher rates than off-season"
  },
  {
    icon: Building,
    title: "Venue Type",
    description: "Indoor vs outdoor, size, and technical requirements",
    impact: "Variable Factor",
    details: "Outdoor events and unique venues may require additional equipment"
  },
  {
    icon: Music,
    title: "Service Complexity",
    description: "MC duties, special requests, coordination needs",
    impact: "Add-on Factor",
    details: "Additional services like uplighting, ceremony audio, and coordination increase costs"
  },
  {
    icon: Award,
    title: "DJ Experience Level",
    description: "Years in business and reputation",
    impact: "Quality Factor",
    details: "More experienced DJs command higher rates but provide better service"
  }
];

const eventTypePricing = [
  {
    eventType: "Wedding Receptions",
    averagePrice: "$600-1,200",
    duration: "6-8 hours",
    commonServices: ["Ceremony music", "Cocktail hour", "Reception DJ", "MC services", "Uplighting"],
    notes: "Most comprehensive DJ services with multiple event phases"
  },
  {
    eventType: "Corporate Events",
    averagePrice: "$400-800",
    duration: "3-6 hours",
    commonServices: ["Background music", "Presentation support", "Award ceremonies", "Networking music"],
    notes: "Professional atmosphere with business-appropriate music"
  },
  {
    eventType: "Birthday Parties",
    averagePrice: "$300-600",
    duration: "3-5 hours",
    commonServices: ["DJ entertainment", "Dance music", "Special announcements", "Games coordination"],
    notes: "Age-appropriate music and interactive entertainment"
  },
  {
    eventType: "School Dances",
    averagePrice: "$400-700",
    duration: "3-4 hours",
    commonServices: ["Clean music playlists", "Interactive DJ", "Sound system", "Lighting effects"],
    notes: "Age-appropriate content with high energy entertainment"
  }
];

const savingsTips = [
  {
    icon: Calendar,
    tip: "Book During Off-Peak Season",
    savings: "15-25%",
    description: "November through April typically offer better rates and more availability"
  },
  {
    icon: Clock,
    tip: "Consider Shorter Events",
    savings: "20-30%",
    description: "4-hour events cost significantly less than 6-8 hour celebrations"
  },
  {
    icon: Target,
    tip: "Choose Weekday Events",
    savings: "10-20%",
    description: "Friday and Sunday events often cost less than Saturday celebrations"
  },
  {
    icon: Gift,
    tip: "Book Multiple Services",
    savings: "10-15%",
    description: "Bundling ceremony, cocktail hour, and reception can reduce overall costs"
  },
  {
    icon: Star,
    tip: "Book Early",
    savings: "5-15%",
    description: "Booking 6+ months in advance often qualifies for early bird discounts"
  }
];

export default function MemphisDJPricingGuide() {
  return (
    <>
      <Head>
        <title>Wedding DJ Cost Guide 2025 | Average Price for Wedding DJ | Memphis DJ Pricing</title>
        <meta 
          name="description" 
          content="Wedding DJ Cost: $600-$1,200 average. Complete guide to wedding DJ pricing, what affects costs, and how to save money. Memphis DJ Company transparent pricing ⭐ Call (901) 410-2020!" 
        />
        <meta name="keywords" content="wedding dj cost, average price for wedding dj, average dj cost for wedding, wedding dj pricing, how much does a wedding dj cost, Memphis DJ pricing, DJ cost Memphis, Memphis DJ prices 2025, wedding DJ cost Memphis, corporate DJ pricing Memphis, event DJ rates Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.m10djcompany.com/memphis-dj-pricing-guide" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis DJ Pricing Guide 2025: Complete Cost Breakdown & Market Analysis" />
        <meta property="og:description" content="Comprehensive Memphis DJ pricing guide with market analysis, cost factors, and money-saving tips for Memphis events." />
        <meta property="og:url" content="https://www.m10djcompany.com/memphis-dj-pricing-guide" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://www.m10djcompany.com/logo-static.jpg" />
        <meta property="article:published_time" content="2025-01-01T00:00:00-06:00" />
        <meta property="article:modified_time" content="2025-01-01T00:00:00-06:00" />
        <meta property="article:author" content="M10 DJ Company" />
        <meta property="article:section" content="Event Planning" />
        <meta property="article:tag" content="Memphis DJ" />
        <meta property="article:tag" content="DJ Pricing" />
        <meta property="article:tag" content="Event Planning" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Memphis DJ Pricing Guide 2025: Complete Cost Breakdown" />
        <meta name="twitter:description" content="Comprehensive Memphis DJ pricing guide with market analysis and money-saving tips." />
        <meta name="twitter:image" content="https://www.m10djcompany.com/logo-static.jpg" />
        
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
              <span className="text-gray-900">Memphis DJ Pricing Guide</span>
            </nav>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="bg-brand-gold text-black px-3 py-1 rounded-full text-sm font-medium">
                Transparent Pricing
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
                15 min read
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Wedding DJ Cost Guide 2025: Average Prices & What to Expect
            </h1>

            {/* Direct Answer for Featured Snippet */}
            <div className="bg-brand-gold/10 border-l-4 border-brand-gold rounded-r-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How Much Does a Wedding DJ Cost?</h2>
              <p className="text-lg text-gray-800 mb-4 leading-relaxed">
                <strong>Professional wedding DJ services typically cost $1,200-$3,500+</strong> for quality celebrations, with most couples investing around <strong>$1,800-$2,500</strong> for complete ceremony and reception coverage with an experienced DJ.
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-3">Wedding DJ Pricing Breakdown by Quality Level:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>$500-$1,000:</strong> Budget/part-time DJs with basic equipment (⚠️ Higher risk - limited experience, no backup systems)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>$1,200-$2,500:</strong> Professional DJs with quality equipment, MC services, lighting, backup systems & insurance (✅ Most popular - 70% of couples choose this range)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>$2,500-$4,000+:</strong> Premium full-service DJ companies with complete production, multiple DJs, luxury packages, and special effects</span>
                  </li>
                </ul>
              </div>
              <p className="text-gray-700 mb-3">
                <strong>What affects the cost:</strong> Event duration (6-8 hours typical), DJ experience level (15+ years commands premium rates), equipment quality, backup systems, insurance coverage, venue complexity, peak season dates (May-October), and additional services like ceremony audio, uplighting (up to 16 fixtures), monogram projection, and special effects.
              </p>
              <p className="text-gray-700 text-sm bg-white p-3 rounded">
                <strong>💡 Pro Tip:</strong> Wedding planners recommend budgeting 8-12% of your total wedding budget for entertainment, as the DJ is the #1 factor guests remember. Investing $1,500-$2,500 in a professional DJ protects your $20,000-$40,000 wedding investment.
              </p>
            </div>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Complete cost breakdown for wedding and event DJ services. Real market analysis, 
              pricing factors, and money-saving tips from experienced event professionals.
            </p>

            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-gold">$600</div>
                  <div className="text-sm text-gray-600">Average Wedding</div>
                  <div className="text-xs text-gray-500">Most popular package</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-gold">$500</div>
                  <div className="text-sm text-gray-600">Corporate Events</div>
                  <div className="text-xs text-gray-500">Professional service</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-gold">6hrs</div>
                  <div className="text-sm text-gray-600">Average Duration</div>
                  <div className="text-xs text-gray-500">Standard package</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-gold">$0</div>
                  <div className="text-sm text-gray-600">Hidden Fees</div>
                  <div className="text-xs text-gray-500">Transparent pricing</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Pricing Overview */}
        <section className="py-16 bg-gray-50">
          <div className="section-container max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Memphis DJ Market Pricing Overview</h2>
            
            <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
              Understanding the Memphis DJ market helps you make informed decisions. Here's a breakdown of 
              typical pricing tiers and what to expect at each level.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {marketPricing.map((tier, index) => (
                <div key={index} className={`rounded-xl p-8 ${tier.popular ? 'bg-brand text-white ring-4 ring-brand-gold shadow-xl' : 'bg-white border-2 border-gray-200'} relative`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-brand-gold text-black px-4 py-1 rounded-full text-sm font-bold">
                        MOST COMMON
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.category}</h3>
                    <div className={`text-3xl font-bold mb-2 ${tier.popular ? 'text-brand-gold' : 'text-brand'}`}>{tier.priceRange}</div>
                    <p className={`text-sm ${tier.popular ? 'text-white/80' : 'text-gray-600'}`}>{tier.description}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className={`font-semibold mb-3 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>Typically Includes:</h4>
                    <ul className="space-y-2">
                      {tier.includes.map((item, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-brand-gold' : 'text-green-500'}`} />
                          <span className={`text-sm ${tier.popular ? 'text-white' : 'text-gray-700'}`}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className={`font-semibold mb-3 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>Considerations:</h4>
                    <ul className="space-y-2">
                      {tier.considerations.map((item, i) => (
                        <li key={i} className={`text-sm ${tier.popular ? 'text-white/80' : 'text-gray-600'}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Factors */}
        <section className="py-16 bg-white">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">What Affects Memphis DJ Pricing?</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Understanding these key factors helps you budget appropriately and make informed decisions 
              about your Memphis event entertainment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {pricingFactors.map((factor, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center flex-shrink-0">
                      <factor.icon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{factor.title}</h3>
                      <p className="text-gray-600 mb-3">{factor.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-brand font-medium">{factor.impact}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{factor.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
              <div className="flex items-center mb-2">
                <Info className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-semibold text-blue-800">Market Insight</span>
              </div>
              <p className="text-blue-700">
                Memphis DJ pricing is generally 15-25% lower than major markets like Nashville or Atlanta, 
                while maintaining the same level of professional service and quality equipment.
              </p>
            </div>
          </div>
        </section>

        {/* Event Type Pricing */}
        <section className="py-16 bg-gray-50">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Memphis DJ Pricing by Event Type</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Different event types have varying requirements and pricing structures. Here's what to expect 
              for common Memphis events.
            </p>

            <div className="space-y-6">
              {eventTypePricing.map((event, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 md:mb-0">{event.eventType}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-brand font-bold text-lg">{event.averagePrice}</span>
                      <span className="text-gray-500 text-sm">{event.duration}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Common Services:</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.commonServices.map((service, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">{event.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Money-Saving Tips */}
        <section className="py-16 bg-white">
          <div className="section-container max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Money-Saving Tips for Memphis DJ Services</h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Smart strategies to get the best value for your Memphis event entertainment budget without 
              compromising on quality.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsTips.map((tip, index) => (
                <div key={index} className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <tip.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-green-800 font-bold text-lg">{tip.savings}</div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.tip}</h3>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <div className="flex items-center mb-2">
                <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="font-semibold text-yellow-800">Pro Tip</span>
              </div>
              <p className="text-yellow-700">
                The best way to save money on DJ services is to be flexible with your date and time. 
                Friday evening, Sunday afternoon, and weekday events often offer significant savings while 
                maintaining the same level of service quality.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-brand text-white">
          <div className="section-container text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Your Custom Quote?</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
              Get accurate pricing for your specific Memphis event with our free, no-obligation consultation. 
              We'll help you understand all options and find the perfect entertainment solution for your budget.
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
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Get Your Custom Memphis DJ Quote
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ready to secure professional DJ services for your Memphis event? Get your personalized quote 
                with transparent pricing and expert guidance.
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
                      <p className="text-gray-600 mb-3">Speak directly with our Memphis event specialists</p>
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Your Event Details</h3>
                      <p className="text-gray-600 mb-3">Send us your Memphis event information</p>
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
                        <li>• 10+ years serving Memphis events</li>
                        <li>• Transparent, competitive pricing</li>
                        <li>• Professional equipment & backup systems</li>
                        <li>• 5-star customer satisfaction</li>
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

        {/* Comprehensive FAQ Section - Targeting Pricing Keywords */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6 text-gray-900">Wedding DJ Cost - Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600">
                  Get answers to common questions about wedding DJ pricing and costs
                </p>
              </div>

              <div className="space-y-6">
                {/* FAQ targeting "wedding dj cost" - 8 impressions, position 55 */}
                <div className="bg-gray-50 rounded-xl p-8 border-l-4 border-brand-gold">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    How much does a wedding DJ cost?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    <strong>Professional wedding DJ services typically cost $1,200-$3,500+</strong> for quality celebrations, with most couples investing <strong>$1,800-$2,500</strong> for an experienced DJ with 6-8 hours of complete ceremony and reception coverage. This includes professional equipment, MC services, lighting, and music coordination.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>$500-$1,000:</strong> Budget/part-time DJs with basic equipment (⚠️ Limited experience, no backup systems, higher risk)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>$1,200-$2,500:</strong> Professional DJs with quality equipment, MC services, lighting, backup systems & insurance (✅ Most popular choice)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>$2,500-$4,000+:</strong> Premium full-service DJ companies with complete production, multiple DJs, and luxury entertainment packages</span>
                    </li>
                  </ul>
                  <p className="text-gray-700 mt-4 text-sm">
                    <strong>💡 Pro Tip:</strong> Most wedding planners recommend budgeting 8-12% of your total wedding budget for entertainment, as the DJ significantly impacts your guests' experience and memories.
                  </p>
                </div>

                {/* FAQ targeting "average price for wedding dj" - 8 impressions, position 74 */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    What is the average price for a wedding DJ?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The average price for a professional wedding DJ is <strong>$1,800-$2,500 for complete coverage</strong> (6-8 hours including ceremony and reception). This typically includes ceremony music, cocktail hour entertainment, reception DJ services, expert MC duties, professional sound system, wireless microphones, dance floor lighting, elegant uplighting (up to 16 fixtures), backup equipment, liability insurance, and personalized music consultation with online planning.
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Note:</strong> While you may find cheaper options ($500-$1,000), these often lack professional equipment, backup systems, experience with venues, and insurance coverage. Investing in a quality DJ ensures your celebration runs smoothly and your guests have an unforgettable experience. Wedding coordinators report that entertainment quality is the #1 factor guests remember about weddings.
                  </p>
                </div>

                {/* FAQ targeting "average dj cost for wedding" - 3 impressions, position 99 */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    What is the average DJ cost for a wedding?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The average DJ cost for a wedding ranges from <strong>$1,500-$2,800</strong> for complete professional service, with most couples investing around <strong>$2,000-$2,500</strong> for a complete wedding package including both ceremony and reception coverage. This includes 6-8 hours of service, professional sound and lighting equipment, MC services, and complete coordination.
                  </p>
                  <p className="text-gray-700 text-sm">
                    Factors affecting cost include event duration, venue complexity, peak season dates (May-October typically 15-25% higher), equipment quality, DJ experience level (15+ years commands premium rates), and included services like ceremony audio, uplighting (up to 16 fixtures), monogram projection, special effects, and extended coverage. <strong>Professional DJs with backup equipment and insurance typically start at $1,500-$2,000</strong> for quality service.
                  </p>
                </div>

                {/* FAQ for cost factors */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    What affects wedding DJ pricing?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Wedding DJ pricing is affected by several key factors:
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <Clock className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Event Duration:</strong> Most weddings need 4-8 hours of service. Each additional hour typically adds $75-150 to the total cost.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Users className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Guest Count:</strong> Larger weddings require more powerful sound systems and additional equipment, increasing costs by 10-20%.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Calendar className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Peak Season:</strong> May-October weddings typically cost 15-25% more than off-season dates.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Volume2 className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Additional Services:</strong> Ceremony music, uplighting, photo booth, and extended coverage add $100-500+ to base pricing.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Award className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>DJ Experience:</strong> Experienced DJs with 10+ years and 500+ weddings command premium rates but provide superior service.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* FAQ for value justification */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Why do professional wedding DJs cost $1,500-$3,000+?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Professional wedding DJ pricing ($1,500-$3,000+) reflects significant business investment and expertise that budget DJs simply can't provide. The cost covers far more than just "playing music":
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Professional Equipment Investment:</strong> $15,000-$40,000 in premium sound systems, wireless microphones, elegant lighting, backup equipment, and transportation
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Experience & Expertise:</strong> 10-15+ years, 500+ weddings, crowd-reading skills, MC training, venue knowledge, and seamless timeline coordination
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Business Operating Costs:</strong> $2,000-$3,000/year liability insurance, business licenses, music licensing fees, equipment maintenance, continuing education
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Time Investment:</strong> 15-20 hours per wedding including consultation meetings, custom playlist creation, venue coordination, setup (2-3 hours), event (6-8 hours), and teardown (1-2 hours)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Risk Protection:</strong> Full backup systems, contingency plans, and insurance protecting you from disasters that could ruin your celebration
                      </div>
                    </li>
                  </ul>
                  <p className="text-gray-700 mt-4 text-sm bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    <strong>⚠️ Warning:</strong> Budget DJs ($500-$1,000) often lack insurance, backup equipment, venue experience, and professional training. Wedding planners report that entertainment failures (equipment breakdown, inexperienced DJs, poor crowd reading) are among the top 3 wedding disasters. <strong>Investing $1,500-$2,500 in a professional DJ protects a $20,000-$40,000 investment in your wedding.</strong>
                  </p>
                </div>

                {/* FAQ for package inclusions */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    What's included in typical wedding DJ pricing?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Professional wedding DJ packages typically include:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Professional DJ for 4-8 hours</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Premium sound system</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Wireless microphones (2-4)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>MC services & coordination</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Basic uplighting package</span>
                      </li>
                    </ul>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Extensive music library</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Online planning portal</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Consultation meetings</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Backup equipment</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                        <span>Liability insurance</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* FAQ for budget savings */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    How can I save money on wedding DJ services?
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You can reduce wedding DJ costs without sacrificing quality:
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <DollarSign className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Book Off-Peak Season:</strong> November-April weddings save 15-25% compared to peak summer months.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <DollarSign className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Choose Weekday Events:</strong> Friday or Sunday weddings cost 10-20% less than Saturday celebrations.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <DollarSign className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Book Early:</strong> Reserve 6-12 months in advance for early bird discounts and best availability.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <DollarSign className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Bundle Services:</strong> Combine ceremony, cocktail hour, and reception for better per-hour rates.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <DollarSign className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Skip Add-ons:</strong> Start with essential package, add upgrades only if budget allows.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* CTA Box */}
                <div className="bg-brand text-white rounded-xl p-8 text-center mt-12">
                  <h3 className="text-2xl font-bold mb-4">Get Your Custom Wedding DJ Quote</h3>
                  <p className="text-lg mb-6 text-white/90">
                    Transparent pricing with no hidden fees. Same-day quotes available!
                  </p>
                  <button 
                    onClick={scrollToContact}
                    className="bg-brand-gold text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-gold/90 transition-colors inline-flex items-center"
                  >
                    Request Free Quote
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                  <p className="mt-4 text-sm text-white/80">
                    ⭐ 5.0 Rating | 500+ Weddings | Call (901) 410-2020
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Memphis DJ Pricing Guide 2025: Complete Cost Breakdown & Market Analysis",
            "description": "Comprehensive Memphis DJ pricing guide for 2025. Market analysis, cost factors, event type pricing, and money-saving tips for weddings and events in Memphis, TN.",
            "image": [
              "https://www.m10djcompany.com/logo-static.jpg"
            ],
            "url": "https://www.m10djcompany.com/memphis-dj-pricing-guide",
            "datePublished": "2025-01-01T00:00:00-06:00",
            "dateModified": "2025-01-01T00:00:00-06:00",
            "author": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "url": "https://www.m10djcompany.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.m10djcompany.com/logo-static.jpg"
              }
            },
            "publisher": {
              "@type": "Organization", 
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.m10djcompany.com/logo-static.jpg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://www.m10djcompany.com/memphis-dj-pricing-guide"
            },
            "keywords": "Memphis DJ pricing, DJ cost Memphis, Memphis DJ prices 2025, wedding DJ cost Memphis, corporate DJ pricing Memphis, event DJ rates Memphis",
            "about": [
              {
                "@type": "Thing",
                "name": "DJ Services Pricing"
              },
              {
                "@type": "Thing", 
                "name": "Memphis Event Planning"
              },
              {
                "@type": "Thing",
                "name": "Wedding Entertainment Costs"
              }
            ],
            "articleSection": "Event Planning",
            "wordCount": 2500,
            "inLanguage": "en-US"
          })
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": "Memphis DJ Pricing Guide FAQ",
            "description": "Frequently asked questions about DJ pricing in Memphis, Tennessee",
            "url": "https://www.m10djcompany.com/memphis-dj-pricing-guide",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How much does a DJ cost for a wedding in Memphis?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Memphis wedding DJ costs typically range from $400-1,200 depending on the duration, services included, and experience level. Most professional wedding DJs charge $600-800 for a 6-hour reception with full services including ceremony music, MC duties, and basic lighting."
                }
              },
              {
                "@type": "Question",
                "name": "What factors affect DJ pricing in Memphis?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Key factors include event duration (4-8 hours), guest count (determines sound system needs), date and season (peak wedding season costs more), venue requirements, service complexity (MC duties, special requests), and the DJ's experience level."
                }
              },
              {
                "@type": "Question",
                "name": "How can I save money on DJ services in Memphis?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Book during off-peak season (November-April) for 15-25% savings, consider weekday events for 10-20% discounts, choose shorter event durations, bundle multiple services, and book 6+ months in advance for early bird pricing."
                }
              },
              {
                "@type": "Question",
                "name": "What's included in typical Memphis DJ pricing?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Professional DJ packages typically include the DJ, sound system, wireless microphones, basic lighting, music library access, event coordination, and MC services. Premium packages may add uplighting, extended hours, and additional equipment."
                }
              }
            ]
          })
        }}
      />
    </>
  );
}