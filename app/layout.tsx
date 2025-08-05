import { Metadata } from 'next';
import Footer from '@/components/company/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { headers } from 'next/headers';
import EnhancedTracking from '@/components/EnhancedTracking';
import PerformanceOptimizations from '@/components/PerformanceOptimizations';
import { CriticalResourceHints, OptimizedScriptLoader, ServiceWorkerManager, PerformanceBudgetMonitor } from '@/components/MobilePerformanceOptimizer';

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
        
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-8DQRX3LY9T"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-8DQRX3LY9T');
            `,
          }}
        />
        
        {/* Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1080417329531937');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1080417329531937&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
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
        <OptimizedScriptLoader>
          <EnhancedTracking />
          <PerformanceOptimizations />
          <ServiceWorkerManager />
          <PerformanceBudgetMonitor />
        </OptimizedScriptLoader>
        <CriticalResourceHints />
      </body>
    </html>
  );
}
