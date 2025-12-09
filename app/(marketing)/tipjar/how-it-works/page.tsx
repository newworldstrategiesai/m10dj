import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FAQ } from '@/components/tipjar/FAQ';
import {
  CheckCircle,
  ArrowRight,
  QrCode,
  Smartphone,
  CreditCard,
  Music,
  DollarSign,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Collect Tips as a DJ | TipJar.Live Guide',
  description: 'Learn how to collect tips as a DJ with TipJar. Simple 3-step process: create your tip jar, share QR code at events, get paid instantly. Setup takes 2 minutes.',
  keywords: [
    'how to collect tips as a DJ',
    'DJ tip collection guide',
    'easy song requests for parties',
    'tip jar for events',
    'QR code tipping for DJs'
  ],
};

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: 'Create Your TipJar',
      description: 'Sign up free (no credit card required), customize your branding, and get your unique TipJar link.',
      icon: <Zap className="w-8 h-8" />,
      details: [
        'Choose your colors and add your logo',
        'Set your welcome message',
        'Get your unique TipJar link',
        'Generate QR codes for events'
      ]
    },
    {
      number: 2,
      title: 'Share at Your Event',
      description: 'Display your QR code or share your link. Guests open it on their phone—no app download needed.',
      icon: <QrCode className="w-8 h-8" />,
      details: [
        'Display QR code on your DJ booth TV',
        'Print QR codes for tables',
        'Share link on social media',
        'Works on any phone or device'
      ]
    },
    {
      number: 3,
      title: 'Get Paid Instantly',
      description: 'Tips go straight to your account. Song requests appear in your queue. Automatic daily payouts.',
      icon: <DollarSign className="w-8 h-8" />,
      details: [
        'See tips and requests in real-time',
        'Automatic daily payouts (free)',
        'Instant payouts available (1.5% fee)',
        'Track earnings in your dashboard'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-tipjar-gradient dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            How to Collect Tips as a DJ<br />Simple 3-Step Guide
          </h1>
          <p className="text-xl text-center text-gray-300 max-w-2xl mx-auto">
            Learn how to collect tips as a DJ with TipJar. From signup to collecting tips and song requests—see how simple it is. Setup takes 2 minutes.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4 dark:text-white">{step.title}</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                    {step.description}
                  </p>
                  <ul className="space-y-3">
                    {step.details.map((detail, detailIdx) => (
                      <li key={detailIdx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-tipjar-success-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guest Experience */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 dark:text-white">
            What Guests Experience
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <Smartphone className="w-12 h-12 text-tipjar-primary-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 dark:text-white">1. Open Your Link</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Guest scans QR code or clicks your link. Opens instantly in their phone browser—no app download needed.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <Music className="w-12 h-12 text-tipjar-primary-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 dark:text-white">2. Request Songs</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Search for songs with integrated Spotify search. Add a tip to boost priority. Request appears in your queue instantly.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <CreditCard className="w-12 h-12 text-tipjar-primary-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 dark:text-white">3. Tip Instantly</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pay with credit card or Cash App Pay. Secure checkout takes seconds. Tip goes straight to your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
              Frequently Asked Questions
            </h2>
            <FAQ
              items={[
                {
                  question: "How long does setup take?",
                  answer: "Setup takes about 2 minutes. Sign up, customize your branding, and get your TipJar link. You can start using it immediately."
                },
                {
                  question: "Do guests need to download an app?",
                  answer: "No! Guests just open your link in their phone browser. Works on iPhone, Android, or any device. No app download required."
                },
                {
                  question: "How quickly do I get paid?",
                  answer: "By default, payouts are automatic and happen daily. If you need money instantly, you can request an instant payout for a 1.5% fee. All payments are processed securely through Stripe."
                },
                {
                  question: "What payment methods do guests use?",
                  answer: "Guests can pay with any major credit card (Visa, Mastercard, Amex, Discover) or Cash App Pay. All payments are processed securely through Stripe."
                },
                {
                  question: "Can I use this at multiple events?",
                  answer: "Absolutely! Your TipJar link works for all your events. You can generate new QR codes for each event if you want to track them separately, or use the same link everywhere."
                },
                {
                  question: "How do song requests work?",
                  answer: "Guests search for songs using our integrated Spotify search. They can add a tip to boost their request priority. You see all requests in real-time in your dashboard and can manage your queue."
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-tipjar-cta-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join 1,200+ DJs who are making more money with TipJar. Setup takes 2 minutes.
          </p>
          <Link href="/signup">
            <Button 
              size="lg" 
              className="bg-white text-tipjar-primary-600 hover:bg-gray-100 font-semibold uppercase tracking-wider text-lg px-8 py-6"
            >
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

