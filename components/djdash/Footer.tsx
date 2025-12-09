import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music } from 'lucide-react';

export default function DJDashFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/assets/DJ-Dash-Logo-Black-1.PNG"
                alt="DJ Dash Logo"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold text-white">DJ Dash</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Run your entire DJ business from one dashboard. From client inquiries to final payouts—handle CRM, contracts, invoicing, analytics, and event requests all in one professional platform.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/djdash/features" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/djdash/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/djdash/how-it-works" className="text-gray-400 hover:text-white text-sm transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/djdash/use-cases" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/djdash/signup" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Start Free Trial
                </Link>
              </li>
              <li>
                <Link href="/signin" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} DJ Dash. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Trusted by 1,200+ pro DJs • $4.5M+ revenue managed • Powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
