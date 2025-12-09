'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function StickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-r from-purple-700 to-pink-600 p-4 shadow-2xl border-t border-purple-500/30">
      <Link href="/signup" className="w-full block">
        <Button 
          size="lg" 
          className="w-full bg-white text-purple-700 hover:bg-gray-50 font-bold text-base uppercase tracking-wide shadow-lg hover:shadow-xl transition-all"
        >
          Start Free – No Credit Card
        </Button>
      </Link>
    </div>
  );
}

