import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, Menu, X, ChevronDown, MapPin } from 'lucide-react';
// Temporarily disabled to prevent rate limiting issues
// import { trackContactAction, trackLead, trackServiceInterest } from '../EnhancedTracking';
import { scrollToContact } from '../../utils/scroll-helpers';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const services = [
    { name: 'Wedding DJ Services', href: '/memphis-wedding-dj' },
    { name: 'Corporate Events', href: '/corporate-events' },
    { name: 'Private Parties', href: '/private-parties' },
    { name: 'School Dances', href: '/school-dances' },
    { name: 'Holiday Parties', href: '/holiday-parties' },
    { name: 'Multicultural DJ', href: '/multicultural-dj-memphis' },
    { name: 'DJ Equipment Rentals', href: '/dj-rentals-memphis' },
    { name: 'Pricing Guide', href: '/memphis-dj-pricing-guide' }
  ];

  const areas = [
    { name: 'Memphis', href: '/memphis' },
    { name: 'Germantown', href: '/germantown' },
    { name: 'Collierville', href: '/collierville' },
    { name: 'Bartlett', href: '/bartlett' },
    { name: 'Arlington', href: '/arlington' },
    { name: 'Cordova', href: '/cordova' },
    { name: 'Southaven', href: '/southaven' },
    { name: 'Olive Branch', href: '/olive-branch' },
    { name: 'East Memphis', href: '/east-memphis' },
    { name: 'Midtown Memphis', href: '/midtown-memphis' },
    { name: 'Downtown Memphis', href: '/downtown-memphis' },
    { name: 'Millington', href: '/millington' },
    { name: 'Lakeland', href: '/lakeland' },
    { name: 'West Memphis', href: '/west-memphis' }
  ];

  return (
    <>
      {/* Skip Navigation Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[60] bg-brand text-white px-4 py-2 rounded-md font-semibold focus:ring-2 focus:ring-yellow-400"
      >
        Skip to main content
      </a>
      
      <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="section-container">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src="/logo-static.jpg"
                    alt="M10 DJ Company - Memphis Wedding DJ & Event Entertainment Services"
                    width={50}
                    height={50}
                    className="rounded-lg transition-transform group-hover:scale-105"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-sans group-hover:text-brand transition-colors">
                    M10 DJ Company
                  </h1>
                  <p className="text-sm text-brand font-semibold font-inter tracking-wide">
                    Premium Event Entertainment
                  </p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-brand font-semibold font-inter transition-colors">
                Home
              </Link>
              
              {/* Services Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-700 hover:text-brand font-semibold font-inter transition-colors"
                  onClick={() => toggleDropdown('services')}
                >
                  Services
                  <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>
                {openDropdown === 'services' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-premium border border-gray-200 py-2 z-50 animate-fade-in">
                    {services.map((service) => (
                      <Link
                        key={service.name}
                        href={service.href}
                        className="block px-4 py-3 text-gray-700 hover:bg-brand/5 hover:text-brand font-inter transition-colors"
                        onClick={() => {
                          closeDropdown();
                          // trackServiceInterest(service.name.toLowerCase().replace(/\s+/g, '_'), 'header_dropdown');
                        }}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Areas Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center text-gray-700 hover:text-brand font-semibold font-inter transition-colors"
                  onClick={() => toggleDropdown('areas')}
                >
                  Service Areas
                  <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>
                {openDropdown === 'areas' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-premium border border-gray-200 py-2 z-50 animate-fade-in">
                    {areas.map((area) => (
                      <Link
                        key={area.name}
                        href={area.href}
                        className="block px-4 py-3 text-gray-700 hover:bg-brand/5 hover:text-brand font-inter transition-colors"
                        onClick={closeDropdown}
                      >
                        {area.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/about" className="text-gray-700 hover:text-brand font-semibold font-inter transition-colors">
                About
              </Link>
              
              <Link href="/contact" className="text-gray-700 hover:text-brand font-semibold font-inter transition-colors">
                Contact
              </Link>
            </nav>

            {/* Contact Info & CTA */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Phone className="w-4 h-4 text-brand" />
                  <a 
                    href="tel:+19014102020" 
                    className="text-gray-700 hover:text-brand font-semibold font-inter transition-colors"
                    onClick={() => {
                      // trackContactAction('phone', 'header_desktop');
                    }}
                  >
(901) 410-2020
                  </a>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  // trackLead('quote_request_start', { source: 'header_desktop' });
                  scrollToContact();
                }}
                className="btn-primary"
              >
                Get Quote
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-brand transition-colors rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-gradient-to-b from-white via-gray-50/50 to-white border-t border-gray-200 shadow-2xl animate-fade-in max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="section-container py-6">
              <nav className="space-y-2">
                <Link 
                  href="/" 
                  className="block text-gray-900 hover:text-brand hover:bg-brand/5 font-semibold font-inter py-3 px-4 rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {/* Mobile Services */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="flex items-center justify-between w-full text-gray-900 font-bold font-inter py-3 px-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 hover:from-amber-50 hover:to-orange-50 transition-all"
                    onClick={() => toggleDropdown('mobile-services')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                    Services
                    </span>
                    <ChevronDown className={`w-5 h-5 text-brand transition-transform ${openDropdown === 'mobile-services' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'mobile-services' && (
                    <div className="bg-white p-3 space-y-1">
                      {services.map((service) => (
                        <Link
                          key={service.name}
                          href={service.href}
                          className="block text-gray-700 hover:text-brand hover:bg-brand/5 font-inter py-2 px-3 rounded-md transition-all text-sm"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            // trackServiceInterest(service.name.toLowerCase().replace(/\s+/g, '_'), 'mobile_menu');
                          }}
                        >
                          → {service.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Areas */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="flex items-center justify-between w-full text-gray-900 font-bold font-inter py-3 px-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-all"
                    onClick={() => toggleDropdown('mobile-areas')}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    Service Areas
                    </span>
                    <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${openDropdown === 'mobile-areas' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'mobile-areas' && (
                    <div className="bg-white p-3 grid grid-cols-2 gap-1">
                      {areas.map((area) => (
                        <Link
                          key={area.name}
                          href={area.href}
                          className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-inter py-2 px-3 rounded-md transition-all text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {area.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link 
                  href="/about" 
                  className="block text-gray-900 hover:text-brand hover:bg-brand/5 font-semibold font-inter py-3 px-4 rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToContact();
                  }}
                  className="block w-full text-left text-gray-900 hover:text-brand hover:bg-brand/5 font-semibold font-inter py-3 px-4 rounded-lg transition-all"
                >
                  Contact
                </button>
                
                <Link 
                  href="/signin" 
                  className="block text-gray-900 hover:text-brand hover:bg-brand/5 font-semibold font-inter py-3 px-4 rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Sign In
                </Link>
              </nav>

              {/* Mobile Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-300 space-y-3">
                <div className="bg-gradient-to-br from-brand/10 to-amber-100/50 border border-brand/20 px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 font-inter mb-0.5">Call or Text</p>
                      <a href="tel:+19014102020" className="text-brand hover:text-amber-700 font-bold font-inter text-lg transition-colors">
(901) 410-2020
                    </a>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 font-inter mb-0.5">Email Us</p>
                      <a href="mailto:info@m10djcompany.com" className="text-blue-600 hover:text-blue-700 font-bold font-inter text-sm transition-colors break-all">
                      info@m10djcompany.com
                    </a>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToContact();
                  }}
                  className="btn-primary w-full text-center shadow-lg hover:shadow-xl min-h-[48px] text-base font-bold"
                >
                  Get Your Free Quote
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Click outside to close dropdowns */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-30"
          onClick={closeDropdown}
        />
      )}
    </>
  );
} 