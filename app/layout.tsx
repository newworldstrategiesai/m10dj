import { Metadata } from 'next';
import Footer from '@/components/company/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { headers } from 'next/headers';
import 'styles/main.css';

const title = 'M10 DJ Company - Professional Event Entertainment in Memphis';
const description = 'Memphis premier DJ and entertainment services for weddings, corporate events, birthday parties, and special occasions. Professional sound, lighting, and MC services with transparent pricing. Call (901) 410-2020 for your free quote!';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: {
    default: title,
    template: '%s | M10 DJ Company'
  },
  description: description,
  keywords: [
    'Memphis DJ',
    'wedding DJ Memphis',
    'corporate event DJ',
    'birthday party DJ',
    'event entertainment Memphis',
    'professional DJ services',
    'sound system rental',
    'uplighting Memphis',
    'MC services Memphis'
  ],
  authors: [{ name: 'M10 DJ Company' }],
  creator: 'M10 DJ Company',
  publisher: 'M10 DJ Company',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getURL(),
    title: title,
    description: description,
    siteName: 'M10 DJ Company',
    images: [
      {
        url: '/logo-static.jpg',
        width: 1200,
        height: 630,
        alt: 'M10 DJ Company - Professional Event Entertainment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    images: ['/logo-static.jpg'],
    creator: '@m10djcompany',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: getURL(),
  },
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Hide navbar on sign-in pages
  const isSignInPage = pathname.includes('/signin');

  return (
    <html lang="en">
      <head>
        {/* Structured Data for Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "description": "Professional DJ and entertainment services in Memphis, TN",
              "url": getURL(),
              "telephone": "+19014102020",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Memphis",
                "addressRegion": "TN",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 35.1495,
                "longitude": -90.0490
              },
              "openingHours": "Mo-Su 09:00-21:00",
              "priceRange": "$$",
              "image": `${getURL()}/logo-static.jpg`,
              "sameAs": [
                "https://www.facebook.com/m10djcompany",
                "https://www.instagram.com/m10djcompany"
              ],
              "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                  "@type": "GeoCoordinates",
                  "latitude": 35.1495,
                  "longitude": -90.0490
                },
                "geoRadius": "50000"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "DJ Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Wedding DJ Services",
                      "description": "Professional wedding DJ and MC services"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Corporate Event DJ",
                      "description": "Professional corporate event entertainment"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Birthday Party DJ",
                      "description": "Birthday party and special event DJ services"
                    }
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body className="bg-black">
        {!isSignInPage && <Navbar />}
        <main
          id="skip"
          className={`${!isSignInPage ? 'min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]' : 'min-h-screen'}`}
        >
          {children}
        </main>
        {!isSignInPage && <Footer />}
        <Suspense>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
