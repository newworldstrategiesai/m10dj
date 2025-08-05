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
  GraduationCap
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';
import { BreadcrumbListSchema } from '../components/StandardSchema';

const pricingTiers = [
  {
    name: "Essential Package",
    price: "$395-495",
    duration: "4 hours",
    description: "Perfect for intimate gatherings and smaller celebrations",
    features: [
      "Professional DJ with music library",
      "Basic sound system (up to 100 guests)",
      "Wireless microphone",
      "Event coordination",
      "Music requests taken",
      "Basic lighting included"
    ],
    eventTypes: ["Small birthday parties", "Intimate anniversary celebrations", "Small corporate events", "Graduation parties"],
    popular: false,
    savings: null
  },
  {
    name: "Premium Package",
    price: "$595-795",
    duration: "6 hours",
    description: "Our most popular choice for Memphis weddings and events",
    features: [
      "Experienced professional DJ",
      "Premium sound system (up to 200 guests)",
      "Wireless microphones (2)",
      "MC services & announcements",
      "Custom playlist creation",
      "Dance floor lighting",
      "Ceremony music (if applicable)",
      "Event timeline coordination"
    ],
    eventTypes: ["Wedding receptions", "Corporate galas", "Large birthday parties", "Anniversary celebrations"],
    popular: true,
    savings: "Most Popular Choice"
  },
  {
    name: "Platinum Package",
    price: "$895-1,195",
    duration: "8 hours",
    description: "Complete entertainment solution for premier Memphis events",
    features: [
      "Top-tier professional DJ",
      "Premium sound system (200+ guests)",
      "Wireless microphones (3+)",
      "Professional MC services",
      "Custom music curation",
      "Full uplighting package",
      "Dance floor lighting effects",
      "Ceremony & cocktail music",
      "Photo booth coordination",
      "Vendor timeline management"
    ],
    eventTypes: ["Luxury weddings", "Corporate galas", "Major celebrations", "Multi-event packages"],
    popular: false,
    savings: "Best Value"
  }
];

const costFactors = [
  {
    icon: Clock,
    title: "Event Duration",
    description: "Most Memphis DJ bookings are 4-8 hours",
    impact: "Major Factor",
    details: "Each additional hour: $75-125"
  },
  {
    icon: Users,
    title: "Guest Count",
    description: "Determines sound system requirements",
    impact: "Significant Factor", 
    details: "50-100 guests: Basic | 100-200: Premium | 200+: Enhanced"
  },
  {
    icon: Calendar,
    title: "Date & Season",
    description: "Peak wedding season affects availability",
    impact: "Moderate Factor",
    details: "May-October: Peak pricing | Nov-April: Standard rates"
  },
  {
    icon: Building,
    title: "Venue Requirements",
    description: "Some Memphis venues require specific equipment",
    impact: "Variable Factor",
    details: "Outdoor events may require additional power/weather protection"
  },
  {
    icon: Music,
    title: "Special Requests",
    description: "Custom services increase value",
    impact: "Add-on Factor",
    details: "Live musician coordination, special effects, extended setup"
  },
  {
    icon: Award,
    title: "Experience Level",
    description: "Professional vs. amateur DJs",
    impact: "Quality Factor",
    details: "Professional DJs: $400-1200 | Amateur DJs: $200-400"
  }
];

const comparisonData = [
  {
    service: "Professional DJ (M10 DJ Company)",
    priceRange: "$395-1,195",
    includes: "DJ, Sound, Mics, Lighting, MC Services",
    pros: ["Professional experience", "Quality equipment", "Event coordination", "Insurance coverage"],
    cons: ["Higher investment than amateur options"]
  },
  {
    service: "Amateur/Part-time DJ",
    priceRange: "$200-500", 
    includes: "Basic DJ, Simple sound system",
    pros: ["Lower cost", "May be available last-minute"],
    cons: ["Limited experience", "Basic equipment", "No backup plans", "No insurance"]
  },
  {
    service: "Live Band",
    priceRange: "$800-3,000",
    includes: "Live musicians, Sound system",
    pros: ["Live music experience", "Can be very engaging"],
    cons: ["Much higher cost", "Less music variety", "Longer setup", "Weather dependent"]
  },
  {
    service: "Playlist/DIY Setup",
    priceRange: "$50-200",
    includes: "Speaker rental, Music streaming",
    pros: ["Very low cost", "Full music control"],
    cons: ["No professional oversight", "Technical issues likely", "No MC services", "No event flow management"]
  }
];

