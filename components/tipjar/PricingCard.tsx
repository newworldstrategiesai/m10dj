'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import Link from 'next/link';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  className?: string;
}

export function PricingCard({ 
  name, 
  price, 
  period = '/month', 
  description, 
  features, 
  cta, 
  ctaLink,
  popular = false,
  className 
}: PricingCardProps) {
  return (
    <Card className={cn(
      "p-8 relative dark:bg-gray-900 dark:border-gray-800",
      popular && "border-2 border-tipjar-primary-500 shadow-lg",
      className
    )}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-tipjar-primary-500 text-white">
          Most Popular
        </Badge>
      )}
      <h3 className="text-2xl font-bold mb-2 dark:text-white">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold dark:text-white">{price}</span>
        {period && <span className="text-gray-600 dark:text-gray-400">{period}</span>}
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-tipjar-success-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaLink} className="block">
        <Button 
          className={cn(
            "w-full",
            popular 
              ? "bg-tipjar-primary-500 hover:bg-tipjar-primary-600 text-white" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
          )}
          size="lg"
        >
          {cta}
        </Button>
      </Link>
    </Card>
  );
}


