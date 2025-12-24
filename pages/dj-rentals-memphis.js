import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Headphones, 
  Mic, 
  Volume2,
  Zap,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const rentalEquipment = [
  {
    icon: Volume2,
    name: "Professional Sound Systems",
    description: "High-quality speakers, amplifiers, and mixing equipment for events up to 500 people",
    price: "Starting at $150/day",
    features: ["Premium speakers", "Wireless microphones", "Mixing console", "All cables included"]
  },
  {
    icon: Mic,
    name: "Microphone Packages",
    description: "Wireless and wired microphone systems for speeches, presentations, and performances",
    price: "Starting at $75/day",
    features: ["Wireless mics", "Handheld & lavalier", "Mic stands", "Battery backup"]
  },
  {
    icon: Zap,
    name: "Lighting Equipment",
    description: "Professional uplighting, dance floor lighting, and ambient lighting systems",
    price: "Starting at $200/day",
    features: ["LED uplighting", "Dance floor lights", "Ambient lighting", "Remote control"]
  },
  {
    icon: Headphones,
    name: "DJ Equipment",
    description: "Complete DJ setup with turntables, controllers, and professional mixing equipment",
    price: "Starting at $250/day",
    features: ["DJ controller", "Turntables", "Mixing board", "Monitor speakers"]
  }
];

const rentalPackages = [
  {
    name: "Basic Sound Package",
    price: "$150/day",
    description: "Perfect for small gatherings and presentations",
    includes: ["2 speakers", "1 wireless mic", "Basic mixer", "All cables", "Setup assistance"]
  },
  {
    name: "Wedding Package",
    price: "$350/day",
    description: "Complete ceremony and reception sound solution",
    includes: ["4 speakers", "3 wireless mics", "Professional mixer", "Uplighting", "Full setup & breakdown"]
  },
  {
    name: "Corporate Event Package",
    price: "$450/day",
    description: "Professional presentation and entertainment system",
    includes: ["Premium speakers", "Multiple mics", "Lighting", "Backup equipment", "Technical support"]
  },
  {
    name: "Full Event Package",
    price: "$650/day",
    description: "Everything you need for large events and celebrations",
    includes: ["Complete sound system", "DJ equipment", "Full lighting", "Backup systems", "On-site technician"]
  }
];

export default function DJRentalsMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>DJ Rentals Memphis | Sound System Rental</title>
        <meta 
          name="description" 
          content="DJ rentals Memphis - Professional sound system rental, microphones, lighting & DJ equipment. Perfect for weddings, corporate events & parties. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="DJ rentals Memphis, sound system rental Memphis, audio equipment rental, microphone rental Memphis, DJ equipment rental, party equipment rental Memphis, wedding sound rental" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.m10djcompany.com/dj-rentals-memphis" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ Rentals Memphis | Sound System Rental | Professional Audio Equipment" />
        <meta property="og:description" content="Professional DJ rentals and sound system rental in Memphis. High-quality audio equipment, microphones, and lighting for all events." />
        <meta property="og:url" content="https://www.m10djcompany.com/dj-rentals-memphis" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />

        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://www.m10djcompany.com/dj-rentals-memphis#business",
              "name": "M10 DJ Company - DJ Rentals Memphis",
              "description": "Professional DJ equipment and sound system rentals in Memphis TN. High-quality audio equipment for weddings, corporate events, and parties.",
              "url": "https://www.m10djcompany.com/dj-rentals-memphis",
              "telephone": "+19014102020",
              "priceRange": "$75-$650",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "65 Stewart Rd",
                "addressLocality": "Eads",
                "addressRegion": "TN",
                "postalCode": "38028",
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
                }
              ],
              "serviceType": "DJ Equipment Rental",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "150",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">DJ Rentals</span>
                <span className="block text-gradient">Memphis</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-4xl mx-auto">
                Professional DJ equipment and sound system rentals in Memphis. High-quality audio equipment, 
                microphones, lighting, and complete DJ setups for weddings, corporate events, and parties. 
                Same-day delivery available throughout the Memphis area.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Rental Quote
                  <DollarSign className="ml-2 w-5 h-5" />
                </button>
                <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                  <Phone className="mr-2 w-5 h-5" />
                  Call (901) 410-2020
                </a>
              </div>

              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-gold mb-2">Same Day</div>
                  <div className="text-gray-300">Delivery Available</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-gold mb-2">Professional</div>
                  <div className="text-gray-300">Grade Equipment</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-gold mb-2">Setup</div>
                  <div className="text-gray-300">Assistance Included</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Equipment Categories */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Professional DJ Equipment Rentals
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Rent high-quality DJ equipment and sound systems for your Memphis event. 
                All equipment is professionally maintained and includes setup assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {rentalEquipment.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="text-brand-gold font-bold text-lg mb-4">{item.price}</div>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-brand-gold mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rental Packages */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                DJ Rental Packages Memphis
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose from our popular rental packages or create a custom solution for your event.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {rentalPackages.map((pkg, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <div className="text-3xl font-bold text-brand-gold mb-2">{pkg.price}</div>
                    <p className="text-gray-600">{pkg.description}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Includes:</h4>
                    <ul className="space-y-2">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-brand-gold mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Our Rentals */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 text-gray-900 mb-6">
                  Why Choose M10 DJ Rentals Memphis?
                </h2>
                <p className="text-xl text-gray-600">
                  Professional-grade equipment with the service and support you need for a successful event.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Shield className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Grade Equipment</h3>
                      <p className="text-gray-600">All rental equipment is professional-grade, regularly maintained, and tested before every event.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Same-Day Delivery Available</h3>
                      <p className="text-gray-600">Need equipment fast? We offer same-day delivery throughout the Memphis area for urgent events.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Assistance Included</h3>
                      <p className="text-gray-600">Our team provides setup assistance to ensure everything works perfectly for your event.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <DollarSign className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparent Pricing</h3>
                      <p className="text-gray-600">No hidden fees or surprise charges. Clear, upfront pricing on all DJ equipment rentals.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Technical Support</h3>
                      <p className="text-gray-600">Get phone support during your event if you need any technical assistance with the equipment.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-brand-gold mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Memphis Area Coverage</h3>
                      <p className="text-gray-600">We deliver throughout Memphis and surrounding areas including Germantown, Collierville, and Bartlett.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 mb-6">
                Get Your DJ Equipment Rental Quote
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ready to rent professional DJ equipment for your Memphis event? 
                Contact us for a free quote and equipment recommendations.
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Call for DJ Rentals</h3>
                      <p className="text-gray-600 mb-3">Get instant quotes and check equipment availability</p>
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
                      <p className="text-gray-600 mb-3">Send us your event details for a custom quote</p>
                      <a href="mailto:info@m10djcompany.com" className="text-brand font-semibold hover:text-brand-600 transition-colors">
                        info@m10djcompany.com
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="modern-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Rental Hours</h3>
                      <p className="text-gray-600">Monday-Sunday: 9 AM - 9 PM<br/>Same-day delivery available</p>
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
      </main>

      <Footer />
    </>
  );
}
