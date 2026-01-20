import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Help & Support Center | TipJar.Live',
  description: 'Get help with TipJar. Find answers to common questions, step-by-step guides, troubleshooting tips, and best practices for maximizing your tips. Complete support documentation for DJs, streamers, and event entertainers.',
  keywords: [
    'TipJar help',
    'TipJar support',
    'TipJar FAQ',
    'DJ tip jar help',
    'song request app support',
    'TipJar troubleshooting',
    'how to use TipJar',
    'TipJar setup guide',
    'Stripe Connect setup',
    'QR code tip jar help',
    'stream alerts setup',
    'TipJar integration guide',
    'Serato DJ Pro integration',
  ],
  openGraph: {
    title: 'TipJar Help & Support Center',
    description: 'Get help with TipJar. Find answers to common questions, step-by-step guides, troubleshooting tips, and best practices.',
    url: 'https://www.tipjar.live/tipjar/support',
    siteName: 'TipJar Live',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJar Help & Support Center',
    description: 'Get help with TipJar. Find answers to common questions, step-by-step guides, and troubleshooting tips.',
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
    canonical: 'https://www.tipjar.live/tipjar/support',
  },
};

export default function SupportLayout({ children }: PropsWithChildren) {
  return children;
}
