import { Metadata } from 'next';
import Link from 'next/link';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';

export const metadata: Metadata = {
  title: 'Affiliate Program Terms | TipJar.Live',
  description: 'Terms and conditions for the TipJar.Live Affiliate Program. Learn about commission rates, payment terms, and program rules.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white py-16 dark:from-emerald-700 dark:via-green-700 dark:to-emerald-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Affiliate Program Terms</h1>
          <p className="text-xl text-emerald-100 dark:text-emerald-200">Last Updated: January 25, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              These Affiliate Program Terms (&quot;Affiliate Terms&quot;) govern your participation in the TipJar.Live Affiliate Program (the &quot;Program&quot;) operated by TipJar.Live (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By applying to or participating in the Program, you agree to be bound by these Affiliate Terms, our general Terms of Service, and our Privacy Policy.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update these Affiliate Terms from time to time. Material changes will be notified by posting the updated terms on this page and updating the &quot;Last Updated&quot; date. Your continued participation in the Program after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Program Overview</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The TipJar.Live Affiliate Program allows you to earn commissions by referring new users to TipJar.Live. When someone signs up for TipJar.Live through your unique referral link and creates a Referred Account that generates platform revenue, you earn commissions on their subscriptions and platform fees.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>&quot;Referred Account&quot;</strong> means a TipJar.Live user account that was created after clicking an Affiliate&apos;s referral link and is permanently associated with that Affiliate. Once attributed, the referral relationship is permanent and will not change, regardless of future link clicks.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              All TipJar.Live users are automatically enrolled in the affiliate program upon signup. You can access your affiliate dashboard at any time to track your referrals, view earnings, and manage your account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Eligibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To participate in the Affiliate Program, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Be at least 18 years old</li>
              <li>Have an active TipJar.Live account in good standing</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not be prohibited from participating under applicable law</li>
              <li>Not engage in fraudulent, deceptive, or unethical marketing practices</li>
              <li>Not use the Program to refer yourself or create multiple accounts</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to approve or reject any affiliate application or terminate any affiliate account at our sole discretion.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How the Program Works</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Referral Links</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Upon enrollment, you will receive a unique affiliate referral link (e.g., tipjar.live/ref/YOUR_CODE). This link is automatically included in the &quot;Powered by TipJar&quot; badge on your public TipJar pages. You may also share this link through:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Social media posts and profiles</li>
              <li>Email campaigns</li>
              <li>Blog posts and websites</li>
              <li>QR codes and printed materials</li>
              <li>Other marketing channels (subject to our guidelines)</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Tracking and Attribution</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Referrals are tracked through cookies and session data. Attribution occurs when a user signs up for TipJar.Live after clicking an affiliate referral link. Once attributed, the referral relationship is permanent and will not change, regardless of future link clicks.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              A referral is attributed to you when:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>A user clicks your referral link</li>
              <li>The user signs up for TipJar.Live within 30 days of clicking</li>
              <li>The user creates a Referred Account that generates platform revenue</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use industry-standard tracking methods, but cannot guarantee 100% accuracy due to browser settings, ad blockers, or other technical limitations.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Commission Structure</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Subscription Commissions</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You earn a commission on subscription revenue from users you refer:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Default Rate:</strong> 25% of monthly subscription revenue</li>
              <li><strong>Commission Type:</strong> Recurring monthly commissions for as long as the referred user maintains an active subscription</li>
              <li><strong>Calculation:</strong> Based on the subscription tier and amount paid by the referred user</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Commission rates are defaults and may vary by affiliate, promotion, account type, or referral source. TipJar.Live reserves the right to adjust commission rates with 30 days&apos; notice.
            </p>
            <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Commission Calculation Timing</h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Affiliate commissions are calculated only after transactions have fully settled, cleared any applicable refund or dispute windows, and are confirmed as non-reversible. TipJar.Live may delay commission approval for up to 30 days to account for refunds, chargebacks, or fraud review.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Platform Fee Commissions</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You also earn a commission on TipJar platform fees from referred users:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Default Rate:</strong> 10% of net platform fees collected</li>
              <li><strong>Platform Fee:</strong> The portion of each transaction retained by TipJar.Live, which may include a percentage-based fee, fixed fee, or combination thereof, as disclosed on our pricing page or within the product at the time of the transaction</li>
              <li><strong>Commission Type:</strong> Ongoing commissions on all net platform fees from referred users</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Platform fees do not include third-party payment processor fees (e.g., Stripe fees), refunds, chargebacks, taxes, or disputed amounts. The following are excluded from commission calculations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Taxes, VAT, or government fees</li>
              <li>Refunds or reversed transactions</li>
              <li>Chargebacks and dispute fees</li>
              <li>Promotional credits or fee waivers</li>
              <li>Fraudulent or abusive activity</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Referral Bonuses</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may be eligible for one-time referral bonuses when:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>A referred user makes their first subscription payment</li>
              <li>A referred user receives their first tip payment</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Bonus amounts and eligibility are determined at our discretion and may change without notice.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Terms</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Payout Threshold</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Commissions are paid out when:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Your pending balance reaches the minimum payout threshold (default: $25.00)</li>
              <li>You have completed Stripe Connect onboarding for payouts</li>
              <li>All required tax and identity verification is complete</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Payout Schedule</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Payouts are processed:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Automatic:</strong> Monthly on the 1st of each month (if auto-payout is enabled)</li>
              <li><strong>Manual:</strong> Upon request when threshold is met (if auto-payout is disabled)</li>
              <li><strong>Method:</strong> Via Stripe Connect to your connected bank account</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Commission Status</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Commissions go through the following statuses:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Pending:</strong> Commission has been calculated but not yet approved</li>
              <li><strong>Approved:</strong> Commission is verified and added to your pending balance</li>
              <li><strong>Paid:</strong> Commission has been transferred to your account</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We reserve the right to hold, review, or reverse commissions in cases of suspected fraud, chargebacks, refunds, or violations of these terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Prohibited Activities</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The following activities are strictly prohibited and may result in immediate termination and forfeiture of all commissions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Self-Referrals:</strong> Referring yourself or creating multiple accounts to generate fake referrals</li>
              <li><strong>Fraudulent Activity:</strong> Using bots, click farms, or other automated methods to generate clicks or signups</li>
              <li><strong>Spam:</strong> Sending unsolicited emails, messages, or communications promoting your referral link</li>
              <li><strong>Misrepresentation:</strong> Making false or misleading claims about TipJar.Live, its features, or pricing</li>
              <li><strong>Trademark Violations:</strong> Using TipJar.Live trademarks, logos, or branding without permission</li>
              <li><strong>Incentivized Clicks:</strong> Offering cash, gifts, or other incentives solely for clicking your referral link</li>
              <li><strong>Cookie Stuffing:</strong> Placing tracking cookies without user knowledge or consent</li>
              <li><strong>Violation of Laws:</strong> Any activity that violates applicable laws, regulations, or third-party terms of service</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We actively monitor for fraudulent activity and reserve the right to investigate any suspicious behavior. Violations may result in immediate account termination and legal action.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Marketing Guidelines</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When promoting TipJar.Live, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Accurately represent TipJar.Live&apos;s features, pricing, and capabilities</li>
              <li>Use only approved marketing materials and branding (if provided)</li>
              <li>Comply with all applicable advertising and marketing laws (CAN-SPAM, GDPR, etc.)</li>
              <li>Clearly disclose your affiliate relationship when required by law</li>
              <li>Respect intellectual property rights and trademarks</li>
              <li>Not engage in negative advertising or disparagement of competitors</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may provide marketing materials, banners, or other assets for your use. You may not modify these materials without permission, except for resizing or minor formatting adjustments.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Termination</h2>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Termination by You</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may terminate your participation in the Program at any time by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Contacting us at affiliates@tipjar.live</li>
              <li>Deactivating your affiliate account through your dashboard</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Upon termination, you will receive any earned commissions that have been approved and meet the payout threshold. Pending commissions may be forfeited at our discretion.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Termination by Us</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We may terminate your participation in the Program immediately if:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>You violate these Affiliate Terms or our Terms of Service</li>
              <li>You engage in fraudulent, deceptive, or illegal activity</li>
              <li>Your TipJar.Live account is suspended or terminated</li>
              <li>We determine, at our sole discretion, that your participation is harmful to our brand or business</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Upon termination for cause, all pending and future commissions may be forfeited. We reserve the right to pursue legal action for violations of these terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Disputes and Refunds</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If a referred user:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Requests a refund for their subscription</li>
              <li>Disputes a charge through their payment provider</li>
              <li>Cancels their subscription within the refund period</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to reverse or adjust the corresponding commissions. If commissions have already been paid, we may deduct the amount from future payouts or require repayment.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Tax Obligations</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Determining and paying all applicable taxes on your affiliate commissions</li>
              <li>Providing accurate tax information to Stripe Connect</li>
              <li>Filing all required tax returns and forms</li>
              <li>Complying with tax laws in your jurisdiction</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We may be required to collect tax information or issue tax forms (e.g., 1099 in the United States) depending on your location and earnings. You agree to provide accurate information and cooperate with any tax reporting requirements.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>We make no warranties or representations about the Program, including potential earnings</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount of commissions paid to you in the 12 months preceding the claim</li>
              <li>We are not responsible for tracking failures, technical issues, or third-party service disruptions</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Modifications to the Program</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Modify commission rates, payout thresholds, or program terms at any time</li>
              <li>Change or discontinue the Program with 30 days&apos; notice</li>
              <li>Add or remove features, benefits, or requirements</li>
              <li>Update tracking methods or attribution windows</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Material changes will be communicated via email or through your affiliate dashboard. Your continued participation after changes constitutes acceptance. If you do not agree to changes, you may terminate your participation as described above.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Confidentiality</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Affiliate agrees that commission rates, conversion data, referral counts, revenue metrics, and internal dashboard information are confidential and may not be publicly disclosed without prior written consent from TipJar.Live. This includes, but is not limited to, screenshots of affiliate dashboards, commission statements, or referral statistics shared on social media, forums, or other public platforms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Use of Name and Marks</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Affiliate grants TipJar.Live a non-exclusive right to list Affiliate&apos;s name, logo, or username as a participant in the Affiliate Program, unless Affiliate opts out in writing. TipJar.Live may use this information for marketing purposes, case studies, or social proof, subject to Affiliate&apos;s right to opt out at any time by contacting affiliates@tipjar.live.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Relationship of Parties</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You are an independent contractor, not an employee, agent, or partner of TipJar.Live. This Agreement does not create any employment, agency, partnership, or joint venture relationship. You have no authority to bind TipJar.Live or make any representations on our behalf beyond what is expressly permitted in these terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions about the Affiliate Program or these terms, please contact us:
            </p>
            <ul className="list-none pl-0 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:affiliates@tipjar.live" className="text-emerald-600 dark:text-emerald-400 hover:underline">affiliates@tipjar.live</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@tipjar.live" className="text-emerald-600 dark:text-emerald-400 hover:underline">support@tipjar.live</a></li>
              <li><strong>Affiliate Dashboard:</strong> <Link href="/tipjar/affiliate" className="text-emerald-600 dark:text-emerald-400 hover:underline">tipjar.live/tipjar/affiliate</Link></li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Dispute Resolution and Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              These Affiliate Terms are governed by the laws of the jurisdiction in which TipJar.Live operates, without regard to conflict of law principles.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Any dispute arising out of or relating to these Affiliate Terms shall be resolved through binding arbitration on an individual basis, except where prohibited by law. Affiliate waives any right to participate in class actions or representative proceedings. The arbitration will be conducted by a single arbitrator in accordance with the rules of the American Arbitration Association (or equivalent organization in the applicable jurisdiction), and judgment on the award may be entered in any court having jurisdiction.
            </p>
          </section>

          <section className="mb-12 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Start Earning?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you&apos;re a TipJar.Live user, you&apos;re already enrolled in the affiliate program! Visit your affiliate dashboard to get your referral link and start earning commissions.
            </p>
            <Link 
              href="/tipjar/affiliate"
              className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Go to Affiliate Dashboard
            </Link>
          </section>

        </div>
      </div>

      <TipJarFooter />
    </div>
  );
}
