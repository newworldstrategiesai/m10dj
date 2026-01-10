import { Metadata } from 'next';
import Link from 'next/link';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | TipJar.Live',
  description: 'Terms of Service for TipJar.Live. Review the terms and conditions for using our DJ tipping and song request platform.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-800 text-white py-16 dark:from-purple-950 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-purple-200 dark:text-purple-300">Last Updated: January 27, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              These Terms of Service ("Terms") govern your use of the TipJar.Live website and platform (the "Service") operated by TipJar.Live ("we," "our," or "us"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update these Terms from time to time. Material changes will be notified by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Description of Service</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live is a platform that enables DJs, performers, and entertainers to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Accept tips and payments from guests at events or online</li>
              <li>Receive song requests from event attendees</li>
              <li>Accept shoutouts and personal messages</li>
              <li>Manage multiple events with unique QR codes</li>
              <li>Track payments and requests in real-time</li>
              <li>Create public tipping pages accessible via unique URLs</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Guests can use TipJar.Live to send tips, submit song requests, and send shoutouts to DJs and performers without creating an account. The Service processes payments through Stripe Connect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Eligibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To use TipJar.Live, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Be at least 18 years old to create a DJ, performer, or venue account</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Provide accurate and complete information when creating an account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not be prohibited from using the Service under applicable law</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              <strong>Guests:</strong> Individuals of any age may use TipJar.Live to send tips and requests as guests, subject to parental consent if under 18. However, guests under 18 cannot process payments without a parent or guardian.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Account Registration and Stripe Connect</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Account Creation</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To receive tips as a DJ or performer, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Create a TipJar.Live account</li>
              <li>Complete your profile with accurate information</li>
              <li>Create and connect a Stripe Connect account</li>
              <li>Provide required tax identification information to Stripe</li>
              <li>Verify your identity and banking information through Stripe</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Stripe Connect Account</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live uses Stripe Connect to process payments. By using our Service:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>You agree to Stripe's Terms of Service and Privacy Policy</li>
              <li>You are responsible for maintaining an active Stripe Connect account</li>
              <li>Stripe may require additional verification or information from you</li>
              <li>Payment processing is subject to Stripe's policies and procedures</li>
              <li>You are responsible for reporting income received through TipJar.Live for tax purposes</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Account Security</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Using a strong, unique password</li>
              <li>Keeping your email address and contact information up to date</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Platform Fees and Payment Terms</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Platform Fees</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live charges the following fees:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Per-Transaction Fee:</strong> 3.5% + $0.30 per tip or payment processed</li>
              <li><strong>Subscription Fees:</strong> Optional paid plans available (Free, Pro, Embed Pro) with varying features</li>
              <li><strong>Stripe Fees:</strong> Additional fees may apply from Stripe (separate from TipJar.Live fees)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Platform fees are deducted automatically from each transaction before funds are transferred to your Stripe account. You will receive the net amount after fees.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Subscription Plans</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live offers subscription plans with different features:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Free Plan:</strong> Limited requests per month, basic features</li>
              <li><strong>Pro Plan:</strong> Unlimited requests, full tipping features, custom branding</li>
              <li><strong>Embed Pro Plan:</strong> All Pro features plus embed functionality</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Subscription fees are billed monthly or annually. You can cancel your subscription at any time, but you will continue to have access until the end of your billing period.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Payment Processing and Payouts</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Payment processing is handled by Stripe:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Tips are processed immediately when sent by guests</li>
              <li>Funds are transferred to your connected Stripe account after platform fees</li>
              <li>Payouts to your bank account are subject to Stripe's payout schedule (typically daily)</li>
              <li>You may choose instant payouts (subject to additional Stripe fees)</li>
              <li>All payments are final unless disputed through Stripe's dispute process</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Refunds and Chargebacks</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Refunds and chargebacks are handled by Stripe:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Refunds may be issued at the DJ's discretion</li>
              <li>Chargebacks may occur if guests dispute charges with their bank or credit card company</li>
              <li>Chargeback fees and associated costs are the responsibility of the DJ/performer</li>
              <li>TipJar.Live is not responsible for refunds or chargebacks processed through Stripe</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">User Conduct and Prohibited Activities</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Impersonate another person or entity</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Send spam, abusive, harassing, or inappropriate messages</li>
              <li>Violate any intellectual property rights</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use automated systems to send tips or requests (bots, scripts)</li>
              <li>Circumvent platform fees or payment processing</li>
              <li>Collect or harvest information about other users</li>
              <li>Use the Service to facilitate money laundering or other financial crimes</li>
              <li>Submit song requests for copyrighted content you do not have rights to request</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Violation of these rules may result in immediate termination of your account and legal action.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Intellectual Property</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Your Content</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You retain ownership of content you submit to TipJar.Live (profile information, photos, messages). By using the Service, you grant TipJar.Live a non-exclusive, worldwide, royalty-free license to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Use, display, and distribute your content on the Service</li>
              <li>Use your content for marketing and promotional purposes (with your consent)</li>
              <li>Modify your content as necessary to operate the Service</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Music and Copyright</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live is a platform for requesting tips and song requests. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>DJs' performance of copyrighted music</li>
              <li>Copyright compliance for music played at events</li>
              <li>DJs' licensing obligations (ASCAP, BMI, SESAC)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              DJs are solely responsible for obtaining appropriate licenses for music performance. TipJar.Live does not provide music licensing services.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">TipJar.Live Intellectual Property</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The Service, including its design, logos, trademarks, and software, is owned by TipJar.Live and protected by intellectual property laws. You may not use our intellectual property without written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Venue and Performer Relationships</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live supports venue accounts that can manage rosters of performers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Venues can invite performers to join their roster</li>
              <li>Performers can accept or decline venue invitations</li>
              <li>Venue owners can view performer activity and analytics</li>
              <li>Performer accounts remain independent but may be associated with venues</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              TipJar.Live is not a party to agreements between venues and performers. We are not responsible for disputes between venues and performers regarding tips, payments, or business arrangements.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Disclaimers and Limitation of Liability</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Service Availability</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TipJar.Live provides the Service "as is" and "as available." We do not guarantee:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Uninterrupted or error-free operation</li>
              <li>That the Service will meet your specific requirements</li>
              <li>That payments will be processed instantly or without delays</li>
              <li>That song requests will be fulfilled by DJs</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Third-Party Services</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The Service integrates with third-party services, including Stripe for payment processing. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Stripe's service availability, errors, or policies</li>
              <li>Payment processing delays or failures</li>
              <li>Stripe's handling of disputes or chargebacks</li>
              <li>Third-party service outages or changes</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Limitation of Liability</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>TipJar.Live's total liability is limited to the amount you paid us in the 12 months preceding the claim</li>
              <li>We are not liable for indirect, incidental, special, or consequential damages</li>
              <li>We are not responsible for lost tips, failed transactions, or payment processing errors</li>
              <li>We are not responsible for DJs' failure to fulfill song requests</li>
              <li>We are not responsible for disputes between DJs and guests</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Indemnification</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless TipJar.Live, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney's fees) arising out of or in any way connected with: (1) your use of the Service, (2) your violation of these Terms, (3) your violation of any third-party rights, (4) content you submit to the Service, or (5) disputes between you and other users.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Termination</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We may terminate or suspend your account immediately, without prior notice, if you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Violate these Terms</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Fail to pay subscription fees (for paid plans)</li>
              <li>Request account deletion</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Upon termination, your access to the Service will cease, but you remain responsible for any outstanding fees or obligations. We may retain your data as required by law or for legitimate business purposes (see Privacy Policy).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Tax Obligations</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              DJs and performers are solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Reporting income received through TipJar.Live to tax authorities</li>
              <li>Paying applicable taxes on tips and payments received</li>
              <li>Maintaining records of transactions for tax purposes</li>
              <li>Complying with local, state, and federal tax laws</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              TipJar.Live may provide transaction records and tax forms as required by law, but we are not responsible for your tax obligations. Consult a tax professional for advice on reporting income from tips.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Payment Disputes:</strong> Payment disputes are handled by Stripe through their dispute resolution process. TipJar.Live is not involved in payment disputes between DJs and guests.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Service Disputes:</strong> If you have a dispute with TipJar.Live regarding the Service, please contact us at support@tipjar.live. We will attempt to resolve disputes in good faith.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Binding Arbitration:</strong> Any disputes that cannot be resolved through direct communication shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except where prohibited by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Tennessee, United States, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the federal or state courts located in Tennessee, and you hereby consent to the personal jurisdiction of such courts.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Severability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be replaced with a valid provision that most closely reflects the intent of the original provision.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Entire Agreement</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and TipJar.Live regarding the Service and supersede all prior agreements and understandings, whether written or oral.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions about these Terms, please contact us:
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

