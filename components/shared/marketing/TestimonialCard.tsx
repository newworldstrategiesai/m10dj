'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { Star } from 'lucide-react';
import { Product } from '@/components/marketing/types';

/**
 * Product color mappings for testimonial cards
 */
const productColors: Record<Product, { star: string; accent: string; quoteBg: string }> = {
  tipjar: {
    star: 'text-yellow-400',
    accent: 'text-emerald-600 dark:text-emerald-400',
    quoteBg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  djdash: {
    star: 'text-yellow-400',
    accent: 'text-blue-600 dark:text-blue-400',
    quoteBg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  m10dj: {
    star: 'text-yellow-400',
    accent: 'text-yellow-600 dark:text-yellow-400',
    quoteBg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
};

interface SharedTestimonialCardProps {
  quote: string;
  author: string;
  /** Role, location, or title */
  subtitle?: string;
  /** For backward compatibility with TipJar */
  location?: string;
  /** Star rating (1-5) */
  rating?: number;
  /** Avatar image URL */
  avatarUrl?: string;
  /** Avatar initials fallback */
  avatarInitials?: string;
  className?: string;
  /** Product determines the color theme */
  product?: Product;
  /** Variant style */
  variant?: 'default' | 'minimal' | 'featured';
}

/**
 * Shared Testimonial Card Component
 * 
 * A product-aware testimonial card that displays customer reviews
 * with optional ratings, avatars, and brand-specific styling.
 * 
 * @example
 * // TipJar usage
 * <TestimonialCard 
 *   product="tipjar"
 *   quote="I've made $500+ in tips at a single wedding."
 *   author="Mike R."
 *   subtitle="Wedding DJ"
 *   rating={5}
 * />
 */
export function TestimonialCard({ 
  quote, 
  author, 
  subtitle,
  location,
  rating,
  avatarUrl,
  avatarInitials,
  className,
  product = 'tipjar',
  variant = 'default',
}: SharedTestimonialCardProps) {
  const colors = productColors[product];
  const displaySubtitle = subtitle || location;
  
  // Generate initials from author name if not provided
  const initials = avatarInitials || author
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  if (variant === 'minimal') {
    return (
      <Card className={cn("p-6 dark:bg-gray-900 dark:border-gray-800", className)}>
        <p className="text-lg mb-4 italic text-gray-700 dark:text-gray-300">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="flex items-center gap-2">
          <div>
            <p className="font-semibold dark:text-white">{author}</p>
            {displaySubtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{displaySubtitle}</p>
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  if (variant === 'featured') {
    return (
      <Card 
        className={cn(
          "p-8 dark:bg-gray-900 dark:border-gray-800",
          "border-2 shadow-lg",
          className
        )}
      >
        {/* Quote icon */}
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4", colors.quoteBg)}>
          <span className={cn("text-3xl font-serif", colors.accent)}>&ldquo;</span>
        </div>
        
        {/* Rating */}
        {rating && (
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "w-5 h-5",
                  i < rating ? colors.star + " fill-current" : "text-gray-300 dark:text-gray-600"
                )}
              />
            ))}
          </div>
        )}
        
        <p className="text-xl mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
        
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
            product === 'tipjar' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
            product === 'djdash' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
            'bg-gradient-to-br from-gray-800 to-gray-900'
          )}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={author} className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{author}</p>
            {displaySubtitle && (
              <p className={cn("text-sm", colors.accent)}>{displaySubtitle}</p>
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  // Default variant
  return (
    <Card className={cn("p-6 dark:bg-gray-900 dark:border-gray-800 hover:shadow-lg transition-shadow", className)}>
      {/* Rating */}
      {rating && (
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "w-4 h-4",
                i < rating ? colors.star + " fill-current" : "text-gray-300 dark:text-gray-600"
              )}
            />
          ))}
        </div>
      )}
      
      <p className="text-lg mb-4 italic text-gray-700 dark:text-gray-300">
        &ldquo;{quote}&rdquo;
      </p>
      
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold",
          product === 'tipjar' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
          product === 'djdash' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
          'bg-gradient-to-br from-gray-800 to-gray-900'
        )}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={author} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{author}</p>
          {displaySubtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{displaySubtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default TestimonialCard;

