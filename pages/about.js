import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Users, 
  Award, 
  Heart,
  MapPin,
  Calendar,
  Star,
  Headphones,
  Zap,
  Shield
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import { PersonSchema, BreadcrumbListSchema, EnhancedOrganizationSchema } from '../components/StandardSchema';

export default function About() {
  const stats = [
    { icon: Calendar, value: '10+', label: 'Years Experience' },
    { icon: Users, value: '500+', label: 'Events Completed' },
    { icon: Star, value: '5.0', label: 'Average Rating' },
    { icon: MapPin, value: '50+', label: 'Venues Served' }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Passion for Music',
      description: 'We believe music is the heartbeat of every great celebration. Our love for creating unforgettable moments through music drives everything we do.'
    },
    {
      icon: Shield,
      title: 'Reliability',
      description: 'Your event is safe with us. We bring backup equipment, arrive early, and have contingency plans for every situation.'
    },
    {
      icon: Users,
      title: 'Client-Focused',
      description: 'Every event is unique, and we customize our services to match your vision, style, and budget perfectly.'
    },
    {
      icon: Zap,
      title: 'Energy & Fun',
      description: 'We know how to read the crowd and keep the energy high, ensuring your dance floor stays packed all night long.'
    },
    {
      icon: Award,
      title: 'Professionalism',
      description: 'From our initial consultation to the last song, we maintain the highest standards of professional service.'
    },
    {
      icon: Headphones,
      title: 'Musical Expertise',
      description: 'With extensive knowledge across all genres and eras, we create the perfect soundtrack for your special day.'
    }
  ];

  const milestones = [
    {
      year: '2014',
      title: 'M10 DJ Company Founded',
      description: 'Started with a passion for music and a dream to make Memphis events unforgettable.'
    },
    {
      year: '2016',
      title: 'First Major Wedding',
      description: 'Successfully provided entertainment for a 300-guest wedding at The Peabody Memphis.'
    },
    {
      year: '2018',
      title: 'Corporate Expansion',
      description: 'Began specializing in corporate events and holiday parties for Memphis businesses.'
    },
    {
      year: '2020',
      title: 'Pandemic Adaptation',
      description: 'Quickly adapted to provide safe, socially-distanced entertainment solutions.'
    },
    {
      year: '2022',
      title: 'Preferred Vendor Network',
      description: 'Established partnerships with Memphis\'s top venues and wedding professionals.'
    },
    {
      year: '2024',
      title: 'Digital Innovation',
      description: 'Launched our new website and digital booking system for enhanced client experience.'
    }
  ];

  return (
    <>
      <Head>
        <title>About M10 DJ Company | Memphis Wedding & Event DJs</title>
        <meta 
          name="description" 
          content="Learn about M10 DJ Company, Memphis's premier wedding and event DJ service. Our story, values, and commitment to creating unforgettable celebrations since 2014." 
        />
        <meta name="keywords" content="about M10 DJ Company, Memphis DJ company history, wedding DJ Memphis story, professional DJ services Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/about" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="About M10 DJ Company | Memphis Wedding & Event DJs" />
        <meta property="og:description" content="Learn about M10 DJ Company, Memphis's premier wedding and event DJ service since 2014." />
        <meta property="og:url" content="https://m10djcompany.com/about" />
        <meta property="og:type" content="website" />
        
        {/* Additional SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />

        {/* Enhanced Organization Schema */}
        <EnhancedOrganizationSchema />

        {/* Person Schema for DJ Ben Murray */}
        <PersonSchema />

        {/* Breadcrumb Schema */}
        <BreadcrumbListSchema 
          breadcrumbs={[
            { name: "Home", url: "https://m10djcompany.com" },
            { name: "About M10 DJ Company", url: "https://m10djcompany.com/about" }
          ]}
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
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="heading-1 mb-6">
                <span className="block text-white">About M10 DJ Company</span>
                <span className="block text-[#fcba00]">Memphis's Premier Event Entertainment</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                For over a decade, we've been creating unforgettable moments through music in Memphis and surrounding areas. 
                Our passion for entertainment and commitment to excellence has made us the trusted choice for weddings, 
                corporate events, and celebrations throughout the Mid-South.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-brand-gold mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                  Our Story
                </h2>
                <div className="w-24 h-1 bg-brand-gold mx-auto"></div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300">
                <p className="text-xl leading-relaxed mb-8">
                  M10 DJ Company was born from a simple belief: that music has the power to transform ordinary moments 
                  into extraordinary memories. Founded in 2014 in Memphis, Tennessee, we started with just a passion 
                  for music and a commitment to making every event special.
                </p>

                <p className="leading-relaxed mb-8">
                  What began as a small operation has grown into Memphis's most trusted DJ company, but our core values 
                  remain the same. We understand that your event isn't just a party – it's a milestone in your life story. 
                  Whether it's your wedding day, a corporate celebration, or a birthday party, we're honored to be part of 
                  these important moments.
                </p>

                <p className="leading-relaxed mb-8">
                  Our deep roots in Memphis give us unique insight into the local music scene and venue landscape. 
                  We've performed at iconic Memphis locations from The Peabody to intimate backyard gatherings, 
                  always adapting our services to fit the unique character of each event and venue.
                </p>

                <p className="leading-relaxed">
                  Today, M10 DJ Company is proud to serve Memphis and the surrounding areas with the same enthusiasm 
                  and attention to detail that defined our early days. Every event is an opportunity to create something 
                  magical, and that's what drives us to continue growing and improving our services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Our Values
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                These core values guide everything we do and ensure that every client receives the exceptional service 
                they deserve.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Company Timeline */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Our Journey
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                From humble beginnings to Memphis's premier DJ company, here are the key milestones in our story.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-brand-gold"></div>

                {milestones.map((milestone, index) => (
                  <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-8`}>
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-brand-gold font-bold text-lg mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-brand-gold rounded-full border-4 border-white dark:border-gray-900"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Memphis Connection Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Proud to Call Memphis Home
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Memphis isn't just where we do business – it's our home. We're deeply connected to this city's rich 
                musical heritage and vibrant community. From Beale Street to the suburbs, we understand what makes 
                Memphis special and bring that authentic spirit to every event we serve.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Local Expertise
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Deep knowledge of Memphis venues, vendors, and community preferences.
                  </p>
                </div>
                <div className="text-center">
                  <Music className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Musical Heritage
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Inspired by Memphis's legendary music scene and cultural diversity.
                  </p>
                </div>
                <div className="text-center">
                  <Heart className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Community Commitment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Actively supporting local events, charities, and community celebrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Ready to Create Something Amazing?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Let's discuss your upcoming event and how we can help make it truly unforgettable. 
                We'd love to be part of your special day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="#contact"
                  className="btn-primary text-lg"
                >
                  Get Your Free Quote
                </Link>
                <Link 
                  href="/services"
                  className="btn-outline text-lg"
                >
                  View Our Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "M10 DJ Company",
            "description": "Memphis's premier wedding and event DJ company, creating unforgettable celebrations since 2014",
            "url": "https://m10djcompany.com",
            "logo": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.yr05JG7kPZyN7YgTzU6h9AAAAA%3Fpid%3DApi&f=1&ipt=17ed6ed3a6ff98b946d704a9f4430cfe33b3d9e95e4c081f0f69d0b2de54de2b&ipo=images",
            "foundingDate": "2014",
            "founder": {
              "@type": "Organization",
              "name": "M10 DJ Company"
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Memphis",
              "addressRegion": "TN",
              "addressCountry": "US"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "(901) 410-2020",
              "contactType": "customer service",
              "email": "m10djcompany@gmail.com"
            },
            "sameAs": [
              "https://facebook.com/m10djcompany",
              "https://instagram.com/m10djcompany"
            ],
            "areaServed": {
              "@type": "City",
              "name": "Memphis, TN"
            }
          })
        }}
      />
    </>
  );
} 