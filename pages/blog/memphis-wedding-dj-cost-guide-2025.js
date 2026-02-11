import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  DollarSign, 
  Clock, 
  Users, 
  Music, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Calendar,
  MapPin,
  Volume2,
  Lightbulb,
  Award
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import { scrollToContact } from '../../utils/scroll-helpers';

const costFactors = [
  {
    icon: Clock,
    title: "Event Duration",
    description: "4-6 hours: $695-$899 | 6-8 hours: $999-$1,299 | 8+ hours: $1,399-$1,899",
    impact: "High"
  },
  {
    icon: Users,
    title: "Guest Count",
    description: "Smaller venues require less equipment, while 200+ guest events need premium sound systems",
    impact: "Medium"
  },
  {
    icon: Music,
    title: "Services Included",
    description: "DJ only vs. DJ + MC + ceremony music + uplighting affects pricing significantly",
    impact: "High"
  },
  {
    icon: MapPin,
    title: "Venue Location",
    description: "Downtown Memphis vs. suburban venues may have different setup requirements",
    impact: "Low"
  },
  {
    icon: Calendar,
    title: "Wedding Date",
    description: "Peak season (May-October) and Saturdays command premium pricing",
    impact: "Medium"
  },
  {
    icon: Volume2,
    title: "Equipment Needed",
    description: "Basic sound vs. premium systems with wireless mics and dance lighting",
    impact: "Medium"
  }
];

const packageComparison = [
  {
    name: "Basic Memphis Wedding DJ",
    price: "$695-$899",
    duration: "4-6 hours",
    includes: [
      "Professional DJ service",
      "Basic sound system",
      "Music consultation",
      "Basic lighting"
    ],
    missing: [
      "MC services",
      "Ceremony sound",
      "Premium equipment",
      "Backup systems"
    ]
  },
  {
    name: "Standard Memphis Wedding DJ",
    price: "$999-$1,299", 
    duration: "6-8 hours",
    popular: true,
    includes: [
      "Professional DJ service",
      "MC & announcements",
      "Ceremony sound system",
      "Reception entertainment",
      "Premium sound equipment",
      "Basic uplighting",
      "Music consultation",
      "Timeline coordination"
    ],
    missing: [
      "Dance floor lighting",
      "Backup DJ",
      "Special effects"
    ]
  },
  {
    name: "Premium Memphis Wedding DJ",
    price: "$1,399-$1,899",
    duration: "8-10 hours",
    includes: [
      "Professional DJ service",
      "Master of ceremonies",
      "Ceremony & cocktail music",
      "Reception entertainment",
      "Premium sound systems",
      "Custom uplighting design",
      "Dance floor lighting",
      "Wireless microphones (4-6)",
      "Backup equipment",
      "Detailed planning",
      "Special effects lighting"
    ],
    missing: []
  }
];

const memphisVenues = [
  { name: "The Peabody Memphis", range: "$1,200-$1,600", notes: "Premium venue requiring top-tier equipment" },
  { name: "Dixon Gallery & Gardens", range: "$1,000-$1,400", notes: "Outdoor/indoor combo, weather backup needed" },
  { name: "Memphis Hunt & Country Club", range: "$1,100-$1,500", notes: "Large ballroom, premium sound required" },
  { name: "The Columns", range: "$900-$1,300", notes: "Historic venue with unique setup requirements" },
  { name: "Memphis Botanic Garden", range: "$800-$1,200", notes: "Outdoor ceremony, reception flexibility" },
  { name: "AutoZone Park", range: "$1,300-$1,700", notes: "Large venue, extensive equipment needed" }
];

const costSavingTips = [
  {
    tip: "Book During Off-Peak Season",
    savings: "10-20%",
    description: "November-April weddings often have lower DJ rates"
  },
  {
    tip: "Choose Friday or Sunday",
    savings: "15-25%", 
    description: "Saturday premiums can add $200-$400 to your Memphis wedding DJ cost"
  },
  {
    tip: "Reduce Event Hours",
    savings: "20-30%",
    description: "6 hours vs. 8 hours can save $300-$500"
  },
  {
    tip: "Bundle Services",
    savings: "10-15%",
    description: "DJ + MC + lighting packages cost less than separate bookings"
  },
  {
    tip: "Book Early",
    savings: "5-10%",
    description: "12+ months advance booking may qualify for early bird discounts"
  }
];

