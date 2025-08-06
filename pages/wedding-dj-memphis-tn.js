import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  Volume2,
  Mic2
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import { scrollToContact } from '../utils/scroll-helpers';

const weddingServices = [
  {
    icon: Music,
    title: "Professional Wedding DJ Memphis TN",
    description: "Experienced wedding DJs creating magical moments for Tennessee couples with premium sound and lighting"
  },
  {
    icon: Users,
    title: "Master of Ceremonies",
    description: "Professional MC services to seamlessly guide your Memphis, TN wedding timeline and announcements"
  },
  {
    icon: Calendar,
    title: "Ceremony & Reception Music",
    description: "Complete wedding music services from processional to last dance for your Memphis, Tennessee celebration"
  },
  {
    icon: Award,
    title: "Premium Equipment",
    description: "State-of-the-art sound systems and lighting packages designed for Memphis, TN wedding venues"
  }
];

const memphisVenues = [
  "The Peabody Memphis",
  "Dixon Gallery & Gardens", 
  "Memphis Hunt & Country Club",
  "The Columns",
  "Graceland Wedding Chapel",
  "Memphis Botanic Garden",
  "The Hallmark",
  "Lichterman Nature Center",
  "Memphis Zoo",
  "AutoZone Park",
  "Historic Elmwood Cemetery",
  "The Cotton Museum"
];

const testimonials = [
  {
    name: "Mary Nguyen",
    location: "Memphis, TN",
    quote: "Ben was the perfect DJ for our Memphis wedding! He was so easy to work with during planning and executed everything flawlessly on our big day. Our dance floor was packed all night!",
    rating: 5,
    venue: "Lichterman Nature Center"
  },
  {
    name: "Haley Blalock",
    location: "Memphis, TN",
    quote: "Incredible experience with M10 DJ Company! Ben understood the unique atmosphere we wanted for our historic Memphis venue and delivered perfectly. Classy, professional, and so much fun!",
    rating: 5,
    venue: "Historic Elmwood Cemetery"
  },
  {
    name: "AK Warmus",
    location: "Memphis, TN",  
    quote: "Best decision we made for our Memphis wedding! Ben's energy and professionalism were unmatched. He kept the party going and made sure every moment was perfect. Cannot recommend enough!",
    rating: 5,
    venue: "The Hallmark"
  }
];

const packages = [
  {
    name: "Essential Memphis Wedding",
    price: "$799",
    duration: "6 hours",
    features: [
      "Professional wedding DJ for 6 hours",
      "Ceremony sound system setup", 
      "Reception DJ services",
      "Wireless microphones (2)",
      "Basic uplighting package",
      "Music consultation meeting",
      "Memphis venue coordination"
    ]
  },
  {
    name: "Premium Memphis Wedding", 
    price: "$1,299",
    duration: "8 hours",
    popular: true,
    features: [
      "Professional wedding DJ for 8 hours",
      "Ceremony & cocktail hour music",
      "Complete reception DJ services", 
      "Wireless microphones (4)",
      "Premium uplighting design",
      "Dance floor lighting effects",
      "Detailed music consultation",
      "Professional MC services",
      "Memphis venue coordination",
      "Backup equipment included"
    ]
  },
  {
    name: "Luxury Memphis Wedding",
    price: "$1,899", 
    duration: "Up to 10 hours",
    features: [
      "Premium wedding DJ up to 10 hours",
      "Ceremony, cocktail & reception",
      "Professional sound system",
      "Wireless microphones (6)",
      "Custom uplighting design", 
      "Special effects lighting",
      "Complete music consultation",
      "Professional MC services",
      "Memphis venue coordination",
      "Backup DJ & equipment",
      "Custom monogram projection"
    ]
  }
];