const realWorldExamples = [
  {
    eventType: "Memphis Wedding Reception",
    guestCount: 150,
    duration: "6 hours",
    venue: "The Peabody Memphis",
    package: "Premium Package",
    totalCost: "$795",
    breakdown: {
      baseCost: "$695",
      venueRequirements: "$50",
      seasonalPeak: "$50"
    },
    notes: "Included ceremony music, cocktail hour, and reception with full uplighting"
  },
  {
    eventType: "Corporate Holiday Party",
    guestCount: 200,
    duration: "4 hours",
    venue: "Memphis Cook Convention Center",
    package: "Premium Package",
    totalCost: "$695",
    breakdown: {
      baseCost: "$595",
      largeVenue: "$100",
      corporateRate: "$0"
    },
    notes: "Background music, presentation support, and award ceremony audio"
  },
  {
    eventType: "50th Anniversary Party",
    guestCount: 75,
    duration: "5 hours",
    venue: "Private Residence, Germantown",
    package: "Essential Plus",
    totalCost: "$495",
    breakdown: {
      baseCost: "$395",
      extraHour: "$75",
      outdoorSetup: "$25"
    },
    notes: "Mix of classic hits spanning 5 decades with special anniversary presentations"
  }
];

const budgetTips = [
  {
    tip: "Book During Off-Peak Season",
    savings: "10-15%",
    description: "November through April typically offer the best rates for Memphis DJ services"
  },
  {
    tip: "Consider Weekday Events",
    savings: "15-20%",
    description: "Friday and Sunday events often cost less than Saturday celebrations"
  },
  {
    tip: "Package Multiple Services",
    savings: "10-25%",
    description: "Combining ceremony, cocktail hour, and reception music can reduce overall costs"
  },
  {
    tip: "Book Early",
    savings: "5-10%",
    description: "Booking 6+ months in advance often qualifies for early bird discounts"
  },
  {
    tip: "Choose Standard Packages",
    savings: "Avoid extras",
    description: "Custom add-ons increase costs - standard packages offer the best value"
  }
];

const faqs = [
  {
    question: "How much does a wedding DJ cost in Memphis?",
    answer: "Memphis wedding DJ costs typically range from $595-895 for most receptions. This includes 6 hours of professional DJ services, premium sound system, wireless microphones, MC services, and basic lighting. Factors like guest count, venue requirements, and season can affect the final price."
  },
  {
    question: "What's included in Memphis DJ pricing?",
    answer: "Professional DJ services include the DJ, sound system, wireless microphones, basic lighting, music library access, event coordination, and MC services. Premium packages add uplighting, extended hours, ceremony music, and additional equipment."
  },
  {
    question: "Are there extra costs I should know about?",
    answer: "Most packages are all-inclusive, but potential extras include: additional hours ($75-125/hour), travel beyond 30 miles ($50-100), special equipment for unique venues, and premium add-ons like photo booth coordination or live musician integration."
  },
  {
    question: "How do Memphis DJ prices compare to other cities?",
    answer: "Memphis DJ pricing is competitive with similar markets. We're typically 15-25% less expensive than Nashville or Atlanta, while offering the same professional quality and experience. Our local knowledge of Memphis venues also adds significant value."
  },
  {
    question: "When is the best time to book to get the best price?",
    answer: "Book 6-12 months in advance for the best rates and availability. Off-peak season (November-April) and weekday events offer the most savings. Last-minute bookings (under 30 days) may have limited availability and higher rates."
  },
  {
    question: "Do you offer payment plans for Memphis DJ services?",
    answer: "Yes! We offer flexible payment options including 50% deposit to secure your date with the balance due 30 days before your event. We accept cash, check, and all major credit cards for your convenience."
  },
  {
    question: "What makes professional DJ pricing worth it vs. cheaper options?",
    answer: "Professional DJs provide reliability, quality equipment, event experience, backup plans, and insurance coverage. While cheaper options exist, professional DJs ensure your event runs smoothly with high-quality sound and experienced event management."
  }
];

