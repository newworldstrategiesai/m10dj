'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TipJarHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className={`text-2xl font-bold transition-colors ${
              isScrolled 
                ? 'text-gray-900 dark:text-white' 
                : 'text-white'
            }`}>
              TipJar
            </span>
            <span className={`text-sm font-medium transition-colors ${
              isScrolled 
                ? 'text-gray-600 dark:text-gray-400' 
                : 'text-gray-200'
            }`}>
              .Live
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/tipjar/features"
              className={`font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                isScrolled
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-white'
              }`}
            >
              Features
            </Link>
            <Link
              href="/tipjar/pricing"
              className={`font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                isScrolled
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-white'
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/tipjar/how-it-works"
              className={`font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                isScrolled
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-white'
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/signin"
              className={`font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                isScrolled
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-white'
              }`}
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button
                className={`font-semibold ${
                  isScrolled
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-white text-purple-600 hover:bg-gray-100'
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
              isScrolled
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-white'
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
                href="/tipjar/features"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/tipjar/pricing"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/tipjar/how-it-works"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/signin"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold">
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

