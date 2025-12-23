'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface TestimonialCardProps {
  quote: string;
  author: string;
  location: string;
  className?: string;
}

export function TestimonialCard({ quote, author, location, className }: TestimonialCardProps) {
  return (
    <Card className={cn("p-6 dark:bg-gray-900 dark:border-gray-800", className)}>
      <p className="text-lg mb-4 italic text-gray-700 dark:text-gray-300">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div>
          <p className="font-semibold dark:text-white">{author}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
        </div>
      </div>
    </Card>
  );
}






