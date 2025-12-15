import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FAQ } from '@/components/tipjar/FAQ';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import {
  CheckCircle,
  ArrowRight,
  QrCode,
  Smartphone,
  CreditCard,
  Music,
  DollarSign,
  Zap,
  Settings,
  BarChart3,
  Download,
  Share2,
  Bell,
  Clock,
  Shield,
  Users,
  TrendingUp,
  Palette,
  Link2,
  FileText,
  PlayCircle,
  MessageSquare,
  Star,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Collect Tips as a DJ | Complete TipJar.Live Guide',
  description: 'Complete guide to using TipJar for DJs. Learn how to set up your tip jar, generate QR codes, manage song requests, track earnings, and get paid instantly. Step-by-step instructions with tips and best practices.',
  keywords: [
    'how to collect tips as a DJ',
    'DJ tip collection guide',
    'easy song requests for parties',
    'tip jar for events',
    'QR code tipping for DJs',
    'DJ payment app',
    'song request management',
    'event tipping guide'
  ],
};

export default function HowItWorksPage() {
  const setupSteps = [
    {
      number: 1,
      title: 'Sign Up (Free, No Credit Card)',
      description: 'Create your account in under 2 minutes. No credit card required to start.',
      icon: <Users className="w-8 h-8" />,
      details: [
        'Go to tipjar.live and click "Start Free Trial"',
        'Enter your email and create a password',
        'Verify your email address (check spam folder)',
        'You\'re in! No payment info needed to start'
      ],
      tips: [
        'Use a professional email address (not personal)',
        'Choose a password you\'ll remember or use a password manager',
        'Check your spam folder if verification email doesn\'t arrive'
      ]
    },
    {
      number: 2,
      title: 'Customize Your Branding',
      description: 'Make it yours. Add your logo, choose colors, and set your welcome message.',
      icon: <Palette className="w-8 h-8" />,
      details: [
        'Upload your logo (PNG or JPG, recommended: 200x200px)',
        'Choose your brand colors (or use our defaults)',
        'Write a custom welcome message for guests',
        'Preview how it looks on mobile devices'
      ],
      tips: [
        'Use high-contrast colors for better readability',
        'Keep your welcome message short and friendly',
        'Test on a phone to see how guests will experience it'
      ]
    },
    {
      number: 3,
      title: 'Get Your Unique Link',
      description: 'Your TipJar link is ready immediately. Share it anywhere.',
      icon: <Link2 className="w-8 h-8" />,
      details: [
        'Your link looks like: tipjar.live/your-username',
        'Copy it to share on social media, email, or text',
        'Works on any device - iPhone, Android, tablets',
        'No app download required for guests'
      ],
      tips: [
        'Bookmark your dashboard link for easy access',
        'Add your TipJar link to your email signature',
        'Include it in your DJ bio on social media'
      ]
    },
    {
      number: 4,
      title: 'Generate QR Codes',
      description: 'Create QR codes for events. Print them or display on screens.',
      icon: <QrCode className="w-8 h-8" />,
      details: [
        'Click "Generate QR Code" in your dashboard',
        'Download as PNG or SVG (high quality for printing)',
        'Display on your DJ booth TV or tablet',
        'Print for tables, flyers, or business cards'
      ],
      tips: [
        'Test your QR code before the event',
        'Make QR codes large enough to scan from 3-5 feet away',
        'Have backup printed QR codes in case tech fails',
        'Use high-contrast colors (dark QR on light background)'
      ]
    }
  ];

  const eventSteps = [
    {
      number: 1,
      title: 'Display Your QR Code',
      description: 'Make it easy for guests to find and scan.',
      icon: <QrCode className="w-8 h-8" />,
      details: [
        'Place QR code on your DJ booth TV or tablet',
        'Print and place on tables near the dance floor',
        'Share your link on event screens or projectors',
        'Announce it during your set: "Scan the QR code to request songs!"'
      ],
      tips: [
        'Position QR codes at eye level for easy scanning',
        'Use multiple QR codes around the venue',
        'Have a backup plan if WiFi is slow',
        'Test your link before guests arrive'
      ]
    },
    {
      number: 2,
      title: 'Monitor Requests in Real-Time',
      description: 'See song requests and tips as they come in.',
      icon: <Bell className="w-8 h-8" />,
      details: [
        'Open your dashboard on your phone or laptop',
        'See requests appear instantly in your queue',
        'View tip amounts and guest messages',
        'Prioritize requests with higher tips'
      ],
      tips: [
        'Keep your dashboard open during events',
        'Enable browser notifications for new requests',
        'Sort by tip amount to prioritize high-paying requests',
        'Use the search feature to find specific songs quickly'
      ]
    },
    {
      number: 3,
      title: 'Manage Your Queue',
      description: 'Organize requests and play what guests want.',
      icon: <PlayCircle className="w-8 h-8" />,
      details: [
        'Drag and drop to reorder your queue',
        'Mark songs as "played" when you finish them',
        'See which requests have tips attached',
        'Filter by genre, artist, or tip amount'
      ],
      tips: [
        'Balance tipped requests with crowd favorites',
        'Don\'t ignore non-tipped requests completely',
        'Use the queue to plan your set flow',
        'Save popular requests for peak dance floor moments'
      ]
    }
  ];

  const paymentFeatures = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Multiple Payment Methods',
      description: 'Guests can pay with credit cards (Visa, Mastercard, Amex, Discover) or Cash App Pay. All processed securely through Stripe.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Processing',
      description: 'All payments are encrypted and processed through Stripe, the same system used by millions of businesses worldwide.'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Automatic Daily Payouts',
      description: 'Money goes straight to your bank account automatically every day. Free and automatic - no action needed.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Payouts Available',
      description: 'Need money immediately? Request an instant payout for a 1.5% fee. Perfect for same-day events.'
    }
  ];

  const dashboardFeatures = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Earnings Dashboard',
      description: 'Track your total earnings, see daily/weekly/monthly breakdowns, and export data for taxes.'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics & Insights',
      description: 'See which songs are most requested, peak tipping times, and event performance metrics.'
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: 'Request History',
      description: 'View all past song requests, see what worked, and identify trends for future events.'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Data',
      description: 'Download CSV files of all transactions for accounting, taxes, or personal records.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 overflow-hidden pt-32 pb-20 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Complete Setup Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              How TipJar Works
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 mb-8 leading-relaxed">
              Everything you need to know to start collecting tips and managing song requests. 
              From setup to getting paid—we've got you covered.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-emerald-50">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>2-minute setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Secure payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Process */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Getting Started: Setup in 4 Steps
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Follow these steps to get your TipJar ready for your next event
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto space-y-12">
            {setupSteps.map((step, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center shadow-xl">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">STEP {step.number}</span>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      {step.description}
                    </p>
                    <div className="space-y-3 mb-6">
                      {step.details.map((detail, detailIdx) => (
                        <div key={detailIdx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                        </div>
                      ))}
                    </div>
                    {step.tips && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                        <div className="flex items-start gap-2 mb-2">
                          <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Pro Tips:</h4>
                        </div>
                        <ul className="space-y-2 ml-7">
                          {step.tips.map((tip, tipIdx) => (
                            <li key={tipIdx} className="text-sm text-blue-800 dark:text-blue-200">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Using at Events */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Using TipJar at Your Events
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Best practices for maximizing tips and managing requests during live events
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto space-y-12">
            {eventSteps.map((step, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center shadow-xl">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">AT EVENT</span>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      {step.description}
                    </p>
                    <div className="space-y-3 mb-6">
                      {step.details.map((detail, detailIdx) => (
                        <div key={detailIdx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                        </div>
                      ))}
                    </div>
                    {step.tips && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mt-6">
                        <div className="flex items-start gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <h4 className="font-semibold text-emerald-900 dark:text-emerald-50">Best Practices:</h4>
                        </div>
                        <ul className="space-y-2 ml-7">
                          {step.tips.map((tip, tipIdx) => (
                            <li key={tipIdx} className="text-sm text-emerald-800 dark:text-emerald-200">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guest Experience */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              What Your Guests Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Simple, fast, and secure—no app downloads required
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">1. Scan & Open</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                Guest scans your QR code or clicks your link. Opens instantly in their phone browser—works on iPhone, Android, or any device. No app download needed.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">2. Request Songs</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                Search for songs using integrated Spotify search. Add an optional tip to boost request priority. Request appears in your queue instantly.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">3. Tip Instantly</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                Pay with credit card or Cash App Pay. Secure checkout takes seconds. Tip goes straight to your account—no waiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Processing */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Getting Paid: Simple & Secure
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              All payments processed securely through Stripe
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {paymentFeatures.map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Pricing & Fees</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  TipJar charges a <strong>3.5% + $0.30</strong> platform fee on each transaction. This fee is only charged when you receive a tip—no monthly fees on the free plan.
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Free Plan:</strong> 3.5% + $0.30 per transaction (no monthly fee)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Pro Plan:</strong> $29/month + 3.5% + $0.30 per transaction</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Instant Payouts:</strong> 1.5% additional fee (optional)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Features */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Your Dashboard: Track Everything
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful tools to manage requests, track earnings, and grow your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {dashboardFeatures.map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-24 bg-gradient-to-b from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Tips for Success
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Maximize your tips and make the most of TipJar
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Maximize Tips
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Announce your TipJar during your set—mention it 2-3 times per hour</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Place QR codes at eye level near the dance floor</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Play requested songs promptly to encourage more tips</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Thank guests who tip during your announcements</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-emerald-600" />
                  Setup Tips
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Test your QR code and link before every event</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Have backup printed QR codes in case of tech issues</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Customize your branding to match your DJ persona</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Set up your bank account for payouts before your first event</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Everything else you need to know
              </p>
            </div>
            <FAQ
              items={[
                {
                  question: "How long does setup take?",
                  answer: "Setup takes about 2 minutes. Sign up, customize your branding, and get your TipJar link. You can start using it immediately—no waiting period."
                },
                {
                  question: "Do guests need to download an app?",
                  answer: "No! Guests just open your link in their phone browser. Works on iPhone, Android, or any device. No app download required—this is one of TipJar's biggest advantages."
                },
                {
                  question: "How quickly do I get paid?",
                  answer: "By default, payouts are automatic and happen daily. Money goes straight to your bank account. If you need money instantly, you can request an instant payout for a 1.5% fee. All payments are processed securely through Stripe."
                },
                {
                  question: "What payment methods do guests use?",
                  answer: "Guests can pay with any major credit card (Visa, Mastercard, Amex, Discover) or Cash App Pay. All payments are processed securely through Stripe, the same system used by millions of businesses."
                },
                {
                  question: "Can I use this at multiple events?",
                  answer: "Absolutely! Your TipJar link works for all your events. You can generate new QR codes for each event if you want to track them separately, or use the same link everywhere. Your dashboard shows all activity across all events."
                },
                {
                  question: "How do song requests work?",
                  answer: "Guests search for songs using our integrated Spotify search. They can add an optional tip to boost their request priority. You see all requests in real-time in your dashboard and can manage your queue—drag and drop to reorder, mark as played, and filter by tip amount."
                },
                {
                  question: "Is there a monthly fee?",
                  answer: "No monthly fee on the free plan! You only pay 3.5% + $0.30 per transaction when you receive a tip. Pro plans start at $29/month and include additional features like unlimited requests and custom branding."
                },
                {
                  question: "What if I have technical issues during an event?",
                  answer: "TipJar is designed to be reliable, but we recommend having backup printed QR codes. Your link always works, so even if QR codes fail, guests can type in your link. Our support team is available to help if needed."
                },
                {
                  question: "Can I customize the look and feel?",
                  answer: "Yes! On Pro plans, you can upload your logo, choose your brand colors, customize your welcome message, and even use custom domains. Free plans include basic customization options."
                },
                {
                  question: "How do I track my earnings?",
                  answer: "Your dashboard shows real-time earnings, daily/weekly/monthly breakdowns, and you can export all transaction data as CSV files for accounting or tax purposes. Analytics show which songs are most requested and peak tipping times."
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 leading-relaxed">
              Join 1,200+ DJs who are making more money with TipJar. Setup takes 2 minutes. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-10 py-7 h-auto shadow-2xl hover:shadow-3xl transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
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
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-emerald-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Secure payments via Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <TipJarFooter />
    </div>
  );
}
