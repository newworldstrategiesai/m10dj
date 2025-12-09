'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function StickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-tipjar-cta-gradient p-4 shadow-lg">
      <Link href="/signup" className="w-full block">
        <Button 
          size="lg" 
          className="w-full bg-white text-tipjar-primary-600 hover:bg-gray-100 font-semibold uppercase tracking-wider"
        >
          Start Free – No Credit Card
        </Button>
      </Link>
    </div>
  );
}

