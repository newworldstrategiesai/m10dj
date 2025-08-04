import Head from 'next/head';
import Link from 'next/link';
import { Calendar, MapPin, Users, Music, Award, Phone, ChevronRight, DollarSign, Star, Clock, CheckCircle } from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { scrollToContact } from '../../utils/scroll-helpers';

export default function MemphisDJCostPricingGuide2025() {
  const pricingTiers = [
    {
      title: "Basic DJ Package",
      price: "$395-$495",
      duration: "4 hours",
      ideal: "Small parties, corporate background music",
      includes: [
        "Professional DJ with music library",
        "Basic sound system",
        "1 wireless microphone",
        "Setup and breakdown"
      ]
    },
    {
      title: "Standard Wedding Package", 
      price: "$795-$995",
      duration: "6-7 hours",
      ideal: "Most Memphis weddings",
      includes: [
        "Experienced wedding DJ",
        "Premium sound system",
        "2 wireless microphones",
        "Basic uplighting (4 lights)",
        "MC services",
        "Online planning portal"
      ],
      popular: true
    },
    {
      title: "Premium Event Package",
      price: "$1,295-$1,595", 
      duration: "8+ hours",
      ideal: "Large weddings, corporate galas",
      includes: [
        "Master DJ with backup",
        "Premium sound + backup system",
        "Multiple microphones",
        "Full uplighting package (12+ lights)",
        "Professional MC services",
        "Ceremony sound if needed"
      ]
    }
  ];

  const factorsAffectingCost = [
    {
      factor: "Event Duration",
      impact: "High",
      description: "Longer events cost more. Most DJs charge hourly rates after the package minimum.",
      tipText: "Book exact hours needed to avoid overtime charges"
    },
    {
      factor: "Day of Week",
      impact: "Medium", 
      description: "Saturday weddings cost 15-25% more than Friday or Sunday events.",
      tipText: "Consider Friday evening or Sunday afternoon for savings"
    },
    {
      factor: "Season & Date",
      impact: "Medium",
      description: "Peak wedding season (May-October) and holidays command premium rates.",
      tipText: "Off-season bookings can save $200-$400"
    },
    {
      factor: "Venue Location",
      impact: "Low",
      description: "Distance from Memphis may include travel fees for venues 30+ miles away.",
      tipText: "Ask about travel charges for suburban venues"
    }
  ];

  return (
    <>
      <Head>
        <title>Memphis DJ Cost Guide 2025 | How Much Does a DJ Cost in Memphis?</title>
        <meta 
          name="description" 
          content="Complete Memphis DJ pricing guide 2025. Learn average DJ costs, wedding DJ prices, party DJ rates, and corporate event pricing. Get accurate Memphis DJ cost estimates and money-saving tips from local experts."
        />
        <meta name="keywords" content="Memphis DJ cost, Memphis DJ prices, how much does a DJ cost in Memphis, average wedding DJ cost Memphis, Memphis DJ pricing, DJ cost Memphis, Memphis DJ rates, wedding DJ prices Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog/memphis-dj-cost-pricing-guide-2025" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis DJ Cost Guide 2025 | How Much Does a DJ Cost in Memphis?" />
        <meta property="og:description" content="Complete Memphis DJ pricing guide with average costs, wedding packages, and money-saving tips from local experts." />
        <meta property="og:url" content="https://m10djcompany.com/blog/memphis-dj-cost-pricing-guide-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Article Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Memphis DJ Cost Guide 2025: How Much Does a DJ Cost in Memphis?",
              "description": "Complete Memphis DJ pricing guide with average costs, wedding packages, and expert tips",
              "author": {
                "@type": "Organization",
                "name": "M10 DJ Company"
              },
              "publisher": {
                "@type": "Organization", 
                "name": "M10 DJ Company",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://m10djcompany.com/logo-static.jpg"
                }
              },
              "datePublished": "2025-01-01",
              "dateModified": "2025-01-01",
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://m10djcompany.com/blog/memphis-dj-cost-pricing-guide-2025"
              },
              "image": "https://m10djcompany.com/logo-static.jpg"
            })
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-600 to-amber-800 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-white/20 backdrop-blur rounded-full p-4">
                  <DollarSign className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Memphis DJ Cost Guide 2025
              </h1>
              <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto">
                How much does a DJ cost in Memphis? Get accurate pricing, compare packages, and learn insider tips to budget for your perfect event.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Get Custom Quote
                </button>
                <a 
                  href="tel:9014102020"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-amber-700 transition-colors"
                >
                  (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Quick Answer */}
            <div className="bg-amber-50 rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Answer: Memphis DJ Pricing 2025</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <h3 className="text-lg font-semibold text-amber-600">Basic Events</h3>
                  <p className="text-3xl font-bold text-gray-900">$395-$495</p>
                  <p className="text-gray-600">4-hour parties, corporate background</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-600">Wedding DJ</h3>
                  <p className="text-3xl font-bold text-gray-900">$795-$995</p>
                  <p className="text-gray-600">6-7 hours, most popular package</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-600">Premium Events</h3>
                  <p className="text-3xl font-bold text-gray-900">$1,295+</p>
                  <p className="text-gray-600">8+ hours, full production</p>
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-xl text-gray-600 mb-8">
                Planning an event in Memphis and wondering about DJ costs? You're not alone. Understanding DJ pricing helps you budget effectively and choose the right entertainment for your celebration.
              </p>
              
              <p className="text-gray-600 mb-8">
                As Memphis's leading DJ company with 500+ events under our belt, we're sharing everything you need to know about Memphis DJ costs in 2025 - from wedding packages to corporate rates, plus insider tips to get the best value.
              </p>
            </div>

            {/* Detailed Pricing Breakdown */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Memphis DJ Pricing Breakdown 2025</h2>
              
              <div className="space-y-8">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className={`rounded-lg p-6 ${tier.popular ? 'border-2 border-amber-500 bg-amber-50' : 'bg-gray-50'} relative`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.title}</h3>
                        <p className="text-3xl font-bold text-amber-600 mb-2">{tier.price}</p>
                        <p className="text-gray-600 mb-2">{tier.duration}</p>
                        <p className="text-sm text-gray-500">{tier.ideal}</p>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">Package Includes:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tier.includes.map((item, idx) => (
                            <div key={idx} className="flex items-center text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Factors Affecting Cost */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">What Affects Memphis DJ Costs?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {factorsAffectingCost.map((factor, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{factor.factor}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        factor.impact === 'High' ? 'bg-red-100 text-red-800' :
                        factor.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {factor.impact} Impact
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{factor.description}</p>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <strong>💡 Money-Saving Tip:</strong> {factor.tipText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Memphis DJ Cost by Event Type */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Memphis DJ Cost by Event Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Wedding DJ Memphis</h3>
                  <p className="text-2xl font-bold text-amber-600 mb-2">$795-$1,595</p>
                  <p className="text-gray-600 text-sm mb-4">Most weddings: $795-$995</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Ceremony + reception</li>
                    <li>• MC services included</li>
                    <li>• Uplighting options</li>
                    <li>• Online planning portal</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Corporate Event DJ</h3>
                  <p className="text-2xl font-bold text-amber-600 mb-2">$495-$1,295</p>
                  <p className="text-gray-600 text-sm mb-4">Background music: $495-$695</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Professional atmosphere</li>
                    <li>• Presentation support</li>
                    <li>• Awards ceremonies</li>
                    <li>• Holiday parties</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Birthday Party DJ</h3>
                  <p className="text-2xl font-bold text-amber-600 mb-2">$395-$795</p>
                  <p className="text-gray-600 text-sm mb-4">Sweet 16: $495-$695</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Age-appropriate music</li>
                    <li>• Interactive entertainment</li>
                    <li>• Party games & activities</li>
                    <li>• Custom announcements</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Money-Saving Tips */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">How to Save Money on Memphis DJ Services</h2>
              
              <div className="bg-green-50 rounded-lg p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-4">💰 Cost-Saving Strategies</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span className="text-green-700"><strong>Book off-season:</strong> Save $200-$400 on November-March events</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span className="text-green-700"><strong>Choose Friday/Sunday:</strong> Save 15-25% vs Saturday weddings</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span className="text-green-700"><strong>Book early:</strong> Lock in rates before annual increases</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-4">⚠️ Avoid Hidden Costs</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span className="text-green-700"><strong>Ask about overtime:</strong> Clarify hourly rates for extra time</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span className="text-green-700"><strong>Travel fees:</strong> Understand charges for distant venues</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <span className="text-green-700"><strong>Equipment add-ons:</strong> Know what's included vs. extra</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Questions to Ask */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Questions to Ask Memphis DJs About Pricing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💵 Budget & Package Questions</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li>• What's included in your base package?</li>
                    <li>• Are there any hidden fees or add-on costs?</li>
                    <li>• Do you charge for setup and breakdown time?</li>
                    <li>• What's your overtime rate if the event runs long?</li>
                    <li>• Do you offer payment plans?</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎵 Service & Value Questions</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li>• How many events have you done in Memphis?</li>
                    <li>• Do you have backup equipment and a backup DJ?</li>
                    <li>• Can I see references from recent Memphis events?</li>
                    <li>• What happens if you're sick on my event day?</li>
                    <li>• Do you carry liability insurance?</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready for Your Memphis Event?</h2>
              <p className="text-xl mb-6">
                Get a personalized quote based on your specific event needs and budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/memphis-dj-services"
                  className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
                >
                  View Our Packages
                </Link>
                <a 
                  href="tel:9014102020"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-amber-700 transition-colors"
                >
                  Call (901) 410-2020
                </a>
              </div>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}