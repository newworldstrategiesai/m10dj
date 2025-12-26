import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Phone, Mail, Menu, X, ChevronDown, MapPin, FileText, Calendar, CreditCard, Music, Facebook, Instagram, Twitter, Youtube, Linkedin, Link2, Users, Settings, DollarSign } from 'lucide-react';
// Temporarily disabled to prevent rate limiting issues
// import { trackContactAction, trackLead, trackServiceInterest } from '../EnhancedTracking';
import { scrollToContact } from '../../utils/scroll-helpers';
import ContactFormModal from './ContactFormModal';
import SocialAccountSelector from '../ui/SocialAccountSelector';
import dynamic from 'next/dynamic';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Dynamically import ThemeToggle to avoid SSR issues
const ThemeToggle = dynamic(() => import('./ThemeToggle'), { ssr: false });

// Helper function to get absolute URL for assets (works across domains)
const getAssetUrl = (path) => {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default to main domain
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
    return `${siteUrl}${path}`;
  }
  // Client-side: use current origin (works for both m10djcompany.com and tipjar.live)
  return path;
};

export default function Header({ customLogoUrl = null, transparent = false, socialLinks = null, isOwner = false, organizationSlug = null, organizationId = null }) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isValidQuote, setIsValidQuote] = useState(false);
  const [isValidatingQuote, setIsValidatingQuote] = useState(false);
  const [hasPayments, setHasPayments] = useState(false);
  const [headerSocialLinks, setHeaderSocialLinks] = useState(socialLinks || []);
  const [socialSelectorOpen, setSocialSelectorOpen] = useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if we're on a quote page and extract quote ID
  const isQuotePage = router.pathname?.includes('/quote/') && router.query?.id;
  const quoteId = router.query?.id;
  
  // Check if we're on a requests page (for transparent navbar)
  const isRequestsPage = router.pathname?.includes('/requests') || router.pathname?.includes('/organizations') && router.pathname?.includes('/requests');
  const shouldBeTransparent = transparent || isRequestsPage;
  
  // Helper classes for mobile menu styling based on transparency
  const mobileMenuTextClass = shouldBeTransparent && !isScrolled 
    ? 'text-white hover:text-brand' 
    : 'text-gray-900 dark:text-gray-100 hover:text-brand';
  const mobileMenuBgClass = shouldBeTransparent && !isScrolled 
    ? 'hover:bg-white/10' 
    : 'hover:bg-brand/5 dark:hover:bg-brand/10';
  const mobileMenuBorderClass = shouldBeTransparent && !isScrolled 
    ? 'border-white/20' 
    : 'border-gray-200 dark:border-gray-700';

  useEffect(() => {
    // Check if user is logged in
    const supabase = createClientComponentClient();
    
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
    
    // Initialize as not scrolled
    setIsScrolled(false);
    
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Check initial scroll position after page load
    const checkInitialScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      setIsScrolled(scrollY > 50);
    };
    
    // Check after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      checkInitialScroll();
      checkDarkMode();
    }, 50);
    
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      setIsScrolled(scrollY > 50);
    };

    // Use both scroll events to catch all scroll changes
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Also check on load
    if (document.readyState === 'complete') {
      checkInitialScroll();
      checkDarkMode();
    } else {
      window.addEventListener('load', () => {
        checkInitialScroll();
        checkDarkMode();
      }, { once: true });
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', checkInitialScroll);
      observer.disconnect();
      subscription?.unsubscribe();
    };
  }, []);

  // Validate quote ID exists before showing customer nav links
  useEffect(() => {
    const validateQuote = async () => {
      // Reset validation state when quote ID changes
      setIsValidQuote(false);
      
      if (!quoteId || !isQuotePage) {
        return;
      }

      // Validate ID format
      if (quoteId === 'null' || quoteId === 'undefined' || String(quoteId).trim() === '') {
        setIsValidQuote(false);
        return;
      }

      try {
        setIsValidatingQuote(true);
        const response = await fetch(`/api/leads/get-lead?id=${quoteId}`);
        
        if (response.ok) {
          const data = await response.json();
          // Only set as valid if we got actual lead data with an ID
          setIsValidQuote(data && data.id && data.id !== 'fallback');
        } else {
          setIsValidQuote(false);
        }
      } catch (error) {
        console.error('Error validating quote:', error);
        setIsValidQuote(false);
      } finally {
        setIsValidatingQuote(false);
      }
    };

    validateQuote();
  }, [quoteId, isQuotePage]);

  // Check if payments exist for this quote (to show "Payments" vs "Payment")
  useEffect(() => {
    const checkPayments = async () => {
      if (!quoteId || !isQuotePage || !isValidQuote) {
        setHasPayments(false);
        return;
      }

      try {
        const timestamp = new Date().getTime();
        const paymentsResponse = await fetch(`/api/quote/${quoteId}/payments?_t=${timestamp}`, { cache: 'no-store' });
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          if (paymentsData.payments && paymentsData.payments.length > 0) {
            // Check if there are any paid payments
            const paidPayments = paymentsData.payments.filter(p => p.payment_status === 'Paid');
            setHasPayments(paidPayments.length > 0);
          } else {
            setHasPayments(false);
          }
        }
      } catch (error) {
        console.error('Error checking payments in header:', error);
        setHasPayments(false);
      }
    };

    checkPayments();
  }, [quoteId, isQuotePage, isValidQuote]);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  // Helper function to get icon component for social platform
  // Minimal, single-color icons that work well over cover photos
  const getSocialIcon = (platform) => {
    const iconProps = { 
      className: "w-4 h-4",
      strokeWidth: 2,
      fill: "none"
    };
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook {...iconProps} />;
      case 'instagram':
        return <Instagram {...iconProps} />;
      case 'twitter':
        return <Twitter {...iconProps} />;
      case 'youtube':
        return <Youtube {...iconProps} />;
      case 'linkedin':
        return <Linkedin {...iconProps} />;
      case 'custom':
      default:
        return <Link2 {...iconProps} />;
    }
  };

  // Default fallback social links
  const defaultSocialLinks = [
    {
      platform: 'instagram',
      url: 'https://instagram.com/m10djcompany',
      label: 'Instagram',
      enabled: true,
      order: 1
    },
    {
      platform: 'facebook',
      url: 'https://facebook.com/m10djcompany',
      label: 'Facebook',
      enabled: true,
      order: 2
    }
  ];

  // Helper function to get social URL with user preference
  const getSocialUrl = (platform, defaultUrl) => {
    if (platform === 'instagram' || platform === 'facebook') {
      const saved = typeof window !== 'undefined' 
        ? localStorage.getItem(`${platform}_account_preference`)
        : null;
      if (saved === 'djbenmurray') {
        return `https://${platform}.com/djbenmurray`;
      } else if (saved === 'm10djcompany') {
        return `https://${platform}.com/m10djcompany`;
      }
    }
    return defaultUrl;
  };

  // Handle social link click
  const handleSocialClick = (e, platform, defaultUrl) => {
    if (platform === 'instagram' || platform === 'facebook') {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setSelectedSocialPlatform(platform);
      setSocialSelectorOpen(true);
    }
    // For other platforms, let the default link behavior work
  };

  // Handle account selection
  const handleAccountSelect = (account) => {
    if (selectedSocialPlatform) {
      const url = `https://${selectedSocialPlatform}.com/${account}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Update social links when prop changes
  useEffect(() => {
    if (socialLinks !== null && Array.isArray(socialLinks) && socialLinks.length > 0) {
      // Use admin-configured links if available
      const enabledLinks = socialLinks
        .filter(link => link.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setHeaderSocialLinks(enabledLinks);
    } else {
      // Use default fallback links if no admin links are configured
      setHeaderSocialLinks(defaultSocialLinks);
    }
  }, [socialLinks]);

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
      
      <header 
        className={`fixed w-full top-0 z-50 transition-all duration-300 overflow-visible ${
          shouldBeTransparent
            ? isScrolled
              ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-lg border-b border-white/20 dark:border-gray-800/20'
              : ''
            : isScrolled 
              ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-800' 
              : 'bg-white/90 dark:bg-black/90 backdrop-blur-sm'
        }`}
        style={
          shouldBeTransparent
            ? !isScrolled
              ? {
                  backgroundColor: 'transparent',
                  background: 'transparent',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  boxShadow: 'none',
                  border: 'none',
                  borderBottom: 'none',
                }
              : undefined
            : undefined
        }
        data-transparent={shouldBeTransparent && !isScrolled ? 'true' : 'false'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          <div className={`flex items-center justify-between gap-4 overflow-visible ${
            shouldBeTransparent && !customLogoUrl 
              ? 'min-h-20 sm:min-h-[88px] py-2' 
              : 'h-16 sm:h-20'
          }`}>
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group">
              <div className="flex items-center space-x-2.5">
                <div className="relative flex-shrink-0 overflow-visible">
                  {shouldBeTransparent && !customLogoUrl ? (
                    <img
                      key={`transparent-logo-${isDarkMode ? 'dark' : 'light'}`}
                      src={isDarkMode 
                        ? getAssetUrl("/assets/m10 dj company logo white.gif")
                        : getAssetUrl("/assets/m10 dj company logo black.gif")}
                      alt="M10 DJ Company - Memphis Wedding DJ & Event Entertainment Services"
                      className="h-[54px] sm:h-[68px] w-auto min-w-[120px] sm:min-w-[150px] rounded-lg transition-transform group-hover:scale-105"
                      style={{ display: 'block', objectFit: 'contain' }}
                      onError={(e) => {
                        // Fallback if GIF doesn't load, try JPG version
                        const currentSrc = e.target.src;
                        if (currentSrc.includes('white.gif')) {
                          e.target.src = getAssetUrl('/assets/m10 dj company logo white.jpg');
                        } else if (currentSrc.includes('black.gif')) {
                          e.target.src = getAssetUrl('/assets/m10 dj company logo black.jpg');
                        }
                      }}
                    />
                  ) : (
                    customLogoUrl ? (
                      // Custom org logos are typically square, keep square sizing
                      <Image
                        key={`logo-custom-${isDarkMode ? 'dark' : 'light'}`}
                        src={customLogoUrl}
                        alt="Organization Logo"
                        width={45}
                        height={45}
                        className="w-9 h-9 sm:w-[45px] sm:h-[45px] rounded-lg transition-transform group-hover:scale-105"
                        priority
                        unoptimized
                      />
                    ) : (
                      // Default M10 logo is wide—use same sizing as requests page so it doesn't look squished
                      <Image
                        key={`logo-m10-${isDarkMode ? 'dark' : 'light'}`}
                        src={isDarkMode 
                          ? getAssetUrl("/assets/m10 dj company logo white.gif")
                          : getAssetUrl("/assets/m10 dj company logo black.gif")}
                        alt="M10 DJ Company - Memphis Wedding DJ & Event Entertainment Services"
                        width={150}
                        height={68}
                        className="h-[54px] sm:h-[68px] w-auto min-w-[120px] sm:min-w-[150px] rounded-lg transition-transform group-hover:scale-105"
                        style={{ objectFit: 'contain' }}
                        priority
                        onError={(e) => {
                          // Fallback if GIF doesn't load, try static JPG version
                          const currentSrc = e.target.src;
                          if (currentSrc.includes('white.gif')) {
                            e.target.src = getAssetUrl('/assets/m10 dj company logo white.jpg');
                          } else if (currentSrc.includes('black.gif')) {
                            e.target.src = getAssetUrl('/assets/m10 dj company logo black.jpg');
                          }
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - Hide on requests page */}
            {!isRequestsPage && (
              <nav className="hidden lg:flex items-center space-x-6">
                {/* Public Navigation - Hide on quote pages */}
                {!(isQuotePage && quoteId && isValidQuote) && (
                  <>
                    <Link href="/" className={`font-medium text-sm transition-colors py-2 ${
                      shouldBeTransparent && !isScrolled 
                        ? 'text-white hover:text-brand' 
                        : 'text-gray-700 dark:text-gray-200 hover:text-brand'
                    }`}>
                      Home
                    </Link>
                    
                    {/* Services Dropdown */}
                    <div className="relative group">
                      <button
                        className={`flex items-center font-medium text-sm transition-colors py-2 ${
                          shouldBeTransparent && !isScrolled 
                            ? 'text-white hover:text-brand' 
                            : 'text-gray-700 dark:text-gray-200 hover:text-brand'
                        }`}
                        onClick={() => toggleDropdown('services')}
                      >
                        Services
                        <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                      </button>
                      {openDropdown === 'services' && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50 animate-fade-in">
                          {services.map((service) => (
                            <Link
                              key={service.name}
                              href={service.href}
                              className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-brand/5 dark:hover:bg-brand/10 hover:text-brand font-inter text-sm transition-colors"
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
                        className={`flex items-center font-medium text-sm transition-colors py-2 ${
                          shouldBeTransparent && !isScrolled 
                            ? 'text-white hover:text-brand' 
                            : 'text-gray-700 dark:text-gray-200 hover:text-brand'
                        }`}
                        onClick={() => toggleDropdown('areas')}
                      >
                        Service Areas
                        <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                      </button>
                      {openDropdown === 'areas' && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50 animate-fade-in max-h-96 overflow-y-auto">
                          {areas.map((area) => (
                            <Link
                              key={area.name}
                              href={area.href}
                              className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-brand/5 dark:hover:bg-brand/10 hover:text-brand font-inter text-sm transition-colors"
                              onClick={closeDropdown}
                            >
                              {area.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link href="/about" className={`font-medium text-sm transition-colors py-2 ${
                      shouldBeTransparent && !isScrolled 
                        ? 'text-white hover:text-brand' 
                        : 'text-gray-700 dark:text-gray-200 hover:text-brand'
                    }`}>
                      About
                    </Link>
                    
                    <Link href="/contact" className={`font-medium text-sm transition-colors py-2 ${
                      shouldBeTransparent && !isScrolled 
                        ? 'text-white hover:text-brand' 
                        : 'text-gray-700 dark:text-gray-200 hover:text-brand'
                    }`}>
                      Contact
                    </Link>
                  </>
                )}
                
                {/* Customer Navigation Links - Only show on valid quote pages */}
                {isQuotePage && quoteId && isValidQuote && (
                  <>
                    <Link href={`/quote/${quoteId}/events`} className="text-gray-700 dark:text-gray-200 hover:text-brand font-medium text-sm transition-colors py-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      My Events
                    </Link>
                    <Link href={`/quote/${quoteId}/my-songs`} className="text-gray-700 dark:text-gray-200 hover:text-brand font-medium text-sm transition-colors py-2 flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      My Songs
                    </Link>
                    <Link href={`/quote/${quoteId}/invoice`} className="text-gray-700 dark:text-gray-200 hover:text-brand font-medium text-sm transition-colors py-2 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Invoice
                    </Link>
                    <Link href={`/quote/${quoteId}/contract`} className="text-gray-700 dark:text-gray-200 hover:text-brand font-medium text-sm transition-colors py-2 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Contract
                    </Link>
                    <Link href={`/quote/${quoteId}/payment`} className="text-gray-700 dark:text-gray-200 hover:text-brand font-medium text-sm transition-colors py-2 flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {hasPayments ? 'Payments' : 'Payment'}
                    </Link>
                  </>
                )}
              </nav>
            )}

            {/* Contact Info & CTA - Hide on quote pages and requests page */}
            {!(isQuotePage && quoteId && isValidQuote) && !isRequestsPage && (
              <div className="hidden lg:flex items-center space-x-4">
                {/* Social Links */}
                {headerSocialLinks && headerSocialLinks.length > 0 && (
                  <>
                    <div className="flex items-center space-x-1.5">
                      {headerSocialLinks.map((link, index) => {
                        const socialUrl = getSocialUrl(link.platform, link.url);
                        const isSelectable = link.platform === 'instagram' || link.platform === 'facebook';
                        
                        if (isSelectable) {
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSocialClick(e, link.platform, link.url);
                              }}
                              className={`flex items-center justify-center w-7 h-7 rounded transition-opacity hover:opacity-70 cursor-pointer border-0 bg-transparent p-0 ${
                                shouldBeTransparent && !isScrolled
                                  ? 'text-white/90'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              aria-label={link.label || link.platform}
                            >
                              {getSocialIcon(link.platform)}
                            </button>
                          );
                        }
                        
                        return (
                          <a
                            key={index}
                            href={socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center w-7 h-7 rounded transition-opacity hover:opacity-70 cursor-pointer ${
                              shouldBeTransparent && !isScrolled
                                ? 'text-white/90'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                            aria-label={link.label || link.platform}
                          >
                            {getSocialIcon(link.platform)}
                          </a>
                        );
                      })}
                    </div>
                    <div className={`h-6 w-px ${shouldBeTransparent && !isScrolled ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-800'}`}></div>
                  </>
                )}
                
                {/* Phone Number */}
                <a 
                  href="tel:+19014102020" 
                  className={`flex items-center space-x-2 font-medium text-sm transition-colors px-3 py-2 rounded-md ${
                    shouldBeTransparent && !isScrolled
                      ? 'text-white hover:text-brand hover:bg-white/10'
                      : 'text-gray-700 dark:text-gray-200 hover:text-brand hover:bg-gray-50 dark:hover:bg-black/50'
                  }`}
                  onClick={() => {
                    // trackContactAction('phone', 'header_desktop');
                  }}
                >
                  <Phone className={`w-4 h-4 ${shouldBeTransparent && !isScrolled ? '' : 'text-brand'}`} />
                  <span className="hidden xl:inline">(901) 410-2020</span>
                  <span className="xl:hidden">(901) 410-2020</span>
                </a>
                
                {/* Theme Toggle - Only show for logged in users */}
                {isLoggedIn && (
                  <>
                    <div className={`h-6 w-px ${shouldBeTransparent && !isScrolled ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-800'}`}></div>
                    <ThemeToggle 
                      className={
                        shouldBeTransparent && !isScrolled
                          ? 'text-white hover:text-brand hover:bg-white/10'
                          : 'text-gray-700 dark:text-gray-200 hover:text-brand hover:bg-gray-50 dark:hover:bg-black/50'
                      }
                    />
                  </>
                )}
                
                {/* Divider - Only show if admin link is visible */}
                {!isRequestsPage && (
                  <>
                    <div className={`h-6 w-px ${shouldBeTransparent && !isScrolled ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                    
                    {/* Admin Link */}
                    <Link
                      href="/signin"
                      className={`font-medium text-sm transition-colors px-3 py-2 rounded-md ${
                        shouldBeTransparent && !isScrolled
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-black/50'
                      }`}
                      onClick={() => closeDropdown()}
                    >
                      Admin
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* CTA Button - Always show on desktop, including requests page */}
            <div className="hidden lg:flex items-center relative z-50">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Get Quote button clicked, opening modal');
                  // trackLead('quote_request_start', { source: 'header_desktop' });
                  setIsContactModalOpen(true);
                }}
                className="btn-primary whitespace-nowrap relative z-50 cursor-pointer"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                Get Quote
              </button>
            </div>

            {/* Mobile Menu Button */}
              <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 transition-colors rounded-lg ${
                shouldBeTransparent && !isScrolled
                  ? 'text-white hover:text-brand hover:bg-white/10'
                  : 'text-gray-700 dark:text-gray-200 hover:text-brand hover:bg-gray-100 dark:hover:bg-black/50'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden fixed top-0 left-0 right-0 bottom-0 z-50 shadow-2xl animate-fade-in overflow-y-auto ${
            shouldBeTransparent && !isScrolled
              ? 'bg-black/90 backdrop-blur-lg border-white/20'
              : 'bg-gradient-to-b from-white/95 dark:from-black/95 via-gray-50/95 dark:via-black/95 to-white/95 dark:to-black/95 border-gray-200 dark:border-gray-800'
          }`}
          style={{
            height: '100vh',
            maxHeight: '100vh',
            ...(shouldBeTransparent && !isScrolled
              ? {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }
              : {
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                })
          }          }>
            {/* Close Button - Fixed at top right */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 transition-colors rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-sm text-gray-900 dark:text-white hover:text-brand dark:hover:text-brand hover:bg-white dark:hover:bg-black/80 shadow-lg border border-gray-200 dark:border-gray-800"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Flex container for scrollable content and sticky footer */}
            <div className="flex flex-col h-full">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <div className="section-container py-6 pt-24 pb-32">
                  <nav className="space-y-2">
                {/* Owner Navigation - Show on requests page if user is owner */}
                {isRequestsPage && isOwner && (
                  <div className="space-y-1">
                    <div className="px-4 py-2 mb-2">
                      <p className={`text-xs font-semibold uppercase tracking-wider text-brand/80`}>
                        Admin Menu
                      </p>
                    </div>
                    <Link 
                      href={`/admin/crowd-requests${organizationId ? `?org=${organizationId}` : ''}`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Music className="w-5 h-5 text-brand" />
                      <span className="font-medium">Song Requests</span>
                    </Link>
                    <Link 
                      href={`/admin/requests-page${organizationId ? `?org=${organizationId}` : ''}`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-brand" />
                      <span className="font-medium">Edit Requests Page</span>
                    </Link>
                    <Link 
                      href="/admin/dashboard"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Calendar className="w-5 h-5 text-brand" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link 
                      href="/admin/contacts"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Users className="w-5 h-5 text-brand" />
                      <span className="font-medium">Contacts</span>
                    </Link>
                    <Link 
                      href="/admin/contracts"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-brand" />
                      <span className="font-medium">Contracts</span>
                    </Link>
                    <Link 
                      href="/admin/invoices"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CreditCard className="w-5 h-5 text-brand" />
                      <span className="font-medium">Invoices</span>
                    </Link>
                    <Link 
                      href="/admin/projects"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Calendar className="w-5 h-5 text-brand" />
                      <span className="font-medium">Projects</span>
                    </Link>
                    <Link 
                      href="/admin/payouts"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <DollarSign className="w-5 h-5 text-brand" />
                      <span className="font-medium">Payouts</span>
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <Link 
                      href="/account"
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 text-brand" />
                      <span className="font-medium">Account Settings</span>
                    </Link>
                  </div>
                )}
                
                {/* Public Navigation - Hide on quote pages and when owner is logged in on requests page */}
                {!(isQuotePage && quoteId && isValidQuote) && !(isRequestsPage && isOwner) && (
                  <>
                    <Link 
                      href="/" 
                      className={`block font-semibold font-inter py-3 px-4 rounded-lg transition-all ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    
                    {/* Mobile Services */}
                    <div className={`border ${mobileMenuBorderClass} rounded-lg overflow-hidden`}>
                      <button
                        className={`flex items-center justify-between w-full font-bold font-inter py-3 px-4 transition-all ${
                          shouldBeTransparent && !isScrolled
                            ? 'text-white hover:bg-white/10 bg-white/5'
                            : 'text-gray-900 dark:text-gray-100 bg-gray-50/60 dark:bg-black hover:bg-gray-50 dark:hover:bg-black/80'
                        }`}
                        onClick={() => toggleDropdown('mobile-services')}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                        Services
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === 'mobile-services' ? 'rotate-180' : ''} text-brand`} />
                      </button>
                      {openDropdown === 'mobile-services' && (
                        <div className={`p-3 space-y-1 ${
                          shouldBeTransparent && !isScrolled
                            ? 'bg-black/60 backdrop-blur-sm'
                            : 'bg-white dark:bg-black'
                        }`}>
                          {services.map((service) => (
                            <Link
                              key={service.name}
                              href={service.href}
                              className={`block font-inter py-2 px-3 rounded-md transition-all text-sm ${
                                shouldBeTransparent && !isScrolled
                                  ? 'text-white hover:text-brand hover:bg-white/10'
                                  : 'text-gray-700 dark:text-gray-200 hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10'
                              }`}
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
                    <div className={`border ${mobileMenuBorderClass} rounded-lg overflow-hidden`}>
                      <button
                        className={`flex items-center justify-between w-full font-bold font-inter py-3 px-4 transition-all ${
                          shouldBeTransparent && !isScrolled
                            ? 'text-white hover:bg-white/10 bg-white/5'
                            : 'text-gray-900 dark:text-white bg-gray-50/60 dark:bg-black hover:bg-gray-50 dark:hover:bg-black/80'
                        }`}
                        onClick={() => toggleDropdown('mobile-areas')}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-brand" />
                        Service Areas
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === 'mobile-areas' ? 'rotate-180' : ''} text-brand`} />
                      </button>
                      {openDropdown === 'mobile-areas' && (
                        <div className={`p-3 grid grid-cols-2 gap-1 ${
                          shouldBeTransparent && !isScrolled
                            ? 'bg-black/60 backdrop-blur-sm'
                            : 'bg-white'
                        }`}>
                          {areas.map((area) => (
                            <Link
                              key={area.name}
                              href={area.href}
                              className={`block font-inter py-2 px-3 rounded-md transition-all text-sm ${
                                shouldBeTransparent && !isScrolled
                                  ? 'text-white hover:text-brand hover:bg-white/10'
                                  : 'text-gray-700 hover:text-brand hover:bg-brand/5'
                              }`}
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
                      className={`block font-semibold font-inter py-3 px-4 rounded-lg transition-all ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      About
                    </Link>
                    
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        scrollToContact();
                      }}
                      className={`block w-full text-left font-semibold font-inter py-3 px-4 rounded-lg transition-all ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                    >
                      Contact
                    </button>
                    
                    {!isRequestsPage && (
                      <Link 
                        href="/signin" 
                        className={`block font-semibold font-inter py-3 px-4 rounded-lg transition-all ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin Sign In
                      </Link>
                    )}
                    
                    {/* Theme Toggle - Mobile - Only show for logged in users */}
                    {isLoggedIn && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
                        <ThemeToggle 
                          variant="mobile"
                          className={mobileMenuTextClass + ' ' + mobileMenuBgClass}
                        />
                      </>
                    )}
                  </>
                )}
                
                {/* Customer Navigation Links - Mobile - Only show on valid quote pages */}
                {isQuotePage && quoteId && isValidQuote && (
                  <div className="space-y-1">
                    <Link 
                      href={`/quote/${quoteId}/events`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Calendar className="w-5 h-5 text-brand" />
                      <span className="font-medium">My Events</span>
                    </Link>
                    <Link 
                      href={`/quote/${quoteId}/my-songs`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Music className="w-5 h-5 text-brand" />
                      <span className="font-medium">My Songs</span>
                    </Link>
                    <Link 
                      href={`/quote/${quoteId}/invoice`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-brand" />
                      <span className="font-medium">Invoice</span>
                    </Link>
                    <Link 
                      href={`/quote/${quoteId}/contract`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-brand" />
                      <span className="font-medium">Contract</span>
                    </Link>
                    <Link 
                      href={`/quote/${quoteId}/payment`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mobileMenuTextClass} ${mobileMenuBgClass}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CreditCard className="w-5 h-5 text-brand" />
                      <span className="font-medium">{hasPayments ? 'Payments' : 'Payment'}</span>
                    </Link>
                  </div>
                )}
              </nav>

              {/* Mobile Contact Info - Hide on quote pages and when owner is logged in on requests page */}
              {!(isQuotePage && quoteId && isValidQuote) && !(isRequestsPage && isOwner) && (
              <div className={`mt-6 pt-6 border-t space-y-3 ${shouldBeTransparent && !isScrolled ? 'border-white/20' : 'border-gray-300 dark:border-gray-800'}`}>
                {/* Social Links */}
                {headerSocialLinks && headerSocialLinks.length > 0 && (
                  <div className={`p-4 rounded-xl ${
                    shouldBeTransparent && !isScrolled
                      ? 'bg-white/10 backdrop-blur-sm border border-white/20'
                      : 'bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800'
                  }`}>
                    <p className={`text-xs font-semibold mb-3 ${
                      shouldBeTransparent && !isScrolled ? 'text-white/80' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Follow Us
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {headerSocialLinks.map((link, index) => {
                        const socialUrl = getSocialUrl(link.platform, link.url);
                        const isSelectable = link.platform === 'instagram' || link.platform === 'facebook';
                        
                        if (isSelectable) {
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSocialClick(e, link.platform, link.url);
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border-0 bg-transparent w-full text-left ${
                                shouldBeTransparent && !isScrolled
                                  ? 'text-white hover:text-brand hover:bg-white/10'
                                  : 'text-gray-700 dark:text-gray-300 hover:text-brand hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                              aria-label={link.label || link.platform}
                            >
                              {getSocialIcon(link.platform)}
                              <span className="text-sm font-medium">{link.label}</span>
                            </button>
                          );
                        }
                        
                        return (
                          <a
                            key={index}
                            href={socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                              shouldBeTransparent && !isScrolled
                                ? 'text-white hover:text-brand hover:bg-white/10'
                                : 'text-gray-700 dark:text-gray-300 hover:text-brand hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            aria-label={link.label || link.platform}
                          >
                            {getSocialIcon(link.platform)}
                            <span className="text-sm font-medium">{link.label}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className={`px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                  shouldBeTransparent && !isScrolled
                    ? 'bg-white/10 backdrop-blur-sm border border-white/20'
                    : 'bg-brand/5 dark:bg-black/50 border border-brand/20'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-brand">
                      <Phone className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold font-inter mb-0.5 ${
                        shouldBeTransparent && !isScrolled ? 'text-white/80' : 'text-gray-700 dark:text-white'
                      }`}>Call or Text</p>
                      <a href="tel:+19014102020" className="font-bold font-inter text-lg transition-colors text-brand hover:text-brand/80">
                        (901) 410-2020
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className={`px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                  shouldBeTransparent && !isScrolled
                    ? 'bg-white/10 backdrop-blur-sm border border-white/20'
                    : 'bg-white dark:bg-black border border-gray-200 dark:border-gray-800'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                      shouldBeTransparent && !isScrolled ? 'bg-white/20' : 'bg-brand'
                    }`}>
                      <Mail className={`w-5 h-5 ${shouldBeTransparent && !isScrolled ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold font-inter mb-0.5 ${
                        shouldBeTransparent && !isScrolled ? 'text-white/80' : 'text-gray-700'
                      }`}>Email Us</p>
                      <a href="mailto:info@m10djcompany.com" className={`font-bold font-inter text-sm transition-colors break-all ${
                        shouldBeTransparent && !isScrolled ? 'text-brand hover:text-brand/80' : 'text-brand hover:text-brand/80'
                      }`}>
                        info@m10djcompany.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              )}
              </div>
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 dark:from-black/95 via-white/95 dark:via-black/95 to-transparent backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 z-40">
                <Link
                  href="/requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand hover:bg-brand/90 text-black font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl min-h-[48px] text-base"
                >
                  <Music className="w-5 h-5" />
                  Requests
                </Link>

                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Get Quote button clicked (mobile), opening modal');
                    setIsMobileMenuOpen(false);
                    setIsContactModalOpen(true);
                  }}
                  className="btn-primary w-full text-center shadow-lg hover:shadow-xl min-h-[48px] text-base font-bold cursor-pointer"
                  type="button"
                  style={{ pointerEvents: 'auto' }}
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
          className={`fixed inset-0 z-40 lg:hidden ${
            shouldBeTransparent && !isScrolled
              ? 'bg-black/50 backdrop-blur-md'
              : 'bg-black/30 backdrop-blur-md'
          }`}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
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
      
      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />

      {/* Social Account Selector */}
      {selectedSocialPlatform && (
        <SocialAccountSelector
          platform={selectedSocialPlatform}
          isOpen={socialSelectorOpen}
          onClose={() => {
            setSocialSelectorOpen(false);
            setSelectedSocialPlatform(null);
          }}
          onSelect={handleAccountSelect}
        />
      )}
    </>
  );
} 