import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Music } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="section-container relative z-10 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand text-black rounded-lg flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-sans">M10 DJ Company</h3>
                <p className="text-brand text-sm md:text-base font-semibold font-inter">Premium Event Entertainment</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6 leading-relaxed font-inter max-w-md">
              Memphis's premier entertainment company, delivering exceptional experiences with professional DJ services, 
              state-of-the-art sound systems, and personalized event coordination.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start space-x-2 md:space-x-3">
                <Phone className="w-4 h-4 md:w-5 md:h-5 text-brand flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <a href="tel:+19014102020" className="text-white hover:text-brand transition-colors font-inter font-semibold text-sm md:text-base">
(901) 410-2020
                  </a>
                  <p className="text-gray-400 text-xs md:text-sm font-inter">Call or text anytime</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 md:space-x-3">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-brand flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <a href="mailto:info@m10djcompany.com" className="text-white hover:text-brand transition-colors font-inter font-semibold text-sm md:text-base break-all">
                    info@m10djcompany.com
                  </a>
                  <p className="text-gray-400 text-xs md:text-sm font-inter">24-hour response time</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 md:space-x-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <p className="text-white font-inter font-semibold text-sm md:text-base">Memphis, TN & Surrounding Areas</p>
                  <p className="text-gray-400 text-xs md:text-sm font-inter">50-mile service radius</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-brand mb-4 md:mb-6 font-sans">Our Services</h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/memphis-wedding-dj" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Wedding Entertainment
                </Link>
              </li>
              <li>
                <Link href="/corporate-events" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Corporate Events
                </Link>
              </li>
              <li>
                <Link href="/private-parties" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Private Parties
                </Link>
              </li>
              <li>
                <Link href="/school-dances" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  School Dances
                </Link>
              </li>
              <li>
                <Link href="/holiday-parties" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Holiday Parties
                </Link>
              </li>
              <li>
                <Link href="/multicultural-dj-memphis" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Multicultural DJ
                </Link>
              </li>
              <li>
                <Link href="/dj-rentals-memphis" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  DJ Equipment Rentals
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Service Areas */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-brand mb-4 md:mb-6 font-sans">Service Areas</h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/memphis" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Memphis
                </Link>
              </li>
              <li>
                <Link href="/germantown" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Germantown
                </Link>
              </li>
              <li>
                <Link href="/collierville" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Collierville
                </Link>
              </li>
              <li>
                <Link href="/bartlett" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Bartlett
                </Link>
              </li>
              <li>
                <Link href="/arlington" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Arlington
                </Link>
              </li>
              <li>
                <Link href="/cordova" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Cordova
                </Link>
              </li>
              <li>
                <Link href="/southaven" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Southaven
                </Link>
              </li>
              <li>
                <Link href="/olive-branch" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Olive Branch
                </Link>
              </li>
            </ul>
          </div>

          {/* Wedding Planning Resources */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-brand mb-4 md:mb-6 font-sans">Wedding Planning</h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/memphis-dj-pricing-guide" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  DJ Pricing Guide
                </Link>
              </li>
              <li>
                <Link href="/memphis-wedding-dj-prices-2025" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Memphis Wedding DJ Prices
                </Link>
              </li>
              <li>
                <Link href="/blog/memphis-wedding-songs-2025" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Wedding Song Ideas
                </Link>
              </li>
              <li>
                <Link href="/venues" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Memphis Wedding Venues
                </Link>
              </li>
              <li>
                <Link href="/blog/memphis-wedding-dj-cost-guide-2025" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Wedding Cost Planning
                </Link>
              </li>
              <li>
                <Link href="/dj-ben-murray" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Meet DJ Ben Murray
                </Link>
              </li>
            </ul>
          </div>

          {/* Specialized Services */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-brand mb-4 md:mb-6 font-sans">Find Local DJ</h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/dj-near-me-memphis" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  DJ Near Me
                </Link>
              </li>
              <li>
                <Link href="/memphis-event-dj-services" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Corporate DJ Services
                </Link>
              </li>
              <li>
                <Link href="/dj-germantown-tn" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  DJ Germantown TN
                </Link>
              </li>
              <li>
                <Link href="/dj-collierville-tn" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  DJ Collierville TN
                </Link>
              </li>
              <li>
                <Link href="/dj-ben-murray" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1 text-sm md:text-base">
                  Meet DJ Ben Murray
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="divider-brand my-8 md:my-12" />
        
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-gray-400 font-inter text-sm md:text-base">
              © {currentYear} <span className="text-brand font-semibold">M10 DJ Company</span>. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs md:text-sm font-inter mt-1">
              Licensed & Insured • Professional Event Entertainment
            </p>
            <p className="text-gray-500 text-xs md:text-sm font-inter mt-2">
              <Link href="/privacy-policy" className="hover:text-brand transition-colors">Privacy Policy</Link>
              {' • '}
              <Link href="/terms-of-service" className="hover:text-brand transition-colors">Terms of Service</Link>
            </p>
            {/* Mobile Sign In Link */}
            <div className="md:hidden mt-3">
              <Link 
                href="/signin" 
                className="text-gray-500 hover:text-brand transition-colors font-inter text-sm px-3 py-1 rounded-md hover:bg-gray-800/50 inline-block"
              >
                Admin Sign In
              </Link>
            </div>
          </div>
          
          {/* Admin Sign In Link */}
          <div className="hidden md:block">
            <Link 
              href="/signin" 
              className="text-gray-500 hover:text-brand transition-colors font-inter text-sm px-3 py-1 rounded-md hover:bg-gray-800/50"
            >
              Admin Sign In
            </Link>
          </div>
          
          {/* Social Media */}
          <div className="flex items-center space-x-6">
            <p className="text-gray-400 font-inter text-sm">Follow Us:</p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com/m10djcompany" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-brand text-gray-400 hover:text-black rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/m10djcompany" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-brand text-gray-400 hover:text-black rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="mt-8 md:mt-12 text-center">
          <div className="bg-gradient-to-r from-brand/10 to-brand/5 rounded-xl md:rounded-2xl p-6 md:p-8 border border-brand/20">
            <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 font-sans">Ready to Make Your Event Unforgettable?</h4>
            <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6 font-inter max-w-2xl mx-auto">
              Get your free consultation and quote today. Let's create an amazing experience for your special event.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/contact" className="btn-primary min-h-[44px]">
                Get Free Quote
              </Link>
              <a href="tel:+19014102020" className="btn-secondary min-h-[44px]">
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 