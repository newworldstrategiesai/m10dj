import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import PricingContent from '@/components/djdash/PricingContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DJ Invoicing Software Pricing | Best DJ Booking Software Plans | DJ Dash',
  description: 'Transparent pricing for DJ invoicing software and the best DJ booking software. All plans include automated invoicing, contract management, and CRM features. 14-day free trial.',
  keywords: [
    'DJ invoicing software',
    'best DJ booking software',
    'DJ booking software pricing',
    'DJ management software cost',
    'DJ CRM pricing'
  ],
  openGraph: {
    title: 'DJ Dash Pricing - DJ Booking Software Plans',
    description: 'Transparent pricing for DJ invoicing software and the best DJ booking software. All plans include automated invoicing, contract management, and CRM features. 14-day free trial.',
    url: 'https://www.djdash.net/pricing',
    siteName: 'DJ Dash',
    images: [
      {
        url: '/assets/djdash-og-image.png',
        width: 1200,
        height: 630,
        alt: 'DJ Dash Pricing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ Dash Pricing - DJ Booking Software Plans',
    description: 'Transparent pricing for DJ invoicing software. All plans include automated invoicing, contract management, and CRM features.',
    images: ['/assets/djdash-og-image.png'],
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DJDashHeader />
      <PricingContent />
      <DJDashFooter />
    </div>
  );
}