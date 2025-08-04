import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Lightbulb, 
  Volume2, 
  Mic, 
  Plus,
  Check,
  Star,
  Clock,
  Users,
  Settings,
  Heart
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import { db } from '../utils/company_lib/supabase';
import { scrollToContact } from '../utils/scroll-helpers';

const categoryIcons = {
  dj: Music,
  lighting: Lightbulb,
  sound: Volume2,
  mc: Mic,
  additional: Plus
};

const categoryLabels = {
  dj: 'DJ Services',
  lighting: 'Lighting Services',
  sound: 'Sound Systems',
  mc: 'MC Services',
  additional: 'Additional Services'
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await db.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const categories = [...new Set(services.map(s => s.category))];

  const formatPrice = (price) => {
    if (!price) return 'Contact for pricing';
    return `$${price.toLocaleString()}`;
  };

  const ServiceCard = ({ service }) => {
    const IconComponent = categoryIcons[service.category] || Music;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mr-4">
                <IconComponent className="w-8 h-8 text-black" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {service.service_name}
                </h3>
                <p className="text-brand-gold font-medium capitalize">
                  {categoryLabels[service.category] || service.category}
                </p>
              </div>
            </div>
            {service.is_featured && (
              <span className="bg-brand-gold text-black text-xs font-bold px-3 py-1 rounded-full">
                FEATURED
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {service.short_description}
          </p>

          {service.full_description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {service.full_description}
            </p>
          )}

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {service.duration_hours && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 text-brand-gold mr-2" />
                Duration: {service.duration_hours} hours
              </div>
            )}
            
            {service.setup_time_minutes && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Settings className="w-4 h-4 text-brand-gold mr-2" />
                Setup: {service.setup_time_minutes} minutes
              </div>
            )}
          </div>

          {/* Equipment Included */}
          {service.equipment_included && service.equipment_included.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Equipment Included:
              </h4>
              <div className="space-y-2">
                {service.equipment_included.map((equipment, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-brand-gold mr-2 flex-shrink-0" />
                    <span className="capitalize">{equipment.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(service.base_price)}
              </div>
              {service.price_unit && service.base_price && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  per {service.price_unit}
                </div>
              )}
              {service.is_addon && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full mt-2 inline-block">
                  Add-on Service
                </div>
              )}
            </div>
            
            <button
              onClick={scrollToContact}
              className="btn-primary"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group services by category for better organization
  const groupedServices = categories.reduce((acc, category) => {
    acc[category] = services.filter(service => service.category === category);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>Professional DJ Services & Pricing in Memphis | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Complete DJ services for Memphis weddings, corporate events & parties. Professional sound, lighting, and MC services with transparent pricing. Get your free quote today!" 
        />
        <meta name="keywords" content="professional DJ Memphis, pro DJ Memphis, DJ services Memphis, professional DJ services Memphis, wedding DJ pricing Memphis, corporate DJ services, sound system rental Memphis, uplighting Memphis, MC services Memphis TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/services" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Professional DJ Services & Pricing in Memphis | M10 DJ Company" />
        <meta property="og:description" content="Complete DJ services for Memphis weddings, corporate events & parties with transparent pricing." />
        <meta property="og:url" content="https://m10djcompany.com/services" />
        <meta property="og:type" content="website" />
        
        {/* Additional SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
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
                <span className="block text-white">Professional DJ Services</span>
                <span className="block text-gradient">for Memphis Events</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Memphis's premier professional DJ services for intimate celebrations to grand events. Our experienced pro DJs deliver 
                comprehensive entertainment with professional-grade equipment, skilled performances, and transparent pricing. Every event is customized to your unique vision.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">{services.length}+</div>
                  <div className="text-sm text-gray-300">Service Options</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">$295</div>
                  <div className="text-sm text-gray-300">Starting Price</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">8</div>
                  <div className="text-sm text-gray-300">Hours Max</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">100%</div>
                  <div className="text-sm text-gray-300">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            {/* Filter Section */}
            <div className="mb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-brand-gold text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Services ({services.length})
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors capitalize ${
                      selectedCategory === category
                        ? 'bg-brand-gold text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {categoryLabels[category] || category} ({services.filter(s => s.category === category).length})
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading our services...</p>
              </div>
            ) : selectedCategory === 'all' ? (
              // Show services grouped by category when "all" is selected
              <div className="space-y-16">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
                        {categoryLabels[category] || category}
                      </h2>
                      <div className="w-24 h-1 bg-brand-gold mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {categoryServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show filtered services
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}

            {/* Service Packages Section */}
            <div className="mt-20 bg-gray-50 dark:bg-gray-800 rounded-2xl p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Popular Service Packages
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Save money with our pre-designed packages that combine our most popular services for different event types.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Wedding Package */}
                <div className="bg-white dark:bg-gray-700 rounded-xl p-8 border-2 border-brand-gold">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Wedding Package
                    </h3>
                    <div className="text-3xl font-bold text-brand-gold mb-2">$895</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Complete wedding entertainment</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      8-hour DJ service
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Ceremony sound system
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Wireless microphones
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Dance floor lighting
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      MC announcements
                    </li>
                  </ul>
                  <button
                    onClick={scrollToContact}
                    className="btn-primary w-full"
                  >
                    Book Wedding Package
                  </button>
                </div>

                {/* Corporate Package */}
                <div className="bg-white dark:bg-gray-700 rounded-xl p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Corporate Package
                    </h3>
                    <div className="text-3xl font-bold text-brand-gold mb-2">$695</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Professional business events</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      6-hour DJ service
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Professional sound system
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Presentation support
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      MC services
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Background music
                    </li>
                  </ul>
                  <button
                    onClick={scrollToContact}
                    className="btn-secondary w-full"
                  >
                    Book Corporate Package
                  </button>
                </div>

                {/* Party Package */}
                <div className="bg-white dark:bg-gray-700 rounded-xl p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Party Package
                    </h3>
                    <div className="text-3xl font-bold text-brand-gold mb-2">$495</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Birthday & celebration parties</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      4-hour DJ service
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Party sound system
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Party lighting
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Microphone
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-brand-gold mr-2" />
                      Music requests
                    </li>
                  </ul>
                  <button
                    onClick={scrollToContact}
                    className="btn-secondary w-full"
                  >
                    Book Party Package
                  </button>
                </div>
              </div>
            </div>

            {/* Memphis Services Links */}
            <div className="mt-20 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Explore Memphis DJ Services
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Discover specialized DJ services for Memphis events, including wedding packages, pricing guides, and local expertise.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/memphis-dj-services" className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-center mb-4">
                    <Music className="w-8 h-8 text-brand mr-3" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                      Complete Memphis DJ Services
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Comprehensive DJ services for all Memphis events - weddings, corporate, private parties, and more.
                  </p>
                </Link>

                <Link href="/memphis-wedding-dj" className="bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-center mb-4">
                    <Heart className="w-8 h-8 text-brand mr-3" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                      Memphis Wedding DJ Specialists
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Professional wedding DJ services with ceremony music, reception entertainment, and MC services.
                  </p>
                </Link>
              </div>

              <div className="text-center mt-8">
                <Link href="/best-wedding-dj-memphis" className="btn-secondary mr-4">
                  Why We're Memphis's Best DJ
                </Link>
                <Link href="/blog/memphis-wedding-dj-cost-guide-2025" className="btn-outline">
                  View DJ Pricing Guide
                </Link>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Book Your Event?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Get a custom quote tailored to your specific event needs. We'll work with you to create the perfect entertainment package.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="#contact"
                  className="btn-primary text-lg"
                >
                  Get Custom Quote
                </Link>
                <a 
                  href="tel:(901)410-2020"
                  className="btn-outline text-lg"
                >
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Professional DJ Services",
            "description": "Complete DJ services for weddings, corporate events, and parties in Memphis, TN",
            "provider": {
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "telephone": "(901) 410-2020",
              "email": "m10djcompany@gmail.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Memphis",
                "addressRegion": "TN",
                "addressCountry": "US"
              }
            },
            "areaServed": {
              "@type": "City",
              "name": "Memphis, TN"
            },
            "offers": services.map(service => ({
              "@type": "Offer",
              "name": service.service_name,
              "description": service.short_description,
              "price": service.base_price || 0,
              "priceCurrency": "USD"
            }))
          })
        }}
      />
    </>
  );
} 