export default function MemphisWeddingDJCostGuide2025() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Memphis Wedding DJ Cost Guide 2025 | Wedding DJ Prices Memphis TN</title>
        <meta 
          name="description" 
          content="Complete guide to Memphis wedding DJ costs in 2025. Compare packages, understand pricing factors, and find the best value for your Tennessee wedding. Average cost: $999-$1,299." 
        />
        <meta name="keywords" content="Memphis wedding DJ cost, wedding DJ prices Memphis, Memphis DJ pricing, how much wedding DJ Memphis, Memphis wedding DJ packages, Tennessee wedding DJ cost" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog/memphis-wedding-dj-cost-guide-2025" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis Wedding DJ Cost Guide 2025 | Wedding DJ Prices Memphis TN" />
        <meta property="og:description" content="Complete guide to Memphis wedding DJ costs with package comparisons and money-saving tips for Tennessee couples." />
        <meta property="og:url" content="https://m10djcompany.com/blog/memphis-wedding-dj-cost-guide-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Article Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Memphis Wedding DJ Cost Guide 2025",
              "description": "Complete guide to Memphis wedding DJ costs with package comparisons and pricing factors",
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
              "datePublished": "2024-12-01",
              "dateModified": "2024-12-01"
            })
          }}
        />
      </Head>

      <Header />

      <main className="bg-white dark:bg-zinc-950">
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold">2025 Pricing Guide</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                <span className="block text-white">Memphis Wedding DJ</span>
                <span className="block text-gradient">Cost Guide 2025</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Everything Memphis couples need to know about wedding DJ costs, package options, and how to get 
                the best value for your Tennessee wedding celebration.
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Quick Answer</h3>
                <p className="text-lg text-gray-200 mb-4">
                  Memphis wedding DJ services typically cost <strong className="text-brand-gold">$999-$1,299</strong> for a standard 
                  6-8 hour package including DJ, MC, and basic lighting.
                </p>
                <div className="text-sm text-gray-300">
                  *Prices vary based on duration, services, and venue requirements
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cost Overview Section */}
        <section className="py-24 bg-white dark:bg-zinc-950">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4 text-gray-900 dark:text-white">Memphis Wedding DJ Cost Breakdown</h2>
              <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Understanding what influences Memphis wedding DJ pricing helps you budget effectively 
                and choose the right package for your Tennessee wedding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {costFactors.map((factor, index) => (
                <div key={index} className="card text-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 shadow-lg">
                  <factor.icon className="w-12 h-12 text-brand mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{factor.title}</h3>
                  <p className="text-gray-600 dark:text-zinc-400 mb-4">{factor.description}</p>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    factor.impact === 'High' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
                    factor.impact === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' :
                    'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                  }`}>
                    {factor.impact} Impact
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Package Comparison */}
        <section className="py-24 bg-gray-50 dark:bg-zinc-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4 text-gray-900 dark:text-white">Memphis Wedding DJ Package Comparison</h2>
              <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Compare Memphis wedding DJ packages to find the perfect fit for your budget and wedding needs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {packageComparison.map((pkg, index) => (
                <div key={index} className={`card bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-8 shadow-lg relative ${pkg.popular ? 'ring-2 ring-brand scale-105' : ''}`}>
                  {pkg.popular && (
                    <div className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{pkg.name}</h3>
                    <div className="text-4xl font-bold text-brand mb-2">{pkg.price}</div>
                    <div className="text-gray-600 dark:text-zinc-400 mb-6">{pkg.duration}</div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Includes:
                    </h4>
                    <ul className="space-y-2">
                      {pkg.includes.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mr-2 mt-0.5" />
                          <span className="text-sm text-gray-900 dark:text-zinc-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pkg.missing.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-500 dark:text-zinc-400 mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Not Included:
                      </h4>
                      <ul className="space-y-2">
                        {pkg.missing.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-gray-400 dark:text-zinc-500 mr-2 mt-0.5" />
                            <span className="text-sm text-gray-500 dark:text-zinc-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <button 
                    onClick={scrollToContact}
                    className={`w-full ${pkg.popular ? 'btn-primary' : 'btn-outline'}`}
                  >
                    Get This Package Quote
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Venue-Specific Costs */}
        <section className="py-24 bg-white dark:bg-zinc-950">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4 text-gray-900 dark:text-white">Memphis Wedding Venue DJ Costs</h2>
              <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Different Memphis wedding venues have unique requirements that can affect DJ service pricing.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-zinc-700">
                <div className="bg-brand text-white p-6">
                  <div className="grid grid-cols-3 gap-4 text-center font-semibold">
                    <div>Memphis Venue</div>
                    <div>Typical DJ Cost Range</div>
                    <div>Special Requirements</div>
                  </div>
                </div>
                
                {memphisVenues.map((venue, index) => (
                  <div key={index} className={`grid grid-cols-3 gap-4 p-6 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'}`}>
                    <div className="font-semibold text-gray-900 dark:text-white">{venue.name}</div>
                    <div className="text-brand font-semibold">{venue.range}</div>
                    <div className="text-sm text-gray-600 dark:text-zinc-400">{venue.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                Don't see your Memphis venue? Contact us for a custom quote based on your specific location.
              </p>
              <button onClick={scrollToContact} className="btn-outline">
                Get Venue-Specific Quote
              </button>
            </div>
          </div>
        </section>

        {/* Money-Saving Tips */}
        <section className="py-24 bg-gray-50 dark:bg-zinc-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4 text-gray-900 dark:text-white">How to Save on Memphis Wedding DJ Costs</h2>
              <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Smart strategies to reduce your Memphis wedding DJ expenses without compromising on quality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {costSavingTips.map((tip, index) => (
                <div key={index} className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-zinc-700">
                  <div className="text-center mb-4">
                    <Lightbulb className="w-12 h-12 text-brand mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{tip.tip}</h3>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{tip.savings}</div>
                  </div>
                  <p className="text-gray-600 dark:text-zinc-400 text-center">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Investment Value Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Award className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Why Investing in a Quality Memphis Wedding DJ Matters</h2>
              <p className="text-xl mb-12 opacity-90 max-w-3xl mx-auto">
                Your wedding DJ does more than play music - they orchestrate your entire celebration. 
                Here's why Memphis couples invest in professional DJ services.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Professional Equipment</h3>
                      <p className="opacity-90">Premium sound systems ensure every guest hears your vows and dances to crystal-clear music.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Experienced MC Services</h3>
                      <p className="opacity-90">Professional announcements and timeline coordination keep your Memphis wedding flowing smoothly.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Backup Plans</h3>
                      <p className="opacity-90">Redundant equipment and contingency planning ensure your celebration never misses a beat.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Music Curation</h3>
                      <p className="opacity-90">Expert playlist creation and reading the room to keep your dance floor packed all night.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Stress-Free Experience</h3>
                      <p className="opacity-90">Professional coordination lets you enjoy your Memphis wedding without worrying about entertainment.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Lasting Memories</h3>
                      <p className="opacity-90">A skilled DJ creates magical moments that you and your guests will remember forever.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16">
                <h3 className="text-2xl font-bold mb-4">Ready to Invest in Your Memphis Wedding?</h3>
                <p className="text-lg mb-8 opacity-90">
                  Get a personalized quote for your Memphis wedding DJ services. No hidden fees, transparent pricing.
                </p>
                <button 
                  onClick={scrollToContact}
                  className="bg-white dark:bg-zinc-100 text-brand hover:bg-gray-100 dark:hover:bg-zinc-200 px-8 py-4 rounded-lg font-semibold text-lg transition-colors mr-4"
                >
                  Get Your Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="py-24 bg-gray-50 dark:bg-zinc-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4 text-gray-900 dark:text-white">Planning Your Memphis Wedding?</h2>
              <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto">
                Explore more resources for Memphis couples planning their perfect wedding celebration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link href="/memphis-wedding-dj" className="card text-center group hover:shadow-xl transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6">
                <Music className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Memphis Wedding DJ Services</h3>
                <p className="text-gray-600 dark:text-zinc-400 mb-4">Complete wedding entertainment packages for Memphis couples</p>
                <span className="text-brand font-semibold">Learn More →</span>
              </Link>

              <Link href="/best-wedding-dj-memphis" className="card text-center group hover:shadow-xl transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6">
                <Award className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Best Wedding DJ Memphis</h3>
                <p className="text-gray-600 dark:text-zinc-400 mb-4">Why M10 is Memphis's top-rated wedding DJ service</p>
                <span className="text-brand font-semibold">See Why →</span>
              </Link>

              <Link href="/wedding-dj-memphis-tn" className="card text-center group hover:shadow-xl transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6">
                <MapPin className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Wedding DJ Memphis TN</h3>
                <p className="text-gray-600 dark:text-zinc-400 mb-4">Professional wedding DJs serving Tennessee couples</p>
                <span className="text-brand font-semibold">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <ContactForm />
      </main>

      <Footer />
    </>
  );
}