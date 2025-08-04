import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  MapPin, 
  Users, 
  Star, 
  Calendar, 
  DollarSign, 
  Music, 
  Camera,
  Leaf,
  Building,
  Crown,
  Heart,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import SEO from '../../components/SEO';

export default function TopMemphisWeddingVenues2025() {
  const [selectedVenue, setSelectedVenue] = useState(0);

  useEffect(() => {
    // Add any tracking or analytics here
  }, []);

  const keywords = [
    "top Memphis wedding venues 2025",
    "best wedding venues Memphis",
    "Memphis wedding venues", 
    "wedding venues Memphis TN",
    "Memphis wedding locations",
    "popular Memphis wedding venues",
    "Memphis wedding reception venues",
    "outdoor wedding venues Memphis",
    "luxury wedding venues Memphis",
    "Memphis wedding venue guide"
  ];

  const venues = [
    {
      name: "The Peabody Memphis",
      icon: Crown,
      category: "Luxury Hotel",
      capacity: "300+ guests",
      priceRange: "$$$$$",
      style: "Grand ballrooms, historic elegance",
      highlight: "Famous Peabody Ducks march daily",
      description: "Memphis's most iconic luxury hotel offers several stunning ballroom options with world-class service. The grand ballrooms feature crystal chandeliers, marble floors, and impeccable service that's hosted presidents and celebrities.",
      features: [
        "Multiple ballroom options",
        "Historic downtown location", 
        "Famous duck march tradition",
        "Full-service catering",
        "Guest room accommodations",
        "Experienced event coordination"
      ],
      djConsiderations: [
        "Premium sound setup required for large ballrooms",
        "Strict noise level requirements",
        "Professional equipment essential",
        "Coordination with hotel events team"
      ],
      seasonalTips: "Book 12-18 months in advance, especially for fall and spring dates. Winter weddings offer better availability and potential savings.",
      website: "peabodymemphis.com"
    },
    {
      name: "Memphis Botanic Garden",
      icon: Leaf,
      category: "Outdoor Garden",
      capacity: "200+ guests", 
      priceRange: "$$$",
      style: "Natural beauty, garden settings",
      highlight: "96 acres of stunning gardens",
      description: "Offering eco-friendly celebrations amid beautiful natural settings, the Botanic Garden provides multiple ceremony and reception locations throughout 96 acres of themed gardens, from rose gardens to Japanese gardens.",
      features: [
        "Multiple garden ceremony sites",
        "Indoor/outdoor reception options",
        "Eco-friendly celebration focus",
        "Beautiful photography backdrops",
        "Seasonal flower displays",
        "Flexible event spaces"
      ],
      djConsiderations: [
        "Weather backup plans essential",
        "Power and setup logistics for outdoor areas", 
        "Sound management for open spaces",
        "Equipment protection from elements"
      ],
      seasonalTips: "Spring (March-May) offers peak garden beauty but books quickly. Fall provides comfortable weather and beautiful foliage.",
      website: "memphisbotanicgarden.com"
    },
    {
      name: "Dixon Gallery & Gardens",
      icon: Camera,
      category: "Art Museum",
      capacity: "150-200 guests",
      priceRange: "$$$$",
      style: "Art museum elegance, garden views",
      highlight: "Stunning art collection and sculpture gardens",
      description: "This elegant art museum offers a sophisticated setting with impressive art collections and beautifully manicured gardens. Perfect for couples who appreciate culture and refined aesthetics.",
      features: [
        "Museum gallery spaces",
        "Sculpture garden ceremonies",
        "Art collection backdrop",
        "Intimate guest capacity",
        "Professional photography opportunities",
        "Cultural sophistication"
      ],
      djConsiderations: [
        "Acoustic considerations in gallery spaces",
        "Art protection requirements",
        "Professional setup protocols",
        "Sound level restrictions"
      ],
      seasonalTips: "Fall and spring offer ideal garden conditions. Museum climate control makes it perfect for year-round events.",
      website: "dixon.org"
    },
    {
      name: "Woodruff-Fontaine House",
      icon: Building,
      category: "Historic Mansion",
      capacity: "100-150 guests",
      priceRange: "$$$",
      style: "Victorian mansion, historic charm",
      highlight: "1870s Victorian architecture and period furnishings",
      description: "Step back in time at this beautifully preserved Victorian mansion. The historic home offers intimate spaces with period furnishings and architectural details that create a unique, romantic atmosphere.",
      features: [
        "Victorian-era architecture",
        "Period furnishing details",
        "Historic significance",
        "Intimate guest capacity",
        "Beautiful architectural photography",
        "Unique Memphis landmark"
      ],
      djConsiderations: [
        "Historic building considerations",
        "Intimate space acoustics",
        "Equipment setup in period rooms",
        "Preservation requirements"
      ],
      seasonalTips: "Popular for intimate fall and winter weddings. The historic setting provides natural elegance in any season.",
      website: "woodruff-fontaine.org"
    },
    {
      name: "The Atrium at Overton Square",
      icon: Music,
      category: "Event Space",
      capacity: "200-300 guests",
      priceRange: "$$$$",
      style: "Modern event space, entertainment district",
      highlight: "Heart of Memphis entertainment district",
      description: "Located in the vibrant Overton Square entertainment district, The Atrium offers modern event spaces with floor-to-ceiling windows and contemporary design, perfect for couples wanting an urban celebration.",
      features: [
        "Modern architectural design",
        "Floor-to-ceiling windows",
        "Entertainment district location",
        "Flexible space configurations",
        "Professional event services",
        "Urban sophistication"
      ],
      djConsiderations: [
        "Excellent acoustics for entertainment",
        "Professional sound system compatibility",
        "Urban noise considerations",
        "Entertainment district coordination"
      ],
      seasonalTips: "Year-round availability with climate control. Spring and fall are most popular for the outdoor areas and district activities.",
      website: "atriumoverton.com"
    }
  ];

  const venueTypes = [
    {
      type: "Luxury Hotels",
      examples: ["The Peabody Memphis", "Guest House at Graceland"],
      priceRange: "$$$$$",
      guestCount: "200-500+",
      bestFor: "Grand celebrations, out-of-town guests"
    },
    {
      type: "Garden & Outdoor",
      examples: ["Memphis Botanic Garden", "Shelby Farms Park"],
      priceRange: "$$$",
      guestCount: "100-300",
      bestFor: "Nature lovers, eco-friendly celebrations"
    },
    {
      type: "Historic Venues",
      examples: ["Woodruff-Fontaine House", "Annesdale Mansion"],
      priceRange: "$$$-$$$$",
      guestCount: "75-200",
      bestFor: "Intimate weddings, history enthusiasts"
    },
    {
      type: "Museums & Cultural",
      examples: ["Dixon Gallery", "Memphis Brooks Museum"],
      priceRange: "$$$$",
      guestCount: "100-250",
      bestFor: "Art lovers, sophisticated celebrations"
    }
  ];

  const seasonalGuide = [
    {
      season: "Spring (March-May)",
      popularity: "Peak Season",
      advantages: ["Beautiful garden blooms", "Comfortable temperatures", "Excellent photography lighting"],
      considerations: ["Book 12-18 months ahead", "Higher demand = higher prices", "Rain backup plans needed"],
      venues: ["Memphis Botanic Garden", "Dixon Gallery & Gardens", "Outdoor venues"]
    },
    {
      season: "Summer (June-August)", 
      popularity: "High Season",
      advantages: ["Long daylight hours", "Vibrant green landscapes", "Pool party options"],
      considerations: ["Heat and humidity", "Outdoor ceremony timing", "Guest comfort priorities"],
      venues: ["Indoor venues preferred", "The Peabody Memphis", "Climate-controlled spaces"]
    },
    {
      season: "Fall (September-November)",
      popularity: "Peak Season", 
      advantages: ["Perfect weather", "Stunning foliage", "Comfortable for all ages"],
      considerations: ["Most popular season", "Premium pricing", "Book very early"],
      venues: ["All venues ideal", "Outdoor ceremonies perfect", "Garden venues spectacular"]
    },
    {
      season: "Winter (December-February)",
      popularity: "Off-Peak",
      advantages: ["Better availability", "Potential cost savings", "Cozy indoor atmosphere"],
      considerations: ["Limited daylight", "Weather unpredictability", "Seasonal decorations"],
      venues: ["Historic mansions", "Hotel ballrooms", "Indoor cultural venues"]
    }
  ];

  return (
    <>
      <SEO
        title="Top Memphis Wedding Venues 2025 | Best Wedding Locations Memphis TN | M10 DJ Company"
        description="Discover Memphis's most sought-after wedding venues for 2025. From The Peabody Hotel to Memphis Botanic Garden, explore capacity, pricing, and DJ considerations for each venue. Expert venue guide from Memphis wedding professionals."
        keywords={keywords}
        canonical="/blog/top-memphis-wedding-venues-2025"
      />

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="heading-1 mb-6">
                <span className="block text-white">Top Memphis Wedding</span>
                <span className="block text-brand-gold">Venues for 2025</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90">
                Discover Memphis's most sought-after wedding venues, from the iconic Peabody Hotel 
                to the stunning Botanic Garden. Expert insights from 500+ Memphis weddings.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link 
                  href="/venues"
                  className="btn-primary bg-white text-brand hover:bg-gray-100 px-8 py-4"
                >
                  Explore All Venues
                </Link>
                <a href="tel:9014102020" className="btn-outline border-white text-white hover:bg-white hover:text-brand px-8 py-4">
                  Venue DJ Services
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis's Premier Wedding Destinations</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  After performing at hundreds of Memphis weddings, we've compiled the definitive guide to the city's 
                  most exceptional venues. Each offers unique character, from grand hotel ballrooms to intimate garden settings.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                <div className="flex items-start space-x-3">
                  <Music className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">DJ Expertise Matters</h3>
                    <p className="text-blue-800">
                      Each venue has unique acoustic properties and setup requirements. Our venue-specific experience 
                      ensures flawless sound and seamless coordination with venue teams across Memphis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Venues */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Featured Memphis Wedding Venues</h2>
                <p className="text-lg text-gray-600">
                  Our top recommendations based on beauty, service, and overall wedding experience.
                </p>
              </div>

              <div className="space-y-12">
                {venues.map((venue, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-8 p-8">
                      <div>
                        <div className="flex items-start space-x-4 mb-6">
                          <div className="flex-shrink-0 w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                            <venue.icon className="h-6 w-6 text-brand" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{venue.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {venue.category}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {venue.capacity}
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {venue.priceRange}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-brand/5 border-l-4 border-brand p-4 mb-6">
                          <p className="text-brand font-semibold">{venue.highlight}</p>
                        </div>

                        <p className="text-gray-600 mb-6">{venue.description}</p>

                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {venue.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-900 mb-2">Seasonal Booking Tip:</h4>
                          <p className="text-yellow-800 text-sm">{venue.seasonalTips}</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Music className="h-5 w-5 text-brand mr-2" />
                            DJ & Entertainment Considerations
                          </h4>
                          <ul className="space-y-2">
                            {venue.djConsiderations.map((consideration, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-sm text-gray-600">{consideration}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-brand text-white rounded-lg p-6">
                          <h4 className="font-semibold mb-3">M10 DJ Experience at {venue.name}</h4>
                          <p className="text-brand-light text-sm mb-4">
                            We've performed at {venue.name} dozens of times and understand the unique requirements 
                            for flawless entertainment at this venue.
                          </p>
                          <div className="flex items-center space-x-4">
                            <Link 
                              href={`/venues/${venue.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                              className="bg-white text-brand hover:bg-gray-100 px-4 py-2 rounded text-sm font-semibold transition-colors"
                            >
                              Venue DJ Services
                            </Link>
                            <a 
                              href="tel:9014102020"
                              className="border border-white text-white hover:bg-white hover:text-brand px-4 py-2 rounded text-sm font-semibold transition-colors"
                            >
                              Get Quote
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Venue Types Guide */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis Wedding Venue Types</h2>
                <p className="text-lg text-gray-600">
                  Understanding different venue categories helps you choose the perfect setting for your celebration.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {venueTypes.map((type, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{type.type}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600">
                        <strong>Price Range:</strong> {type.priceRange}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Typical Capacity:</strong> {type.guestCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Best For:</strong> {type.bestFor}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-700">Examples:</h4>
                      {type.examples.map((example, idx) => (
                        <div key={idx} className="text-xs text-gray-600">{example}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seasonal Planning Guide */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Seasonal Venue Planning Guide</h2>
                <p className="text-lg text-gray-600">
                  Choose your wedding season wisely - each offers unique advantages and considerations.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {seasonalGuide.map((season, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{season.season}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        season.popularity === 'Peak Season' ? 'bg-red-100 text-red-800' :
                        season.popularity === 'High Season' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {season.popularity}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Advantages:</h4>
                        <ul className="space-y-1">
                          {season.advantages.map((advantage, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              <span>{advantage}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2">Considerations:</h4>
                        <ul className="space-y-1">
                          {season.considerations.map((consideration, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="w-3 h-3 border border-orange-300 rounded-full mt-1 flex-shrink-0"></span>
                              <span>{consideration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Recommended Venues:</h4>
                        <p className="text-sm text-gray-600">{season.venues}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Venue Selection Tips */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Expert Venue Selection Tips</h2>
                <p className="text-lg text-gray-600">
                  Essential factors to consider when choosing your Memphis wedding venue.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Budget Considerations</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Venue typically represents 40-50% of wedding budget</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Consider additional costs: service fees, gratuities, decor</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Ask about off-peak pricing and package deals</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Practical Factors</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Guest capacity and comfort considerations</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Parking availability and accessibility</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Weather backup plans for outdoor elements</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Entertainment Setup</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Power availability and electrical requirements</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Acoustic properties and sound restrictions</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Load-in access and setup time allowances</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Vendor Relationships</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Preferred vendor lists and restrictions</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Coordination requirements with venue staff</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">Experience with your chosen service providers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* M10 DJ Venue Experience */}
        <section className="py-16 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 mb-6">Expert DJ Services at Every Memphis Venue</h2>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                With 15+ years serving Memphis couples, we've mastered the unique requirements of every 
                major wedding venue. Our venue-specific experience ensures flawless entertainment.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">50+ Venues</h3>
                  <p className="text-white/80">Experience at Memphis's top wedding locations</p>
                </div>
                
                <div className="text-center">
                  <Users className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">500+ Weddings</h3>
                  <p className="text-white/80">Proven track record across all venue types</p>
                </div>
                
                <div className="text-center">
                  <Star className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Venue Partnerships</h3>
                  <p className="text-white/80">Trusted relationships with venue coordinators</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/venues"
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  View Venue DJ Services
                </Link>
                <a 
                  href="tel:9014102020" 
                  className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Related Wedding Planning Resources</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Link 
                  href="/blog/how-to-choose-wedding-dj-memphis-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    How to Choose Your Wedding DJ
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Essential guide to selecting the perfect Memphis wedding DJ with venue-specific expertise.
                  </p>
                </Link>

                <Link 
                  href="/blog/memphis-dj-cost-complete-guide-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Memphis DJ Cost & Pricing Guide
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Complete breakdown of wedding DJ costs including venue-specific pricing considerations.
                  </p>
                </Link>

                <Link 
                  href="/memphis-wedding-dj"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Memphis Wedding DJ Services
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Professional wedding DJ services designed for Memphis venues and couples.
                  </p>
                </Link>

                <Link 
                  href="/venues"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Complete Venue DJ Services
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Explore our specialized DJ services for specific Memphis wedding venues.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6 text-gray-900">Planning Your Dream Memphis Wedding?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Let us help you create perfect entertainment for your chosen venue. Contact Memphis's 
                most experienced wedding DJs today.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Top Memphis Wedding Venues 2025",
            "description": "Discover Memphis's most sought-after wedding venues including The Peabody Hotel, Memphis Botanic Garden, and Dixon Gallery & Gardens.",
            "author": {
              "@type": "Organization",
              "name": "M10 DJ Company"
            },
            "publisher": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.m10djcompany.com/logo-static.jpg"
              }
            },
            "datePublished": "2025-01-04",
            "dateModified": "2025-01-04",
            "mainEntityOfPage": {
              "@type": "WebPage", 
              "@id": "https://www.m10djcompany.com/blog/top-memphis-wedding-venues-2025"
            }
          })
        }}
      />
    </>
  );
}