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

      <div className="section-container relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-brand text-black rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-playfair">M10 DJ Company</h3>
                <p className="text-brand font-semibold font-inter">Premium Event Entertainment</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed font-inter max-w-md">
              Memphis's premier entertainment company, delivering exceptional experiences with professional DJ services, 
              state-of-the-art sound systems, and personalized event coordination.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-brand flex-shrink-0" />
                <div>
                  <a href="tel:+19014102020" className="text-white hover:text-brand transition-colors font-inter font-semibold">
(901) 410-2020
                  </a>
                  <p className="text-gray-400 text-sm font-inter">Call or text anytime</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-brand flex-shrink-0" />
                <div>
                  <a href="mailto:info@m10djcompany.com" className="text-white hover:text-brand transition-colors font-inter font-semibold">
                    info@m10djcompany.com
                  </a>
                  <p className="text-gray-400 text-sm font-inter">24-hour response time</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-white font-inter font-semibold">Memphis, TN & Surrounding Areas</p>
                  <p className="text-gray-400 text-sm font-inter">50-mile service radius</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-brand mb-6 font-playfair">Our Services</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/services#wedding" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Wedding Entertainment
                </Link>
              </li>
              <li>
                <Link href="/services#corporate" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Corporate Events
                </Link>
              </li>
              <li>
                <Link href="/services#private" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Private Parties
                </Link>
              </li>
              <li>
                <Link href="/services#school" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  School Dances
                </Link>
              </li>
              <li>
                <Link href="/services#holiday" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Holiday Parties
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Service Areas */}
          <div>
            <h4 className="text-lg font-semibold text-brand mb-6 font-playfair">Service Areas</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/memphis" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Memphis
                </Link>
              </li>
              <li>
                <Link href="/germantown" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Germantown
                </Link>
              </li>
              <li>
                <Link href="/collierville" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Collierville
                </Link>
              </li>
              <li>
                <Link href="/bartlett" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Bartlett
                </Link>
              </li>
              <li>
                <Link href="/arlington" className="text-gray-300 hover:text-brand transition-colors font-inter hover:pl-2 block py-1">
                  Arlington
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="divider-brand my-12" />
        
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-gray-400 font-inter">
              © {currentYear} <span className="text-brand font-semibold">M10 DJ Company</span>. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm font-inter mt-1">
              Licensed & Insured • Professional Event Entertainment
            </p>
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
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-brand/10 to-brand/5 rounded-2xl p-8 border border-brand/20">
            <h4 className="text-2xl font-bold text-white mb-4 font-playfair">Ready to Make Your Event Unforgettable?</h4>
            <p className="text-gray-300 mb-6 font-inter max-w-2xl mx-auto">
              Get your free consultation and quote today. Let's create an amazing experience for your special event.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#contact" className="btn-primary">
                Get Free Quote
              </Link>
              <a href="tel:+19014102020" className="btn-secondary">
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 