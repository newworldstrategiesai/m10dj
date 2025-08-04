import Head from 'next/head';
import { useRouter } from 'next/router';
import { Music, MapPin, Phone, Mail, Star, Users, Award } from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import FAQSection from '../components/company/FAQSection';
import { scrollToContact } from '../utils/scroll-helpers';

// Location data for Memphis area
const locationData = {
  'memphis': {
    name: 'Memphis',
    zipCodes: ['38103', '38104', '38105', '38106', '38107', '38114', '38126'],
    description: 'Professional DJ services throughout Memphis, serving the heart of Tennessee with exceptional entertainment.',
    neighborhoods: ['Downtown', 'Midtown', 'Cooper-Young', 'Central Gardens', 'South Main', 'Medical District'],
    landmarks: ['Beale Street', 'Graceland', 'Sun Studio', 'National Civil Rights Museum', 'Memphis Zoo', 'Overton Park'],
    localBusinesses: ['The Peabody Memphis', 'FedExForum', 'Crosstown Concourse', 'AutoZone Park', 'Memphis Cook Convention Center'],
    eventTypes: ['Historic venue weddings', 'Corporate galas downtown', 'Private parties', 'Cultural events', 'Festival entertainment']
  },
  'midtown-memphis': {
    name: 'Midtown Memphis',
    zipCodes: ['38104', '38105', '38106', '38107', '38114'],
    description: 'Serving the vibrant Midtown Memphis community with professional DJ services for all occasions.',
    neighborhoods: ['Cooper-Young', 'Central Gardens', 'Vollintine Evergreen', 'Crosstown'],
    landmarks: ['Overton Park', 'Memphis Zoo', 'Brooks Museum', 'Cooper-Young District'],
    localBusinesses: ['The Peabody Memphis', 'Crosstown Concourse', 'Overton Square'],
    eventTypes: ['Wedding receptions at historic venues', 'Corporate events downtown', 'Birthday parties', 'Anniversary celebrations']
  },
  'downtown-memphis': {
    name: 'Downtown Memphis',
    zipCodes: ['38103', '38126'],
    description: 'Professional DJ services in the heart of Memphis, serving downtown venues and corporate events.',
    neighborhoods: ['South Main Historic District', 'Medical District', 'Pinch District'],
    landmarks: ['Beale Street', 'FedExForum', 'Memphis Pyramid', 'National Civil Rights Museum'],
    localBusinesses: ['The Peabody Memphis', 'Big River Crossing', 'AutoZone Park'],
    eventTypes: ['Corporate galas', 'Wedding receptions', 'Hotel events', 'Private parties']
  },
  'germantown': {
    name: 'Germantown',
    zipCodes: ['38138', '38139'],
    description: 'Premier DJ services for Germantown\'s upscale events, weddings, and corporate celebrations.',
    neighborhoods: ['Forest Hill Irene', 'Germantown Hills', 'Thornwood'],
    landmarks: ['Germantown Performing Arts Centre', 'W.C. Johnson Park', 'Shelby Farms'],
    localBusinesses: ['Saddle Creek', 'Germantown Country Club', 'River Oaks'],
    eventTypes: ['Elegant wedding receptions', 'Country club events', 'Corporate retreats', 'Anniversary parties']
  },
  'collierville': {
    name: 'Collierville',
    zipCodes: ['38017', '38027'],
    description: 'Serving Collierville with professional DJ services for weddings, celebrations, and community events.',
    neighborhoods: ['Historic Collierville', 'Schilling Farms', 'Bailey Station'],
    landmarks: ['Historic Square', 'W.C. Johnson Park', 'Collierville Greenbelt'],
    localBusinesses: ['The Columns', 'Morton Museum', 'Town Square Park'],
    eventTypes: ['Historic venue weddings', 'Community celebrations', 'School events', 'Private parties']
  },
  'bartlett': {
    name: 'Bartlett',
    zipCodes: ['38133', '38135'],
    description: 'Professional DJ entertainment for Bartlett residents, from intimate gatherings to large celebrations.',
    neighborhoods: ['Bartlett Station', 'Elmore Park', 'Scenic Hills'],
    landmarks: ['Bartlett Station Municipal Center', 'Nicholas Yahk Park', 'Stage Road Park'],
    localBusinesses: ['Bartlett Recreation Center', 'Bradford Creek Golf Course'],
    eventTypes: ['Community center events', 'School dances', 'Birthday celebrations', 'Wedding receptions']
  },
  'arlington': {
    name: 'Arlington',
    zipCodes: ['38002'],
    description: 'Bringing professional DJ services to Arlington and surrounding suburban communities.',
    neighborhoods: ['Arlington Heights', 'Donelson Hills'],
    landmarks: ['Arlington High School', 'Shelby Forest State Park'],
    localBusinesses: ['Arlington Community Center'],
    eventTypes: ['School events', 'Community celebrations', 'Wedding receptions', 'Family reunions']
  }
};

