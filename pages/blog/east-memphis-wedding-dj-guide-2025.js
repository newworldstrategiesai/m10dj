import Head from 'next/head';
import Link from 'next/link';
import { Calendar, MapPin, Users, Music, Award, Phone, ChevronRight, Heart, Star, Clock, CheckCircle } from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { scrollToContact } from '../../utils/scroll-helpers';

export default function EastMemphisWeddingDJGuide2025() {
  const venues = [
    {
      name: "The Racquet Club of Memphis",
      location: "5111 Sanderlin Ave",
      capacity: "300 guests",
      highlights: ["Grand ballroom", "Outdoor terrace", "Elegant atmosphere"],
      djConsiderations: "Large space requires powerful sound system and strategic speaker placement for optimal coverage."
    },
    {
      name: "Memphis Country Club", 
      location: "4685 Chickasaw Country Club Dr",
      capacity: "200 guests",
      highlights: ["Clubhouse ballroom", "Golf course views", "Upscale setting"],
      djConsiderations: "Intimate setting calls for refined music selection and wireless microphone capabilities."
    },
    {
      name: "White Station Tower",
      location: "5050 Poplar Ave", 
      capacity: "150 guests",
      highlights: ["City views", "Modern facilities", "Corporate-style venue"],
      djConsiderations: "Modern venue with built-in A/V requires equipment compatibility and professional setup."
    }
  ];

  const neighborhoods = [
    {
      name: "Poplar Corridor",
      description: "Premium shopping and dining district",
      weddingStyle: "Upscale, sophisticated celebrations",
      venues: ["White Station area venues", "Private clubs", "Hotel ballrooms"]
    },
    {
      name: "White Station",
      description: "Established residential area with country clubs",  
      weddingStyle: "Traditional, elegant receptions",
      venues: ["Memphis Country Club", "Private residences", "Community centers"]
    },
    {
      name: "Hickory Hill",
      description: "Diverse community with various event spaces",
      weddingStyle: "Family-focused, multicultural weddings", 
      venues: ["Community centers", "Churches", "Reception halls"]
    }
  ];

  const musicStyles = [
    {
      style: "Classic Elegance",
      description: "Timeless hits perfect for country club receptions",
      examples: ["Frank Sinatra", "Ella Fitzgerald", "Michael Bublé", "Norah Jones"],
      venues: "Perfect for Memphis Country Club and Racquet Club events"
    },
    {
      style: "Contemporary Mix",
      description: "Modern hits that appeal to all generations",
      examples: ["Ed Sheeran", "John Legend", "Adele", "Bruno Mars"],
      venues: "Ideal for White Station Tower and modern venues"
    },
    {
      style: "Southern Soul",
      description: "Memphis music heritage with a wedding twist",
      examples: ["Al Green", "Otis Redding", "B.B. King", "Elvis Presley"],
      venues: "Celebrated across all East Memphis venues"
    }
  ];

  return (
    <>
      <Head>
        <title>East Memphis Wedding DJ Guide 2025 | Best Wedding DJs East Memphis TN</title>
        <meta 
          name="description" 
          content="Complete guide to East Memphis wedding DJ services in 2025. Find the perfect DJ for Racquet Club, Memphis Country Club, and other premier East Memphis venues. Expert tips, pricing, and planning advice."
        />
        <meta name="keywords" content="East Memphis wedding DJ, wedding DJ East Memphis TN, East Memphis wedding DJs, Memphis Country Club DJ, Racquet Club wedding DJ, White Station wedding DJ, East Memphis wedding music" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog/east-memphis-wedding-dj-guide-2025" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="East Memphis Wedding DJ Guide 2025 | Best Wedding DJs East Memphis TN" />
        <meta property="og:description" content="Complete guide to East Memphis wedding DJ services. Expert advice for planning the perfect wedding entertainment at East Memphis venues." />
        <meta property="og:url" content="https://m10djcompany.com/blog/east-memphis-wedding-dj-guide-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Article Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "East Memphis Wedding DJ Guide 2025",
              "description": "Complete guide to East Memphis wedding DJ services in 2025",
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
                "@id": "https://m10djcompany.com/blog/east-memphis-wedding-dj-guide-2025"
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
                  <Heart className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                East Memphis Wedding DJ Guide 2025
              </h1>
              <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto">
                Everything you need to know about hiring the perfect wedding DJ for your East Memphis celebration. From venue considerations to music selection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Get Wedding Quote
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
            
            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-xl text-gray-600 mb-8">
                Planning a wedding in East Memphis means you have access to some of Tennessee's most prestigious venues, from country clubs to modern event spaces. But with great venues comes the need for exceptional entertainment that matches the sophistication of your location.
              </p>
              
              <p className="text-gray-600 mb-8">
                As Memphis's premier wedding DJ company with extensive experience in East Memphis venues, we've compiled this comprehensive guide to help you plan the perfect wedding entertainment for your special day.
              </p>
            </div>

            {/* Top East Memphis Wedding Venues */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Top East Memphis Wedding Venues for DJ Services</h2>
              
              <div className="space-y-8">
                {venues.map((venue, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{venue.name}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{venue.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600 mb-4">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{venue.capacity}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Venue Highlights</h4>
                        <ul className="space-y-2">
                          {venue.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-center text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">DJ Considerations</h4>
                        <p className="text-gray-600">{venue.djConsiderations}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* East Memphis Neighborhoods */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">East Memphis Neighborhoods & Wedding Styles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {neighborhoods.map((neighborhood, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{neighborhood.name}</h3>
                    <p className="text-gray-600 mb-4">{neighborhood.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Wedding Style</h4>
                      <p className="text-gray-600 text-sm">{neighborhood.weddingStyle}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Common Venues</h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        {neighborhood.venues.map((venue, idx) => (
                          <li key={idx}>• {venue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Music Styles */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Popular Music Styles for East Memphis Weddings</h2>
              
              <div className="space-y-6">
                {musicStyles.map((style, index) => (
                  <div key={index} className="bg-amber-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{style.style}</h3>
                    <p className="text-gray-600 mb-4">{style.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Featured Artists</h4>
                        <div className="flex flex-wrap gap-2">
                          {style.examples.map((artist, idx) => (
                            <span key={idx} className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm">
                              {artist}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Best For</h4>
                        <p className="text-gray-600 text-sm">{style.venues}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* East Memphis Wedding DJ Pricing */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">East Memphis Wedding DJ Pricing 2025</h2>
              
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-amber-600 mb-2">Essential Package</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">$750</p>
                    <ul className="text-gray-600 space-y-2 text-left">
                      <li>• 6 hours of DJ service</li>
                      <li>• Professional sound system</li>
                      <li>• Wireless microphone</li>
                      <li>• Music consultation</li>
                      <li>• Basic lighting</li>
                    </ul>
                  </div>
                  
                  <div className="text-center border-2 border-amber-500 rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                    <h3 className="text-2xl font-bold text-amber-600 mb-2">Premium Package</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">$1,200</p>
                    <ul className="text-gray-600 space-y-2 text-left">
                      <li>• 8 hours of DJ service</li>
                      <li>• Premium sound system</li>
                      <li>• Multiple microphones</li>
                      <li>• MC services</li>
                      <li>• LED uplighting</li>
                      <li>• Online planning portal</li>
                    </ul>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-amber-600 mb-2">Luxury Package</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">$1,800</p>
                    <ul className="text-gray-600 space-y-2 text-left">
                      <li>• 10 hours of service</li>
                      <li>• Premium sound + backup</li>
                      <li>• Full MC services</li>
                      <li>• Ceremony music</li>
                      <li>• Full uplighting package</li>
                      <li>• Photo booth add-on available</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-600 mb-4">
                    <strong>East Memphis venues often require premium packages</strong> due to their size and sophistication. Country club weddings typically start at our Premium Package level.
                  </p>
                  <Link href="/dj-east-memphis-tn" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold">
                    View detailed East Memphis DJ services
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Planning Timeline */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">East Memphis Wedding DJ Planning Timeline</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    12
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">12 Months Before: Book Your DJ</h3>
                    <p className="text-gray-600">Popular East Memphis wedding dates book quickly, especially at venues like Memphis Country Club and The Racquet Club. Secure your DJ early to ensure availability.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    6
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6 Months Before: Venue Coordination</h3>
                    <p className="text-gray-600">Coordinate with your East Memphis venue about setup requirements, power access, and noise restrictions. Each venue has unique considerations.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3 Months Before: Music Planning</h3>
                    <p className="text-gray-600">Begin detailed music planning, considering your venue's atmosphere and guest demographics. East Memphis crowds often appreciate a mix of classic and contemporary hits.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1 Month Before: Final Details</h3>
                    <p className="text-gray-600">Finalize timeline, special requests, and do-not-play lists. Confirm setup times with your East Memphis venue coordinator.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Why Choose M10 DJ */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose M10 DJ Company for Your East Memphis Wedding?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">East Memphis Venue Expertise</h3>
                      <p className="text-gray-600">We've performed at every major East Memphis wedding venue and understand the unique acoustics and requirements of each location.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Premium Equipment</h3>
                      <p className="text-gray-600">Professional-grade sound systems and lighting packages that match the sophistication of East Memphis venues.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Reliable Service</h3>
                      <p className="text-gray-600">Always on time, professionally dressed, and prepared for East Memphis's upscale wedding environments.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">East Memphis Wedding Success</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="ml-2 text-gray-600">200+ East Memphis weddings</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="ml-2 text-gray-600">5-star average rating</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="ml-2 text-gray-600">100% satisfaction guarantee</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="ml-2 text-gray-600">Preferred vendor at top venues</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Book Your East Memphis Wedding DJ?</h2>
              <p className="text-xl mb-6">
                Let's make your East Memphis wedding unforgettable with professional DJ services tailored to your venue and style.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/dj-east-memphis-tn"
                  className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
                >
                  View East Memphis Services
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