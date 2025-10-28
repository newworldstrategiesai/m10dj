import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | M10 DJ Company</title>
        <meta name="description" content="Privacy Policy for M10 DJ Company. Learn how we collect, use, and protect your personal information." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-300">Last Updated: January 27, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-lg max-w-none">
            
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                M10 DJ Company ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or communicate with us through various channels including our website, email, phone, text messages, Facebook Messenger, and Instagram.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access our website or use our services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">We may collect personal information that you voluntarily provide to us when you:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Fill out a contact form on our website</li>
                <li>Request a quote or consultation</li>
                <li>Book our DJ services</li>
                <li>Subscribe to our newsletter or marketing communications</li>
                <li>Contact us via phone, email, text message, Facebook Messenger, or Instagram</li>
                <li>Engage with our social media content</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">This information may include:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Event details (date, location, type of event)</li>
                <li>Social media usernames and profile information (Instagram, Facebook)</li>
                <li>Messages and communications you send to us</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Automatically Collected Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">When you visit our website, we may automatically collect certain information about your device and browsing actions, including:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Referring website</li>
                <li>Pages visited and time spent on pages</li>
                <li>Device identifiers</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Social Media Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you interact with us through Facebook Messenger or Instagram Direct Messages, we collect information provided by those platforms, including your username, profile information, and message content. This data is used solely to respond to your inquiries and provide customer service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Respond to your inquiries and provide customer service</li>
                <li>Process your bookings and manage your events</li>
                <li>Send you quotes, contracts, and other event-related information</li>
                <li>Communicate with you about our services via email, phone, text, or social media</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Analyze website usage and trends</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our business (e.g., email services, payment processors, website hosting, analytics providers)</li>
                <li><strong>Venue Partners:</strong> When necessary to coordinate your event</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of our business</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use the following third-party services that may collect information:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Google Analytics:</strong> For website analytics</li>
                <li><strong>Facebook Pixel:</strong> For advertising and analytics</li>
                <li><strong>Vercel:</strong> For website hosting</li>
                <li><strong>Supabase:</strong> For data storage</li>
                <li><strong>Twilio:</strong> For SMS communications</li>
                <li><strong>Meta Platforms:</strong> For Facebook and Instagram messaging</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to improve your experience on our website, analyze site traffic, and personalize content. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our website.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. Event-related information is typically retained for up to 7 years for business and legal purposes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-Out:</strong> Opt out of marketing communications</li>
                <li><strong>Data Portability:</strong> Request a copy of your information in a portable format</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:info@m10djcompany.com" className="text-brand hover:underline">info@m10djcompany.com</a> or <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a>.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">SMS/Text Messaging</h2>
              <p className="text-gray-700 leading-relaxed">
                If you provide your phone number, you may receive text messages from us regarding your booking, event details, or (with your consent) marketing communications. You can opt out of text messages at any time by replying STOP. Message and data rates may apply.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date. We encourage you to review this privacy policy periodically.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions or concerns about this privacy policy or our data practices, please contact us:
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

