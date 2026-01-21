import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { StickyCTA } from '@/components/tipjar/StickyCTA';
import { ProductStructuredData } from '@/components/shared/marketing/StructuredData';
import ToolkitContent from './ToolkitContent';
import {
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TipJar Toolkit - Practical Ways to Use QR Codes for DJ Tipping | TipJar.Live',
  description: 'Discover practical applications for using TipJar QR codes at weddings, parties, bars, restaurants, and events. Learn how to maximize tips and song requests with smart QR code placement.',
  keywords: [
    'DJ tip jar QR code placement',
    'wedding DJ tipping strategies',
    'bar QR code tipping',
    'restaurant tipping QR codes',
    'event tipping applications',
    'DJ song request QR codes',
    'QR code tip jar ideas',
    'venue tipping solutions'
  ],
  openGraph: {
    title: 'TipJar Toolkit - Practical QR Code Applications for DJ Tipping',
    description: 'Discover practical applications for using TipJar QR codes at weddings, parties, bars, restaurants, and events. Learn how to maximize tips and song requests.',
    url: 'https://www.tipjar.live/toolkit',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-toolkit-og.png',
        width: 1200,
        height: 630,
        alt: 'TipJar Toolkit - Practical QR Code Applications',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJar Toolkit - Practical QR Code Applications for DJ Tipping',
    description: 'Discover practical applications for using TipJar QR codes at weddings, parties, bars, restaurants, and events.',
    images: ['/assets/tipjar-toolkit-og.png'],
  },
};

export default function ToolkitPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Structured Data for SEO */}
      <ProductStructuredData
        product="tipjar"
        includeOrganization={true}
        includeSoftwareApp={true}
        includeWebsite={true}
        softwareAppProps={{
          name: 'TipJar Live - DJ Tip Collection Toolkit',
          applicationCategory: 'BusinessApplication',
          offers: { price: '0', priceCurrency: 'USD' },
          aggregateRating: { ratingValue: '4.9', reviewCount: '1200' },
        }}
      />

      <TipJarHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 overflow-hidden pt-32 pb-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Practical Applications</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              TipJar Toolkit
            </h1>

            <p className="text-xl md:text-2xl text-emerald-50 mb-8 leading-relaxed max-w-3xl mx-auto">
              Discover practical ways to use TipJar QR codes and digital links to maximize tips and song requests at weddings, events, bars, and restaurants.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 h-auto"
                >
                  View Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ToolkitContent />

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Join 1,200+ DJs Making More Money
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              These practical applications have helped DJs increase their tips by up to 300%
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                  1,200+
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">DJs Using TipJar</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                  $250K+
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Tips Collected</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                  45K+
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Song Requests</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                  300%
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Average Tip Increase</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Start Making More Money?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 leading-relaxed">
              Join thousands of DJs who are using these practical applications to increase their tips. Setup takes 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-10 py-7 h-auto shadow-2xl hover:shadow-3xl transition-all"
              >
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-10 py-7 h-auto"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TipJarFooter />
      <StickyCTA />
    </div>
  );
}