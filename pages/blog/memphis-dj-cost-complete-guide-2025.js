import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  DollarSign, 
  Clock, 
  Music, 
  Users, 
  Zap, 
  Star, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Award
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import SEO from '../../components/SEO';

export default function MemphisDJCostCompleteGuide() {
  const [selectedPackage, setSelectedPackage] = useState(0);

  useEffect(() => {
    // Add any tracking or analytics here
  }, []);

  const keywords = [
    "Memphis DJ cost",
    "Memphis DJ prices",
    "how much does a DJ cost in Memphis", 
    "average wedding DJ cost Memphis",
    "Memphis DJ pricing 2025",
    "wedding DJ cost Memphis",
    "DJ prices Memphis TN",
    "Memphis event DJ cost",
    "professional DJ pricing Memphis",
    "Memphis DJ rates"
  ];

  const pricingFactors = [
    {
      icon: Clock,
      title: "Event Duration",
      description: "The length of your event is the primary pricing factor.",
      details: [
        "4-hour events: $495-695",
        "6-hour events: $695-895", 
        "8-hour events: $895-1,195",
        "All-day events: $1,195+"
      ],
      impact: "High Impact"
    },
    {
      icon: Music,
      title: "Equipment & Setup",
      description: "Professional sound systems and lighting affect overall cost.",
      details: [
        "Basic sound system included",
        "Uplighting: +$200-400",
        "Photo booth: +$300-500", 
        "Additional speakers: +$150-250"
      ],
      impact: "Medium Impact"
    },
    {
      icon: MapPin,
      title: "Venue Location",
      description: "Distance from Memphis affects travel costs and setup time.",
      details: [
        "Memphis metro: No extra charge",
        "30+ miles: +$100-200",
        "Complex setups: +$150-300",
        "Multiple locations: +$200-400"
      ],
      impact: "Low-Medium Impact"
    },
    {
      icon: Calendar,
      title: "Date & Season",
      description: "Peak wedding dates command premium pricing.",
      details: [
        "Saturday evenings: Standard rates",
        "Friday/Sunday: 10-15% discount",
        "Peak season (May-Oct): Standard",
        "Off-season: 10-20% savings"
      ],
      impact: "Medium Impact"
    }
  ];

  const packageTiers = [
    {
      name: "Essential",
      price: "495-695",
      duration: "4-6 hours",
      ideal: "Intimate ceremonies, cocktail parties",
      includes: [
        "Professional DJ & MC",
        "Premium sound system",
        "Wireless microphones (2)",
        "Music planning consultation",
        "Basic lighting",
        "Setup & breakdown"
      ],
      popular: false
    },
    {
      name: "Complete",
      price: "695-895", 
      duration: "6-8 hours",
      ideal: "Full wedding receptions, corporate events",
      includes: [
        "All Essential features",
        "Extended music library",
        "Dance floor lighting",
        "Timeline coordination",
        "Song request management",
        "Backup equipment"
      ],
      popular: true
    },
    {
      name: "Premium",
      price: "895-1,195",
      duration: "8+ hours",
      ideal: "Luxury weddings, multi-event celebrations",
      includes: [
        "All Complete features",
        "Uplighting package",
        "Enhanced sound system", 
        "Multiple microphones",
        "Ceremony music",
        "Cocktail hour playlist"
      ],
      popular: false
    }
  ];

  const costComparisons = [
    {
      category: "Budget DJ ($300-500)",
      pros: ["Lower upfront cost"],
      cons: [
        "Consumer-grade equipment",
        "Limited experience",
        "No backup equipment",
        "Basic MC skills",
        "Limited music library"
      ],
      risk: "High risk of equipment failure or poor performance"
    },
    {
      category: "Professional DJ ($595-895)",
      pros: [
        "Professional equipment",
        "Experienced MC",
        "Backup systems",
        "Extensive music library",
        "Liability insurance"
      ],
      cons: ["Higher investment"],
      risk: "Minimal risk with proven track record"
    },
    {
      category: "Premium DJ ($895+)",
      pros: [
        "Top-tier equipment",
        "Advanced lighting",
        "Multiple services",
        "Luxury experience",
        "Complete event coordination"
      ],
      cons: ["Highest investment"],
      risk: "Lowest risk with maximum service"
    }
  ];

  const savingsTips = [
    {
      tip: "Book Off-Peak Dates",
      savings: "10-20%",
      description: "Friday, Sunday, or off-season dates often have lower rates."
    },
    {
      tip: "Longer Advance Booking",
      savings: "5-10%",
      description: "Book 12+ months in advance for early booking discounts."
    },
    {
      tip: "Weekday Events",
      savings: "15-25%",
      description: "Thursday or Friday events typically cost less than Saturday."
    },
    {
      tip: "Package Bundling",
      savings: "10-15%",
      description: "Combine ceremony and reception services for package savings."
    }
  ];

  return (
    <>
      <SEO
        title="Memphis DJ Cost & Pricing Guide 2025 | What Does a DJ Cost in Memphis? | M10 DJ Company"
        description="Complete Memphis DJ pricing guide for 2025. Learn what DJs cost in Memphis, pricing factors, and how to budget for professional wedding and event DJ services. Transparent pricing from Memphis experts."
        keywords={keywords}
        canonical="/blog/memphis-dj-cost-complete-guide-2025"
      />

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-brand to-brand-dark text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="heading-1 mb-6">
                <span className="block text-white">Memphis DJ Cost &</span>
                <span className="block text-white/90">Pricing Guide 2025</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90">
                Transparent pricing information for Memphis DJ services. Learn what professional DJs cost, 
                what affects pricing, and how to budget for your wedding or event entertainment.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-4">
                  <DollarSign className="h-8 w-8 text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">$595 - $1,195</div>
                    <div className="text-white/80">Typical Memphis DJ Range</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link 
                  href="/memphis-dj-pricing-guide"
                  className="btn-primary bg-white text-brand hover:bg-gray-100 px-8 py-4"
                >
                  View Our Packages
                </Link>
                <a href="tel:9014102020" className="btn-outline border-white text-white hover:bg-white hover:text-brand px-8 py-4">
                  Get Custom Quote
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Price Overview */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis DJ Pricing at a Glance</h2>
                <p className="text-lg text-gray-600">
                  Based on 500+ Memphis events, here's what you can expect to invest in professional DJ services.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {packageTiers.map((tier, index) => (
                  <div 
                    key={index} 
                    className={`relative bg-white border rounded-lg p-6 ${tier.popular ? 'border-brand shadow-lg ring-2 ring-brand/20' : 'border-gray-200'}`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-brand text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                      <div className="text-3xl font-bold text-brand mb-1">${tier.price}</div>
                      <div className="text-gray-600 text-sm">{tier.duration}</div>
                      <div className="text-gray-500 text-sm mt-2">{tier.ideal}</div>
                    </div>

                    <ul className="space-y-2">
                      {tier.includes.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Why Professional DJ Pricing Varies</h3>
                    <p className="text-blue-800 text-sm">
                      Professional DJs invest in high-quality equipment, liability insurance, and years of experience. 
                      This pricing reflects the value of reliable, professional entertainment that ensures your event's success.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Factors */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">What Affects Memphis DJ Pricing?</h2>
                <p className="text-lg text-gray-600">
                  Understanding these factors helps you budget accurately and choose the right service level.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {pricingFactors.map((factor, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <factor.icon className="h-8 w-8 text-brand" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{factor.title}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            factor.impact === 'High Impact' ? 'bg-red-100 text-red-800' :
                            factor.impact === 'Medium Impact' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {factor.impact}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{factor.description}</p>
                        
                        <ul className="space-y-1">
                          {factor.details.map((detail, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="w-1 h-1 bg-brand rounded-full mt-2 flex-shrink-0"></span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cost Comparison */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Budget vs. Professional vs. Premium DJ Services</h2>
                <p className="text-lg text-gray-600">
                  Understanding the differences helps you make an informed investment decision.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {costComparisons.map((comparison, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{comparison.category}</h3>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-green-700 mb-2">Pros:</h4>
                      <ul className="space-y-1">
                        {comparison.pros.map((pro, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-red-700 mb-2">Cons:</h4>
                      <ul className="space-y-1">
                        {comparison.cons.map((con, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                            <span className="w-3 h-3 border border-red-300 rounded-full mt-1 flex-shrink-0"></span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={`p-3 rounded-lg ${
                      index === 0 ? 'bg-red-50 border border-red-200' :
                      index === 1 ? 'bg-green-50 border border-green-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        index === 0 ? 'text-red-800' :
                        index === 1 ? 'text-green-800' :
                        'text-blue-800'
                      }`}>
                        {comparison.risk}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Money-Saving Tips */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Smart Ways to Save on Memphis DJ Services</h2>
                <p className="text-lg text-gray-600">
                  Professional DJ services don't have to break your budget. Here are legitimate ways to reduce costs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {savingsTips.map((saving, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{saving.tip}</h3>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Save {saving.savings}
                      </span>
                    </div>
                    <p className="text-gray-600">{saving.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">Avoid These "Savings" That Cost More</h3>
                    <ul className="text-yellow-800 text-sm space-y-1">
                      <li>• Choosing DJs without backup equipment (risk of event failure)</li>
                      <li>• Hiring inexperienced DJs (poor performance affects guest experience)</li>
                      <li>• Skipping liability insurance (potential legal and financial risk)</li>
                      <li>• No-contract arrangements (no protection if DJ cancels)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memphis Market Insights */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis DJ Market Insights</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Average Investment by Event Type</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Wedding Reception (6 hrs)</span>
                      <span className="font-semibold text-brand">$695-895</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Corporate Event (4 hrs)</span>
                      <span className="font-semibold text-brand">$595-795</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Birthday Party (4 hrs)</span>
                      <span className="font-semibold text-brand">$495-695</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">School Dance (3 hrs)</span>
                      <span className="font-semibold text-brand">$395-595</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Popular Memphis Venues & Pricing</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">The Peabody Hotel</div>
                      <div className="text-sm text-gray-600">Premium setup required: $895-1,195</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">Memphis Botanic Garden</div>
                      <div className="text-sm text-gray-600">Outdoor considerations: $795-995</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">Dixon Gallery & Gardens</div>
                      <div className="text-sm text-gray-600">Standard setup: $695-895</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">Community Centers</div>
                      <div className="text-sm text-gray-600">Basic requirements: $595-795</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Custom Quote CTA */}
        <section className="py-16 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 mb-6">Get Your Custom Memphis DJ Quote</h2>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                Every event is unique. Contact us for a personalized quote based on your specific needs, 
                venue, and date. No hidden fees, no surprises.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Free Consultation</h3>
                  <p className="text-white/80">Discuss your event needs and get pricing</p>
                </div>
                
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
                  <p className="text-white/80">No hidden fees or surprise charges</p>
                </div>
                
                <div className="text-center">
                  <Award className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">15+ Years Experience</h3>
                  <p className="text-white/80">Proven track record in Memphis</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="tel:9014102020" 
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Call (901) 410-2020
                </a>
                <Link 
                  href="/memphis-dj-pricing-guide"
                  className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  View Package Details
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Related Memphis DJ Resources</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Link 
                  href="/blog/how-to-choose-wedding-dj-memphis-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    How to Choose the Right Wedding DJ
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Complete guide to selecting the perfect Memphis wedding DJ with expert tips and red flags to avoid.
                  </p>
                </Link>

                <Link 
                  href="/memphis-dj-services"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Memphis DJ Services Overview
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Explore our complete range of professional DJ services for weddings, corporate events, and celebrations.
                  </p>
                </Link>

                <Link 
                  href="/blog/memphis-wedding-songs-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Best Memphis Wedding Songs 2025
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Popular wedding music and Memphis favorites for your ceremony, reception, and special moments.
                  </p>
                </Link>

                <Link 
                  href="/best-wedding-dj-memphis"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Why Choose M10 DJ Company
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Learn why Memphis couples consistently choose us for their most important celebrations.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6 text-gray-900">Ready to Discuss Your Memphis Event?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get a personalized quote for professional DJ services that fit your budget and exceed your expectations.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
      
      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How much does a DJ cost in Memphis?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Professional DJ services in Memphis typically range from $595-$1,195 depending on event duration, equipment needs, and venue requirements. Most wedding receptions cost $695-$895 for 6-8 hours of professional service."
                }
              },
              {
                "@type": "Question", 
                "name": "What affects Memphis DJ pricing?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The main factors affecting DJ pricing in Memphis are event duration, equipment requirements, venue location and setup complexity, date and season, and additional services like uplighting or ceremony music."
                }
              },
              {
                "@type": "Question",
                "name": "Are expensive DJs worth the investment?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Professional DJs invest in high-quality equipment, backup systems, liability insurance, and years of experience. This ensures reliable performance and reduces the risk of equipment failure or poor service that could affect your event."
                }
              }
            ]
          })
        }}
      />
    </>
  );
}