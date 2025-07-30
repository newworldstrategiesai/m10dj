import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const serviceAreas = [
    { name: 'Midtown Memphis', href: '/midtown-memphis' },
    { name: 'Downtown Memphis', href: '/downtown-memphis' },
    { name: 'Germantown', href: '/germantown' },
    { name: 'Collierville', href: '/collierville' },
    { name: 'Bartlett', href: '/bartlett' },
    { name: 'Arlington', href: '/arlington' }
  ];

  const services = [
    { name: 'Wedding DJ Services', href: '/services#wedding' },
    { name: 'Corporate Events', href: '/services#corporate' },
    { name: 'Birthday Parties', href: '/services#parties' },
    { name: 'Sound & Lighting', href: '/services#lighting' },
    { name: 'MC Services', href: '/services#mc' }
  ];

  const resources = [
    { name: 'About Us', href: '/about' },
    { name: 'Our Services', href: '/services' },
    { name: 'Event Blog', href: '/blog' },
    { name: 'Preferred Venues', href: '/venues' },
    { name: 'Trusted Vendors', href: '/vendors' },
    { name: 'Admin Dashboard', href: '/admin/dashboard' }
  ];

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "M10 DJ Company",
    "description": "Professional DJ services for weddings, corporate events, and parties in Memphis, TN",
    "url": "https://m10djcompany.com",
    "telephone": "(901) 410-2020",
    "email": "m10djcompany@gmail.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://m10djcompany.com/logo-static.jpg",
      "width": "400",
      "height": "400"
    },
    "image": "https://m10djcompany.com/logo-static.jpg",
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
    "areaServed": [
      {
        "@type": "City",
        "name": "Memphis, TN"
      },
      {
        "@type": "City", 
        "name": "Germantown, TN"
      },
      {
        "@type": "City",
        "name": "Collierville, TN"
      },
      {
        "@type": "City",
        "name": "Bartlett, TN"
      },
      {
        "@type": "City",
        "name": "Arlington, TN"
      }
    ],
    "priceRange": "$$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "50"
    },
    "sameAs": [
      "https://facebook.com/m10djcompany",
      "https://instagram.com/m10djcompany"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      
      <footer className="cyber-grid animated-bg text-white relative overflow-hidden">
        <div className="section-container py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                <div className="relative w-14 h-14 mr-3">
                  <Image
                    src="/logo.gif"
                    alt="M10 DJ Company Logo"
                    width={56}
                    height={56}
                    className="object-contain"
                    unoptimized // This allows GIF animation to work
                    onError={(e) => {
                      // Fallback to static logo if GIF fails to load
                      e.target.src = '/logo-static.jpg';
                    }}
                  />
                </div>
                <div>
                  <div className="text-xl font-bold font-orbitron text-neon-cyan neon-text">M10 DJ COMPANY</div>
                  <div className="text-neon-purple text-sm font-rajdhani uppercase tracking-wide">Memphis Event Entertainment</div>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed font-rajdhani">
                Creating unforgettable celebrations throughout Memphis and surrounding areas 
                with professional DJ services, lighting, and entertainment.
              </p>

              <div className="space-y-3">
                <div className="flex items-center glass-card px-3 py-2">
                  <Phone className="w-5 h-5 text-neon-cyan mr-3" />
                  <a 
                    href="tel:(901)410-2020" 
                    className="text-gray-300 hover:text-neon-cyan transition-colors font-rajdhani"
                  >
                    (901) 410-2020
                  </a>
                </div>
                <div className="flex items-center glass-card px-3 py-2">
                  <Mail className="w-5 h-5 text-neon-purple mr-3" />
                  <a 
                    href="mailto:m10djcompany@gmail.com" 
                    className="text-gray-300 hover:text-neon-purple transition-colors font-rajdhani"
                  >
                    m10djcompany@gmail.com
                  </a>
                </div>
                <div className="flex items-center glass-card px-3 py-2">
                  <MapPin className="w-5 h-5 text-neon-pink mr-3" />
                  <span className="text-gray-300 font-rajdhani">Memphis, TN & Surrounding Areas</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-bold mb-6 font-orbitron text-neon-cyan uppercase tracking-wide">Our Services</h3>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index}>
                    <Link 
                      href={service.href}
                      className="text-gray-300 hover:text-neon-cyan transition-colors text-sm font-rajdhani block py-1 px-2 hover:bg-neon-cyan/10 clip-cyber-small"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-bold mb-6 font-orbitron text-neon-purple uppercase tracking-wide">Resources</h3>
              <ul className="space-y-3">
                {resources.map((resource, index) => (
                  <li key={index}>
                    <Link 
                      href={resource.href}
                      className="text-gray-300 hover:text-neon-purple transition-colors text-sm font-rajdhani block py-1 px-2 hover:bg-neon-purple/10 clip-cyber-small"
                    >
                      {resource.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Service Areas */}
            <div>
              <h3 className="text-lg font-bold mb-6 font-orbitron text-neon-pink uppercase tracking-wide">Areas We Serve</h3>
              <ul className="space-y-3">
                {serviceAreas.map((area, index) => (
                  <li key={index}>
                    <Link 
                      href={area.href}
                      className="text-gray-300 hover:text-neon-pink transition-colors text-sm font-rajdhani block py-1 px-2 hover:bg-neon-pink/10 clip-cyber-small"
                    >
                      {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Media & Copyright */}
          <div className="border-t border-neon-cyan/30 mt-12 pt-8 glass-card p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <a
                  href="https://facebook.com/m10djcompany"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 glass-card flex items-center justify-center hover:bg-neon-cyan hover:text-black transition-all duration-300 clip-cyber-small group"
                  aria-label="Follow us on Facebook"
                >
                  <Facebook className="w-5 h-5 text-neon-cyan group-hover:text-black" />
                </a>
                <a
                  href="https://instagram.com/m10djcompany"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 glass-card flex items-center justify-center hover:bg-neon-purple hover:text-black transition-all duration-300 clip-cyber-small group"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5 text-neon-purple group-hover:text-black" />
                </a>
              </div>
              
              <div className="text-center md:text-right">
                <p className="text-gray-300 text-sm font-rajdhani uppercase tracking-wide">
                  © {new Date().getFullYear()} M10 DJ Company. All rights reserved.
                </p>
                <p className="text-neon-cyan text-xs mt-1 font-orbitron">
                  Professional DJ Services in Memphis, TN since 2014
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
} 