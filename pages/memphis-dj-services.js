import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Users, 
  Calendar, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  ChevronRight,
  Volume2,
  Mic2,
  Headphones,
  Sparkles,
  Building,
  Heart,
  GraduationCap,
  TreePine
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import { scrollToContact } from '../utils/scroll-helpers';

const djServices = [
  {
    icon: Heart,
    title: "Wedding DJ Services",
    description: "Professional Memphis DJ services for all event types including corporate events, private parties, school dances, and special celebrations",
    features: ["Ceremony music", "Reception DJ", "MC services", "Uplighting", "Dance floor lighting"],
    price: "Starting at $799"
  },
  {
    icon: Building,
    title: "Corporate Event DJ",
    description: "Professional corporate entertainment for Memphis businesses, conferences, and company celebrations",
    features: ["Background music", "Presentation support", "Awards ceremonies", "Holiday parties", "Team building events"],
    price: "Starting at $495"
  },
  {
    icon: Users,
    title: "Private Party & Anniversary DJ",
    description: "Memorable anniversary DJ services and private party entertainment for birthdays, milestone celebrations, and special occasions throughout Memphis",
    features: ["Anniversary celebrations", "Birthday parties", "Anniversary DJ Memphis", "Retirement parties", "Family reunions", "Graduation parties"],
    price: "Starting at $395"
  },
  {
    icon: GraduationCap,
    title: "School Dance DJ",
    description: "Age-appropriate Memphis school dance entertainment for proms, homecoming, and school events",
    features: ["Prom DJ services", "Homecoming dances", "School fundraisers", "Clean music playlists", "Interactive entertainment"],
    price: "Starting at $595"
  },
  {
    icon: TreePine,
    title: "Holiday Party DJ",
    description: "Festive holiday entertainment for Christmas parties, New Year events, and seasonal celebrations",
    features: ["Christmas parties", "New Year celebrations", "Halloween events", "Themed decorations", "Holiday music"],
    price: "Starting at $495"
  },
  {
    icon: Sparkles,
    title: "Special Events DJ",
    description: "Custom Memphis DJ services for unique events, grand openings, and community celebrations",
    features: ["Grand openings", "Community events", "Charity fundraisers", "Product launches", "Award ceremonies"],
    price: "Custom pricing"
  }
];

const equipmentFeatures = [
  {
    icon: Volume2,
    title: "Professional Sound Systems",
    description: "High-quality speakers and mixing equipment for crystal-clear audio at any Memphis venue"
  },
  {
    icon: Mic2,
    title: "Wireless Microphones",
    description: "Professional wireless mic systems for speeches, toasts, and announcements"
  },
  {
    icon: Sparkles,
    title: "LED Uplighting",
    description: "Color-changing LED uplighting to transform any Memphis venue atmosphere"
  },
  {
    icon: Music,
    title: "Professional Mixing",
    description: "Seamless music transitions and professional DJ mixing for non-stop entertainment"
  }
];

const serviceAreas = [
  { name: "Downtown Memphis", slug: "downtown-memphis" },
  { name: "Midtown Memphis", slug: "midtown-memphis" },
  { name: "East Memphis", slug: "east-memphis" },
  { name: "Memphis", slug: "memphis" },
  { name: "Germantown", slug: "germantown" },
  { name: "Collierville", slug: "collierville" },
  { name: "Bartlett", slug: "bartlett" },
  { name: "Cordova", slug: "cordova" },
  { name: "Olive Branch", slug: "olive-branch" },
  { name: "Southaven", slug: "southaven" },
  { name: "Lakeland", slug: "lakeland" },
  { name: "Arlington", slug: "arlington" },
  { name: "Millington", slug: "millington" },
  { name: "West Memphis", slug: "west-memphis" }
];

const testimonials = [
  {
    name: "Jamie Irby",
    event: "Entertainment Director - The Bluff",
    quote: "As entertainment director at The Bluff, I've worked with many DJs, but M10 DJ Company stands out. Ben is professional, reliable, and always delivers exceptional service for our Memphis events. Highly recommend!",
    rating: 5
  },
  {
    name: "Quade Nowlin",
    event: "Wedding Reception",
    quote: "Ben was absolutely amazing for our Memphis wedding! From the ceremony to the reception, everything was flawless. The music selection kept everyone on the dance floor, and his MC skills were professional and engaging. Worth every penny!",
    rating: 5
  },
  {
    name: "Alexis Cameron",
    event: "Wedding Reception",
    quote: "M10 DJ Company exceeded all our expectations! Ben understood our vision perfectly and created the ideal atmosphere for our Memphis wedding. The sound quality was incredible and he kept the energy high all night long.",
    rating: 5
  }
];

