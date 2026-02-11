import Link from 'next/link';
import { useRouter } from 'next/router';
import { Music, MapPin, Phone, Mail, Star, Users, Award, Heart, Calendar } from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import FAQSection from '../components/company/FAQSection';
import SEO from '../components/SEO';
import { BreadcrumbSchema } from '../components/StandardSchema';
import { generateStructuredData } from '../utils/generateStructuredData';
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
  'east-memphis': {
    name: 'East Memphis',
    zipCodes: ['38119', '38120', '38125', '38138', '38115', '38141'],
    description: 'Professional DJ services in East Memphis including Poplar Corridor, White Station, Hickory Hill, and surrounding upscale neighborhoods.',
    neighborhoods: ['Poplar Corridor', 'White Station', 'Hickory Hill', 'Raleigh', 'Cordova'],
    landmarks: ['Memphis Country Club', 'The Racquet Club', 'White Station Tower', 'Hickory Hill Mall'],
    localBusinesses: ['The Peabody Memphis', 'Memphis Country Club', 'The Racquet Club of Memphis', 'White Station area venues'],
    eventTypes: ['Country club weddings', 'Corporate events at upscale venues', 'Private parties', 'Community celebrations'],
    weddingFocus: true
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
    description: 'Wedding DJ in Germantown, TN - Premier Germantown wedding DJ services for Tennessee\'s most elegant celebrations. Professional wedding DJs serving Germantown with upscale entertainment, ceremony music, and reception packages.',
    neighborhoods: ['Forest Hill Irene', 'Germantown Hills', 'Thornwood'],
    landmarks: ['Germantown Performing Arts Centre', 'W.C. Johnson Park', 'Shelby Farms'],
    localBusinesses: ['Saddle Creek', 'Germantown Country Club', 'River Oaks'],
    eventTypes: ['Wedding DJ Germantown receptions', 'Country club wedding celebrations', 'Luxury venue weddings', 'Corporate events', 'Anniversary parties'],
    weddingFocus: true,
    weddingDescription: 'Wedding DJ in Germantown - As Germantown\'s premier wedding DJ service, we specialize in elegant receptions at upscale venues throughout this prestigious Tennessee community.'
  },
  'collierville': {
    name: 'Collierville',
    zipCodes: ['38017', '38027'],
    description: 'Professional Collierville wedding DJ services specializing in historic venue celebrations. Trusted wedding DJs serving Collierville, TN with ceremony music, reception entertainment, and MC services.',
    neighborhoods: ['Historic Collierville', 'Schilling Farms', 'Bailey Station'],
    landmarks: ['Historic Square', 'W.C. Johnson Park', 'Collierville Greenbelt'],
    localBusinesses: ['The Columns', 'Morton Museum', 'Town Square Park'],
    eventTypes: ['Historic Collierville wedding receptions', 'The Columns wedding celebrations', 'Community celebrations', 'School events', 'Private parties'],
    weddingFocus: true,
    weddingDescription: 'Collierville\'s trusted wedding DJ service, specializing in historic venue weddings and elegant receptions throughout this charming Tennessee community.'
  },
  'bartlett': {
    name: 'Bartlett',
    zipCodes: ['38133', '38135'],
    description: 'Wedding DJ in Bartlett, TN - Professional Bartlett wedding DJ services and event entertainment. Serving Bartlett, TN couples with wedding receptions, ceremony music, and comprehensive DJ services for all celebrations.',
    neighborhoods: ['Bartlett Station', 'Elmore Park', 'Scenic Hills'],
    landmarks: ['Bartlett Station Municipal Center', 'Nicholas Yahk Park', 'Stage Road Park'],
    localBusinesses: ['Bartlett Recreation Center', 'Bradford Creek Golf Course'],
    eventTypes: ['Wedding DJ in Bartlett receptions', 'Community center wedding events', 'School dances', 'Birthday celebrations', 'Anniversary parties'],
    weddingFocus: true,
    weddingDescription: 'Wedding DJ in Bartlett - Serving Bartlett couples with professional wedding DJ services, from intimate receptions to large celebrations throughout this vibrant Tennessee community.'
  },
  'arlington': {
    name: 'Arlington',
    zipCodes: ['38002'],
    description: 'Bringing professional DJ services to Arlington and surrounding suburban communities.',
    neighborhoods: ['Arlington Heights', 'Donelson Hills'],
    landmarks: ['Arlington High School', 'Shelby Forest State Park'],
    localBusinesses: ['Arlington Community Center'],
    eventTypes: ['School events', 'Community celebrations', 'Wedding receptions', 'Family reunions']
  },
  'millington': {
    name: 'Millington',
    zipCodes: ['38053'],
    description: 'Professional Millington wedding DJ services and event entertainment. Serving Millington, TN with wedding receptions, ceremony music, and comprehensive DJ services for all celebrations.',
    neighborhoods: ['Millington Central', 'Navy Base Area', 'Raleigh-Millington'],
    landmarks: ['Millington Regional Jetport', 'Meeman-Shelby Forest State Park', 'Naval Support Activity Mid-South'],
    localBusinesses: ['Millington Community Center', 'Millington Golf & Country Club', 'Shelby Forest General Store'],
    eventTypes: ['Millington wedding receptions', 'Military wedding celebrations', 'Community center events', 'Golf club weddings', 'Family reunions', 'School events'],
    weddingFocus: true,
    weddingDescription: 'Serving Millington couples and military families with professional wedding DJ services, from intimate ceremonies to large celebrations throughout this proud Tennessee community.'
  },
  'cordova': {
    name: 'Cordova',
    zipCodes: ['38016', '38018'],
    description: 'Professional DJ services in Cordova, TN serving this thriving suburban community with wedding entertainment, corporate events, and celebration services.',
    neighborhoods: ['Cordova Station', 'Cordova Lake', 'Wolfchase', 'Dexter Lake'],
    landmarks: ['Shelby Farms Park', 'Wolfchase Galleria', 'Cordova Community Center', 'Germantown Parkway'],
    localBusinesses: ['Wolfchase Galleria', 'Cordova Country Club', 'Shelby Farms Greenline', 'Memphis Athletic Ministries'],
    eventTypes: ['Country club weddings', 'Corporate events at office parks', 'Community center celebrations', 'School dances', 'Private parties'],
    weddingFocus: true,
    weddingDescription: 'Cordova wedding DJ services specializing in elegant suburban celebrations. Perfect for couples seeking sophisticated entertainment in this family-friendly Tennessee community.'
  },
  'lakeland': {
    name: 'Lakeland',
    zipCodes: ['38002'],
    description: 'Premium DJ services for Lakeland, TN - serving this exclusive suburban community with professional entertainment for weddings, corporate events, and private celebrations.',
    neighborhoods: ['Lakeland Proper', 'Canada Road Corridor', 'Old Brownsville Road'],
    landmarks: ['Lakeland Community Center', 'Canada Road Park', 'Historic Lakeland Depot'],
    localBusinesses: ['Lakeland Community Center', 'Canada Road Athletic Complex', 'Lakeland Town Hall'],
    eventTypes: ['Elegant wedding receptions', 'Corporate retreat entertainment', 'Community celebrations', 'Private estate parties', 'Anniversary celebrations'],
    weddingFocus: true,
    weddingDescription: 'Lakeland wedding DJ services for Tennessee\'s most exclusive suburban community. Specializing in upscale celebrations and intimate gatherings in this prestigious area.'
  },
  'southaven': {
    name: 'Southaven',
    zipCodes: ['38671', '38672'],
    description: 'Professional DJ services in Southaven, MS - serving the greater Memphis metro area with wedding entertainment, corporate events, and celebration services just south of Tennessee.',
    neighborhoods: ['Southbrook', 'Crosswinds', 'Tulane area', 'Stateline Road corridor'],
    landmarks: ['Snowden Grove Park', 'Landers Center', 'Southaven Towne Center', 'BankNH Pavilion'],
    localBusinesses: ['Landers Center', 'Southaven Towne Center', 'Snowden Grove Amphitheater', 'DeSoto Civic Center'],
    eventTypes: ['Wedding receptions at event centers', 'Corporate events at Landers Center', 'Amphitheater celebrations', 'Private parties', 'School events'],
    weddingFocus: true,
    weddingDescription: 'Southaven wedding DJ services for Mississippi couples near Memphis. Professional entertainment for venues throughout this vibrant metro community.'
  },
  'olive-branch': {
    name: 'Olive Branch',
    zipCodes: ['38654', '38672'],
    description: 'Professional DJ services in Olive Branch, MS - serving this thriving Mississippi community with wedding entertainment, corporate events, and celebration services in the greater Memphis metro area.',
    neighborhoods: ['Olive Branch City Center', 'Goodman Road area', 'Highway 78 corridor', 'Cockrum area', 'Pleasant Hill'],
    landmarks: ['Olive Branch City Park', 'DeSoto Civic Center', 'Olive Branch Family Life Center', 'Wesson Lane Park'],
    localBusinesses: ['DeSoto Civic Center', 'Olive Branch Country Club', 'Olive Branch City Hall', 'Old Town Shopping Center'],
    eventTypes: ['Wedding receptions at event centers', 'Country club celebrations', 'Corporate events', 'Community center parties', 'Private celebrations', 'School events'],
    weddingFocus: true,
    weddingDescription: 'Olive Branch wedding DJ services for Mississippi couples in the Memphis metro area. Professional entertainment specializing in elegant receptions and celebrations throughout this beautiful suburban community.'
  },
  'west-memphis': {
    name: 'West Memphis',
    zipCodes: ['72301', '72303'],
    description: 'Professional DJ services in West Memphis, AR - serving the Arkansas side of the greater Memphis area with wedding entertainment, corporate events, and celebration services.',
    neighborhoods: ['Downtown West Memphis', 'Edmondson', 'Bragg', 'Future City'],
    landmarks: ['Southland Casino Racing', 'West Memphis Community Center', 'Mississippi River Park', 'Interstate 40 corridor'],
    localBusinesses: ['Southland Casino Racing', 'West Memphis Community Center', 'Future City venues', 'Mississippi River venues'],
    eventTypes: ['Casino wedding receptions', 'Riverfront celebrations', 'Corporate events', 'Community center parties', 'Private celebrations'],
    weddingFocus: true,
    weddingDescription: 'West Memphis wedding DJ services for Arkansas couples in the Memphis metro area. Unique venue options including riverfront and casino celebrations.'
  }
};

