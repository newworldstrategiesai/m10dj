import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import ContactForm from '../components/company/ContactForm';

export default function Book() {
  return (
    <>
      <Head>
        <title>Book a DJ | M10 DJ Company</title>
        <meta name="description" content="Request a quote for your Memphis wedding, corporate event, or party. M10 DJ Company." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Top bar: logo only */}
        <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center">
            <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-brand rounded-lg">
              <Image
                src="/m10-black-clear-png.png"
                alt="M10 DJ Company"
                width={140}
                height={44}
                className="h-9 w-auto dark:invert"
                priority
              />
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Request a quote
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Tell us about your event and we&apos;ll get back to you soon.
            </p>
          </div>

          <ContactForm className="shadow-none" />
        </main>
      </div>
    </>
  );
}