export default function LocationPage() {
  const router = useRouter();
  const { location } = router.query;
  
  // Get location data or default
  const loc = locationData[location] || {
    name: 'Memphis Area',
    zipCodes: ['38103'],
    description: 'Professional DJ services in the Memphis area.',
    neighborhoods: [],
    landmarks: [],
    localBusinesses: [],
    eventTypes: []
  };

  const services = [
    {
      icon: Music,
      title: "Wedding DJ Services",
      description: `Create your perfect wedding day in ${loc.name} with our professional DJ services, from ceremony to reception.`,
      price: "Starting at $495"
    },
    {
      icon: Users,
      title: "Corporate Events",  
      description: `Professional corporate event entertainment for ${loc.name} businesses and organizations.`,
      price: "Starting at $395"
    },
    {
      icon: Award,
      title: "Birthday Parties",
      description: `Make birthdays memorable in ${loc.name} with age-appropriate music and entertainment.`,
      price: "Starting at $295"
    }
  ];

  return (
    <>
      <Head>
        <title>{`Professional DJ Services in ${loc.name}, TN | M10 DJ Company`}</title>
        <meta 
          name="description" 
          content={`${loc.description} Wedding DJ, corporate events, birthday parties & more. Call (901) 410-2020 for your free quote!`}
        />
        <meta name="keywords" content={`DJ services ${loc.name}, wedding DJ ${loc.name} TN, ${loc.name} event DJ, birthday party DJ ${loc.name}, corporate event entertainment`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://m10djcompany.com/${location}`} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={`Professional DJ Services in ${loc.name}, TN | M10 DJ Company`} />
        <meta property="og:description" content={`${loc.description} Professional DJ entertainment for all occasions.`} />
        <meta property="og:url" content={`https://m10djcompany.com/${location}`} />
        <meta property="og:type" content="website" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content={loc.name} />
        <meta name="ICBM" content="35.1495, -90.0490" />
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
              <div className="flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold text-lg">Serving {loc.name}</span>
              </div>
              
              <h1 className="heading-1 mb-6">
                <span className="block text-white">Professional DJ Services in</span>
                <span className="block text-gradient">{loc.name}, Tennessee</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                {loc.description} From weddings to corporate events, we bring premium entertainment 
                to your special occasions with professional equipment and experienced DJs.
              </p>
              
              {/* Zip Codes */}
              <div className="mb-8">
                <p className="text-gray-400 mb-3">Serving zip codes:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {loc.zipCodes.map(zip => (
                    <span key={zip} className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                      {zip}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Free Quote
                </button>
                <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Local Services */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                {loc.name} DJ Services
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We specialize in providing professional DJ entertainment for {loc.name} residents and businesses. 
                Our local knowledge ensures we understand your community's unique event needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {services.map((service, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                    <service.icon className="w-8 h-8 text-black" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {service.description}
                  </p>
                  
                  <div className="text-brand-gold font-bold text-lg mb-4">
                    {service.price}
                  </div>
                  
                  <button
                    onClick={scrollToContact}
                    className="btn-primary w-full"
                  >
                    Get Quote
                  </button>
                </div>
              ))}
            </div>

            {/* Local Areas */}
            {loc.neighborhoods.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 mb-16">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Areas We Serve in {loc.name}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {loc.neighborhoods.map(neighborhood => (
                    <div key={neighborhood} className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <MapPin className="w-5 h-5 text-brand-gold mx-auto mb-2" />
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{neighborhood}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Event Types */}
            {loc.eventTypes.length > 0 && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                  Popular Events in {loc.name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loc.eventTypes.map((eventType, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-3 h-3 bg-brand-gold rounded-full mr-4 flex-shrink-0"></div>
                      <p className="text-gray-700 dark:text-gray-300">{eventType}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-4">
                Trusted by {loc.name} Residents
              </h2>
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-brand-gold fill-current" />
                  ))}
                </div>
                <span className="ml-3 text-gray-600 dark:text-gray-300 font-medium">5.0 out of 5 stars</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Based on reviews from satisfied clients throughout {loc.name} and the Memphis area. 
                We pride ourselves on delivering exceptional service for every event.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Ready to Book Your {loc.name} Event?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Contact us today for a free quote on your {loc.name} event. We'll work with you to create 
                the perfect entertainment experience for your special occasion.
              </p>
            </div>
            
            <div id="contact-form">
              <ContactForm className="max-w-5xl mx-auto" />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Local Business Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "M10 DJ Company",
            "description": `Professional DJ services in ${loc.name}, TN for weddings, corporate events, and celebrations`,
            "url": `https://m10djcompany.com/${location}`,
            "telephone": "(901) 410-2020",
            "email": "m10djcompany@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": loc.name,
              "addressRegion": "TN",
              "addressCountry": "US",
              "postalCode": loc.zipCodes[0]
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "35.1495",
              "longitude": "-90.0490"
            },
            "areaServed": {
              "@type": "City",
              "name": `${loc.name}, TN`
            },
            "serviceType": ["Wedding DJ Services", "Corporate Event DJ", "Birthday Party DJ", "Event Entertainment"],
            "sameAs": [
              "https://facebook.com/m10djcompany",
              "https://instagram.com/m10djcompany"
            ]
          })
        }}
      />
    </>
  );
}

// Generate static paths for all locations
export async function getStaticPaths() {
  const paths = Object.keys(locationData).map((location) => ({
    params: { location },
  }));

  return {
    paths,
    fallback: false, // Return 404 for paths not in locationData
  };
}

// Generate static props
export async function getStaticProps({ params }) {
  return {
    props: {
      location: params.location,
    },
  };
} 