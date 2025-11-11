import { Metadata } from 'next';
import Footer from '@/components/company/Footer';
import FloatingLeadImportWidget from '@/components/chat/FloatingLeadImportWidget';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { headers } from 'next/headers';
// Performance components disabled during SEO recovery
// import EnhancedTracking from '@/components/EnhancedTracking';
// import PerformanceOptimizations from '@/components/PerformanceOptimizations';
// Performance components disabled during SEO recovery
// import { CriticalResourceHints, OptimizedScriptLoader, ServiceWorkerManager, PerformanceBudgetMonitor } from '@/components/MobilePerformanceOptimizer';
import { Analytics } from '@vercel/analytics/next';

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
  const isChatPage = pathname.startsWith('/chat');
  const hideNavbar = isSignInPage || isChatPage;
  const hideFooter = isSignInPage || isChatPage;

  return (
    <html lang="en">
      <head>
        {/* Performance Optimizations */}
        <meta name="theme-color" content="#F59E0B" />
        <meta name="color-scheme" content="light dark" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical Resource Hints */}
        <link rel="preload" href="/logo-static.jpg" as="image" type="image/jpeg" />
        <link rel="modulepreload" href="/_next/static/chunks/main.js" />
        
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
                "streetAddress": "65 Stewart Rd",
                "addressLocality": "Eads",
                "addressRegion": "TN",
                "postalCode": "38028",
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
              "areaServed": [
                {
                  "@type": "City",
                  "name": "Memphis",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "Place",
                  "name": "East Memphis",
                  "containedInPlace": {
                    "@type": "City",
                    "name": "Memphis"
                  }
                },
                {
                  "@type": "City",
                  "name": "Germantown",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "City",
                  "name": "Collierville",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "City",
                  "name": "Bartlett",
                  "containedInPlace": {
                    "@type": "State",
                    "name": "Tennessee"
                  }
                },
                {
                  "@type": "Place",
                  "name": "Midtown Memphis",
                  "containedInPlace": {
                    "@type": "City",
                    "name": "Memphis"
                  }
                },
                {
                  "@type": "Place",
                  "name": "Downtown Memphis",
                  "containedInPlace": {
                    "@type": "City",
                    "name": "Memphis"
                  }
                }
              ],
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
        
        {/* Tracking scripts removed from layout.tsx to prevent conflicts with _document.js */}
        {/* All tracking now handled in _document.js with proper defer loading */}
      </head>
      <body className="bg-black">
        {!hideNavbar && <Navbar />}
        <main
          id="skip"
          className={`${!hideNavbar ? 'min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]' : 'min-h-screen'}`}
        >
          {children}
        </main>
        {!hideFooter && <Footer />}
        <Suspense>
          <Toaster />
        </Suspense>
        {!isSignInPage && <FloatingLeadImportWidget />}
        {/* Performance components disabled during SEO recovery */}
        {/* TODO: Re-enable after traffic recovery with proper optimization */}
        {/* <OptimizedScriptLoader>
          <EnhancedTracking />
          <PerformanceOptimizations />
          <ServiceWorkerManager />
          <PerformanceBudgetMonitor />
        </OptimizedScriptLoader>
        <CriticalResourceHints /> */}
        <Analytics />
      </body>
    </html>
  );
}
