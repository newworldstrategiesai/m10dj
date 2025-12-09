/**
 * Platform Landing Page
 * 
 * This is the public-facing landing page for DJs to sign up for the platform.
 * M10 DJ Company pages remain untouched at / and other routes.
 */

import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { 
  CheckCircle, 
  Music, 
  FileText, 
  CreditCard, 
  Users, 
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  Star,
  TrendingUp
} from 'lucide-react';

export default function PlatformLanding() {
  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Contracts & E-Signatures',
      description: 'Professional contracts with digital signatures. No more DocuSign fees.'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Invoicing & Payments',
      description: 'Create invoices, collect deposits, and process payments seamlessly.'
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: 'Song Planning',
      description: 'Music questionnaires and playlist management for every event.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Contact Management',
      description: 'CRM to track leads, clients, and communication history.'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Track revenue, bookings, and business performance in real-time.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Crowd Requests',
      description: 'Let event guests request songs, send tips, and shoutouts. New revenue stream!'
    }
  ];

  const benefits = [
    'Replace 5-7 separate tools with one platform',
    'Save 10-20 hours per month on admin tasks',
    'Professional appearance increases bookings',
    'Automated workflows reduce errors',
    'Mobile-friendly, work from anywhere'
  ];

  return (
    <>
      <Head>
        <title>DJ Business Management Platform | All-in-One Solution for Professional DJs</title>
        <meta 
          name="description" 
          content="Manage your DJ business in one place. Invoicing, contracts, song planning, payments, and more. Start your free trial today." 
        />
        <link rel="canonical" href="/platform" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Music className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  DJ Platform
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dj-pricing"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Pricing
                </Link>
                <Link 
                  href="/signup"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Trusted by Professional DJs
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Manage Your DJ Business
              <span className="block text-purple-600 dark:text-purple-400">
                In One Place
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Replace 5-7 separate tools with one powerful platform. Invoicing, contracts, 
              song planning, payments, and more. Built specifically for DJs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/signup"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/dj-pricing"
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-300 dark:border-gray-600 transition-colors"
              >
                View Pricing
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">10-20</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hours Saved/Month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">5-7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tools Replaced</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">$480+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Saved/Year</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything You Need to Run Your DJ Business
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                All the tools you need, integrated into one platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <div className="text-purple-600 dark:text-purple-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Why DJs Choose Our Platform
              </h2>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0 mt-0.5" />
                  <p className="text-lg text-gray-900 dark:text-white">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Streamline Your DJ Business?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <Link 
              href="/signup"
              className="inline-flex items-center bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} DJ Platform. All rights reserved.</p>
            <div className="mt-4 space-x-6">
              <Link href="/dj-pricing" className="hover:text-white">Pricing</Link>
              <Link href="/signup" className="hover:text-white">Sign Up</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

