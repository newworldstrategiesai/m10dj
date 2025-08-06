import Pricing from '@/components/ui/Pricing/Pricing';
import { createClient } from '@/utils/supabase/server';
import {
  getProducts,
  getSubscription,
  getUser
} from '@/utils/supabase/queries';
import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';

export const metadata: Metadata = {
  title: 'DJ Services Pricing & Packages | M10 DJ Company Memphis',
  description: 'Transparent DJ service pricing for Memphis weddings, corporate events & parties. Package 1 from $1,145, Package 2 from $1,245, Package 3 from $1,500. Ceremony audio packages available. Get your free quote today!',
  keywords: [
    'DJ pricing Memphis',
    'wedding DJ cost Memphis',
    'corporate DJ pricing',
    'event DJ packages Memphis',
    'ceremony audio package',
    'uplighting pricing Memphis',
    'photo booth rental Memphis',
    'dance floor lighting Memphis'
  ],
  openGraph: {
    title: 'DJ Services Pricing & Packages | M10 DJ Company Memphis',
    description: 'Transparent DJ service pricing for Memphis weddings, corporate events & parties. Professional packages starting at $1,145.',
    url: `${getURL()}/pricing`,
    type: 'website',
    images: [
      {
        url: '/logo-static.jpg',
        width: 1200,
        height: 630,
        alt: 'M10 DJ Company Pricing Packages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ Services Pricing & Packages | M10 DJ Company Memphis',
    description: 'Transparent DJ service pricing for Memphis weddings, corporate events & parties.',
  },
  alternates: {
    canonical: `${getURL()}/pricing`,
  },
};

export default async function PricingPage() {
  const supabase = createClient();
  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase)
  ]);

  return (
    <>
      {/* Structured Data for Pricing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "DJ Services Pricing",
            "description": "Professional DJ services pricing for Memphis events",
            "provider": {
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "telephone": "+19014102020",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "65 Stewart Rd",
                "addressLocality": "Eads",
                "addressRegion": "TN",
                "postalCode": "38028",
                "addressCountry": "US"
              }
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "DJ Service Packages",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "name": "Package 1 - Reception Only",
                  "description": "4 hours of DJ and MC services + dance floor lighting and speaker plus one of the following: Uplighting (16 lights) or Additional hour of time",
                  "price": "1145",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Package 2 - Reception Only",
                  "description": "4 hours of DJ and MC services + dance floor lighting and speaker plus two of the following: Ceremony audio package, Additional hour of time, Uplighting (16 lights)",
                  "price": "1245",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Package 3 - Reception Only",
                  "description": "4 hours of DJ and MC services + dance floor lighting and speaker plus two of the following: Ceremony audio package, Additional hour of time, Uplighting (16 lights)",
                  "price": "1500",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Ceremony Audio Package",
                  "description": "Smaller, less obstructive system. Prelude music starts up to 15 mins before time. 4 hours of DJ and MC services + dance floor lighting and speaker",
                  "price": "295",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Ceremony Audio A La Carte",
                  "description": "Microphones & speaker only (no music)",
                  "price": "245",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                }
              ]
            }
          })
        }}
      />
      <Pricing
        user={user}
        products={products ?? []}
        subscription={subscription}
      />
    </>
  );
}