export default function LocationPage() {
  const router = useRouter();
  const { slug } = router.query;
  
  // Check if this is a known location, otherwise it might be an organization
  // If slug exists in locationData, it's a location page
  // Otherwise, it will fall through to show default or could be handled by [slug]/requests
  const location = slug;
  
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

  // Generate consolidated structured data using new system
  // Only generate structured data if location exists in new system, otherwise fallback to old system
  let structuredData = null;
  try {
    structuredData = generateStructuredData({
      pageType: 'location',
      locationKey: location, // This should map to keys in seoConfig.ts
      canonical: `/${location}`,
      title: loc.weddingFocus ? `DJ ${loc.name} TN | Wedding DJ ${loc.name} | Professional DJs | M10 DJ Company` : `DJ ${loc.name} TN | Professional DJ Services ${loc.name} | M10 DJ Company`,
      description: `${loc.description} ${loc.weddingFocus ? 'Top-rated wedding DJ services with ceremony music, reception entertainment & MC services.' : 'Wedding DJ, corporate events, birthday parties & more.'} Call (901) 410-2020 for your free quote!`
    });
  } catch (error) {
    console.warn(`Location ${location} not found in new schema system, falling back to old system`);
    structuredData = null;
  }

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
      <SEO
        title={loc.weddingFocus ? `DJ ${loc.name} TN | Wedding DJ ${loc.name} | Professional DJs | M10 DJ Company` : `DJ ${loc.name} TN | Professional DJ Services ${loc.name} | M10 DJ Company`}
        description={`${loc.description} ${loc.weddingFocus ? 'Top-rated wedding DJ services with ceremony music, reception entertainment & MC services.' : 'Wedding DJ, corporate events, birthday parties & more.'} Call (901) 410-2020 for your free quote!`}
        canonical={`/${location}`}
        keywords={loc.weddingFocus ? [
          `DJ ${loc.name} TN`,
          `Wedding DJ ${loc.name}`,
          `${loc.name} wedding DJ`,
          `wedding DJ ${loc.name} TN`,
          `${loc.name} wedding DJs`,
          `best wedding DJ ${loc.name}`,
          `professional wedding DJ ${loc.name}`,
          `DJ services ${loc.name}`
        ] : [
          `DJ ${loc.name} TN`,
          `DJ services ${loc.name}`,
          `${loc.name} DJ`,
          `event DJ ${loc.name}`,
          `party DJ ${loc.name}`,
          `corporate DJ ${loc.name}`
        ]}
        jsonLd={structuredData}
      />
      
      {/* Fallback to old schema system if location not in new system */}
      {!structuredData && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "LocalBusiness",
                    "@id": `https://www.m10djcompany.com/${location}#localbusiness`,
                    "name": "M10 DJ Company",
                    "description": `Professional DJ services in ${loc.name} for weddings, corporate events, and celebrations. ${loc.description}`,
                    "url": `https://www.m10djcompany.com/${location}`,
                    "telephone": "(901) 410-2020",
                    "email": "m10djcompany@gmail.com",
                    "priceRange": "$$",
                    "paymentAccepted": ["Cash", "Check", "Credit Card", "PayPal"],
                    "currenciesAccepted": "USD",
                    "openingHours": "Mo-Su 09:00-21:00",
                    "address": {
                      "@type": "PostalAddress",
                      "addressLocality": loc.name,
                      "addressRegion": loc.name.includes('Memphis') ? "TN" : loc.name.includes('Southaven') ? "MS" : loc.name.includes('West Memphis') ? "AR" : "TN",
                      "addressCountry": "US",
                      "postalCode": loc.zipCodes[0]
                    },
                    "geo": {
                      "@type": "GeoCoordinates",
                      "latitude": loc.name.includes('East Memphis') ? "35.1174" : loc.name.includes('Germantown') ? "35.0867" : loc.name.includes('Collierville') ? "35.0420" : loc.name.includes('Cordova') ? "35.1456" : loc.name.includes('Southaven') ? "34.9895" : loc.name.includes('West Memphis') ? "35.1465" : "35.1495",
                      "longitude": loc.name.includes('East Memphis') ? "-89.8711" : loc.name.includes('Germantown') ? "-89.8101" : loc.name.includes('Collierville') ? "-89.6645" : loc.name.includes('Cordova') ? "-89.7734" : loc.name.includes('Southaven') ? "-89.9948" : loc.name.includes('West Memphis') ? "-90.1848" : "-90.0490"
                    },
                    "areaServed": {
                      "@type": "City",
                      "name": `${loc.name}, ${loc.name.includes('Southaven') ? 'MS' : loc.name.includes('West Memphis') ? 'AR' : 'TN'}`
                    },
                    "serviceType": [
                      "Wedding DJ Services",
                      "Corporate Event DJ",
                      "Private Party DJ", 
                      "MC Services",
                      "Event Entertainment",
                      "Sound System Rental",
                      "Uplighting Services"
                    ]
                  },
                  {
                    "@type": "QAPage",
                    "@id": `https://www.m10djcompany.com/${location}#qa1`,
                    "mainEntity": {
                      "@type": "Question",
                      "name": `What DJ services does M10 DJ Company offer in ${loc.name}?`,
                      "text": `I'm looking for professional DJ services in ${loc.name}. What specific services and packages does M10 DJ Company offer?`,
                      "answerCount": 1,
                      "upvoteCount": 42,
                      "datePublished": "2024-01-15T09:00:00-06:00",
                      "url": `https://www.m10djcompany.com/${location}#question`,
                      "author": {
                        "@type": "Person",
                        "name": "Local Event Planner",
                        "url": "https://www.m10djcompany.com/contact"
                      },
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": `M10 DJ Company provides comprehensive DJ services in ${loc.name} including ${loc.eventTypes.slice(0, 3).join(', ')}. We offer professional sound systems, wireless microphones, MC services, uplighting, and music for all types of celebrations.`,
                        "datePublished": "2024-01-15T10:00:00-06:00",
                        "url": `https://www.m10djcompany.com/${location}#services-answer`,
                        "upvoteCount": 73,
                        "author": {
                          "@type": "Organization",
                          "name": "M10 DJ Company",
                          "url": "https://www.m10djcompany.com"
                        }
                      }
                    }
                  }
                ]
              })
            }}
          />
        </>
      )}

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden [&_.heading-1]:!text-inherit">
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
                {loc.weddingFocus ? (
                  <>
                    <span className="block text-white">DJ {loc.name} TN</span>
                    <span className="block text-[#fcba00]">Wedding DJ {loc.name} Services</span>
                  </>
                ) : (
                  <>
                    <span className="block text-white">DJ {loc.name} TN</span>
                    <span className="block text-[#fcba00]">Professional Entertainment Services</span>
                  </>
                )}
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                {loc.description} From weddings to corporate events, we bring premium entertainment 
                to {loc.name} and your special occasions with professional equipment and experienced DJs.
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
          </div>
        </section>

        {/* Wedding DJ Focus Section */}
        {loc.weddingFocus && (
          <section className="py-16 bg-brand text-white">
            <div className="section-container">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-white mr-3" />
                  <span className="text-white font-semibold text-lg">Wedding DJ Specialists</span>
                </div>
                
                <h2 className="text-4xl font-bold mb-6">
                  {loc.name} Wedding DJ Services
                </h2>
                
                <p className="text-xl mb-8 opacity-90 leading-relaxed">
                  {loc.weddingDescription}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="text-center">
                    <Music className="w-12 h-12 text-white mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Ceremony Music</h3>
                    <p className="opacity-90">Professional sound for your {loc.name} wedding ceremony</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-12 h-12 text-white mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Reception DJ</h3>
                    <p className="opacity-90">Keep your {loc.name} wedding guests dancing all night</p>
                  </div>
                  <div className="text-center">
                    <Award className="w-12 h-12 text-white mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">MC Services</h3>
                    <p className="opacity-90">Professional announcements and timeline coordination</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={scrollToContact}
                    className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                  >
                    Get {loc.name} Wedding Quote
                  </button>
                  <Link 
                    href="/memphis-wedding-dj-prices-2025" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors text-center"
                  >
                    View Wedding Packages
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Location Details */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="section-container">
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
        <FAQSection showSchema={false} />

        {/* Related Services Section - Strategic Internal Linking */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6 text-gray-900 dark:text-white">
                Complete DJ Services for {loc.name}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Beyond {loc.name} events, M10 DJ Company offers specialized services throughout Memphis. 
                Explore our full range of professional entertainment options.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Wedding DJ Authority Link */}
              <Link 
                href="/memphis-wedding-dj"
                className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <Heart className="h-8 w-8 text-brand group-hover:text-brand-dark" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand">
                      Memphis Wedding DJ Services
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Complete wedding entertainment from ceremony to reception. Learn about our wedding packages and specialties.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Event DJ Services Link */}
              <Link 
                href="/memphis-event-dj-services"
                className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <Users className="h-8 w-8 text-brand group-hover:text-brand-dark" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand">
                      Corporate & Event DJ Memphis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Professional entertainment for corporate events, birthday parties, and special celebrations.
                    </p>
                  </div>
                </div>
              </Link>

              {/* DJ Near Me Link */}
              <Link 
                href="/dj-near-me-memphis"
                className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <MapPin className="h-8 w-8 text-brand group-hover:text-brand-dark" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand">
                      DJ Near Me Memphis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Find local DJ services throughout Memphis with same-day quotes and professional entertainment.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Specialty Services Link */}
              <Link 
                href="/memphis-specialty-dj-services"
                className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <Star className="h-8 w-8 text-brand group-hover:text-brand-dark" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand">
                      Specialty Event DJ Services
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      School dances, proms, bar mitzvahs, Sweet 16 parties, and other unique celebrations.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Multicultural Services Link */}
              <Link 
                href="/multicultural-dj-memphis"
                className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <Music className="h-8 w-8 text-brand group-hover:text-brand-dark" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand">
                      Multicultural DJ Services
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Spanish DJ, Indian wedding DJ, Bollywood DJ, and bilingual entertainment services.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Pricing Guide Link */}
              <Link 
                href="/memphis-dj-pricing-guide"
                className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <Calendar className="h-8 w-8 text-brand group-hover:text-brand-dark" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand">
                      Memphis DJ Pricing Guide
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Transparent pricing information for DJ services, packages, and what to expect for your event.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

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

        {/* Other Areas We Serve */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6 text-gray-900">Other Areas We Serve</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                M10 DJ Company provides professional DJ services throughout the Memphis metro area. 
                Explore our specialized services in these communities:
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(locationData)
                .filter(([key]) => key !== location)
                .map(([key, locationInfo]) => (
                  <Link 
                    key={key}
                    href={`/${key}`}
                    className="bg-gray-50 hover:bg-brand hover:text-white transition-all duration-300 rounded-lg p-4 text-center group"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="h-4 w-4 text-brand group-hover:text-white mr-2" />
                      <h3 className="font-semibold text-gray-900 group-hover:text-white">
                        {locationInfo.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 group-hover:text-white opacity-80">
                      DJ services in {locationInfo.name}
                      {locationInfo.weddingFocus && (
                        <span className="block text-xs mt-1">Wedding Specialists</span>
                      )}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Service Areas', url: '/#service-areas' },
          { name: `DJ ${loc.name} TN`, url: `/${location}` }
        ]}
      />
    </>
  );
}

// Generate static paths for all locations
export async function getStaticPaths() {
  const paths = Object.keys(locationData).map((location) => ({
    params: { slug: location },
  }));

  return {
    paths,
    // Only serve known location slugs; /gallery and other paths are handled by their own pages
    fallback: false,
  };
}

// Generate static props
export async function getStaticProps({ params }) {
  return {
    props: {
      location: params.slug,
    },
  };
} 