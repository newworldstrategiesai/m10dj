import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tipjar.live'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.tipjar.live',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-og-image.png', // Will use logo as fallback if image doesn't exist
        width: 1200,
        height: 630,
        alt: 'TipJar Live - DJ Tip Collection & Song Request App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tipjarlive',
    images: ['/assets/tipjar-og-image.png'],
  },
};

export default function TipJarLayout({ children }: PropsWithChildren) {
  return children;
}