export default function MemphisDJPricingGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedExample, setSelectedExample] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Memphis DJ Cost & Pricing Guide 2025 | Wedding & Event DJ Prices | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Complete Memphis DJ pricing guide 2025. Wedding DJ costs $595-895, corporate events $495-795. Compare packages, get accurate Memphis DJ prices & save money. Free quotes available!" 
        />
        <meta name="keywords" content="Memphis DJ cost, Memphis DJ prices, wedding DJ cost Memphis, how much does a DJ cost Memphis, DJ pricing Memphis, Memphis DJ rates, event DJ cost Memphis, corporate DJ pricing Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/memphis-dj-pricing-guide" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis DJ Cost & Pricing Guide 2025 | Complete DJ Pricing" />
        <meta property="og:description" content="Transparent Memphis DJ pricing guide with real costs, packages, and money-saving tips. Wedding DJs from $595, corporate events from $495. Get accurate quotes!" />
        <meta property="og:url" content="https://m10djcompany.com/memphis-dj-pricing-guide" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Memphis DJ Cost & Pricing Guide 2025",
              "description": "Complete Memphis DJ pricing guide with transparent costs, packages, and booking information",
              "url": "https://m10djcompany.com/memphis-dj-pricing-guide",
              "mainEntity": {
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                  "@type": "Question",
                  "name": faq.question,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                  }
                }))
              },
                              "about": {
                "@type": "EntertainmentBusiness",
                "name": "M10 DJ Company",
                "description": "Professional DJ services in Memphis, TN with 15+ years experience",
                "telephone": "+19014102020",
                "email": "booking@m10djcompany.com",
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
                "priceRange": "$395-$1195",
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
                      "name": "Jennifer Martinez"
                    },
                    "datePublished": "2024-11-10",
                    "reviewBody": "Excellent value for professional DJ services! M10 provided transparent pricing and exceeded our expectations for our corporate event.",
                    "reviewRating": {
                      "@type": "Rating",
                      "ratingValue": "5",
                      "bestRating": "5",
                      "worstRating": "1"
                    }
                  }
                ],
                "serviceArea": {
                  "@type": "City",
                  "name": "Memphis",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                }
              },
              "offers": pricingTiers.map(tier => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": tier.name,
                  "description": tier.description,
                  "category": "DJ Services"
                },
                "priceSpecification": {
                  "@type": "PriceSpecification",
                  "price": tier.price.replace(/\$|\-.*$/g, ''),
                  "priceCurrency": "USD",
                  "valueAddedTaxIncluded": true
                },
                "availability": "https://schema.org/InStock",
                "validFrom": "2024-01-01"
              }))
            }),
          }}
        />

        {/* Breadcrumb Schema */}
        <BreadcrumbListSchema 
          breadcrumbs={[
            { name: "Home", url: "https://m10djcompany.com" },
            { name: "Memphis DJ Pricing Guide", url: "https://m10djcompany.com/memphis-dj-pricing-guide" }
          ]}
        />
      </Head>

      <Header />

      <main className="min-h-screen">
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-brand via-brand-dark to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="section-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              
              <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <div className="flex items-center justify-center mb-6">
                  <Calculator className="w-8 h-8 text-brand-gold mr-3" />
                  <span className="text-brand-gold font-semibold text-lg">Transparent Pricing</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                  <span className="block">Memphis DJ</span>
                  <span className="block text-brand-gold">Pricing Guide 2025</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Complete cost breakdown for Memphis wedding and event DJ services. Real prices, 
                  package comparisons, and money-saving tips from Memphis's trusted DJ company.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                  <button 
                    onClick={scrollToContact}
                    className="bg-brand-gold text-black hover:bg-yellow-400 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Get Free Quote
                  </button>
                  <a 
                    href="#pricing-packages" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    View Pricing
                  </a>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">$595</div>
                    <div className="text-white font-semibold">Average Wedding</div>
                    <div className="text-gray-300 text-sm">Most popular package</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">$495</div>
                    <div className="text-white font-semibold">Corporate Events</div>
                    <div className="text-gray-300 text-sm">Professional service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">6hrs</div>
                    <div className="text-white font-semibold">Average Duration</div>
                    <div className="text-gray-300 text-sm">Standard package</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-gold">$0</div>
                    <div className="text-white font-semibold">Hidden Fees</div>
                    <div className="text-gray-300 text-sm">Transparent pricing</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing Packages Section */}
        <section id="pricing-packages" className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Memphis DJ Service Packages & Pricing</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Transparent, all-inclusive pricing with no hidden fees. Choose the package that fits your Memphis event perfectly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {pricingTiers.map((tier, index) => (
                  <div 
                    key={index} 
                    className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                      tier.popular ? 'ring-2 ring-brand scale-105' : ''
                    }`}
                  >
                    <div className="text-center mb-6">
                      {tier.popular && (
                        <span className="bg-brand text-white px-4 py-2 rounded-full text-sm font-bold mb-4 inline-block">
                          Most Popular
                        </span>
                      )}
                      {tier.savings && !tier.popular && (
                        <span className="bg-brand-gold text-black px-4 py-2 rounded-full text-sm font-bold mb-4 inline-block">
                          {tier.savings}
                        </span>
                      )}
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                      <div className="text-4xl font-bold text-brand mb-2">{tier.price}</div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">{tier.duration} • {tier.description}</div>
                    </div>
                    
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">What's Included:</h4>
                      <ul className="space-y-2">
                        {tier.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-brand mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Perfect For:</h4>
                      <div className="flex flex-wrap gap-2">
                        {tier.eventTypes.map((eventType, eIndex) => (
                          <span key={eIndex} className="bg-brand/10 text-brand px-2 py-1 rounded text-xs">
                            {eventType}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={scrollToContact}
                      className={`w-full py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center ${
                        tier.popular 
                          ? 'bg-brand text-white hover:bg-brand-dark' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Get Quote
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Cost Factors Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">What Affects Memphis DJ Pricing?</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Understanding the factors that influence DJ costs helps you budget accurately and get the best value for your Memphis event
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {costFactors.map((factor, index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <factor.icon className="w-8 h-8 text-brand mr-3" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{factor.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          factor.impact === 'Major Factor' ? 'bg-red-100 text-red-800' :
                          factor.impact === 'Significant Factor' ? 'bg-orange-100 text-orange-800' :
                          factor.impact === 'Moderate Factor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {factor.impact}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                      {factor.description}
                    </p>
                    
                    <div className="text-sm text-brand font-semibold">
                      {factor.details}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Real World Examples Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Real Memphis DJ Pricing Examples</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  See actual costs for recent Memphis events to understand realistic pricing for your celebration
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {realWorldExamples.map((example, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{example.eventType}</h3>
                      <div className="text-2xl font-bold text-brand mb-2">{example.totalCost}</div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{example.guestCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{example.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Venue:</span>
                        <span className="text-gray-900 dark:text-white font-semibold text-right">{example.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Package:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{example.package}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Cost Breakdown:</h4>
                      {Object.entries(example.breakdown).map(([key, value], bIndex) => (
                        <div key={bIndex} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-gray-900 dark:text-white">{value}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {example.notes}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Memphis DJ Cost Comparison</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Compare professional DJ services with other Memphis entertainment options to make an informed decision
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-6 font-bold text-gray-900 dark:text-white">Service Type</th>
                      <th className="text-left p-6 font-bold text-gray-900 dark:text-white">Price Range</th>
                      <th className="text-left p-6 font-bold text-gray-900 dark:text-white">What's Included</th>
                      <th className="text-left p-6 font-bold text-gray-900 dark:text-white">Pros & Cons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((item, index) => (
                      <tr key={index} className={`border-b border-gray-100 dark:border-gray-800 ${index === 0 ? 'bg-brand/5' : ''}`}>
                        <td className="p-6">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.service}
                            {index === 0 && <span className="ml-2 text-xs bg-brand text-white px-2 py-1 rounded-full">Recommended</span>}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="font-bold text-brand">{item.priceRange}</div>
                        </td>
                        <td className="p-6">
                          <div className="text-gray-600 dark:text-gray-300 text-sm">{item.includes}</div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-2">
                            <div>
                              <div className="text-green-600 text-sm font-semibold mb-1">Pros:</div>
                              <ul className="text-xs space-y-1">
                                {item.pros.map((pro, pIndex) => (
                                  <li key={pIndex} className="text-gray-600 dark:text-gray-300">• {pro}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-red-600 text-sm font-semibold mb-1">Cons:</div>
                              <ul className="text-xs space-y-1">
                                {item.cons.map((con, cIndex) => (
                                  <li key={cIndex} className="text-gray-600 dark:text-gray-300">• {con}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </section>

        {/* Money-Saving Tips Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">Money-Saving Tips for Memphis DJ Services</h2>
                <p className="text-xl text-gray-200">
                  Smart strategies to get the best value for your Memphis event entertainment budget
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {budgetTips.map((tip, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-brand-gold text-black rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4">
                        {tip.savings}
                      </div>
                      <h3 className="text-xl font-bold">{tip.tip}</h3>
                    </div>
                    
                    <p className="text-gray-200 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Ready to Get Your Custom Quote?</h3>
                  <p className="text-xl mb-6">
                    Get accurate pricing for your specific Memphis event with our free, no-obligation quote
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="tel:(901) 410-2020"
                      className="bg-brand-gold text-black hover:bg-yellow-400 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call (901) 410-2020
                    </a>
                    <button 
                      onClick={scrollToContact}
                      className="border-2 border-white text-white hover:bg-white hover:text-brand px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Get Free Quote
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Memphis DJ Pricing FAQ</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Common questions about DJ costs, packages, and booking in Memphis
                </p>
              </div>

              <div className="space-y-8">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-start">
                      <DollarSign className="w-6 h-6 text-brand mr-3 mt-1 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-9">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Have specific questions about pricing for your Memphis event?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="tel:(901) 410-2020"
                    className="btn-primary flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call (901) 410-2020
                  </a>
                  <button 
                    onClick={scrollToContact}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Get Custom Quote
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Explore Memphis DJ Services</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Discover our specialized services and coverage areas throughout Memphis and surrounding communities
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Wedding DJ Services */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Wedding DJ Services</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Complete wedding entertainment with ceremony, cocktail hour, and reception coverage.
                  </p>
                  <Link href="/memphis-wedding-dj" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors text-sm">
                    Memphis Wedding DJs <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </div>
                
                {/* Corporate Events */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                    <Building className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Corporate DJ Services</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Professional entertainment for business events, conferences, and corporate celebrations.
                  </p>
                  <Link href="/memphis-event-dj-services" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors text-sm">
                    Corporate Services <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </div>
                
                {/* DJ Near Me */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Find Local DJ</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Looking for a DJ near your location? Explore our Memphis area coverage and availability.
                  </p>
                  <Link href="/dj-near-me-memphis" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors text-sm">
                    DJ Near Me <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </div>
                
                {/* Premium Locations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Premium Locations</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Specialized DJ services for Memphis suburbs including luxury venues and community celebrations.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href="/dj-germantown-tn" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors text-sm">
                      DJ Germantown TN <ChevronRight className="ml-1 w-3 h-3" />
                    </Link>
                    <Link href="/dj-collierville-tn" className="inline-flex items-center text-brand font-semibold hover:text-brand-600 transition-colors text-sm">
                      DJ Collierville TN <ChevronRight className="ml-1 w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Book Your Memphis DJ?</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Get started with your free consultation and custom pricing quote
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/dj-ben-murray" className="btn-secondary flex items-center justify-center">
                      <Users className="w-5 h-5 mr-2" />
                      Meet Your DJ
                    </Link>
                    <button 
                      onClick={scrollToContact}
                      className="btn-primary flex items-center justify-center"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Get Free Quote
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-800">
          <ContactForm />
        </section>

      </main>

      <Footer />
    </>
  );
}