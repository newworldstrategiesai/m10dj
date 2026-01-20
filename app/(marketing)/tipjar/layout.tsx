import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

const title = 'TipJar Live - DJ Tip Collection & Song Request App';
const description = 'Request songs, send tips, and interact with your DJ in real-time. The easiest way to support your favorite DJ and get your music played at events.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tipjar.live'),
  title: {
    default: title,
    template: '%s | TipJar Live',
  },
  description: description,
  keywords: [
    'DJ tips',
    'song requests',
    'live DJ interaction',
    'event requests',
    'DJ app',
    'music requests',
    'tip your DJ',
  ],
  authors: [{ name: 'TipJar Live' }],
  creator: 'TipJar Live',
  publisher: 'TipJar Live',
  icons: {
    icon: '/assets/TipJar-Logo-Icon.png',
    shortcut: '/assets/TipJar-Logo-Icon.png',
    apple: '/assets/TipJar-Logo-Icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.tipjar.live',
    title: title,
    description: description,
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-og-image.png', // Custom OG image for TipJar
        width: 1200,
        height: 630,
        alt: 'TipJar Live - DJ Tip Collection & Song Request App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    site: '@tipjarlive',
    images: ['/assets/tipjar-og-image.png'],
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
  alternates: {
    canonical: 'https://www.tipjar.live',
  },
};

export default function TipJarLayout({ children }: PropsWithChildren) {
  return children;
}

