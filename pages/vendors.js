import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Camera, 
  Flower, 
  ChefHat, 
  Calendar, 
  Cake, 
  Video,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Star,
  Filter
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import { db } from '../utils/company_lib/supabase';

const vendorTypeIcons = {
  photographer: Camera,
  videographer: Video,
  florist: Flower,
  caterer: ChefHat,
  planner: Calendar,
  baker: Cake,
  decorator: Flower,
  transportation: MapPin,
  other: Star
};

const vendorTypeLabels = {
  photographer: 'Photographers',
  videographer: 'Videographers', 
  florist: 'Florists',
  caterer: 'Caterers',
  planner: 'Wedding Planners',
  baker: 'Bakers & Desserts',
  decorator: 'Decorators',
  transportation: 'Transportation',
  other: 'Other Services'
};

export default function PreferredVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await db.getPreferredVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = selectedType === 'all' 
    ? vendors 
    : vendors.filter(vendor => vendor.business_type === selectedType);

  const vendorTypes = [...new Set(vendors.map(v => v.business_type))];

  const renderPriceRange = (range) => {
    if (!range) return null;
    return (
      <div className="flex items-center">
        <span className="text-brand-gold font-medium">{range}</span>
        <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
          {range === '$' && 'Budget-friendly'}
          {range === '$$' && 'Moderate'}
          {range === '$$$' && 'Premium'}
          {range === '$$$$' && 'Luxury'}
        </span>
      </div>
    );
  };

  const VendorCard = ({ vendor }) => {
    const IconComponent = vendorTypeIcons[vendor.business_type] || Star;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {vendor.logo_url && (
          <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <img 
              src={vendor.logo_url} 
              alt={`${vendor.business_name} logo`}
              className="max-h-32 max-w-32 object-contain"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center mr-3">
                <IconComponent className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {vendor.business_name}
                </h3>
                <p className="text-brand-gold font-medium capitalize">
                  {vendorTypeLabels[vendor.business_type] || vendor.business_type}
                </p>
              </div>
            </div>
            {vendor.is_featured && (
              <span className="bg-brand-gold text-black text-xs font-bold px-2 py-1 rounded-full">
                FEATURED
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {vendor.description}
          </p>

          {vendor.specialties && vendor.specialties.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Specialties:
              </h4>
              <div className="flex flex-wrap gap-2">
                {vendor.specialties.map((specialty, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {specialty.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mb-4">
            {vendor.contact_name && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium mr-2">Contact:</span>
                {vendor.contact_name}
              </div>
            )}
            
            {vendor.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-brand-gold mr-2" />
                <a 
                  href={`tel:${vendor.phone}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
                >
                  {vendor.phone}
                </a>
              </div>
            )}
            
            {vendor.email && (
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-brand-gold mr-2" />
                <a 
                  href={`mailto:${vendor.email}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
                >
                  {vendor.email}
                </a>
              </div>
            )}

            {vendor.address && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-brand-gold mr-2" />
                {vendor.address}, {vendor.city}, {vendor.state}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            {renderPriceRange(vendor.price_range)}
            
            <div className="flex items-center space-x-2">
              {vendor.years_worked_together > 0 && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                  {vendor.years_worked_together} years together
                </span>
              )}
              
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-brand-gold hover:text-brand-gold-dark transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Preferred Wedding Vendors in Memphis | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Discover our network of trusted wedding vendors in Memphis, TN. Photographers, caterers, florists, and more - all vetted by M10 DJ Company for exceptional service." 
        />
        <meta name="keywords" content="Memphis wedding vendors, wedding photographers Memphis, wedding caterers Memphis, wedding florists Memphis, wedding planners Memphis TN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/vendors" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Preferred Wedding Vendors in Memphis | M10 DJ Company" />
        <meta property="og:description" content="Discover our network of trusted wedding vendors in Memphis, TN. All vetted by M10 DJ Company for exceptional service." />
        <meta property="og:url" content="https://m10djcompany.com/vendors" />
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
                <span className="block">Preferred Wedding Vendors</span>
                <span className="block text-gradient">in Memphis, Tennessee</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Our handpicked network of trusted wedding professionals in Memphis. These vendors have proven their excellence 
                through our collaborations and come highly recommended for your special day.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">{vendors.length}+</div>
                  <div className="text-sm text-gray-300">Trusted Partners</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">500+</div>
                  <div className="text-sm text-gray-300">Events Together</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">8</div>
                  <div className="text-sm text-gray-300">Service Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">100%</div>
                  <div className="text-sm text-gray-300">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vendors Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            {/* Filter Section */}
            <div className="mb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedType === 'all'
                      ? 'bg-brand-gold text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Vendors ({vendors.length})
                </button>
                {vendorTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors capitalize ${
                      selectedType === type
                        ? 'bg-brand-gold text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {vendorTypeLabels[type] || type} ({vendors.filter(v => v.business_type === type).length})
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading our preferred vendors...</p>
              </div>
            ) : filteredVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No vendors found for the selected category.
                </p>
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-16 text-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Want to Join Our Preferred Vendors?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                We're always looking for exceptional wedding professionals who share our commitment to excellence. 
                If you'd like to partner with M10 DJ Company, we'd love to hear from you.
              </p>
              <Link 
                href="#contact"
                className="btn-primary text-lg"
              >
                Partner With Us
              </Link>
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
            "@type": "WebPage",
            "name": "Preferred Wedding Vendors in Memphis",
            "description": "Trusted wedding vendors in Memphis, TN recommended by M10 DJ Company",
            "url": "https://m10djcompany.com/vendors",
            "isPartOf": {
              "@type": "WebSite",
              "url": "https://m10djcompany.com"
            },
            "about": {
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
            }
          })
        }}
      />
    </>
  );
} 