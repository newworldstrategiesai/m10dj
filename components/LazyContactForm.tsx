'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton loading component for contact form
const ContactFormSkeleton = () => (
  <div className="min-h-[400px] bg-white dark:bg-gray-900 rounded-xl p-8 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-24 w-full" />
    </div>
    <Skeleton className="h-12 w-32" />
  </div>
);

// Lazy load ContactForm to improve initial page load performance
const ContactForm = dynamic(() => import('./company/ContactForm'), {
  loading: () => <ContactFormSkeleton />,
  ssr: false // Don't render on server since it's interactive
});

export default function LazyContactForm({ className = '' }: { className?: string }) {
  return (
    <Suspense fallback={<ContactFormSkeleton />}>
      <ContactForm className={className} />
    </Suspense>
  );
}