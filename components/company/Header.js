import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, Menu, X, ChevronDown, MapPin } from 'lucide-react';

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
    { name: 'Wedding DJ Services', href: '/services#wedding' },
    { name: 'Corporate Events', href: '/services#corporate' },
    { name: 'Private Parties', href: '/services#private' },
    { name: 'School Dances', href: '/services#school' },
    { name: 'Holiday Parties', href: '/services#holiday' }
  ];

  const areas = [
    { name: 'Memphis', href: '/memphis' },
    { name: 'Germantown', href: '/germantown' },
    { name: 'Collierville', href: '/collierville' },
    { name: 'Bartlett', href: '/bartlett' },
    { name: 'Arlington', href: '/arlington' }
  ];

  return (
    <>
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
                    alt="M10 DJ Company Logo"
                    width={50}
                    height={50}
                    className="rounded-lg transition-transform group-hover:scale-105"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-playfair group-hover:text-brand transition-colors">
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
                        onClick={closeDropdown}
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
              
              <Link href="#contact" className="text-gray-700 hover:text-brand font-semibold font-inter transition-colors">
                Contact
              </Link>
            </nav>

            {/* Contact Info & CTA */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Phone className="w-4 h-4 text-brand" />
                  <a href="tel:+19015551234" className="text-gray-700 hover:text-brand font-semibold font-inter transition-colors">
                    (901) 555-1234
                  </a>
                </div>
              </div>
              
              <Link href="#contact" className="btn-primary">
                Get Quote
              </Link>
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
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg animate-fade-in">
            <div className="section-container py-4">
              <nav className="space-y-4">
                <Link 
                  href="/" 
                  className="block text-gray-700 hover:text-brand font-semibold font-inter py-2 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {/* Mobile Services */}
                <div>
                  <button
                    className="flex items-center justify-between w-full text-gray-700 font-semibold font-inter py-2"
                    onClick={() => toggleDropdown('mobile-services')}
                  >
                    Services
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'mobile-services' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'mobile-services' && (
                    <div className="pl-4 pt-2 space-y-2">
                      {services.map((service) => (
                        <Link
                          key={service.name}
                          href={service.href}
                          className="block text-gray-600 hover:text-brand font-inter py-1 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {service.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Areas */}
                <div>
                  <button
                    className="flex items-center justify-between w-full text-gray-700 font-semibold font-inter py-2"
                    onClick={() => toggleDropdown('mobile-areas')}
                  >
                    Service Areas
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'mobile-areas' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'mobile-areas' && (
                    <div className="pl-4 pt-2 space-y-2">
                      {areas.map((area) => (
                        <Link
                          key={area.name}
                          href={area.href}
                          className="block text-gray-600 hover:text-brand font-inter py-1 transition-colors"
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
                  className="block text-gray-700 hover:text-brand font-semibold font-inter py-2 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                
                <Link 
                  href="#contact" 
                  className="block text-gray-700 hover:text-brand font-semibold font-inter py-2 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </nav>

              {/* Mobile Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center space-x-3 bg-gray-50 px-3 py-3 rounded-lg">
                  <Phone className="w-5 h-5 text-brand" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 font-inter">Call or Text</p>
                    <a href="tel:+19015551234" className="text-brand hover:text-brand-600 font-semibold font-inter transition-colors">
                      (901) 555-1234
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 bg-gray-50 px-3 py-3 rounded-lg">
                  <Mail className="w-5 h-5 text-brand" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 font-inter">Email Us</p>
                    <a href="mailto:info@m10dj.com" className="text-brand hover:text-brand-600 font-semibold font-inter transition-colors">
                      info@m10dj.com
                    </a>
                  </div>
                </div>

                <Link 
                  href="#contact" 
                  className="btn-primary w-full text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Your Free Quote
                </Link>
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