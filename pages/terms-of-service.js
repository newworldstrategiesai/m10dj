import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | M10 DJ Company</title>
        <meta name="description" content="Terms of Service for M10 DJ Company. Review the terms and conditions for using our DJ and entertainment services." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-300">Last Updated: January 27, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-lg max-w-none">
            
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service ("Terms") govern your use of the M10 DJ Company website and services. By accessing our website or booking our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our website or services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                M10 DJ Company provides professional DJ and entertainment services for various events including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Weddings</li>
                <li>Corporate events</li>
                <li>Private parties</li>
                <li>School dances</li>
                <li>Holiday parties</li>
                <li>Other special events</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking and Payment</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Quotes and Contracts</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All quotes provided are estimates and may be subject to change based on final event details. A signed contract and deposit are required to secure your event date.
              </p>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Deposits and Payments</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>A non-refundable deposit is required at the time of booking</li>
                <li>Final payment is due 7-14 days before your event</li>
                <li>Late payments may result in cancellation of services</li>
                <li>We accept various payment methods including credit cards, checks, and electronic payments</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Cancellation Policy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cancellations must be made in writing. Cancellation fees apply as follows:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>More than 90 days before event: Deposit forfeited</li>
                <li>60-90 days before event: 50% of total contract value</li>
                <li>30-60 days before event: 75% of total contract value</li>
                <li>Less than 30 days before event: 100% of total contract value</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Event Responsibilities</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Client Responsibilities</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate event information (date, time, location, guest count)</li>
                <li>Ensure adequate space and power outlets for equipment setup</li>
                <li>Provide access to the venue for setup and teardown</li>
                <li>Notify us of any special requests or requirements at least 14 days before the event</li>
                <li>Ensure venue policies allow our services and equipment</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Our Responsibilities</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Arrive on time for setup (typically 1-2 hours before event start)</li>
                <li>Provide professional, working equipment</li>
                <li>Perform services as outlined in the contract</li>
                <li>Dress appropriately for your event</li>
                <li>Maintain professional conduct throughout the event</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Equipment and Technical Issues</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We maintain and test all equipment before events. In the unlikely event of equipment failure:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We carry backup equipment to minimize disruption</li>
                <li>We will make reasonable efforts to resolve technical issues quickly</li>
                <li>If services cannot be performed due to equipment failure, a prorated refund will be provided</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Force Majeure</h2>
              <p className="text-gray-700 leading-relaxed">
                Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control, including but not limited to: natural disasters, severe weather, pandemics, government restrictions, venue closure, or other acts of God. In such cases, we will work with you to reschedule or provide a partial refund.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Liability and Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                M10 DJ Company carries liability insurance for events. However:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We are not responsible for personal injuries or property damage caused by guests</li>
                <li>Our liability is limited to the total amount paid for services</li>
                <li>The client agrees to indemnify M10 DJ Company against claims arising from the event</li>
                <li>We are not responsible for venue-specific policies or requirements</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All music played is properly licensed through appropriate performance rights organizations (ASCAP, BMI, SESAC). We maintain our own music library and equipment. The client may not record or distribute our performances without written consent.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Photography and Marketing</h2>
              <p className="text-gray-700 leading-relaxed">
                We may take photos or videos at your event for marketing purposes. If you do not wish to have your event featured in our marketing materials, please notify us in writing before the event.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modifications to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Continued use of our services after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Tennessee, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Shelby County, Tennessee.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-semibold mb-2">M10 DJ Company</p>
                <p className="text-gray-700 mb-1">Email: <a href="mailto:info@m10djcompany.com" className="text-brand hover:underline">info@m10djcompany.com</a></p>
                <p className="text-gray-700 mb-1">Phone: <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a></p>
                <p className="text-gray-700 mb-1">Address: 65 Stewart Rd, Eads, TN 38028</p>
                <p className="text-gray-700">Website: <a href="https://www.m10djcompany.com" className="text-brand hover:underline">www.m10djcompany.com</a></p>
              </div>
            </section>

            {/* Back to Home */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link href="/" className="inline-flex items-center text-brand hover:text-brand-dark font-semibold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

