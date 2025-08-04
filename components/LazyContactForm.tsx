'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load ContactForm to improve initial page load performance
const ContactForm = dynamic(() => import('./company/ContactForm'), {
  loading: () => (
    <div className="min-h-[400px] bg-gray-50 rounded-xl p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto mb-4"></div>
        <p className="text-gray-600">Loading contact form...</p>
      </div>
    </div>
  ),
  ssr: false // Don't render on server since it's interactive
});

export default function LazyContactForm({ className = '' }: { className?: string }) {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] bg-gray-50 rounded-xl p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contact form...</p>
        </div>
      </div>
    }>
      <ContactForm className={className} />
    </Suspense>
  );
}