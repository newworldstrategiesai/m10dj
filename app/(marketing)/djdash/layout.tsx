import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.djdash.net'),
  icons: {
    icon: '/assets/DJ-Dash-Logo-Black-1.PNG',
    shortcut: '/assets/DJ-Dash-Logo-Black-1.PNG',
    apple: '/assets/DJ-Dash-Logo-Black-1.PNG',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.djdash.net',
    siteName: 'DJ Dash',
    images: [
      {
        url: '/assets/djdash-og-image.png',
        width: 1200,
        height: 630,
        alt: 'DJ Dash - DJ Booking Software & DJ CRM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@djdash',
    images: ['/assets/djdash-og-image.png'],
  },
};

export default function DJDashLayout({ children }: PropsWithChildren) {
  return children;
}