export default function WeddingDJMemphisTN() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Tennessee Wedding DJ Services | Memphis TN Wedding Entertainment | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Professional Tennessee wedding DJ services. Serving couples across TN with premium wedding entertainment, from Memphis to Nashville. Experienced DJs, state-wide coverage. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="Tennessee wedding DJ, wedding DJ Tennessee, TN wedding entertainment, Memphis TN wedding DJ, Tennessee wedding entertainment, wedding DJ services TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/wedding-dj-memphis-tn" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Tennessee Wedding DJ Services | Memphis TN Wedding Entertainment" />
        <meta property="og:description" content="Professional wedding DJ services across Tennessee. From Memphis to Nashville, we provide premium wedding entertainment for TN couples. Experienced DJs, state-wide coverage." />
        <meta property="og:url" content="https://m10djcompany.com/wedding-dj-memphis-tn" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
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
              "name": "M10 DJ Company",
              "description": "Premier wedding DJ Memphis TN services with professional ceremony and reception entertainment",
              "url": "https://m10djcompany.com/wedding-dj-memphis-tn",
              "telephone": "+19014102020",
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
                  "sameAs": "https://en.wikipedia.org/wiki/Memphis,_Tennessee"
                }
              ],
              "serviceType": "Wedding DJ Services",
              "priceRange": "$799-$1899"
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
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    <span className="block text-white">Wedding DJ</span>
                    <span className="block text-gradient">Memphis TN</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    The premier wedding DJ Memphis TN couples trust for their special day. With over 10 years of experience 
                    serving Tennessee brides and grooms, we create unforgettable celebrations from ceremony to reception.
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
                      <div className="text-sm text-gray-300">TN Weddings</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">10+</div>
                      <div className="text-sm text-gray-300">Years Experience</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">5★</div>
                      <div className="text-sm text-gray-300">Memphis Rating</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6">Why Choose Our Memphis TN Wedding DJ?</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Memphis, Tennessee's most trusted wedding DJ</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Professional MC and ceremony services</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Premium sound systems for TN venues</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Transparent pricing for Tennessee couples</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Approved by top Memphis, TN wedding venues</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Complete Wedding DJ Services in Memphis, TN</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From intimate ceremonies to grand receptions, our wedding DJ Memphis TN team provides comprehensive 
                entertainment services for Tennessee couples throughout the greater Memphis area.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {weddingServices.map((service, index) => (
                <div key={index} className="card text-center group hover:shadow-xl transition-all duration-300">
                  <service.icon className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wedding Packages Section */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Memphis TN Wedding DJ Packages</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect wedding DJ package for your Memphis, Tennessee celebration. 
                All packages include professional equipment and experienced entertainment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.map((pkg, index) => (
                <div key={index} className={`card text-center ${pkg.popular ? 'ring-2 ring-brand scale-105' : ''}`}>
                  {pkg.popular && (
                    <div className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-brand mb-2">{pkg.price}</div>
                  <div className="text-gray-600 mb-6">{pkg.duration}</div>
                  
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-left">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={scrollToContact}
                    className={`btn-${pkg.popular ? 'primary' : 'outline'} w-full`}
                  >
                    Choose This Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Memphis Venues Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Memphis, TN Wedding Venues We Serve</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our wedding DJ Memphis TN team is experienced at Tennessee's most popular wedding venues, 
                ensuring seamless setup and perfect sound for your special day.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {memphisVenues.map((venue, index) => (
                <div key={index} className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <MapPin className="w-6 h-6 text-brand mx-auto mb-2" />
                  <span className="text-sm font-medium">{venue}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                Don't see your Memphis, TN venue listed? We work at venues throughout Tennessee!
              </p>
              <button onClick={scrollToContact} className="btn-outline">
                Ask About Your Venue
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">What Memphis, TN Couples Say</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Don't just take our word for it - see what Tennessee brides and grooms say about 
                our wedding DJ Memphis TN services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                  
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.location}</div>
                    <div className="text-sm text-brand-gold">{testimonial.venue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">Ready to Book Your Memphis TN Wedding DJ?</h2>
              <p className="text-xl mb-8 opacity-90">
                Contact Tennessee's premier wedding DJ service today for your free consultation. 
                Let's make your Memphis wedding unforgettable!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Get Free Quote
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
                <a href="tel:(901)410-2020" className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                  <Phone className="mr-2 w-5 h-5 inline" />
                  Call Now: (901) 410-2020
                </a>
              </div>
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