export default function MemphisDJServices() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Memphis DJ Services | All Event Types | Professional DJ</title>
        <meta 
          name="description" 
          content="Complete Memphis DJ services for all event types: corporate events, private parties, school dances, and celebrations. Professional equipment, experienced DJs. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="Memphis DJ services, DJ services Memphis, event DJ Memphis, corporate DJ Memphis, Memphis event DJ, Memphis party DJ, professional DJ Memphis, anniversary DJ Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/memphis-dj-services" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis DJ Services | Professional Event Entertainment" />
        <meta property="og:description" content="Complete Memphis DJ services for all events with professional equipment and experienced entertainers. Serving Memphis, TN and surrounding areas." />
        <meta property="og:url" content="https://m10djcompany.com/memphis-dj-services" />
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
              "description": "Complete Memphis DJ services for weddings, corporate events, private parties, and special celebrations. Professional equipment, experienced DJs, transparent pricing. Call (901) 410-2020!",
              "url": "https://m10djcompany.com/memphis-dj-services",
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
              "areaServed": serviceAreas.map(area => ({
                "@type": "City",
                "name": area.name
              })),
              "serviceType": ["Wedding DJ Services", "Corporate Event DJ", "Private Party DJ", "School Dance DJ", "Holiday Party Entertainment"],
              "priceRange": "$395-$1899"
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
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="block text-white">Memphis DJ Services</span>
                <span className="block text-gradient">Complete Entertainment for Every Event Type</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                Comprehensive Memphis DJ services covering weddings, corporate events, private parties, school dances, and special celebrations. 
                From intimate gatherings to large-scale corporate galas, we provide professional entertainment tailored to your event type.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Free Quote Today
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                  <Phone className="mr-2 w-5 h-5" />
                  Call (901) 410-2020
                </a>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">2000+</div>
                  <div className="text-sm text-gray-300">Memphis Events</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">10+</div>
                  <div className="text-sm text-gray-300">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">5★</div>
                  <div className="text-sm text-gray-300">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">100%</div>
                  <div className="text-sm text-gray-300">Client Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Complete Memphis DJ Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From intimate gatherings to grand celebrations, our Memphis DJ services cover every type of event 
                with professional entertainment, premium equipment, and personalized attention to detail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {djServices.map((service, index) => (
                <div key={index} className="card text-center group hover:shadow-xl transition-all duration-300">
                  <service.icon className="w-16 h-16 text-brand mx-auto mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center justify-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="text-xl font-bold text-brand mb-4">{service.price}</div>
                  <button 
                    onClick={scrollToContact}
                    className="btn-outline w-full group-hover:btn-primary transition-all"
                  >
                    Get Free Quote
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment Section */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Professional DJ Equipment</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our Memphis DJ services include premium sound systems, lighting equipment, and professional 
                mixing technology to ensure flawless entertainment at your event.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {equipmentFeatures.map((feature, index) => (
                <div key={index} className="text-center group">
                  <div className="bg-white rounded-2xl p-8 shadow-lg group-hover:shadow-xl transition-shadow">
                    <feature.icon className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                All equipment is professional-grade, fully insured, and includes backup systems for peace of mind.
              </p>
              <Link href="/memphis-wedding-dj" className="btn-primary">
                View Wedding Packages
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Memphis DJ Services Coverage Area</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our Memphis DJ services extend throughout the greater Memphis area and surrounding communities. 
                We're proud to serve Tennessee couples and event planners across the Mid-South region.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {serviceAreas.map((area, index) => (
                <Link 
                  key={index} 
                  href={`/${area.slug}`}
                  className="text-center p-4 rounded-lg border hover:bg-gray-50 hover:shadow-md hover:border-brand transition-all duration-200 group"
                >
                  <MapPin className="w-5 h-5 text-brand mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-brand transition-colors">{area.name}</span>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                Don't see your location? We travel throughout Tennessee and surrounding states!
              </p>
              <button onClick={scrollToContact} className="btn-outline">
                Ask About Your Area
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">What Memphis Clients Say</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See why Memphis event planners, couples, and corporations choose our DJ services 
                for their most important celebrations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <CheckCircle key={i} className="w-5 h-5 text-brand-gold" />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                  
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-brand-gold">{testimonial.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Why Choose M10 Memphis DJ Services?</h2>
                <p className="text-xl opacity-90">
                  Experience the difference that professional Memphis DJ services can make for your event.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Memphis Local Expertise</h3>
                      <p className="opacity-90">Over 10 years serving Memphis events with deep knowledge of local venues and preferences.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Professional Equipment</h3>
                      <p className="opacity-90">Premium sound systems, wireless mics, and LED lighting included in every package.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Personalized Service</h3>
                      <p className="opacity-90">Customized music selection and timeline planning for your specific Memphis event.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Transparent Pricing</h3>
                      <p className="opacity-90">No hidden fees or surprise charges - clear, upfront pricing for all Memphis DJ services.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Backup Systems</h3>
                      <p className="opacity-90">Redundant equipment and backup plans ensure your Memphis event never misses a beat.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-white mr-4 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">5-Star Reviews</h3>
                      <p className="opacity-90">Consistently rated 5 stars by Memphis clients for professionalism and entertainment quality.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-16">
                <button 
                  onClick={scrollToContact}
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors mr-4"
                >
                  Book Your Memphis DJ
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
                <a href="tel:(901)410-2020" className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                  <Phone className="mr-2 w-5 h-5 inline" />
                  Call (901) 410-2020
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