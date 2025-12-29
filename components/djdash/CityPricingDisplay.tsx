'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PricingStats {
  city: string;
  state?: string;
  event_type: string;
  price_low: number;
  price_median: number;
  price_high: number;
  price_average: number;
  sample_size: number;
  data_quality: 'high' | 'medium' | 'low';
  trend_direction?: 'rising' | 'stable' | 'declining';
  trend_percentage?: number;
}

interface CityPricingDisplayProps {
  city: string;
  eventType: string;
  state?: string;
  className?: string;
}

export default function CityPricingDisplay({
  city,
  eventType,
  state,
  className = ''
}: CityPricingDisplayProps) {
  const [stats, setStats] = useState<PricingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          city,
          event_type: eventType,
          ...(state && { state })
        });
        
        const response = await fetch(`/api/pricing/city?${params}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No pricing data available yet');
          } else {
            setError('Failed to load pricing data');
          }
          return;
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching pricing:', err);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPricing();
  }, [city, eventType, state]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return null; // Don't show anything if no data
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  };

  const formatPriceRange = () => {
    return `${formatPrice(stats.price_low)}–${formatPrice(stats.price_high)}`;
  };

  const getTrendIcon = () => {
    if (!stats.trend_direction) return null;
    
    switch (stats.trend_direction) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const eventTypeLabel = eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {eventTypeLabel} Pricing in {city}
              {state && `, ${state}`}
            </CardTitle>
            <CardDescription>
              Based on recent DJ Dash bookings
            </CardDescription>
          </div>
          {stats.trend_direction && (
            <Badge variant="outline" className="flex items-center gap-1">
              {getTrendIcon()}
              {stats.trend_direction === 'rising' && 'Prices Rising'}
              {stats.trend_direction === 'declining' && 'Competitive Pricing'}
              {stats.trend_direction === 'stable' && 'Stable Pricing'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Price Range */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Typical Price Range</p>
          <p className="text-3xl font-bold">
            {formatPriceRange()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Median price: {formatPrice(stats.price_median)}
          </p>
        </div>

        {/* Summary Text */}
        <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>{eventTypeLabel} DJs in {city}</strong>
            {state && `, ${state}`} typically cost between{' '}
            <strong>{formatPriceRange()}</strong>, with a median price of{' '}
            <strong>{formatPrice(stats.price_median)}</strong>, based on recent DJ Dash bookings.
          </p>
        </div>

        {/* Data Quality Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>
            Based on {stats.sample_size} recent bookings •{' '}
            {stats.data_quality === 'high' ? 'High confidence' : 'Moderate confidence'} data
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple inline pricing text component for use in paragraphs
 */
export function CityPricingText({
  city,
  eventType,
  state
}: {
  city: string;
  eventType: string;
  state?: string;
}) {
  const [stats, setStats] = useState<PricingStats | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const params = new URLSearchParams({
          city,
          event_type: eventType,
          ...(state && { state })
        });
        
        const response = await fetch(`/api/pricing/city?${params}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        // Silently fail for inline text
      }
    }
    
    fetchPricing();
  }, [city, eventType, state]);

  if (!stats) return null;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  };

  const formatPriceRange = () => {
    return `${formatPrice(stats.price_low)}–${formatPrice(stats.price_high)}`;
  };

  const eventTypeLabel = eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className="font-semibold">
      {eventTypeLabel} DJs in {city}
      {state && `, ${state}`} typically cost between {formatPriceRange()}, with a median price of{' '}
      {formatPrice(stats.price_median)}, based on recent DJ Dash bookings.
    </span>
  );
}

