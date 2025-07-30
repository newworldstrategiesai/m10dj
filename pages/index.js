import Head from 'next/head';
import { Music, Users, Calendar, Award, Heart, Building2, PartyPopper, GraduationCap } from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import FAQSection from '../components/company/FAQSection';
import TestimonialSlider from '../components/company/TestimonialSlider';

export default function Home() {
  const services = [
    {
      icon: Heart,
      title: "Wedding DJ Services",
      description: "Make your special day unforgettable with our professional wedding DJ services. From the ceremony to the last dance, we'll create the perfect atmosphere.",
      features: ["Ceremony music", "Cocktail hour playlist", "Reception entertainment", "Wireless microphones", "Dance floor lighting"]
    },
    {
      icon: Building2,
      title: "Corporate Events",
      description: "Professional DJ services for corporate functions, holiday parties, product launches, and company celebrations that impress your guests.",
      features: ["Professional MC services", "Audio visual support", "Background music", "Presentation support", "Award ceremonies"]
    },
    {
      icon: PartyPopper,
      title: "Birthday Parties",
      description: "Celebrate another year of life with music that gets everyone dancing! We specialize in parties for all ages with age-appropriate music.",
      features: ["All-ages playlists", "Interactive games", "Special announcements", "Party lighting", "Music requests"]
    },
    {
      icon: Calendar,
      title: "Anniversary Celebrations", 
      description: "Honor your special milestone with music from your era and favorites that tell your love story through the years.",
      features: ["Era-specific music", "Special dedications", "Romantic lighting", "Timeline music", "Guest requests"]
    },
    {
      icon: GraduationCap,
      title: "School Dances & Events",
      description: "Create memorable experiences for students with current hits and appropriate music that keeps the energy high and the dance floor packed.",
      features: ["Current hit music", "Clean versions only", "Student requests", "School-appropriate content", "Interactive activities"]
    },
    {
      icon: Users,
      title: "Private Parties",
      description: "Whatever the occasion, we'll provide the perfect soundtrack. From intimate gatherings to large celebrations, we've got you covered.",
      features: ["Custom playlists", "Flexible timing", "All music genres", "Professional setup", "Backup equipment"]
    }
  ];

  return (
    <>
      <Head>
        <title>M10 DJ Company | Premier Wedding & Event DJ Services in Memphis, TN</title>
        <meta 
          name="description" 
          content="Professional DJ services in Memphis, TN for weddings, corporate events, birthdays & celebrations. Serving Germantown, Collierville, Bartlett & surrounding areas. Get your free quote today!" 
        />
        <meta name="keywords" content="DJ services Memphis, wedding DJ Memphis TN, corporate event DJ, birthday party DJ, Memphis DJ company, Germantown DJ, Collierville DJ, Bartlett DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="M10 DJ Company | Premier Wedding & Event DJ Services in Memphis, TN" />
        <meta property="og:description" content="Professional DJ services in Memphis, TN for weddings, corporate events, birthdays & celebrations. Serving Germantown, Collierville, Bartlett & surrounding areas." />
        <meta property="og:image" content="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.yr05JG7kPZyN7YgTzU6h9AAAAA%3Fpid%3DApi&f=1&ipt=17ed6ed3a6ff98b946d704a9f4430cfe33b3d9e95e4c081f0f69d0b2de54de2b&ipo=images" />
        <meta property="og:url" content="https://m10djcompany.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="M10 DJ Company" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="M10 DJ Company | Premier Wedding & Event DJ Services in Memphis, TN" />
        <meta name="twitter:description" content="Professional DJ services in Memphis, TN for weddings, corporate events, birthdays & celebrations." />
        <meta name="twitter:image" content="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.yr05JG7kPZyN7YgTzU6h9AAAAA%3Fpid%3DApi&f=1&ipt=17ed6ed3a6ff98b946d704a9f4430cfe33b3d9e95e4c081f0f69d0b2de54de2b&ipo=images" />
        
        {/* Additional SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="geo.position" content="35.1495;-90.0490" />
        <meta name="ICBM" content="35.1495, -90.0490" />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section id="home" className="relative min-h-screen flex items-center justify-center animated-bg cyber-grid text-white overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple rounded-full blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-pink rounded-full blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          {/* Particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="particle" 
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`
                }}
              />
            ))}
          </div>
          
          <div className="section-container relative z-10 text-center pt-20">
            <div className="max-w-5xl mx-auto">
              {/* Main Headline */}
              <h1 className="heading-1 mb-6 neon-text">
                <span className="block text-white">Unforgettable Memphis Events</span>
                <span className="block text-gradient">Start with M10 DJ Company</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up">
                Professional DJ services that create perfect moments for your wedding, corporate event, or celebration. 
                Serving Memphis and all surrounding areas with premium sound, lighting, and entertainment.
              </p>
              
              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm md:text-base">
                <div className="flex items-center space-x-2 glass-card px-6 py-3 hologram">
                  <Award className="w-5 h-5 text-neon-cyan" />
                  <span className="font-rajdhani font-semibold uppercase tracking-wide">Professional Equipment</span>
                </div>
                <div className="flex items-center space-x-2 glass-card px-6 py-3 hologram">
                  <Music className="w-5 h-5 text-neon-purple" />
                  <span className="font-rajdhani font-semibold uppercase tracking-wide">All Music Genres</span>
                </div>
                <div className="flex items-center space-x-2 glass-card px-6 py-3 hologram">
                  <Users className="w-5 h-5 text-neon-pink" />
                  <span className="font-rajdhani font-semibold uppercase tracking-wide">MC Services Included</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button
                  onClick={() => {
                    const element = document.getElementById('contact');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Free Quote
                </button>
                <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                  Call (901) 410-2020
                </a>
              </div>
              
              {/* Service Areas */}
              <div className="text-center">
                <p className="text-gray-400 mb-3">Proudly serving:</p>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-300">
                  <span>Memphis</span>
                  <span>Germantown</span>
                  <span>Collierville</span>
                  <span>Bartlett</span>
                  <span>Arlington</span>
                  <span>Midtown</span>
                  <span>Downtown</span>
                  <span>& More</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 relative cyber-grid">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-white mb-6 neon-text">
                Professional DJ Services for Every Occasion
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto font-rajdhani">
                From intimate gatherings to grand celebrations, we bring the perfect soundtrack to your special moments. 
                Our experienced DJs understand how to read the crowd and keep the energy flowing all night long.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div key={index} className="glass-card p-8 hover:shadow-cyber transition-all duration-500 group">
                  <div className="w-16 h-16 bg-gradient-to-r from-neon-cyan to-neon-purple clip-cyber-small flex items-center justify-center mb-6 shadow-neon-cyan">
                    <service.icon className="w-8 h-8 text-black" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 font-orbitron uppercase tracking-wide group-hover:text-neon-cyan transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6 leading-relaxed font-rajdhani">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3 flex-shrink-0 shadow-neon-cyan"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary text-lg"
              >
                Get Custom Quote for Your Event
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialSlider id="testimonials" />

        {/* FAQ Section */}
        <FAQSection id="faq" />

        {/* Contact Section */}
        <section id="contact" className="py-20 relative cyber-grid">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 text-white mb-6 neon-text">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto font-rajdhani">
                Let's discuss your event and create something amazing together. Get your free quote today and let's start planning your perfect celebration!
              </p>
            </div>
            
            <ContactForm className="max-w-5xl mx-auto" />
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
            "@type": "LocalBusiness",
            "name": "M10 DJ Company",
            "image": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.yr05JG7kPZyN7YgTzU6h9AAAAA%3Fpid%3DApi&f=1&ipt=17ed6ed3a6ff98b946d704a9f4430cfe33b3d9e95e4c081f0f69d0b2de54de2b&ipo=images",
            "description": "Professional DJ services for weddings, corporate events, and celebrations in Memphis, TN and surrounding areas",
            "url": "https://m10djcompany.com",
            "telephone": "(901) 410-2020",
            "email": "m10djcompany@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Memphis",
              "addressRegion": "TN",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "35.1495",
              "longitude": "-90.0490"
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
              ],
              "opens": "09:00",
              "closes": "23:00"
            },
            "serviceType": services.map(service => service.title),
            "areaServed": [
              "Memphis, TN",
              "Germantown, TN", 
              "Collierville, TN",
              "Bartlett, TN",
              "Arlington, TN",
              "Midtown Memphis, TN",
              "Downtown Memphis, TN"
            ],
            "sameAs": [
              "https://facebook.com/m10djcompany",
              "https://instagram.com/m10djcompany"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "6",
              "bestRating": "5"
            }
          })
        }}
      />
    </>
  );
} 