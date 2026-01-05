'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TipJarHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLivePage = pathname?.startsWith('/live/');
  const isPricingPage = pathname?.includes('/pricing') || pathname === '/pricing';
  // Check if this is an artist/organization page (e.g., /tipjar/m10djcompany)
  // Marketing pages are: /tipjar, /tipjar/pricing, /tipjar/features, etc.
  const isArtistPage = pathname?.startsWith('/tipjar/') && 
    pathname !== '/tipjar' && 
    !pathname.startsWith('/tipjar/pricing') &&
    !pathname.startsWith('/tipjar/features') &&
    !pathname.startsWith('/tipjar/how-it-works') &&
    !pathname.startsWith('/tipjar/signin') &&
    !pathname.startsWith('/tipjar/signup') &&
    !pathname.startsWith('/tipjar/dashboard') &&
    !pathname.startsWith('/tipjar/onboarding') &&
    !pathname.startsWith('/tipjar/embed') &&
    !pathname.startsWith('/tipjar/alerts');

  useEffect(() => {
    // On live pages, keep header transparent
    if (isLivePage) {
      setIsScrolled(false);
      return;
    }
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLivePage]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLivePage
          ? 'bg-black/60 backdrop-blur-md'
          : isPricingPage
          ? 'bg-tipjar-gradient backdrop-blur-md shadow-lg border-b border-white/10'
          : isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            {isArtistPage ? (
              // Use full white logo for artist pages
              <div className="relative h-10 md:h-12 group-hover:scale-105 transition-transform">
                <Image
                  src="/assets/TipJar-Logo-White.png"
                  alt="TipJar Logo"
                  width={120}
                  height={48}
                  className="object-contain h-full w-auto"
                  priority
                />
              </div>
            ) : (
              // Use icon + text for marketing pages
              <>
                <div className="relative w-10 h-10 group-hover:scale-105 transition-transform">
                  <Image
                    src="/assets/TipJar-Logo-Icon.png"
                    alt="TipJar Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority
                  />
                </div>
                <span className={`text-2xl font-bold transition-colors ${
                  isLivePage || isPricingPage || !isScrolled
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  TipJar
                </span>
                <span className={`text-sm font-medium transition-colors ${
                  isLivePage || isPricingPage || !isScrolled
                    ? 'text-white font-semibold' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  .Live
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/features"
              className={`font-semibold transition-colors ${
                isLivePage || isPricingPage || !isScrolled
                  ? 'text-white hover:text-emerald-200'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className={`font-semibold transition-colors ${
                isLivePage || isPricingPage || !isScrolled
                  ? 'text-white hover:text-emerald-200'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/how-it-works"
              className={`font-semibold transition-colors ${
                isLivePage || isPricingPage || !isScrolled
                  ? 'text-white hover:text-emerald-200'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/tipjar/signin/password_signin"
              className={`font-semibold transition-colors ${
                isLivePage || isPricingPage || !isScrolled
                  ? 'text-white hover:text-emerald-200'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button
                className={`font-semibold ${
                  isLivePage || isPricingPage || !isScrolled
                    ? 'bg-white text-emerald-600 hover:bg-gray-100 dark:bg-white dark:text-emerald-600 dark:hover:bg-gray-100'
                    : 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600'
                }`}
              >
                Start Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isLivePage || isPricingPage || !isScrolled
                ? 'text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden py-4 border-t ${
            isScrolled
              ? 'border-gray-200 dark:border-gray-700'
              : 'border-white/20'
          } ${
            isScrolled
              ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md'
              : 'bg-white/98 dark:bg-gray-900/98 backdrop-blur-md shadow-lg'
          }`}>
            <div className="flex flex-col space-y-4">
              <Link
                href="/features"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/how-it-works"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/tipjar/signin/password_signin"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

