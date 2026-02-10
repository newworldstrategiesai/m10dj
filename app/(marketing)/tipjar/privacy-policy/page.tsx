import { Metadata } from 'next';
import Link from 'next/link';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | TipJar.Live',
  description: 'Privacy Policy for TipJar.Live. Learn how we collect, use, and protect your personal information when using our DJ tipping and song request platform.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-800 text-white py-16 dark:from-purple-950 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-purple-200 dark:text-purple-300">Last Updated: January 27, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our tipping and song request platform, or interact with our services as a DJ, performer, venue, or guest.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access our website or use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Account Information (DJs, Performers, Venues)</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you create an account with TipJar.Live as a DJ, performer, or venue, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Phone number (optional)</li>
              <li>Business or stage name</li>
              <li>Profile information (bio, photos, links to social media)</li>
              <li>Payment account information via Stripe Connect (bank account details for receiving tips)</li>
              <li>Tax identification information (required for payment processing)</li>
              <li>Venue information (if applicable: venue name, address, roster of performers)</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Guest User Information (Tip Senders and Requesters)</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you send a tip or submit a song request as a guest user (you do not need an account), we may collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Name (you may use an alias or remain anonymous)</li>
              <li>Email address (optional, collected during payment processing)</li>
              <li>Payment information (processed securely through Stripe; we do not store full card details)</li>
              <li>Song request details (song title, artist name, message to DJ)</li>
              <li>Shoutout information (recipient name, message)</li>
              <li>Tip amount and message (if provided)</li>
              <li>IP address and device information (for fraud prevention and security)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Note:</strong> Guest users can send tips and requests anonymously. We only collect information necessary to process payments and deliver your requests to the DJ or performer.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Payment Information</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              All payment processing is handled by Stripe, our payment processor. We collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Payment method details (credit card, debit card, or other payment methods supported by Stripe)</li>
              <li>Billing address (for payment verification)</li>
              <li>Transaction history and payment records</li>
              <li>Bank account information (for DJs receiving tips, stored securely by Stripe)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Important:</strong> We do not store full credit card numbers on our servers. All payment data is encrypted and stored securely by Stripe, which is PCI-DSS compliant.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Event and Activity Information</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you use TipJar.Live, we collect information about your activity:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>QR code scans and link accesses</li>
              <li>Tips sent (amount, timestamp, recipient)</li>
              <li>Song requests submitted (title, artist, status)</li>
              <li>Shoutouts sent (recipient, message)</li>
              <li>Event codes associated with activities</li>
              <li>Venue associations (if applicable)</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Automatically Collected Information</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you visit our website or use our services, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Device identifiers</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website or source</li>
              <li>Clickstream data</li>
              <li>Geographic location (general, based on IP address)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Process Payments:</strong> Facilitate tips and payments between guests and DJs/performer through Stripe Connect</li>
              <li><strong>Deliver Requests:</strong> Forward song requests, shoutouts, and tips to the intended DJ or performer</li>
              <li><strong>Account Management:</strong> Create and manage your DJ, performer, or venue account</li>
              <li><strong>Payment Distribution:</strong> Route tips to your connected Stripe account (for DJs/performer)</li>
              <li><strong>Platform Fees:</strong> Calculate and collect platform fees (3.5% + $0.30 per transaction)</li>
              <li><strong>Customer Support:</strong> Respond to your inquiries and provide technical support</li>
              <li><strong>Communication:</strong> Send you transaction receipts, account updates, and service-related notifications</li>
              <li><strong>Marketing:</strong> Send you marketing communications (with your consent) about new features, tips, and promotions</li>
              <li><strong>Fraud Prevention:</strong> Detect and prevent fraudulent transactions and abuse</li>
              <li><strong>Analytics:</strong> Analyze platform usage to improve our services</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations, including tax reporting and financial regulations</li>
              <li><strong>Venue Management:</strong> Manage venue rosters and performer associations</li>
              <li><strong>Event Organization:</strong> Organize requests and tips by event codes and QR codes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How We Share Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <strong>Stripe:</strong> We share payment information with Stripe to process payments. Stripe acts as a data controller for payment data. Please review{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Stripe&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>DJs and Performers:</strong> When you send a tip, song request, or shoutout, we share your name (or alias), message, and request details with the DJ or performer you&apos;re interacting with. You can choose to remain anonymous.
              </li>
              <li>
                <strong>Venues:</strong> If you are a performer associated with a venue, your profile and activity may be visible to the venue owner.
              </li>
              <li>
                <strong>Service Providers:</strong> Third-party companies that help us operate our business, including:
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>Hosting providers (Vercel, Supabase)</li>
                  <li>Analytics providers (Google Analytics)</li>
                  <li>Email service providers</li>
                  <li>Customer support platforms</li>
                </ul>
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court order, or government regulation, or to protect our rights, property, or safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of our business
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly consent to sharing your information
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Processing and Stripe</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live uses Stripe Connect to process payments. This means:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>DJs and performer must create a Stripe Connect account to receive tips</li>
              <li>All payment data is processed and stored by Stripe, not TipJar.Live</li>
              <li>Stripe collects tax identification information from DJs for compliance purposes</li>
              <li>Tips are routed directly to the DJ&apos;s Stripe account, minus platform fees</li>
              <li>Stripe may request additional information from DJs to comply with financial regulations</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Stripe is responsible for payment data security and compliance with financial regulations. For more information, please review{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                Stripe&apos;s Privacy Policy
              </a>{' '}
              and{' '}
              <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                Stripe&apos;s Terms of Service
              </a>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">QR Codes and Public Links</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When DJs or performer create TipJar pages, they receive:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>A unique public URL (e.g., tipjar.live/username)</li>
              <li>QR codes for easy access at events</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Important:</strong> These pages are publicly accessible. Anyone with the link or QR code can:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>View the DJ&apos;s or performer&apos;s public profile</li>
              <li>Send tips, song requests, or shoutouts</li>
              <li>See publicly displayed information (name, bio, photos)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              DJs and performer control what information is displayed on their public TipJar pages. We recommend not sharing sensitive personal information on public profiles.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Remember your preferences and settings</li>
              <li>Maintain your session when logged in</li>
              <li>Analyze website usage and improve performance</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform, including payment processing.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Secure authentication and authorization systems</li>
              <li>Regular security audits and updates</li>
              <li>PCI-DSS compliant payment processing through Stripe</li>
              <li>Row-level security (RLS) policies to restrict data access</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Retained while your account is active and for 7 years after account closure (for tax and legal compliance)</li>
              <li><strong>Payment Records:</strong> Retained for 7 years (required for financial and tax compliance)</li>
              <li><strong>Transaction Data:</strong> Retained indefinitely for financial record-keeping and analytics</li>
              <li><strong>Guest User Data:</strong> Retained for 90 days after the last transaction, unless longer retention is required for legal purposes</li>
              <li><strong>Request and Tip Data:</strong> Retained for 2 years for DJ/performer reference, then archived</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              When data is no longer needed, we securely delete or anonymize it in accordance with our data retention policies.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your Privacy Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Opt-Out:</strong> Opt out of marketing communications (account-related communications will still be sent)</li>
              <li><strong>Data Portability:</strong> Request a copy of your information in a portable format</li>
              <li><strong>Objection:</strong> Object to processing of your personal information in certain circumstances</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              <strong>Note:</strong> Some information, particularly payment and transaction records, may be retained for legal and tax compliance purposes even after deletion requests.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:support@tipjar.live" className="text-purple-600 dark:text-purple-400 hover:underline">
                support@tipjar.live
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              TipJar.Live is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that we have collected information from a child under 18, we will delete that information promptly.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              <strong>Important:</strong> Users under 18 may not create DJ, performer, or venue accounts, as payment processing requires individuals to be at least 18 years old.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">International Data Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              TipJar.Live is operated in the United States. If you are located outside the United States, please note that your information may be transferred to, stored, and processed in the United States. By using our services, you consent to the transfer of your information to the United States. We take appropriate measures to ensure your information receives adequate protection in accordance with this privacy policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Right to know what personal information is collected, used, and shared</li>
              <li>Right to delete personal information (subject to exceptions)</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              To exercise your California privacy rights, please contact us at{' '}
              <a href="mailto:support@tipjar.live" className="text-purple-600 dark:text-purple-400 hover:underline">
                support@tipjar.live
              </a>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this privacy policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-4">
              <li>Posting the new privacy policy on this page</li>
              <li>Updating the &quot;Last Updated&quot; date</li>
              <li>Sending an email notification to registered users (for significant changes)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We encourage you to review this privacy policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions or concerns about this privacy policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <p className="text-gray-900 dark:text-white font-semibold mb-2">TipJar.Live</p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Email:{' '}
                <a href="mailto:support@tipjar.live" className="text-purple-600 dark:text-purple-400 hover:underline">
                  support@tipjar.live
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Website:{' '}
                <a href="https://www.tipjar.live" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  www.tipjar.live
                </a>
              </p>
            </div>
          </section>

          {/* Back to Home */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link href="/" className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <TipJarFooter />
    </div>
  );
}

