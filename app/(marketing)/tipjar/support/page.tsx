'use client';

import { useState, useEffect, Fragment } from 'react';
import { Search, Mail, HelpCircle, CreditCard, User, Settings, Smartphone, DollarSign, FileText, Users, QrCode, Video, AlertCircle, CheckCircle, Rocket, BookOpen, Wrench, ArrowRight, Code, Music, Palette, BarChart3, Lightbulb, Radio, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FAQ } from '@/components/tipjar/FAQ';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { StepByStepGuide } from '@/components/tipjar/support/StepByStepGuide';
import { TroubleshootingCard } from '@/components/tipjar/support/TroubleshootingCard';
import { QuickActionButton } from '@/components/tipjar/support/QuickActionButton';
import { FeatureGuide } from '@/components/tipjar/support/FeatureGuide';
import { FAQSchema } from '@/components/shared/marketing/StructuredData';

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClientComponentClient();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, [supabase]);

  const categories = [
    { id: 'account', name: 'Account & Login', icon: User, color: 'text-blue-500' },
    { id: 'payments', name: 'Payments & Tips', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'payouts', name: 'Payouts', icon: CreditCard, color: 'text-green-600' },
    { id: 'subscription', name: 'Subscription & Billing', icon: FileText, color: 'text-purple-500' },
    { id: 'setup', name: 'Getting Started', icon: Settings, color: 'text-orange-500' },
    { id: 'qr-codes', name: 'QR Codes', icon: QrCode, color: 'text-indigo-500' },
    { id: 'embed', name: 'Embed Widget', icon: Video, color: 'text-pink-500' },
    { id: 'venue', name: 'Venue & Performer Features', icon: Users, color: 'text-cyan-500' },
    { id: 'stream-alerts', name: 'Stream Alerts', icon: Video, color: 'text-yellow-500' },
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
    {
      category: 'technical',
      question: "Why is my page loading slowly?",
      answer: "Slow loading can be due to: 1) Poor internet connection, 2) Browser cache issues (try clearing cache), 3) Too many browser extensions, 4) Outdated browser. Try: refreshing the page, clearing browser cache, using a different browser, or checking your internet connection. If the issue persists, contact support."
    },
    {
      category: 'technical',
      question: "Can I use TipJar offline?",
      answer: "No, TipJar requires an internet connection to function. You need internet to: receive tips, view your dashboard, generate QR codes, and process payments. Make sure you have a reliable internet connection at your events. Consider having a backup mobile hotspot."
    },

    // Additional Payment FAQs
    {
      category: 'payments',
      question: "What payment methods do you accept?",
      answer: "TipJar accepts all major credit cards (Visa, Mastercard, American Express, Discover) and Cash App Pay. All payments are processed securely through Stripe. Guests don't need to create accounts or download apps—they can pay directly through the secure payment form."
    },
    {
      category: 'payments',
      question: "How are platform fees calculated?",
      answer: "TipJar charges a 3.5% + $0.30 platform fee on each tip. For example: $10 tip = $0.35 (3.5%) + $0.30 = $0.65 fee, you receive $9.35. This fee only applies when you actually receive a tip—no fees if you don't get any tips."
    },
    {
      category: 'payments',
      question: "Can I set custom tip amounts?",
      answer: "Yes! You can set preset tip amounts (like $5, $10, $20, $50) or allow guests to enter custom amounts. Go to Dashboard → Settings → Payment Options to configure your tip amounts. The minimum tip amount is $1.00."
    },
    {
      category: 'payments',
      question: "What happens if a payment is disputed or charged back?",
      answer: "If a customer disputes a payment, Stripe will notify you. You can provide evidence to support the transaction. If the dispute is resolved in your favor, you keep the payment. If not, the payment is reversed. Contact support if you need help with a dispute."
    },
    {
      category: 'payments',
      question: "Can I accept tips in multiple currencies?",
      answer: "Currently, TipJar only supports USD (US Dollars). We're working on adding support for additional currencies in the future. Check our updates page for announcements."
    },

    // Additional Payout FAQs
    {
      category: 'payouts',
      question: "What's the difference between standard and instant payouts?",
      answer: "Standard payouts are free and arrive in 1-2 business days. Instant payouts cost 1.5% of the payout amount (minimum $0.50) and arrive in your bank account within minutes. You can request instant payouts from your Stripe dashboard."
    },
    {
      category: 'payouts',
      question: "Do I need to pay taxes on my tips?",
      answer: "Yes, tips are considered income and are subject to taxes. Stripe will send you a 1099-K form if you receive more than $600 in payments in a calendar year. Consult with a tax professional for advice on reporting tip income."
    },
    {
      category: 'payouts',
      question: "Can I receive payouts to a debit card?",
      answer: "Yes! Stripe supports payouts to debit cards. During Stripe Connect setup, you can choose to receive payouts to a bank account or debit card. Debit card payouts may have different processing times."
    },
    {
      category: 'payouts',
      question: "What if my bank account is closed or changed?",
      answer: "Update your bank account information in your Stripe dashboard immediately. Go to Stripe → Settings → Payment details and update your account. The new account will need to be verified, which may take a few business days. Pending payouts may be delayed."
    },

    // Additional Subscription FAQs
    {
      category: 'subscription',
      question: "What happens to my data if I cancel my subscription?",
      answer: "Your data is preserved when you cancel. You'll continue to have access until the end of your billing period. After cancellation, your account reverts to the Free plan. You can export your data at any time from your dashboard."
    },
    {
      category: 'subscription',
      question: "Can I switch between monthly and annual billing?",
      answer: "Yes! You can switch between monthly and annual billing at any time. Annual billing saves you 17% compared to monthly. Changes take effect at the start of your next billing cycle. Go to Dashboard → Settings → Subscription to change your billing cycle."
    },
    {
      category: 'subscription',
      question: "What features are included in the Free plan?",
      answer: "The Free plan includes: basic tipping functionality, up to 10 requests per month, QR code generation, shareable links, basic analytics, and email support. You can upgrade anytime to unlock unlimited requests, custom branding, advanced analytics, and more."
    },
    {
      category: 'subscription',
      question: "Do you offer discounts for annual plans?",
      answer: "Yes! Annual plans save you 17% compared to monthly billing. Pro annual: $99/year (vs $119.88/monthly), Embed Pro annual: $299/year (vs $359.88/monthly). You can switch to annual billing anytime from your subscription settings."
    },

    // Additional QR Code FAQs
    {
      category: 'qr-codes',
      question: "Can I create multiple QR codes for different events?",
      answer: "Yes! You can generate event-specific QR codes with unique event codes. This allows you to track tips and requests by event. Go to Dashboard → QR Codes → Create Event QR Code. Each event gets its own unique URL and QR code."
    },
    {
      category: 'qr-codes',
      question: "What's the best size to print my QR code?",
      answer: "For best results, print QR codes at least 3\"x3\" (7.5cm x 7.5cm). Larger is better—4\"x4\" or 5\"x5\" works great for events. Ensure high resolution (300 DPI minimum) and high contrast (dark on light background) for easy scanning."
    },
    {
      category: 'qr-codes',
      question: "Can I add my logo to the center of my QR code?",
      answer: "Yes! You can customize your QR code with a logo in the center. Go to Dashboard → Settings → QR Code → Customize. Upload your logo and adjust the size. Keep the logo small (about 30% of QR code size) to maintain scanability."
    },
    {
      category: 'qr-codes',
      question: "Do QR codes expire?",
      answer: "No, QR codes don't expire. Once generated, your QR code will work indefinitely as long as your TipJar account is active. You can regenerate QR codes at any time if needed, but the old ones will continue to work."
    },

    // Additional Embed Widget FAQs
    {
      category: 'embed',
      question: "How do I add the embed widget to OBS Studio?",
      answer: "1) Get your embed URL from Dashboard → Settings → Embed Widget, 2) Open OBS Studio, 3) Add a Browser Source, 4) Paste your embed URL, 5) Set width to 1920 and height to 1080, 6) Enable 'Shutdown source when not visible' and 'Refresh browser when scene becomes active'. The widget will display your TipJar page in OBS."
    },
    {
      category: 'embed',
      question: "Can I customize the embed widget colors?",
      answer: "Yes! You can customize the embed widget to match your brand. Go to Dashboard → Settings → Embed Widget → Customize. You can adjust colors, size, border radius, and more. Changes apply immediately to your embedded widget."
    },
    {
      category: 'embed',
      question: "Does the embed widget work on mobile websites?",
      answer: "Yes! The embed widget is fully responsive and works on all devices including mobile phones and tablets. It automatically adapts to different screen sizes for the best user experience."
    },
    {
      category: 'embed',
      question: "Can I remove TipJar branding from the embed widget?",
      answer: "Yes, Embed Pro subscribers can remove TipJar branding from embed widgets. Go to Dashboard → Settings → Embed Widget → White Label Options. This gives you a completely white-labeled experience."
    },

    // Additional Setup FAQs
    {
      category: 'setup',
      question: "How long does it take to set up TipJar?",
      answer: "You can set up TipJar in just 5 minutes! Sign up, complete your profile, generate your QR code, and you're ready to go. Setting up Stripe Connect for payouts takes an additional 5-10 minutes and can be done later."
    },
    {
      category: 'setup',
      question: "Do I need technical knowledge to use TipJar?",
      answer: "No! TipJar is designed to be simple and user-friendly. No technical knowledge required. Just follow the setup guide, and you'll be collecting tips in minutes. If you need help, our support team is here to assist."
    },
    {
      category: 'setup',
      question: "Can I use TipJar for both live events and streaming?",
      answer: "Absolutely! TipJar works great for both live events (weddings, parties, corporate events) and live streaming (Twitch, YouTube, TikTok). You can use the same TipJar page for both, or create separate pages for different purposes."
    },
    {
      category: 'setup',
      question: "What information do I need to get started?",
      answer: "To get started, you only need: your email address, a business/stage name, and a password. That's it! You can add more details (profile picture, bio, etc.) later. To receive payouts, you'll need bank account information for Stripe Connect setup."
    },

    // Additional Account FAQs
    {
      category: 'account',
      question: "Can I have multiple TipJar accounts?",
      answer: "Yes, you can create multiple TipJar accounts using different email addresses. Each account gets its own unique TipJar page, QR code, and dashboard. This is useful if you want separate pages for different projects or brands."
    },
    {
      category: 'account',
      question: "How do I delete my TipJar account?",
      answer: "To delete your account, contact support at support@tipjar.live with your account email. We'll process your deletion request within 48 hours. Note: Deleting your account is permanent and cannot be undone. Make sure to export any data you want to keep first."
    },
    {
      category: 'account',
      question: "Can I transfer my TipJar page to someone else?",
      answer: "Currently, TipJar pages cannot be transferred between accounts. If you need to transfer ownership, contact support and we can help with the process. You may need to create a new account for the new owner."
    },

    // Additional Venue FAQs
    {
      category: 'venue',
      question: "How much does a venue account cost?",
      answer: "Venue accounts use the same pricing as individual accounts (Free, Pro, Embed Pro). The venue pays for the subscription, and all performers benefit from the features. Contact us for custom pricing for large venues with many performers."
    },
    {
      category: 'venue',
      question: "Can performers see each other's tips?",
      answer: "No, performers can only see their own tips and statistics. Venues can see aggregated statistics across all performers (with permission), but individual tip details remain private to each performer."
    },
    {
      category: 'venue',
      question: "How do I remove a performer from my venue?",
      answer: "Go to Dashboard → Venue → Manage Performers. Find the performer you want to remove and click 'Remove'. The performer will no longer be linked to your venue, but their TipJar page will continue to work independently."
    },

    // Stream Alerts FAQs
    {
      category: 'stream-alerts',
      question: "How do I set up stream alerts for OBS?",
      answer: "1) Go to Dashboard → Stream Alerts, 2) Configure your alert settings (theme, colors, sounds), 3) Copy your Alert URL, 4) In OBS, add a Browser Source, 5) Paste your Alert URL, 6) Set dimensions to 1920x1080, 7) Enable 'Refresh browser when scene becomes active'. Your alerts will now appear in OBS when you receive tips!"
    },
    {
      category: 'stream-alerts',
      question: "What streaming platforms support TipJar alerts?",
      answer: "TipJar stream alerts work with OBS Studio, Streamlabs Desktop, XSplit, TikTok LIVE Studio, YouTube Live, and any streaming software that supports browser sources. Simply add your Alert URL as a browser source."
    },
    {
      category: 'stream-alerts',
      question: "Can I customize my stream alert appearance?",
      answer: "Yes! You can customize everything: theme (5 built-in themes), colors, fonts, background images, sound effects, text-to-speech, animation style, and layout position. Go to Dashboard → Stream Alerts → Customize to access all options."
    },
    {
      category: 'stream-alerts',
      question: "Why aren't my stream alerts showing up?",
      answer: "Check: 1) Browser source is active in your streaming software, 2) Alert URL is correct, 3) 'Refresh browser when scene becomes active' is enabled, 4) You've received a tip (test with the Test Alert button), 5) Browser source dimensions are correct (1920x1080 recommended). If still not working, check browser console for errors."
    },
    {
      category: 'stream-alerts',
      question: "Can I use stream alerts with multiple streaming platforms?",
      answer: "Yes! Your Alert URL works with any streaming software that supports browser sources. You can use the same Alert URL in OBS, Streamlabs, TikTok LIVE, and YouTube Live simultaneously. The alerts will appear in whichever software is currently streaming."
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

  // Generate FAQ structured data for SEO
  const faqStructuredData = allFAQs.map(faq => ({
    question: faq.question,
    answer: faq.answer,
  }));

  // Generate HowTo structured data for Getting Started guide
  const gettingStartedHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Get Started with TipJar in 5 Minutes',
    description: 'Complete step-by-step guide to setting up your TipJar account and starting to collect tips',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Sign Up for Free',
        text: 'Create your TipJar account with just your email and business name. Go to tipjar.live/signup, enter your email and business name, create a secure password, and confirm your email address.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Complete Your Profile',
        text: 'Add your information to personalize your TipJar page. Add your name or stage name, upload a profile picture or logo, write a brief bio (optional), and set your page URL/slug.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Get Your QR Code & Link',
        text: 'Generate your unique TipJar link and QR code to share with your audience. Go to Dashboard → QR Code, download your QR code (PNG or SVG), copy your shareable link, and test the link on your phone.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Set Up Payments (Optional but Recommended)',
        text: 'Connect your Stripe account to receive payouts automatically. Go to Dashboard → Settings → Payments, click "Set Up Payment Processing", complete Stripe Connect onboarding, and add your bank account details.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Share & Start Collecting Tips',
        text: 'Share your TipJar link and QR code with your audience. Display QR code at events or on stream, share link in social media bio, add to email signature, and print on business cards or flyers.',
      },
    ],
  };

  return (
    <Fragment>
      {/* Structured Data for SEO */}
      <FAQSchema questions={faqStructuredData} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gettingStartedHowTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'TipJar Help & Support Center',
            description: 'Get help with TipJar. Find answers to common questions, step-by-step guides, troubleshooting tips, and best practices for maximizing your tips.',
            url: 'https://www.tipjar.live/tipjar/support',
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Getting Started',
                  url: 'https://www.tipjar.live/tipjar/support#getting-started',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Feature Guides',
                  url: 'https://www.tipjar.live/tipjar/support#feature-guides',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: 'Troubleshooting',
                  url: 'https://www.tipjar.live/tipjar/support#troubleshooting',
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: 'Best Practices',
                  url: 'https://www.tipjar.live/tipjar/support#best-practices',
                },
              ],
            },
          }),
        }}
      />

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
            <div className="relative max-w-2xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
              <QuickActionButton
                icon={Rocket}
                title="Getting Started"
                description="New to TipJar? Start here with our 5-minute setup guide"
                href="#getting-started"
                variant="primary"
              />
              <QuickActionButton
                icon={DollarSign}
                title="Payment Issues?"
                description="Troubleshoot payment and payout problems"
                href="#troubleshooting"
                variant="secondary"
              />
              <QuickActionButton
                icon={Mail}
                title="Contact Support"
                description="Can't find what you need? We're here to help"
                href="#contact"
                variant="outline"
              />
              <QuickActionButton
                icon={BookOpen}
                title="Feature Guides"
                description="Detailed guides for all TipJar features"
                href="#feature-guides"
                variant="secondary"
              />
              <QuickActionButton
                icon={Lightbulb}
                title="Best Practices"
                description="Tips to maximize your tips and success"
                href="#best-practices"
                variant="outline"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <article id="getting-started" className="container mx-auto px-4 py-12 scroll-mt-20">
        <div className="max-w-4xl mx-auto mb-12">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <Rocket className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Getting Started with TipJar
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get up and running in 5 minutes. Follow these simple steps to start collecting tips.
            </p>
          </header>

          <StepByStepGuide
            title="5-Minute Quick Start Guide"
            description="Get your TipJar page live and start accepting tips in just 5 minutes"
            isLoggedIn={isLoggedIn}
            steps={[
              {
                number: 1,
                title: "Sign Up for Free",
                description: "Create your TipJar account with just your email and business name.",
                details: [
                  "Go to tipjar.live/signup",
                  "Enter your email and business name",
                  "Create a secure password",
                  "Confirm your email address"
                ],
                tips: [
                  "Use an email you check regularly",
                  "Choose a memorable business name"
                ]
              },
              {
                number: 2,
                title: "Complete Your Profile",
                description: "Add your information to personalize your TipJar page.",
                details: [
                  "Add your name or stage name",
                  "Upload a profile picture or logo",
                  "Write a brief bio (optional)",
                  "Set your page URL/slug"
                ],
                tips: [
                  "A good profile picture increases trust",
                  "Keep your bio short and authentic"
                ]
              },
              {
                number: 3,
                title: "Get Your QR Code & Link",
                description: "Generate your unique TipJar link and QR code to share with your audience.",
                details: [
                  "Go to Dashboard → QR Code",
                  "Download your QR code (PNG or SVG)",
                  "Copy your shareable link",
                  "Test the link on your phone"
                ],
                tips: [
                  "Print QR codes at least 3\"x3\" for easy scanning",
                  "Test your QR code before the event"
                ]
              },
              {
                number: 4,
                title: "Set Up Payments (Optional but Recommended)",
                description: "Connect your Stripe account to receive payouts automatically.",
                details: [
                  "Go to Dashboard → Settings → Payments",
                  "Click 'Set Up Payment Processing'",
                  "Complete Stripe Connect onboarding",
                  "Add your bank account details"
                ],
                tips: [
                  "You can skip this step and set it up later",
                  "First payout may take 2-7 business days"
                ],
                warning: "Without Stripe Connect, you won't receive automatic payouts"
              },
              {
                number: 5,
                title: "Share & Start Collecting Tips",
                description: "Share your TipJar link and QR code with your audience.",
                details: [
                  "Display QR code at events or on stream",
                  "Share link in social media bio",
                  "Add to email signature",
                  "Print on business cards or flyers"
                ],
                tips: [
                  "Announce your TipJar during events",
                  "Make it easy for guests to find"
                ]
              }
            ]}
          />
        </div>
      </article>

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
            <FAQ 
              items={filteredFAQs.map(faq => ({ question: faq.question, answer: faq.answer }))} 
              isLoggedIn={isLoggedIn}
            />
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
      </div>

        {/* Feature Guides Section */}
        <section id="feature-guides" className="max-w-4xl mx-auto mt-16 mb-16 scroll-mt-20">
          <header className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Feature Guides
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Detailed guides for all TipJar features. Click to expand and learn more.
            </p>
          </header>

          <div className="space-y-4">
            {/* Payment Processing Guide */}
            <FeatureGuide
              id="payment-guide"
              icon={DollarSign}
              title="Payment Processing & Stripe Connect Setup"
              description="Complete guide to setting up payments and receiving payouts"
              overview="Stripe Connect allows you to receive tips directly to your bank account. This guide walks you through the complete setup process, from creating your account to receiving your first payout."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Access Payment Setup",
                  description: "Navigate to your dashboard and start the payment setup process.",
                  details: [
                    "Go to Dashboard → Settings → Payments",
                    "Click 'Set Up Payment Processing' or 'Connect Stripe Account'",
                    "You'll be redirected to Stripe's secure onboarding page"
                  ],
                  tips: [
                    "Have your bank account information ready",
                    "The process takes 5-10 minutes"
                  ]
                },
                {
                  number: 2,
                  title: "Choose Business Type",
                  description: "Select whether you're an individual or a business.",
                  details: [
                    "Individual: For solo DJs, performers, or freelancers",
                    "Business: For companies, LLCs, or organizations",
                    "This affects tax reporting (1099-K forms)"
                  ],
                  tips: [
                    "Choose Individual if you're not sure",
                    "You can update this later if needed"
                  ]
                },
                {
                  number: 3,
                  title: "Enter Business Information",
                  description: "Provide your business or personal details.",
                  details: [
                    "Business name (or your name for individuals)",
                    "Business address",
                    "Phone number",
                    "Email address (usually pre-filled)"
                  ],
                  tips: [
                    "Use the address where you receive mail",
                    "This information is used for tax reporting"
                  ]
                },
                {
                  number: 4,
                  title: "Add Bank Account",
                  description: "Connect your bank account to receive payouts.",
                  details: [
                    "Enter your bank routing number",
                    "Enter your account number",
                    "Select account type (checking or savings)",
                    "Verify account ownership"
                  ],
                  tips: [
                    "You can find routing and account numbers on a check or bank statement",
                    "Double-check numbers for accuracy"
                  ],
                  warning: "Incorrect account numbers will delay payouts"
                },
                {
                  number: 5,
                  title: "Complete Identity Verification",
                  description: "Verify your identity for security and compliance.",
                  details: [
                    "Provide Social Security Number (last 4 digits for individuals)",
                    "Upload government-issued ID (driver's license or passport)",
                    "Take a selfie if requested (for additional verification)"
                  ],
                  tips: [
                    "Have your ID ready before starting",
                    "Ensure good lighting for selfie verification"
                  ]
                },
                {
                  number: 6,
                  title: "Wait for Verification",
                  description: "Stripe reviews your information (usually instant, up to 2 business days).",
                  details: [
                    "Most accounts are verified instantly",
                    "First-time accounts may take 1-2 business days",
                    "You'll receive email notifications about status"
                  ],
                  tips: [
                    "Check your email for verification updates",
                    "You can still use TipJar while verification is pending"
                  ]
                },
                {
                  number: 7,
                  title: "Verify Account Status",
                  description: "Confirm that charges and payouts are enabled.",
                  details: [
                    "Go to Dashboard → Settings → Payments",
                    "Check that 'Charges Enabled' shows ✓",
                    "Check that 'Payouts Enabled' shows ✓",
                    "Your account is ready when both are enabled"
                  ],
                  tips: [
                    "If not enabled, check for pending requirements in Stripe",
                    "Contact support if verification is taking longer than expected"
                  ]
                },
                {
                  number: 8,
                  title: "Receive Your First Payout",
                  description: "Your first payout may take 2-7 business days due to bank verification.",
                  details: [
                    "After first payout, subsequent payouts arrive in 1-2 business days",
                    "Payouts are automatic and happen daily",
                    "You can request instant payouts for a 1.5% fee"
                  ],
                  tips: [
                    "Plan ahead for your first payout",
                    "Use instant payout if you need money immediately"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Account Not Verified",
                  symptoms: [
                    "Charges or payouts disabled",
                    "Error: 'Account not ready'",
                    "Pending requirements in Stripe"
                  ],
                  causes: [
                    "Incomplete onboarding information",
                    "Identity verification pending",
                    "Bank account not verified",
                    "Additional information requested"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Complete all required information in Stripe",
                      details: "Check Stripe dashboard for pending requirements"
                    },
                    {
                      step: 2,
                      action: "Verify bank account",
                      details: "Complete bank account verification if pending"
                    },
                    {
                      step: 3,
                      action: "Wait for verification (1-2 business days)",
                      details: "First-time verification may take time"
                    },
                    {
                      step: 4,
                      action: "Contact Stripe support if stuck",
                      details: "They can help with verification issues"
                    }
                  ],
                  severity: "high"
                }
              ]}
              faqs={[
                {
                  question: "How long does Stripe Connect setup take?",
                  answer: "The setup process takes 5-10 minutes. Verification is usually instant but may take 1-2 business days for first-time accounts."
                },
                {
                  question: "Do I need a separate Stripe account?",
                  answer: "No! TipJar handles the Stripe integration for you. You just need to complete the onboarding process to verify your identity and connect your bank account."
                },
                {
                  question: "What information do I need for setup?",
                  answer: "You'll need: your name/business name, address, phone number, bank account details (routing and account numbers), and a government-issued ID for verification."
                },
                {
                  question: "Is my information secure?",
                  answer: "Yes! All information is encrypted and processed securely through Stripe, which is PCI DSS Level 1 compliant. We never store your full bank account numbers or SSN."
                }
              ]}
            />

            {/* QR Codes Guide */}
            <FeatureGuide
              id="qr-codes-guide"
              icon={QrCode}
              title="QR Codes & Shareable Links"
              description="Create, customize, and share QR codes for your events"
              overview="QR codes make it easy for guests to access your TipJar page. Generate unique QR codes for each event, customize them to match your brand, and share them anywhere."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Generate Your QR Code",
                  description: "Create your first QR code from your dashboard.",
                  details: [
                    "Go to Dashboard → QR Codes",
                    "Click 'Generate QR Code'",
                    "Choose between main QR code or event-specific QR code",
                    "Download as PNG or SVG"
                  ],
                  tips: [
                    "PNG is best for digital use",
                    "SVG is best for printing (scalable)"
                  ]
                },
                {
                  number: 2,
                  title: "Create Event-Specific QR Codes",
                  description: "Generate unique QR codes for individual events to track performance.",
                  details: [
                    "Click 'Create Event QR Code'",
                    "Enter event code (e.g., 'wedding-2025-01-15')",
                    "Add event name and date (optional)",
                    "Generate and download"
                  ],
                  tips: [
                    "Use descriptive event codes",
                    "Event codes help you track which events perform best"
                  ]
                },
                {
                  number: 3,
                  title: "Customize Your QR Code",
                  description: "Make your QR code match your brand.",
                  details: [
                    "Go to Dashboard → Settings → QR Code",
                    "Choose colors (foreground and background)",
                    "Add logo to center (optional)",
                    "Adjust logo size (keep it small for scanability)"
                  ],
                  tips: [
                    "Use high contrast colors (dark on light)",
                    "Keep logo small (about 30% of QR code size)",
                    "Test your customized QR code before printing"
                  ],
                  warning: "Too much customization can make QR codes harder to scan"
                },
                {
                  number: 4,
                  title: "Download & Print",
                  description: "Get your QR code ready for use.",
                  details: [
                    "Download high-resolution version for printing",
                    "Print at least 3\"x3\" (7.5cm x 7.5cm)",
                    "Use 300 DPI minimum for best quality",
                    "Test print before printing large quantities"
                  ],
                  tips: [
                    "Larger is better - 4\"x4\" or 5\"x5\" works great",
                    "Print on high-contrast backgrounds",
                    "Have backup printed copies at events"
                  ]
                },
                {
                  number: 5,
                  title: "Share Your Link",
                  description: "Share your TipJar link in multiple ways.",
                  details: [
                    "Copy your shareable link from dashboard",
                    "Share in social media bio",
                    "Add to email signature",
                    "Include in event descriptions",
                    "Text or email to guests"
                  ],
                  tips: [
                    "Make it easy to find",
                    "Announce your TipJar during events",
                    "Display QR code prominently"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "QR Code Not Scanning",
                  symptoms: [
                    "Phone camera can't read QR code",
                    "Works on some phones but not others",
                    "QR code appears but doesn't work"
                  ],
                  causes: [
                    "QR code too small",
                    "Poor contrast",
                    "Blurry or pixelated",
                    "Insufficient lighting"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Download larger size QR code",
                      details: "Print at least 3\"x3\" for best results"
                    },
                    {
                      step: 2,
                      action: "Ensure high contrast",
                      details: "Use dark QR code on light background"
                    },
                    {
                      step: 3,
                      action: "Print at higher resolution",
                      details: "Use 300 DPI minimum"
                    },
                    {
                      step: 4,
                      action: "Test before using",
                      details: "Scan with multiple devices"
                    }
                  ],
                  severity: "medium"
                }
              ]}
              faqs={[
                {
                  question: "Can I create multiple QR codes?",
                  answer: "Yes! You can create unlimited QR codes. Create event-specific QR codes to track performance by event, or use your main QR code everywhere."
                },
                {
                  question: "Do QR codes expire?",
                  answer: "No, QR codes don't expire. Once generated, they work indefinitely as long as your TipJar account is active."
                },
                {
                  question: "Can guests scan without the TipJar app?",
                  answer: "Yes! Guests can scan with any smartphone camera or QR code reader app. No app download required."
                }
              ]}
            />

            {/* Stream Alerts Guide */}
            <FeatureGuide
              id="stream-alerts-guide"
              icon={Video}
              title="Stream Alerts Setup"
              description="Set up beautiful alerts for OBS, Streamlabs, TikTok LIVE, and YouTube Live"
              overview="Stream alerts display animated notifications when you receive tips, song requests, or other interactions. Works with all major streaming software that supports browser sources."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Configure Alert Settings",
                  description: "Set up your alerts in the TipJar dashboard.",
                  details: [
                    "Go to Dashboard → Stream Alerts",
                    "Choose a theme (Dark, Neon, Retro, Minimal, Pride)",
                    "Set layout position (center, left, right, top, bottom)",
                    "Customize colors and fonts",
                    "Upload background image (optional)",
                    "Configure sound effects",
                    "Set up text-to-speech (optional)"
                  ],
                  tips: [
                    "Test different themes to find your style",
                    "Position alerts where they won't block important content"
                  ]
                },
                {
                  number: 2,
                  title: "Copy Your Alert URL",
                  description: "Get your unique alert URL for streaming software.",
                  details: [
                    "In Stream Alerts dashboard, find your Alert URL",
                    "Format: https://tipjar.live/tipjar/alerts/@yourusername",
                    "Click 'Copy URL' button",
                    "Keep this URL handy for next steps"
                  ],
                  tips: [
                    "Bookmark the alert settings page",
                    "You can regenerate the URL anytime"
                  ]
                },
                {
                  number: 3,
                  title: "Add to OBS Studio",
                  description: "Set up alerts in OBS Studio.",
                  details: [
                    "Open OBS Studio",
                    "Right-click in Sources → Add → Browser Source",
                    "Name it 'TipJar Alerts'",
                    "Paste your Alert URL",
                    "Set Width: 1920, Height: 1080",
                    "Enable 'Shutdown source when not visible'",
                    "Enable 'Refresh browser when scene becomes active'",
                    "Click OK"
                  ],
                  tips: [
                    "Use 1920x1080 for best quality",
                    "Position the source where you want alerts to appear"
                  ]
                },
                {
                  number: 4,
                  title: "Add to Streamlabs",
                  description: "Set up alerts in Streamlabs Desktop.",
                  details: [
                    "Open Streamlabs Desktop",
                    "Go to Sources → Add Source → Browser Source",
                    "Name it 'TipJar Alerts'",
                    "Paste your Alert URL",
                    "Set dimensions to 1920x1080",
                    "Enable auto-refresh options",
                    "Click Done"
                  ],
                  tips: [
                    "Streamlabs setup is similar to OBS",
                    "Test alerts before going live"
                  ]
                },
                {
                  number: 5,
                  title: "Test Your Alerts",
                  description: "Verify alerts are working correctly.",
                  details: [
                    "In TipJar dashboard, click 'Test Alert' button",
                    "You should see a test alert in your streaming software",
                    "Check that sound plays (if enabled)",
                    "Verify alert position and appearance"
                  ],
                  tips: [
                    "Test before every stream",
                    "Adjust settings if alerts don't look right"
                  ]
                },
                {
                  number: 6,
                  title: "Customize Alert Appearance",
                  description: "Fine-tune your alerts to match your brand.",
                  details: [
                    "Adjust colors to match your stream theme",
                    "Upload custom background image",
                    "Configure animation style",
                    "Set up donor ticker (optional)",
                    "Configure goal progress bar (optional)"
                  ],
                  tips: [
                    "Keep alerts visible but not distracting",
                    "Use colors that contrast with your stream"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Alerts Not Showing",
                  symptoms: [
                    "No alerts appear when receiving tips",
                    "Browser source shows blank screen",
                    "Alerts work in dashboard but not in OBS"
                  ],
                  causes: [
                    "Browser source not active",
                    "Incorrect Alert URL",
                    "Browser source not refreshing",
                    "Network connectivity issues"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Verify browser source is active",
                      details: "Make sure the scene with browser source is active"
                    },
                    {
                      step: 2,
                      action: "Check Alert URL is correct",
                      details: "Copy URL again from dashboard and verify"
                    },
                    {
                      step: 3,
                      action: "Enable 'Refresh browser when scene becomes active'",
                      details: "This ensures alerts load when scene becomes active"
                    },
                    {
                      step: 4,
                      action: "Test alert from dashboard",
                      details: "Use Test Alert button to verify alerts are working"
                    },
                    {
                      step: 5,
                      action: "Check browser console for errors",
                      details: "Right-click browser source → Inspect → Check console"
                    }
                  ],
                  severity: "high"
                }
              ]}
              faqs={[
                {
                  question: "Which streaming platforms are supported?",
                  answer: "TipJar alerts work with OBS Studio, Streamlabs Desktop, XSplit, TikTok LIVE Studio, YouTube Live, and any software that supports browser sources."
                },
                {
                  question: "Can I customize alert sounds?",
                  answer: "Yes! You can enable/disable sounds, adjust volume, and choose from different sound effects in your alert settings."
                },
                {
                  question: "Do alerts work on mobile streams?",
                  answer: "Alerts work with any streaming software that supports browser sources, including mobile streaming apps that support browser sources."
                }
              ]}
            />

            {/* Embed Widget Guide */}
            <FeatureGuide
              id="embed-widget-guide"
              icon={Code}
              title="Embed Widget Setup"
              description="Add TipJar to your website or streaming software (Embed Pro only)"
              overview="The embed widget lets you display your TipJar page directly on your website or in your streaming software. Perfect for seamless integration without redirecting guests to a separate page."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Verify Embed Pro Subscription",
                  description: "The embed widget is only available on the Embed Pro plan.",
                  details: [
                    "Go to Dashboard → Settings → Subscription",
                    "Verify you're on Embed Pro plan ($29.99/month)",
                    "Upgrade if needed (upgrade link provided)"
                  ],
                  tips: [
                    "Embed Pro includes many other features too",
                    "You can upgrade anytime"
                  ],
                  warning: "Embed widget requires Embed Pro subscription"
                },
                {
                  number: 2,
                  title: "Generate Embed Code",
                  description: "Get your embed code from the dashboard.",
                  details: [
                    "Go to Dashboard → Settings → Embed Widget",
                    "Click 'Generate Embed Code'",
                    "Copy the iframe code provided",
                    "Customize options (theme, colors, size) if desired"
                  ],
                  tips: [
                    "Test the embed code in a test page first",
                    "Customize to match your website design"
                  ]
                },
                {
                  number: 3,
                  title: "Add to WordPress",
                  description: "Embed TipJar in your WordPress site.",
                  details: [
                    "Edit the page/post where you want the widget",
                    "Add a 'Custom HTML' block",
                    "Paste your embed code",
                    "Publish the page"
                  ],
                  tips: [
                    "Use a full-width block for best results",
                    "Test on mobile devices"
                  ]
                },
                {
                  number: 4,
                  title: "Add to Wix",
                  description: "Embed TipJar in your Wix website.",
                  details: [
                    "Edit your Wix page",
                    "Add an 'HTML iframe' element",
                    "Paste your embed URL (not the full code)",
                    "Adjust size and position",
                    "Publish"
                  ],
                  tips: [
                    "Wix may require the URL format instead of full code",
                    "Adjust iframe dimensions in Wix settings"
                  ]
                },
                {
                  number: 5,
                  title: "Add to Squarespace",
                  description: "Embed TipJar in your Squarespace site.",
                  details: [
                    "Edit your page",
                    "Add a 'Code' block",
                    "Paste your embed code",
                    "Save and publish"
                  ],
                  tips: [
                    "Squarespace supports full HTML/iframe code",
                    "Preview before publishing"
                  ]
                },
                {
                  number: 6,
                  title: "Add to OBS/Streamlabs",
                  description: "Display TipJar in your stream overlay.",
                  details: [
                    "Open OBS Studio or Streamlabs",
                    "Add a Browser Source",
                    "Paste your embed URL",
                    "Set dimensions (recommended: 800x600 or full screen)",
                    "Position where you want it visible"
                  ],
                  tips: [
                    "Use browser source for live updates",
                    "Position widget where it won't block important content"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Embed Widget Not Showing",
                  symptoms: [
                    "Blank space where widget should be",
                    "Error message in iframe",
                    "Widget loads but doesn't display correctly"
                  ],
                  causes: [
                    "Not on Embed Pro plan",
                    "Incorrect embed code",
                    "Website blocking iframes",
                    "CORS or security restrictions"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Verify Embed Pro subscription",
                      details: "Check Dashboard → Settings → Subscription"
                    },
                    {
                      step: 2,
                      action: "Regenerate embed code",
                      details: "Get fresh code from dashboard"
                    },
                    {
                      step: 3,
                      action: "Check website iframe permissions",
                      details: "Some sites restrict iframe embedding"
                    },
                    {
                      step: 4,
                      action: "Test in different browser",
                      details: "Check for browser-specific issues"
                    }
                  ],
                  severity: "medium"
                }
              ]}
              faqs={[
                {
                  question: "Can I customize the embed widget appearance?",
                  answer: "Yes! You can customize colors, size, border radius, and theme. Go to Dashboard → Settings → Embed Widget → Customize to access all options."
                },
                {
                  question: "Does the embed widget work on mobile?",
                  answer: "Yes! The embed widget is fully responsive and works on all devices including mobile phones and tablets."
                },
                {
                  question: "Can I remove TipJar branding from the embed?",
                  answer: "Yes, Embed Pro subscribers can remove branding for a completely white-labeled experience. Go to Embed Widget settings → White Label Options."
                }
              ]}
            />

            {/* Song Requests Guide */}
            <FeatureGuide
              id="song-requests-guide"
              icon={Music}
              title="Song Requests & Queue Management"
              description="How song requests work and how to manage your request queue"
              overview="Guests can request songs through your TipJar page. Learn how the request system works, how to prioritize requests, and how to manage your queue effectively. Tip: Connect Serato DJ Pro for automatic song detection and notifications—see the 'Serato DJ Pro Integration' guide below for setup instructions."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Understanding Request Types",
                  description: "TipJar supports multiple request types.",
                  details: [
                    "Song Requests: Guests request specific songs",
                    "Shoutouts: Guests send personalized messages",
                    "Tips: Direct tips without requests",
                    "All can include payment amounts"
                  ],
                  tips: [
                    "You can enable/disable request types in settings",
                    "Set minimum amounts for each type"
                  ]
                },
                {
                  number: 2,
                  title: "Fast-Track Option",
                  description: "Guests can pay extra to prioritize their requests.",
                  details: [
                    "Fast-Track adds $10 to base payment",
                    "Moves request to front of queue",
                    "Song plays next after current song",
                    "Available for song requests only"
                  ],
                  tips: [
                    "Communicate Fast-Track clearly to guests",
                    "Always honor Fast-Track requests promptly"
                  ]
                },
                {
                  number: 3,
                  title: "Next Song Option",
                  description: "Premium priority option for immediate play.",
                  details: [
                    "Higher fee than Fast-Track (configurable)",
                    "Highest priority in queue",
                    "Plays immediately after current song",
                    "Great for special occasions"
                  ],
                  tips: [
                    "Set appropriate pricing for Next Song",
                    "Use sparingly to maintain value"
                  ]
                },
                {
                  number: 4,
                  title: "Managing Your Queue",
                  description: "View and manage requests in your dashboard.",
                  details: [
                    "Go to Dashboard → Requests",
                    "View all requests sorted by priority",
                    "Update request status (new → acknowledged → playing → played)",
                    "Filter by status, type, or event",
                    "Search for specific requests"
                  ],
                  tips: [
                    "Update status as you play songs",
                    "Use filters to find specific requests quickly"
                  ]
                },
                {
                  number: 5,
                  title: "Request Status Workflow",
                  description: "Recommended workflow for managing requests.",
                  details: [
                    "New: Request just submitted",
                    "Acknowledged: You've seen it and will play it",
                    "Playing: Currently playing the song",
                    "Played: Song has been played",
                    "Cancelled: Request cancelled (refund if paid)"
                  ],
                  tips: [
                    "Keep status updated for accurate tracking",
                    "Use 'Acknowledged' to let guests know you saw their request"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Requests Not Appearing in Dashboard",
                  symptoms: [
                    "Guest submitted request but it's not showing",
                    "Payment went through but no request",
                    "Request missing from queue"
                  ],
                  causes: [
                    "Payment processing delay",
                    "Webhook delay",
                    "Account sync issue",
                    "Filter hiding the request"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Wait 1-2 minutes for processing",
                      details: "Requests may take a moment to appear"
                    },
                    {
                      step: 2,
                      action: "Refresh dashboard",
                      details: "Click refresh or reload page"
                    },
                    {
                      step: 3,
                      action: "Check filters",
                      details: "Make sure no filters are hiding requests"
                    },
                    {
                      step: 4,
                      action: "Check payment status",
                      details: "Verify payment was successful in Stripe"
                    },
                    {
                      step: 5,
                      action: "Contact support if still missing",
                      details: "Provide request ID or payment ID"
                    }
                  ],
                  severity: "high"
                }
              ]}
              faqs={[
                {
                  question: "Can guests request songs without paying?",
                  answer: "You can set minimum payment amounts for requests. Set it to $0 if you want to allow free requests, or require a minimum tip amount."
                },
                {
                  question: "How do I prevent duplicate song requests?",
                  answer: "TipJar has duplicate detection built-in. You can also set up your music library with boundaries to control which songs can be requested."
                },
                {
                  question: "Can I blacklist certain songs?",
                  answer: "Yes! Go to Dashboard → Music Library to add songs to your blacklist. Blacklisted songs will be immediately denied if requested."
                },
                {
                  question: "Can I automate request tracking with Serato?",
                  answer: "Yes! TipJar can automatically detect when you play requested songs in Serato DJ Pro and notify requesters. Check out the 'Serato DJ Pro Integration' guide below for complete setup instructions. No separate app needed—works entirely through your browser."
                }
              ]}
            />

            {/* Serato Integration Guide */}
            <FeatureGuide
              id="serato-integration-guide"
              icon={Radio}
              title="Serato DJ Pro Integration - Automatic Song Detection"
              description="Automatically detect when requested songs play in Serato and notify requesters"
              overview="Connect your Serato DJ Pro to TipJar to automatically detect when you play requested songs. The system matches played tracks to active song requests and sends automatic notifications to requesters. No separate app needed—works entirely through your browser using Serato's Live Playlist feature."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Enable Live Playlists in Serato DJ Pro",
                  description: "First, you need to enable Live Playlists in your Serato settings.",
                  details: [
                    "Open Serato DJ Pro",
                    "Go to Settings → Expansion Packs",
                    "Enable 'Serato Playlists' expansion pack",
                    "Navigate to Settings → Serato Playlists",
                    "Check 'Enable Live Playlists' option",
                    "Save settings"
                  ],
                  tips: [
                    "Live Playlists requires a Serato account (free to create)",
                    "The expansion pack is included with Serato DJ Pro",
                    "You may need to restart Serato after enabling"
                  ],
                  warning: "Without Live Playlists enabled, the integration won't work"
                },
                {
                  number: 2,
                  title: "Start a Live Playlist Session",
                  description: "Begin a Live Playlist session in Serato to start tracking your plays.",
                  details: [
                    "In Serato DJ Pro, go to the History panel",
                    "Click on 'Live Playlist' tab or button",
                    "Click 'Start Live Playlist'",
                    "Your session will begin automatically",
                    "Tracks you play will be added to the playlist"
                  ],
                  tips: [
                    "Start the Live Playlist before your event begins",
                    "The playlist updates in real-time as you play songs",
                    "You can view it on serato.com while you DJ"
                  ]
                },
                {
                  number: 3,
                  title: "Make Your Live Playlist Public",
                  description: "Your Live Playlist must be public for TipJar to access it.",
                  details: [
                    "Go to serato.com and sign in with your Serato account",
                    "Navigate to your profile or playlists section",
                    "Find your active Live Playlist",
                    "Click 'Edit Details' or settings",
                    "Change visibility from 'Private' to 'Public'",
                    "Save changes"
                  ],
                  tips: [
                    "Public playlists can be viewed by anyone on serato.com",
                    "Only the playlist is public—your account remains private",
                    "The playlist URL will look like: serato.com/playlists/YOUR_USERNAME/live"
                  ],
                  warning: "If your playlist isn't public, TipJar won't be able to detect your tracks"
                },
                {
                  number: 4,
                  title: "Find Your Serato Username",
                  description: "Get your Serato username to connect it to TipJar.",
                  details: [
                    "Check your serato.com profile page",
                    "Your username appears in the URL: serato.com/USERNAME",
                    "It's also displayed on your profile",
                    "Copy your exact username (case-sensitive)"
                  ],
                  tips: [
                    "Usernames are usually your display name (e.g., 'DJ_Ben_Murray')",
                    "Make sure there are no extra spaces or characters",
                    "Test by visiting: serato.com/playlists/YOUR_USERNAME/live"
                  ]
                },
                {
                  number: 5,
                  title: "Connect Serato in TipJar Dashboard",
                  description: "Set up the connection in your TipJar dashboard.",
                  details: [
                    "Go to your TipJar Dashboard",
                    "Navigate to Settings → DJ Software or Dashboard → Requests",
                    "Look for 'Serato Integration' or 'DJ Software Setup' section",
                    "Select 'Serato DJ Pro' as your software",
                    "Enter your Serato username in the provided field",
                    "Click 'Start Watching' or 'Enable Detection'"
                  ],
                  tips: [
                    "The connection works entirely in your browser—no downloads needed",
                    "Your dashboard will check for new tracks every 5 seconds",
                    "Keep the dashboard page open or in a browser tab during your event"
                  ]
                },
                {
                  number: 6,
                  title: "Verify Connection Status",
                  description: "Confirm that TipJar is successfully detecting your tracks.",
                  details: [
                    "After clicking 'Start Watching', you should see a status indicator",
                    "Green status = Connected and detecting",
                    "Test by playing a song in Serato",
                    "Within 5-10 seconds, you should see it appear in your TipJar dashboard",
                    "Check the 'Now Playing' section for current track"
                  ],
                  tips: [
                    "Status updates every 5 seconds",
                    "You can manually test detection using the test track feature",
                    "If status shows as disconnected, check your Serato settings"
                  ]
                },
                {
                  number: 7,
                  title: "Automatic Request Matching",
                  description: "How TipJar automatically matches played songs to requests.",
                  details: [
                    "When you play a song, TipJar detects it within 5-10 seconds",
                    "The system uses fuzzy matching (85% similarity) to match tracks",
                    "Matched requests are automatically updated to 'Playing' status",
                    "Requesters receive automatic SMS/Email notifications",
                    "The request is marked as 'Played' after completion"
                  ],
                  tips: [
                    "Matching works even with slight variations in artist/song names",
                    "Only active requests ('new', 'acknowledged', 'paid') are matched",
                    "Each request is only notified once—no duplicate notifications"
                  ]
                },
                {
                  number: 8,
                  title: "Monitor Your Integration",
                  description: "Keep an eye on your connection and track detection.",
                  details: [
                    "Watch the connection status indicator during your event",
                    "View 'Recent Tracks' to see what's been detected",
                    "Check request queue to see which requests have been matched",
                    "Review notification history in your dashboard"
                  ],
                  tips: [
                    "If detection stops working, check that Live Playlist is still active",
                    "Ensure your Serato username hasn't changed",
                    "Refresh your dashboard page if connection seems stuck"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Tracks Not Being Detected",
                  symptoms: [
                    "Songs play in Serato but don't appear in TipJar",
                    "Status shows 'Watching' but no tracks detected",
                    "Connection status shows as disconnected"
                  ],
                  causes: [
                    "Live Playlist not enabled in Serato",
                    "Live Playlist not set to Public",
                    "Incorrect Serato username",
                    "Live Playlist session not started",
                    "Browser tab closed or dashboard page not open"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Verify Live Playlist is enabled",
                      details: "Check Serato Settings → Expansion Packs → Serato Playlists → Enable Live Playlists"
                    },
                    {
                      step: 2,
                      action: "Confirm Live Playlist is Public",
                      details: "Visit serato.com/playlists/YOUR_USERNAME/live - it should be publicly accessible"
                    },
                    {
                      step: 3,
                      action: "Double-check your Serato username",
                      details: "Make sure username matches exactly (case-sensitive) and has no extra spaces"
                    },
                    {
                      step: 4,
                      action: "Ensure Live Playlist session is active",
                      details: "In Serato, check History panel - Live Playlist should show as 'Active'"
                    },
                    {
                      step: 5,
                      action: "Keep dashboard page open",
                      details: "The browser-based detection requires the dashboard page to be open in a tab"
                    },
                    {
                      step: 6,
                      action: "Test connection manually",
                      details: "Use the 'Test Track Detection' feature in dashboard to verify API is working"
                    }
                  ],
                  severity: "high"
                },
                {
                  issue: "Songs Not Matching to Requests",
                  symptoms: [
                    "Tracks are detected but requests aren't being matched",
                    "Status shows 'Playing' but requester wasn't notified",
                    "Matches not happening even for exact song names"
                  ],
                  causes: [
                    "Song name/artist doesn't match exactly",
                    "Request doesn't exist or is already 'played'",
                    "Fuzzy matching threshold too strict",
                    "Request in wrong status (not 'new', 'acknowledged', or 'paid')"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Check song name formatting",
                      details: "Serato track name must closely match request (85% similarity required)"
                    },
                    {
                      step: 2,
                      action: "Verify request exists and is active",
                      details: "Check your request queue - request must be in 'new', 'acknowledged', or 'paid' status"
                    },
                    {
                      step: 3,
                      action: "Manually match if needed",
                      details: "If auto-match fails, you can manually update request status in dashboard"
                    },
                    {
                      step: 4,
                      action: "Check notification settings",
                      details: "Ensure requesters provided phone or email for notifications"
                    }
                  ],
                  severity: "medium"
                },
                {
                  issue: "Connection Drops During Event",
                  symptoms: [
                    "Connection was working but stopped detecting",
                    "Status shows 'Disconnected' after being connected",
                    "Tracks stopped appearing in dashboard"
                  ],
                  causes: [
                    "Browser tab closed or computer went to sleep",
                    "Internet connection lost",
                    "Live Playlist session ended in Serato",
                    "Serato username changed or account issue"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Check browser tab is still open",
                      details: "Ensure TipJar dashboard page is open and active in browser"
                    },
                    {
                      step: 2,
                      action: "Verify internet connection",
                      details: "Check that your computer/laptop has active internet connection"
                    },
                    {
                      step: 3,
                      action: "Restart Live Playlist session",
                      details: "In Serato, stop and restart the Live Playlist session"
                    },
                    {
                      step: 4,
                      action: "Reconnect in dashboard",
                      details: "Click 'Stop Watching' then 'Start Watching' again in TipJar dashboard"
                    }
                  ],
                  severity: "medium"
                }
              ]}
              faqs={[
                {
                  question: "Do I need to download any software or apps?",
                  answer: "No! The Serato integration works entirely through your browser. Just enable Live Playlists in Serato, make it public, and enter your username in your TipJar dashboard. No separate app or software installation required."
                },
                {
                  question: "Will this work if I'm using Virtual DJ or other DJ software?",
                  answer: "The browser-based integration currently works with Serato DJ Pro via Live Playlists. Virtual DJ support is available through a different method. Check your dashboard for Virtual DJ setup options."
                },
                {
                  question: "How accurate is the song matching?",
                  answer: "The system uses fuzzy matching with an 85% similarity threshold, so it can match songs even with slight variations in formatting. However, for best results, ensure your Serato track metadata (artist and title) matches the request as closely as possible."
                },
                {
                  question: "What happens if a song matches multiple requests?",
                  answer: "If multiple requests exist for the same song, the system will match to the highest priority request first (Fast-Track or Next Song requests take priority). Only one request is marked as 'playing' per track."
                },
                {
                  question: "Do requesters get notified immediately?",
                  answer: "Yes! When a song is detected and matched, requesters receive SMS/Email notifications within seconds (if they provided contact information when making the request)."
                },
                {
                  question: "Can I use this integration during livestreams?",
                  answer: "Yes! The integration works perfectly for live events and streams. Just make sure to start the Live Playlist session before you begin and keep your dashboard page open in a browser tab."
                },
                {
                  question: "What if my Serato username changes?",
                  answer: "If you change your Serato username, you'll need to update it in your TipJar dashboard settings. The old username will no longer work for detection."
                },
                {
                  question: "Is there a delay in detection?",
                  answer: "Tracks are typically detected within 5-10 seconds of playing in Serato. This slight delay is normal and ensures accurate detection."
                }
              ]}
            />

            {/* Custom Branding Guide */}
            <FeatureGuide
              id="custom-branding-guide"
              icon={Palette}
              title="Custom Branding & White-Label"
              description="Customize your TipJar page to match your brand (Pro & Embed Pro)"
              overview="Make your TipJar page uniquely yours with custom branding. Upload your logo, choose your colors, customize backgrounds, and create a professional appearance that matches your brand identity."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Access Branding Settings",
                  description: "Navigate to your branding customization page.",
                  details: [
                    "Go to Dashboard → Settings → Branding",
                    "Or go to Dashboard → Customization",
                    "Verify you're on Pro or Embed Pro plan"
                  ],
                  tips: [
                    "Free plan has limited customization",
                    "Upgrade to Pro for full branding options"
                  ],
                  warning: "Full branding requires Pro or Embed Pro subscription"
                },
                {
                  number: 2,
                  title: "Upload Your Logo",
                  description: "Add your logo to your TipJar page.",
                  details: [
                    "Click 'Upload Logo' button",
                    "Select image file (PNG, JPG, or SVG recommended)",
                    "Recommended size: 200x200px minimum",
                    "Use transparent background for best results",
                    "Preview your logo before saving"
                  ],
                  tips: [
                    "Use high-resolution logo for crisp display",
                    "SVG format is best for scalability",
                    "Keep file size under 2MB for fast loading"
                  ]
                },
                {
                  number: 3,
                  title: "Choose Your Colors",
                  description: "Set your brand colors throughout your page.",
                  details: [
                    "Primary Color: Main brand color (buttons, links)",
                    "Secondary Color: Accent color (highlights)",
                    "Background Color: Page background",
                    "Text Color: Main text color",
                    "Use color picker or enter hex codes"
                  ],
                  tips: [
                    "Choose colors with good contrast for readability",
                    "Test colors in both light and dark modes",
                    "Use your brand's official colors for consistency"
                  ]
                },
                {
                  number: 4,
                  title: "Customize Background",
                  description: "Set your page background (Pro+ only).",
                  details: [
                    "Choose background type: Solid, Gradient, Image, or Animated",
                    "Solid: Single color background",
                    "Gradient: Two-color gradient",
                    "Image: Upload custom background image",
                    "Animated: Choose from animated patterns (wavy, bubble, spiral)"
                  ],
                  tips: [
                    "Keep backgrounds subtle so content is readable",
                    "Test on mobile devices",
                    "Animated backgrounds add visual interest"
                  ]
                },
                {
                  number: 5,
                  title: "Customize Typography",
                  description: "Set your font family (Embed Pro only).",
                  details: [
                    "Choose from available font families",
                    "Or use custom CSS for complete control (Embed Pro)",
                    "Preview changes in real-time",
                    "Save your settings"
                  ],
                  tips: [
                    "Use web-safe fonts for best compatibility",
                    "Custom CSS gives you complete design freedom"
                  ],
                  warning: "Custom CSS requires Embed Pro subscription"
                },
                {
                  number: 6,
                  title: "White-Label Options (Embed Pro)",
                  description: "Remove TipJar branding for complete white-label experience.",
                  details: [
                    "Enable white-label mode",
                    "Remove 'Powered by TipJar' branding",
                    "Upload custom favicon",
                    "Use custom domain (if configured)"
                  ],
                  tips: [
                    "White-label creates a completely branded experience",
                    "Perfect for professional brands and agencies"
                  ],
                  warning: "White-label requires Embed Pro subscription"
                },
                {
                  number: 7,
                  title: "Preview & Save",
                  description: "Preview your changes and save your branding.",
                  details: [
                    "Use preview mode to see changes in real-time",
                    "Test on different devices",
                    "Check light and dark mode appearance",
                    "Save your branding settings",
                    "Changes apply immediately to your TipJar page"
                  ],
                  tips: [
                    "Always preview before saving",
                    "Test on mobile devices for best results"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Branding Changes Not Appearing",
                  symptoms: [
                    "Changes saved but not visible on page",
                    "Logo not showing",
                    "Colors not updating"
                  ],
                  causes: [
                    "Browser cache",
                    "Changes not saved",
                    "Wrong subscription tier",
                    "CDN cache delay"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Clear browser cache",
                      details: "Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
                    },
                    {
                      step: 2,
                      action: "Verify changes were saved",
                      details: "Check dashboard to confirm settings are saved"
                    },
                    {
                      step: 3,
                      action: "Wait 1-2 minutes for CDN update",
                      details: "Changes may take a moment to propagate"
                    },
                    {
                      step: 4,
                      action: "Check subscription tier",
                      details: "Some features require Pro or Embed Pro"
                    }
                  ],
                  severity: "low"
                }
              ]}
              faqs={[
                {
                  question: "What file formats are supported for logos?",
                  answer: "PNG, JPG, and SVG formats are supported. SVG is recommended for best quality and scalability."
                },
                {
                  question: "Can I use custom CSS?",
                  answer: "Yes! Embed Pro subscribers can use custom CSS for complete design control. Go to Branding → Custom CSS."
                },
                {
                  question: "Do branding changes affect my QR code?",
                  answer: "No, QR codes are separate. You can customize QR code colors separately in QR Code settings."
                }
              ]}
            />

            {/* Analytics Guide */}
            <FeatureGuide
              id="analytics-guide"
              icon={BarChart3}
              title="Analytics & Reports"
              description="Understand your tips, requests, and audience insights (Pro & Embed Pro)"
              overview="Analytics help you understand your performance, track revenue, and make data-driven decisions. View detailed reports on tips, requests, events, and more."
              isLoggedIn={isLoggedIn}
              steps={[
                {
                  number: 1,
                  title: "Access Analytics Dashboard",
                  description: "Navigate to your analytics page.",
                  details: [
                    "Go to Dashboard → Analytics",
                    "Or click 'Analytics' in the main dashboard",
                    "Verify you're on Pro or Embed Pro plan"
                  ],
                  tips: [
                    "Free plan has limited analytics",
                    "Upgrade to Pro for full analytics access"
                  ],
                  warning: "Full analytics require Pro or Embed Pro subscription"
                },
                {
                  number: 2,
                  title: "View Revenue Analytics",
                  description: "Track your earnings and revenue trends.",
                  details: [
                    "Total Revenue: All-time earnings",
                    "This Month: Current month revenue",
                    "Average Tip: Average tip amount",
                    "Revenue Trends: Growth over time",
                    "Filter by date range (7 days, 30 days, 90 days, all time)"
                  ],
                  tips: [
                    "Use date filters to compare periods",
                    "Track growth trends over time",
                    "Identify peak earning periods"
                  ]
                },
                {
                  number: 3,
                  title: "View Request Statistics",
                  description: "Understand your request patterns.",
                  details: [
                    "Total Requests: All-time request count",
                    "By Type: Song requests vs shoutouts vs tips",
                    "This Month: Current month requests",
                    "Request Trends: Request volume over time"
                  ],
                  tips: [
                    "See which request types are most popular",
                    "Track request volume trends",
                    "Identify peak request times"
                  ]
                },
                {
                  number: 4,
                  title: "Event-Specific Analytics",
                  description: "Track performance by event (if using event codes).",
                  details: [
                    "Filter by event code",
                    "See revenue per event",
                    "Track request volume per event",
                    "Compare event performance"
                  ],
                  tips: [
                    "Use event codes to track individual events",
                    "Compare which events perform best",
                    "Use insights to improve future events"
                  ]
                },
                {
                  number: 5,
                  title: "Export Data",
                  description: "Export your analytics for external analysis.",
                  details: [
                    "Click 'Export' button in analytics dashboard",
                    "Choose date range",
                    "Select data format (CSV, Excel)",
                    "Download your report"
                  ],
                  tips: [
                    "Export regularly for record-keeping",
                    "Use for tax preparation",
                    "Share with accountants or bookkeepers"
                  ]
                },
                {
                  number: 6,
                  title: "Understand Key Metrics",
                  description: "Learn what each metric means.",
                  details: [
                    "Conversion Rate: % of visitors who tip",
                    "Average Tip: Mean tip amount",
                    "Peak Hours: Times with most activity",
                    "Top Events: Highest-performing events"
                  ],
                  tips: [
                    "Focus on metrics that matter to your goals",
                    "Track trends, not just absolute numbers",
                    "Use insights to optimize your strategy"
                  ]
                }
              ]}
              troubleshooting={[
                {
                  issue: "Analytics Not Loading",
                  symptoms: [
                    "Dashboard shows loading forever",
                    "No data displayed",
                    "Error messages"
                  ],
                  causes: [
                    "Not on Pro/Embed Pro plan",
                    "No data yet",
                    "Network issues",
                    "Browser issues"
                  ],
                  solutions: [
                    {
                      step: 1,
                      action: "Verify subscription tier",
                      details: "Analytics require Pro or Embed Pro"
                    },
                    {
                      step: 2,
                      action: "Check if you have any tips/requests",
                      details: "Analytics need data to display"
                    },
                    {
                      step: 3,
                      action: "Refresh the page",
                      details: "Try hard refresh (Ctrl+Shift+R)"
                    },
                    {
                      step: 4,
                      action: "Check internet connection",
                      details: "Analytics require network access"
                    }
                  ],
                  severity: "low"
                }
              ]}
              faqs={[
                {
                  question: "How far back does analytics data go?",
                  answer: "Analytics data goes back to when you created your account. You can filter by date range to view specific periods."
                },
                {
                  question: "Can I export analytics data?",
                  answer: "Yes! Pro and Embed Pro subscribers can export analytics data in CSV or Excel format for external analysis."
                },
                {
                  question: "Do analytics include refunded tips?",
                  answer: "Analytics show net revenue after refunds. Refunded tips are excluded from revenue calculations."
                }
              ]}
            />
          </div>
        </section>

        {/* Best Practices Section */}
        <section id="best-practices" className="max-w-4xl mx-auto mt-16 mb-16 scroll-mt-20">
          <header className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Best Practices
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tips and strategies to maximize your tips and get the most out of TipJar
            </p>
          </header>

          <div className="space-y-6">
            {/* Maximizing Tips */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Maximizing Tips
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Set Appropriate Minimum Amounts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Set minimum tip amounts that reflect the value of your service. Too low may devalue your work, too high may discourage tips.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Announce Your TipJar</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mention your TipJar during events or streams. Let people know it&apos;s available and how to access it.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Make It Easy to Find</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Display QR codes prominently, share links in bios, and make access as frictionless as possible.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Offer Fast-Track Options</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fast-Track and Next Song options give guests a way to pay more for priority, increasing your average tip amount.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Engage with Tippers</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Acknowledge tips publicly (if appropriate) and thank tippers. Engagement encourages more tips.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* QR Code Best Practices */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-500" />
                QR Code Best Practices
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Print Large Enough</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Print QR codes at least 3&Prime;x3&Prime; (7.5cm). Larger is better—4&Prime;x4&Prime; or 5&Prime;x5&Prime; works great for events.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Use High Contrast</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ensure dark QR codes on light backgrounds (or vice versa) for best scanability.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Place Multiple QR Codes</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Place QR codes in multiple locations at events—tables, bar, entrance, DJ booth.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Have Backup Copies</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Print multiple copies in case one gets damaged or lost during the event.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Test Before Events</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Always test your QR code with multiple devices before printing large quantities or using at events.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Event Setup Tips */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Event Setup Tips
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Create Event-Specific QR Codes</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Use event codes to track performance by event. This helps you understand which events generate the most tips.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Set Up Before the Event</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generate QR codes and test everything at least a day before the event to avoid last-minute issues.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Have Internet Backup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ensure you have reliable internet at events. Consider a mobile hotspot as backup.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Monitor Requests in Real-Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Keep your dashboard open on a tablet or phone to see requests as they come in during events.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Update Request Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mark requests as &apos;Playing&apos; and &apos;Played&apos; to keep your queue organized and show guests you&apos;re responsive.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Pricing Strategies */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Pricing Strategies
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Offer Multiple Price Points</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Provide preset amounts ($5, $10, $20, $50) plus custom amount option to accommodate different budgets.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Set Minimums Appropriately</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Minimum $1 for basic tips, higher minimums ($5-$10) for song requests or shoutouts to reflect value.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Price Fast-Track Strategically</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fast-Track at $10 and Next Song at $20-25 provides good revenue boost while maintaining accessibility.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Adjust for Event Type</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Higher-end events (weddings, corporate) can support higher minimums than casual events.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section id="troubleshooting" className="max-w-4xl mx-auto mt-16 mb-16 scroll-mt-20">
          <header className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <Wrench className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Troubleshooting Common Issues
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Quick solutions to the most common problems
            </p>
          </header>

          <div className="space-y-6">
            <TroubleshootingCard
              issue="Payment Failed - Card Declined"
              symptoms={[
                "Error message: 'Your card was declined'",
                "Payment doesn't go through",
                "Guest sees payment failure"
              ]}
              causes={[
                "Insufficient funds in account",
                "Card expired or incorrect details",
                "Bank security block on transaction",
                "Card not activated for online payments"
              ]}
              solutions={[
                {
                  step: 1,
                  action: "Check card balance and expiration date",
                  details: "Verify the card has sufficient funds and hasn't expired"
                },
                {
                  step: 2,
                  action: "Contact bank to authorize transaction",
                  details: "Some banks block online transactions by default"
                },
                {
                  step: 3,
                  action: "Try a different payment method",
                  details: "Use a different card or Cash App Pay"
                },
                {
                  step: 4,
                  action: "Verify card details are entered correctly",
                  details: "Double-check card number, CVV, and billing address"
                }
              ]}
              severity="high"
            />

            <TroubleshootingCard
              issue="QR Code Not Scanning"
              symptoms={[
                "Phone camera can't read QR code",
                "QR code appears but doesn't work",
                "Works on some phones but not others"
              ]}
              causes={[
                "QR code too small or too far away",
                "Poor contrast (light on light or dark on dark)",
                "Blurry or pixelated QR code",
                "Damaged or creased printed QR code",
                "Insufficient lighting"
              ]}
              solutions={[
                {
                  step: 1,
                  action: "Download larger size QR code",
                  details: "Use at least 3\"x3\" when printing"
                },
                {
                  step: 2,
                  action: "Ensure high contrast",
                  details: "Use dark QR code on light background or vice versa"
                },
                {
                  step: 3,
                  action: "Print at higher resolution",
                  details: "Use PNG format and print at 300 DPI minimum"
                },
                {
                  step: 4,
                  action: "Test before using",
                  details: "Scan with multiple devices before printing large quantities"
                },
                {
                  step: 5,
                  action: "Improve lighting and distance",
                  details: "Ensure good lighting and get closer to QR code"
                }
              ]}
              severity="medium"
            />

            <TroubleshootingCard
              issue="Payout Not Received"
              symptoms={[
                "Tips received but no payout in bank account",
                "Payout shows as processed but money not received",
                "Longer than expected delay"
              ]}
              causes={[
                "Bank account not verified in Stripe",
                "Incorrect bank account details",
                "Bank processing delays (weekends/holidays)",
                "First payout still in verification period",
                "Bank account on hold"
              ]}
              solutions={[
                {
                  step: 1,
                  action: "Check Stripe dashboard for payout status",
                  details: "Log in to Stripe to see if payout was processed"
                },
                {
                  step: 2,
                  action: "Verify bank account details are correct",
                  details: "Check routing and account numbers in Stripe settings"
                },
                {
                  step: 3,
                  action: "Wait for bank processing time",
                  details: "Standard payouts take 1-2 business days (weekends excluded)"
                },
                {
                  step: 4,
                  action: "Check with your bank",
                  details: "Some banks hold transfers for security review"
                },
                {
                  step: 5,
                  action: "Contact support if still missing",
                  details: "Provide payout ID from Stripe dashboard"
                }
              ]}
              severity="high"
            />

            <TroubleshootingCard
              issue="Stripe Connect Account Not Verified"
              symptoms={[
                "Can't receive payouts",
                "Error: 'Account not ready'",
                "Charges or payouts disabled"
              ]}
              causes={[
                "Onboarding process incomplete",
                "Missing required information",
                "Identity verification pending",
                "Bank account not verified",
                "Additional information requested by Stripe"
              ]}
              solutions={[
                {
                  step: 1,
                  action: "Complete Stripe onboarding",
                  details: "Go to Dashboard → Settings → Payments and finish setup"
                },
                {
                  step: 2,
                  action: "Provide all required information",
                  details: "Business details, identity verification, bank account"
                },
                {
                  step: 3,
                  action: "Check for pending requirements",
                  details: "Stripe dashboard will show what's needed"
                },
                {
                  step: 4,
                  action: "Wait for verification (1-2 business days)",
                  details: "First-time verification may take time"
                },
                {
                  step: 5,
                  action: "Contact Stripe support if stuck",
                  details: "They can help with verification issues"
                }
              ]}
              severity="high"
            />
          </div>
        </section>

        {/* Contact Support */}
        <section id="contact" className="max-w-4xl mx-auto mt-16 mb-16 scroll-mt-20">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
            <div className="text-center">
              <Mail className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Still need help?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help. Send us a message and we&apos;ll get back to you as soon as possible.
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
        </section>

        {/* Quick Links */}
        <nav className="max-w-4xl mx-auto mb-16" aria-label="Quick Links">
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
        </nav>
        
        <TipJarFooter />
      </div>
    </Fragment>
  );
}

