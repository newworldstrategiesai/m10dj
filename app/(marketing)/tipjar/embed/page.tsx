import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import {
  QrCode,
  Smartphone,
  Globe,
  Code,
  CheckCircle,
  ArrowRight,
  Zap,
  Copy
} from 'lucide-react';
import ForceLightMode from './ForceLightMode';

export const metadata: Metadata = {
  title: 'Mobile Tip Jar & QR Code Song Requests DJ | Embed TipJar Widget',
  description: 'Embed mobile tip jar and QR code song requests for DJs on your website. One line of code to add tip collection and song requests to any site. Works on WordPress, Wix, Squarespace.',
  keywords: [
    'mobile tip jar',
    'QR code song requests DJ',
    'QR code tip jar',
    'embed tip jar',
    'tip jar widget',
    'song request widget'
  ],
  openGraph: {
    title: 'Embed TipJar - Just One Line of Code',
    description: 'Embed mobile tip jar and QR code song requests for DJs on your website. One line of code to add tip collection and song requests to any site.',
    url: 'https://www.tipjar.live/embed',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-embed-og.png',
        width: 1200,
        height: 630,
        alt: 'Embed TipJar - Just One Line of Code',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Embed TipJar - Just One Line of Code',
    description: 'Embed mobile tip jar and QR code song requests on your website. Works on WordPress, Wix, Squarespace.',
    images: ['/assets/tipjar-embed-og.png'],
  },
};

export default function EmbedPage() {
  const embedCode = `<script src="https://tipjar.live/widget.js" data-tipjar-id="YOUR_ID"></script>`;

  return (
    <>
      <ForceLightMode />
      <div className="min-h-screen bg-white dark:bg-gray-950" suppressHydrationWarning>
        <TipJarHeader />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Mobile Tip Jar & QR Code<br />Song Requests for DJs
          </h1>
          <p className="text-xl text-center text-emerald-50 dark:text-gray-200 max-w-2xl mx-auto">
            Embed mobile tip jar and QR code song requests on your website. One line of code to add tip collection and song requests to any site.
          </p>
        </div>
      </section>

      {/* QR Code Tip Jar Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                  QR Code Tip Jar for Events
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  Generate unique QR codes for each event. Display on your DJ booth TV, print for tables, or share on social media. Guests scan and tip instantly—no app download needed.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-tipjar-success-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Generate unlimited QR codes for different events</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-tipjar-success-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Track tips and requests per event with unique codes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-tipjar-success-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Works on any phone—iPhone, Android, no app needed</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-tipjar-success-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Print-ready QR codes for tables and flyers</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                <QrCode className="w-32 h-32 mx-auto mb-4 text-gray-900 dark:text-white" />
                <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
                  QR Code Example<br />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scan to tip and request songs</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Tip Jar Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Mobile Tip Jar That Works Everywhere
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Your mobile tip jar works on any device—iPhone, Android, tablet, or desktop. No app downloads required. Guests just open your link and start tipping.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Smartphone className="w-12 h-12 text-tipjar-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Mobile-First Design</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Optimized for mobile phones. Fast loading, touch-friendly interface. Works perfectly on any screen size.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Globe className="w-12 h-12 text-tipjar-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">No App Required</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Guests open your link in any browser. No app download, no account creation. Zero friction for maximum tips.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Zap className="w-12 h-12 text-tipjar-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Payments</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Credit card or Cash App Pay. Secure checkout in seconds. Tips go straight to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Widget Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Embed TipJar on Your Website
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-12">
              One line of code to add mobile tip jar and song requests to your website. Works on WordPress, Wix, Squarespace, or any platform.
            </p>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Embed Code</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </Button>
              </div>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                <code className="text-green-400 text-sm font-mono">
                  {embedCode}
                </code>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Supported Platforms</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">WordPress</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Wix</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Squarespace</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Shopify</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Custom HTML sites</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Features Included</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Mobile tip jar widget</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Song request functionality</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">QR code generation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Custom branding</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Real-time analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Song Requests Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              QR Code Song Requests for DJs
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-12">
              Guests scan your QR code to request songs instantly. No shouting, no notes, no chaos—just organized song requests in your queue.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h3>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                    <span className="text-gray-600 dark:text-gray-300">Display QR code at your DJ booth or on tables</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                    <span className="text-gray-600 dark:text-gray-300">Guest scans code with phone camera</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                    <span className="text-gray-600 dark:text-gray-300">Search and request songs with Spotify integration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                    <span className="text-gray-600 dark:text-gray-300">Request appears in your dashboard instantly</span>
                  </li>
                </ol>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">No more shouting requests across the dance floor</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Organized queue you can manage in real-time</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Priority requests when guests add tips</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">Track which songs are most requested</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Add Mobile Tip Jar to Your Site?
          </h2>
          <p className="text-xl text-emerald-50 dark:text-gray-200 mb-8 max-w-2xl mx-auto">
            Start collecting tips and song requests with QR codes. Setup takes 2 minutes.
          </p>
          <Button 
            size="lg" 
            asChild
            className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold uppercase tracking-wider text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
          >
            <Link href="/signup">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
      <TipJarFooter />
      </div>
    </>
  );
}

