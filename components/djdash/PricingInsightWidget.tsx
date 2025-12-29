'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PricingInsight {
  city: string;
  state?: string;
  event_type: string;
  dj_current_price: number;
  market_position: 'below_market' | 'market_aligned' | 'premium';
  position_percentage: number;
  market_median: number;
  market_low: number;
  market_high: number;
  market_range_text: string;
  insight_text: string;
  positioning_text: string;
}

interface PricingInsightWidgetProps {
  djProfileId: string;
  city: string;
  eventType: string;
  state?: string;
}

export default function PricingInsightWidget({
  djProfileId,
  city,
  eventType,
  state
}: PricingInsightWidgetProps) {
  const [insight, setInsight] = useState<PricingInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsight() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          dj_profile_id: djProfileId,
          city,
          event_type: eventType,
          ...(state && { state })
        });
        
        const response = await fetch(`/api/pricing/dj?${params}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No pricing data available yet');
          } else {
            setError('Failed to load pricing insights');
          }
          return;
        }
        
        const data = await response.json();
        setInsight(data);
      } catch (err) {
        console.error('Error fetching pricing insight:', err);
        setError('Failed to load pricing insights');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInsight();
  }, [djProfileId, city, eventType, state]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing vs Market
          </CardTitle>
          <CardDescription>Loading market insights...</CardDescription>
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

  if (error || !insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing vs Market
          </CardTitle>
          <CardDescription>Market intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">
              {error || 'Insufficient market data available. Check back soon as more bookings are processed.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPositionBadge = () => {
    switch (insight.market_position) {
      case 'below_market':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <TrendingDown className="w-3 h-3 mr-1" />
            Below Market
          </Badge>
        );
      case 'premium':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Minus className="w-3 h-3 mr-1" />
            Market Aligned
          </Badge>
        );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing vs Market
            </CardTitle>
            <CardDescription>
              {eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} events in {city}
              {state && `, ${state}`}
            </CardDescription>
          </div>
          {getPositionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Range */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Market Range</p>
          <p className="text-2xl font-bold">
            {insight.market_range_text}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on recent DJ Dash bookings
          </p>
        </div>

        {/* Your Pricing */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Your Current Price</p>
          <p className="text-xl font-semibold">{formatPrice(insight.dj_current_price)}</p>
        </div>

        {/* Market Median */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">City Median</p>
          <p className="text-lg font-medium">{formatPrice(insight.market_median)}</p>
        </div>

        {/* Position Indicator */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Your Position</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2 relative">
              <div
                className="absolute h-2 rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, Math.max(0, 50 + (insight.position_percentage / 2)))}%`,
                  left: '0%'
                }}
              />
              <div
                className="absolute w-2 h-2 rounded-full bg-primary border-2 border-background -translate-x-1/2"
                style={{
                  left: `${Math.min(100, Math.max(0, 50 + (insight.position_percentage / 2)))}%`,
                  top: '-2px'
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[60px] text-right">
              {insight.position_percentage > 0 ? '+' : ''}
              {insight.position_percentage.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {insight.positioning_text}
          </p>
        </div>

        {/* Insight Text */}
        <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {insight.insight_text}
          </p>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-xs text-muted-foreground italic mt-4">
          * Market insights are informational only. Pricing decisions remain at your discretion.
        </p>
      </CardContent>
    </Card>
  );
}

