import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, Mail, ChevronDown } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
      setActiveDropdown(null);
    }
  };

  const navigationItems = [
    { 
      name: 'Home', 
      href: '/', 
      type: 'link' 
    },
    { 
      name: 'About', 
      href: '/about', 
      type: 'link' 
    },
    {
      name: 'Services',
      type: 'dropdown',
      items: [
        { name: 'All Services', href: '/services' },
        { name: 'Wedding Packages', href: '/services#wedding' },
        { name: 'Corporate Events', href: '/services#corporate' },
        { name: 'Private Parties', href: '/services#parties' },
        { name: 'Lighting & Sound', href: '/services#lighting' }
      ]
    },
    {
      name: 'Resources',
      type: 'dropdown',
      items: [
        { name: 'Preferred Venues', href: '/venues' },
        { name: 'Trusted Vendors', href: '/vendors' },
        { name: 'Event Blog', href: '/blog' },
        { name: 'Planning Tips', href: '/#faq' },
        { name: 'Photo Gallery', href: '/#gallery' }
      ]
    },
    {
      name: 'Areas Served',
      type: 'dropdown',
      items: [
        { name: 'Midtown Memphis', href: '/midtown-memphis' },
        { name: 'Downtown Memphis', href: '/downtown-memphis' },
        { name: 'Germantown', href: '/germantown' },
        { name: 'Collierville', href: '/collierville' },
        { name: 'Bartlett', href: '/bartlett' },
        { name: 'Arlington', href: '/arlington' }
      ]
    },
    { 
      name: 'Blog', 
      href: '/blog', 
      type: 'link' 
    },
    { 
      name: 'Contact', 
      onClick: () => scrollToSection('contact'),
      type: 'button' 
    }
  ];

  const handleDropdownToggle = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'glass-card backdrop-blur-md shadow-neon-cyan' 
        : 'bg-transparent'
    }`}>
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-16 h-16 transform group-hover:scale-105 transition-transform">
              <Image
                src="/logo.gif"
                alt="M10 DJ Company Logo"
                width={64}
                height={64}
                className="object-contain"
                priority
                unoptimized // This allows GIF animation to work
                onError={(e) => {
                  // Fallback to static logo if GIF fails to load
                  e.target.src = '/logo-static.jpg';
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-white font-orbitron neon-text">
                M10 DJ COMPANY
              </div>
              <div className="text-sm text-neon-purple font-rajdhani uppercase tracking-wide">
                Memphis Event Entertainment
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item, index) => (
              <div key={index} className="relative">
                {item.type === 'link' ? (
                  <Link
                    href={item.href}
                    className="px-4 py-2 text-gray-300 hover:text-neon-cyan font-medium transition-colors font-rajdhani uppercase tracking-wide"
                  >
                    {item.name}
                  </Link>
                ) : item.type === 'button' ? (
                  <button
                    onClick={item.onClick}
                    className="px-4 py-2 text-gray-300 hover:text-neon-cyan font-medium transition-colors font-rajdhani uppercase tracking-wide"
                  >
                    {item.name}
                  </button>
                ) : (
                  // Dropdown
                  <div className="relative">
                    <button
                      onClick={() => handleDropdownToggle(index)}
                      onMouseEnter={() => setActiveDropdown(index)}
                      className="flex items-center px-4 py-2 text-gray-300 hover:text-neon-cyan font-medium transition-colors font-rajdhani uppercase tracking-wide"
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    
                    {activeDropdown === index && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-56 glass-card clip-cyber border border-neon-cyan/30 py-2 z-50 animate-fade-in"
                        onMouseLeave={closeDropdown}
                      >
                        {item.items.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            onClick={closeDropdown}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors font-rajdhani"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-300 glass-card px-3 py-1">
              <Phone className="w-4 h-4 mr-1 text-neon-cyan" />
              <a 
                href="tel:(901)410-2020" 
                className="hover:text-neon-cyan transition-colors font-rajdhani"
              >
                (901) 410-2020
              </a>
            </div>
            <button
              onClick={() => scrollToSection('contact')}
              className="btn-primary text-sm"
            >
              Get Quote
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-neon-cyan hover:text-neon-purple transition-all duration-300 glass-card clip-cyber-small hover:shadow-neon-cyan"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 glass-card border-t border-neon-cyan/30 shadow-neon-cyan animate-fade-in">
            <nav className="px-4 py-6 space-y-4">
              {navigationItems.map((item, index) => (
                <div key={index}>
                  {item.type === 'link' ? (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-300 hover:text-neon-cyan font-medium transition-colors font-rajdhani uppercase tracking-wide"
                    >
                      {item.name}
                    </Link>
                  ) : item.type === 'button' ? (
                    <button
                      onClick={() => {
                        item.onClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block py-2 text-gray-300 hover:text-neon-cyan font-medium transition-colors font-rajdhani uppercase tracking-wide"
                    >
                      {item.name}
                    </button>
                  ) : (
                    // Mobile Dropdown
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(`mobile-${index}`)}
                        className="flex items-center justify-between w-full py-2 text-gray-300 hover:text-neon-cyan font-medium transition-colors font-rajdhani uppercase tracking-wide"
                      >
                        {item.name}
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform text-neon-purple ${
                            activeDropdown === `mobile-${index}` ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      {activeDropdown === `mobile-${index}` && (
                        <div className="pl-4 mt-2 space-y-2">
                          {item.items.map((subItem, subIndex) => (
                            <Link
                              key={subIndex}
                              href={subItem.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-1 text-sm text-gray-400 hover:text-neon-purple transition-colors font-rajdhani"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile Contact Info */}
              <div className="pt-4 border-t border-neon-cyan/30 space-y-3">
                <div className="flex items-center text-sm text-gray-300 glass-card px-3 py-2">
                  <Phone className="w-4 h-4 mr-2 text-neon-cyan" />
                  <a 
                    href="tel:(901)410-2020" 
                    className="hover:text-neon-cyan transition-colors font-rajdhani"
                  >
                    (901) 410-2020
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-300 glass-card px-3 py-2">
                  <Mail className="w-4 h-4 mr-2 text-neon-purple" />
                  <a 
                    href="mailto:m10djcompany@gmail.com" 
                    className="hover:text-neon-purple transition-colors font-rajdhani"
                  >
                    m10djcompany@gmail.com
                  </a>
                </div>
                <button
                  onClick={() => {
                    scrollToSection('contact');
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-primary w-full mt-4"
                >
                  Get Your Free Quote
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 