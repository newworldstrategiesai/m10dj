'use client';

import { useState } from 'react';
import { Search, Mail, HelpCircle, CreditCard, User, Settings, Smartphone, DollarSign, FileText, Users, QrCode, Video, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { FAQ } from '@/components/tipjar/FAQ';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'account', name: 'Account & Login', icon: User, color: 'text-blue-500' },
    { id: 'payments', name: 'Payments & Tips', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'payouts', name: 'Payouts', icon: CreditCard, color: 'text-green-600' },
    { id: 'subscription', name: 'Subscription & Billing', icon: FileText, color: 'text-purple-500' },
    { id: 'setup', name: 'Getting Started', icon: Settings, color: 'text-orange-500' },
    { id: 'qr-codes', name: 'QR Codes', icon: QrCode, color: 'text-indigo-500' },
    { id: 'embed', name: 'Embed Widget', icon: Video, color: 'text-pink-500' },
    { id: 'venue', name: 'Venue & Performer Features', icon: Users, color: 'text-cyan-500' },
    { id: 'technical', name: 'Technical Issues', icon: AlertCircle, color: 'text-red-500' },
  ];

  const allFAQs = [
    // Account & Login
    {
      category: 'account',
      question: "I can't sign in to my account. What should I do?",
      answer: "First, check that you're using the correct email address. If you've forgotten your password, use the 'Forgot Password' link on the sign-in page. If you still can't sign in, make sure your email is confirmed (check your inbox for a confirmation email). If you're still having issues, try clearing your browser cache or using an incognito/private window. If the problem persists, contact support with your email address."
    },
    {
      category: 'account',
      question: "I didn't receive my password reset email. Where is it?",
      answer: "Password reset emails can sometimes go to spam or junk folders. Check these folders first. Also verify you're checking the correct email address. If it's been more than a few minutes, try requesting another reset link. Make sure to check the email associated with your TipJar account (this might be different from the email you use for other services). If you still don't receive it, contact support."
    },
    {
      category: 'account',
      question: "I'm getting an error that my email is already registered. What does this mean?",
      answer: "This means an account already exists with that email address. You may have signed up previously, or someone else may have created a page for you. Try signing in with your email and using the 'Forgot Password' option if you don't remember your password. If you believe this is an error, contact support with your email address."
    },
    {
      category: 'account',
      question: "How do I claim my TipJar page if I received an invitation email?",
      answer: "Click the claim link in the email invitation. You'll be taken to a page where you can create your account using the email address that received the invitation. Enter your business name, create a password, and click 'Claim My Page'. After claiming, you'll have full access to manage your TipJar page, view tips, and configure settings."
    },
    {
      category: 'account',
      question: "Can I change my email address?",
      answer: "Yes, you can change your email address in your account settings. Go to Dashboard → Settings → Account. Changing your email will require email confirmation, so make sure you have access to the new email address. Note: Your TipJar page URL will remain the same even if you change your email."
    },
    {
      category: 'account',
      question: "What if I signed up but never confirmed my email?",
      answer: "You should receive a confirmation email when you sign up. If you didn't receive it, check your spam folder. You can request a new confirmation email by trying to sign in—if your email isn't confirmed, you'll see an option to resend the confirmation. Some features may be limited until your email is confirmed."
    },

    // Payments & Tips
    {
      category: 'payments',
      question: "A tip was sent to me but I don't see it in my dashboard. Where is it?",
      answer: "Tips can take a few moments to appear in your dashboard after payment is processed. Refresh your dashboard page. If it's been more than 10 minutes and you still don't see it, check your Stripe dashboard (if you have one) to verify the payment went through. If the payment shows as successful in Stripe but not in TipJar, contact support with the payment ID or transaction details."
    },
    {
      category: 'payments',
      question: "A guest says their payment failed. What should I tell them?",
      answer: "Payment failures are usually due to card issues (insufficient funds, expired card, bank decline) or network problems. Ask the guest to: 1) Verify their card has sufficient funds, 2) Try a different payment method, 3) Check with their bank that the transaction isn't being blocked, 4) Try again in a few minutes. If they continue to have issues, they should contact their bank or try a different card."
    },
    {
      category: 'payments',
      question: "Can guests tip me using Cash App?",
      answer: "Yes! TipJar accepts all major credit cards (Visa, Mastercard, Amex, Discover) and Cash App Pay. Guests don't need to download any apps or create accounts—they can pay directly through the secure payment form. All payments are processed securely through Stripe."
    },
    {
      category: 'payments',
      question: "How do I see who sent me tips and their messages?",
      answer: "Go to your Dashboard and click on 'Tips' or 'Recent Activity'. You'll see a list of all tips with the tipper's name (if provided), message, amount, and timestamp. You can view individual tip details by clicking on them. Tip history is available for all active subscriptions."
    },
    {
      category: 'payments',
      question: "Can I refund a tip if someone made a mistake?",
      answer: "Yes, you can refund tips through your Stripe dashboard. Log in to Stripe, find the payment, and issue a refund. The refund will be processed back to the original payment method. Note: Platform fees are non-refundable. If you need help with a refund, contact support with the tip ID or transaction details."
    },
    {
      category: 'payments',
      question: "Is there a minimum or maximum tip amount?",
      answer: "The minimum tip amount is $1.00. There's no maximum tip amount—guests can tip any amount they choose. Some payment methods may have their own limits set by the payment processor or the guest's bank."
    },

    // Payouts
    {
      category: 'payouts',
      question: "How quickly will I receive my tips?",
      answer: "By default, payouts are automatic and happen daily. Your tips are deposited directly to your bank account. The first payout may take 2-7 business days to appear in your account due to bank verification. After that, payouts typically arrive within 1-2 business days. You can request an instant payout for a 1.5% fee if you need money immediately."
    },
    {
      category: 'payouts',
      question: "How do I set up my bank account for payouts?",
      answer: "You'll need to connect a Stripe account to receive payouts. During onboarding or in your Dashboard → Settings → Payments, you'll be guided through the Stripe setup process. You'll need your bank account details (routing number and account number) or debit card information. Stripe will verify your account, which may take a few business days."
    },
    {
      category: 'payouts',
      question: "What are the payout fees?",
      answer: "Regular payouts (daily automatic) are free. If you need money instantly, you can request an instant payout for a 1.5% fee. There are no fees for setting up your bank account or for receiving regular payouts. TipJar charges a 3.5% + $0.30 platform fee on each tip, which is separate from payout fees."
    },
    {
      category: 'payouts',
      question: "Why haven't I received my payout yet?",
      answer: "Payouts typically arrive within 1-2 business days after they're processed. Weekends and holidays may cause delays. If it's been longer than expected: 1) Check your Stripe dashboard for payout status, 2) Verify your bank account details are correct, 3) Make sure your bank account is verified in Stripe, 4) Check with your bank that there are no holds or issues. Contact support if you need assistance."
    },
    {
      category: 'payouts',
      question: "Can I change my payout bank account?",
      answer: "Yes, you can update your bank account in your Stripe dashboard. Log in to Stripe, go to Settings → Payment details, and update your bank account information. The new account will need to be verified, which may take a few business days. Payouts will then be sent to the new account."
    },

    // Subscription & Billing
    {
      category: 'subscription',
      question: "Do I pay fees if I don't receive any tips?",
      answer: "No! The 3.5% + $0.30 platform fee only applies when you actually receive a tip. If you don't get any tips in a month, you don't pay any transaction fees. However, if you're on a Pro or Embed Pro plan, you'll still pay the monthly subscription fee regardless of tips received. The Free plan has no monthly fee."
    },
    {
      category: 'subscription',
      question: "What's the difference between Free, Pro, and Embed Pro plans?",
      answer: "The Free plan includes basic tipping functionality with up to 10 requests per month. Pro ($9.99/month) includes unlimited requests, custom branding, analytics, and priority support. Embed Pro ($29.99/month) includes everything in Pro plus the embed widget for your website/streaming software, custom domain support, and advanced analytics."
    },
    {
      category: 'subscription',
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your Dashboard → Settings → Subscription. When you cancel, you'll continue to have access to all features until the end of your current billing period. After that, your account will revert to the Free plan. You can resubscribe at any time."
    },
    {
      category: 'subscription',
      question: "What happens if my subscription payment fails?",
      answer: "If a subscription payment fails, you'll receive an email notification. Your subscription will be marked as 'past due' and you'll have a grace period to update your payment method. During this time, some features may be limited. Update your payment method in Dashboard → Settings → Subscription to restore full access. If payment continues to fail, your account will revert to the Free plan."
    },
    {
      category: 'subscription',
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes! You can upgrade or downgrade at any time from Dashboard → Settings → Subscription. When you upgrade, you'll immediately gain access to the new features. When you downgrade, the change takes effect at the end of your current billing period. Pro-rated refunds may apply when downgrading."
    },
    {
      category: 'subscription',
      question: "Do I get a free trial?",
      answer: "The Free plan is always free with no trial period needed. For Pro and Embed Pro plans, we may offer free trials or promotional pricing. Check the pricing page for current offers. During a trial, you'll have full access to the plan's features, and your subscription will begin automatically at the end of the trial unless canceled."
    },

    // Getting Started
    {
      category: 'setup',
      question: "How do I get started with TipJar?",
      answer: "1) Sign up for a free account, 2) Complete your profile (add your name, bio, profile picture), 3) Get your unique TipJar link or QR code, 4) Share it with your audience during events or streams, 5) Start receiving tips! You can customize your page, set up payouts, and explore advanced features as you grow. Check out our Getting Started guide for detailed steps."
    },
    {
      category: 'setup',
      question: "What should I put on my TipJar page?",
      answer: "Your TipJar page should include: your name or stage name, a brief bio or description, a profile picture or logo, and any special instructions or messages for your audience. You can customize the page with your branding, colors, and messaging. Keep it simple and authentic—your audience wants to support you!"
    },
    {
      category: 'setup',
      question: "How do I share my TipJar link with my audience?",
      answer: "You can share your TipJar link in multiple ways: 1) Display the QR code on screen during streams or events, 2) Share the link in chat, social media, or your bio, 3) Include it in your streaming software overlay, 4) Print the QR code on cards or signage, 5) Use the embed widget on your website. Your unique link is available in your Dashboard."
    },
    {
      category: 'setup',
      question: "Can I use TipJar for multiple events or streams?",
      answer: "Absolutely! Your TipJar link works for all your events and streams. You can use the same link everywhere, or create separate pages for different projects (requires multiple accounts). The same QR code works everywhere. All tips will be tracked in your main dashboard regardless of where they come from."
    },
    {
      category: 'setup',
      question: "Do I need a Stripe account?",
      answer: "You don't need to create a Stripe account separately—TipJar handles the integration for you. However, you will need to complete Stripe's verification process to receive payouts. This includes providing your bank account information and verifying your identity. The process is straightforward and guided within TipJar."
    },

    // QR Codes
    {
      category: 'qr-codes',
      question: "How do I download or print my QR code?",
      answer: "In your Dashboard, go to your page settings and find your QR code. You can download it as a PNG image in various sizes. For best results when printing, download the high-resolution version. The QR code works in both color and black & white, so you can customize it to match your branding."
    },
    {
      category: 'qr-codes',
      question: "Can I customize my QR code?",
      answer: "Yes! You can customize your QR code's colors, add a logo in the center, and adjust the size. These options are available in your Dashboard → Settings → QR Code. Keep in mind that extreme customization may affect scanability, so test your QR code before printing large quantities."
    },
    {
      category: 'qr-codes',
      question: "My QR code isn't scanning. What's wrong?",
      answer: "If your QR code isn't scanning: 1) Make sure it's displayed clearly (not blurry or pixelated), 2) Check that there's enough contrast between the code and background, 3) Ensure it's not too small or too far away, 4) Try printing it larger or displaying it on a screen, 5) Test it with multiple QR code reader apps. If it still doesn't work, download a fresh QR code from your dashboard."
    },
    {
      category: 'qr-codes',
      question: "Can guests scan my QR code without the TipJar app?",
      answer: "Yes! Guests can scan your QR code with any smartphone camera or QR code reader app. No app download is required. When scanned, the QR code will open your TipJar page in their mobile browser, where they can easily send a tip."
    },

    // Embed Widget
    {
      category: 'embed',
      question: "How do I add the TipJar widget to my website or stream?",
      answer: "If you're on the Embed Pro plan, go to Dashboard → Settings → Embed Widget. Copy the embed code and paste it into your website's HTML or your streaming software's browser source. The widget will display your TipJar page directly on your site or stream. Detailed setup instructions are provided in your dashboard."
    },
    {
      category: 'embed',
      question: "Can I customize the embed widget appearance?",
      answer: "Yes! The embed widget can be customized to match your brand. You can adjust colors, size, position, and styling options in Dashboard → Settings → Embed Widget. The widget is responsive and will adapt to different screen sizes. You can also choose between different widget styles (button, full page, popup, etc.)."
    },
    {
      category: 'embed',
      question: "Which streaming software works with the TipJar widget?",
      answer: "The TipJar embed widget works with any streaming software that supports browser sources, including OBS Studio, Streamlabs, XSplit, and others. Simply add a browser source and paste your embed URL. The widget will display your TipJar page with real-time updates as tips come in."
    },
    {
      category: 'embed',
      question: "Do I need Embed Pro to use the widget?",
      answer: "Yes, the embed widget feature is only available on the Embed Pro plan ($29.99/month). The Free and Pro plans include the QR code and link sharing, but not the embed widget. You can upgrade to Embed Pro at any time from your Dashboard → Settings → Subscription."
    },

    // Venue & Performer Features
    {
      category: 'venue',
      question: "How do venue and performer features work?",
      answer: "Venues can create accounts and invite performers to use TipJar at their events. Performers receive invitations and can accept to link their TipJar page to the venue. Venues can manage multiple performers and see aggregated tip statistics. This is ideal for music venues, event spaces, and multi-performer events."
    },
    {
      category: 'venue',
      question: "How do I invite a performer to use TipJar at my venue?",
      answer: "If you're a venue account, go to Dashboard → Venue → Invite Performer. Enter the performer's email address and they'll receive an invitation. Once they accept, they can use TipJar at your venue and you'll be able to see their tip activity (with their permission)."
    },
    {
      category: 'venue',
      question: "Can a performer use TipJar at multiple venues?",
      answer: "Yes! Performers can accept invitations from multiple venues. Their TipJar page works everywhere—at your venue and others. Each venue will see the tips received during events at their location, while the performer sees all tips in their main dashboard."
    },

    // Technical Issues
    {
      category: 'technical',
      question: "My page isn't loading or showing errors. What should I do?",
      answer: "First, try refreshing the page. Clear your browser cache and cookies, then try again. If you're using an old browser, try updating it or using a modern browser (Chrome, Firefox, Safari, Edge). If the issue persists, try accessing your page from a different device or network. If problems continue, contact support with details about the error message and what you were doing when it occurred."
    },
    {
      category: 'technical',
      question: "I'm seeing a 'Payment processing' error. What does this mean?",
      answer: "This usually means there's a temporary issue with the payment processor. Wait a few minutes and try again. If the error persists, it may be due to: 1) Your bank blocking the transaction, 2) Network connectivity issues, 3) Payment processor maintenance. Check your internet connection and try again. If the problem continues, contact support with the error details."
    },
    {
      category: 'technical',
      question: "Can I use TipJar on mobile devices?",
      answer: "Yes! TipJar is fully responsive and works on all mobile devices. You can manage your dashboard, view tips, download QR codes, and access all features from your smartphone or tablet. The guest tipping experience is also optimized for mobile—guests can easily scan QR codes and send tips from their phones."
    },
    {
      category: 'technical',
      question: "What browsers does TipJar support?",
      answer: "TipJar works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. We recommend using the latest version of any browser for the best experience. Older browsers may not support all features. If you're experiencing issues, try updating your browser or using a different one."
    },
    {
      category: 'technical',
      question: "Is my data secure?",
      answer: "Yes! TipJar uses bank-level encryption and security practices. All payments are processed securely through Stripe (PCI DSS Level 1 compliant). We never store full credit card numbers. Your personal information is encrypted and protected. We follow industry best practices for data security and privacy. Read our Privacy Policy for more details."
    },
  ];

  const filteredFAQs = allFAQs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <HelpCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Help & Support
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Find answers to common questions about TipJar
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All Topics
          </button>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${selectedCategory === category.id ? 'text-white' : category.color}`} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        {selectedCategory && (
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredFAQs.length} {filteredFAQs.length === 1 ? 'article' : 'articles'} in{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{selectedCategoryData?.name}</span>
            </p>
          </div>
        )}

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length > 0 ? (
            <FAQ items={filteredFAQs.map(faq => ({ question: faq.question, answer: faq.answer }))} />
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search or browse by category
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="max-w-4xl mx-auto mt-16 mb-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
            <div className="text-center">
              <Mail className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Still need help?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help. Send us a message and we'll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@tipjar.live"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Contact Support
                </a>
                <Link
                  href="/tipjar/dashboard"
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto mb-16">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/tipjar/how-it-works"
              className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
            >
              <HelpCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How It Works</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn how TipJar works and get started
              </p>
            </Link>
            <Link
              href="/tipjar/pricing"
              className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
            >
              <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pricing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See plans and pricing options
              </p>
            </Link>
            <Link
              href="/tipjar/features"
              className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
            >
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore all TipJar features
              </p>
            </Link>
          </div>
        </div>
      </div>
      
      <TipJarFooter />
    </div>
  );
}

