'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  AlertCircle,
  Lightbulb,
  BarChart3,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PricingGuidanceWidgetProps {
  city: string;
  eventType: string;
  state?: string;
  djProfileId?: string;
  className?: string;
}

interface PricingGuidanceData {
  city: string;
  state?: string;
  event_type: string;
  market_range: {
    low?: number;
    median?: number;
    high?: number;
    formatted: string;
  };
  suggested_range: {
    low: number;
    high: number;
    formatted: string;
  };
  sample_size: number;
  data_quality: 'high' | 'medium' | 'low';
  last_updated: string;
  disclaimer: string;
  data_source_note: string;
  educational_notes: {
    higher_pricing_impact: string;
    lower_pricing_impact: string;
  };
  dj_comparison?: {
    current_price: number;
    market_position: 'below_market' | 'market_aligned' | 'premium';
    position_percentage: number;
    positioning_text: string;
  };
  subscription_tier?: 'free' | 'pro' | 'elite';
  upgrade_message?: string;
}

export default function PricingGuidanceWidget({
  city,
  eventType,
  state,
  djProfileId,
  className = ''
}: PricingGuidanceWidgetProps) {
  const [data, setData] = useState<PricingGuidanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    fetchPricingGuidance();
  }, [city, eventType, state, djProfileId]);

  const fetchPricingGuidance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        city,
        event_type: eventType,
        ...(state && { state }),
        ...(djProfileId && { dj_profile_id: djProfileId })
      });
      
      const response = await fetch(`/api/djdash/pricing-guidance?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pricing guidance');
      }
      
      const guidanceData = await response.json();
      setData(guidanceData);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing guidance');
      console.error('Error fetching pricing guidance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMarketPositionIcon = (position?: 'below_market' | 'market_aligned' | 'premium') => {
    if (!position) return null;
    
    switch (position) {
      case 'below_market':
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      case 'premium':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'market_aligned':
        return <Minus className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getMarketPositionColor = (position?: 'below_market' | 'market_aligned' | 'premium') => {
    if (!position) return 'bg-gray-100 dark:bg-gray-800';
    
    switch (position) {
      case 'below_market':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'premium':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'market_aligned':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  const getDataQualityBadge = (quality: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    
    return (
      <Badge className={variants[quality]}>
        {quality.charAt(0).toUpperCase() + quality.slice(1)} Confidence
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Pricing Guidance
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

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Market Pricing Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-300">
                {error || 'No pricing guidance available. Insufficient market data for this city and event type.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Pricing Guidance
            </CardTitle>
            <CardDescription>
              {city}{state ? `, ${state}` : ''} • {eventType.replace('_', ' ')}
            </CardDescription>
          </div>
          {getDataQualityBadge(data.data_quality)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Market Range */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold">Market Range</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.market_range.formatted}
          </div>
          {data.subscription_tier === 'free' && data.upgrade_message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.upgrade_message}
            </p>
          )}
          {data.subscription_tier !== 'free' && data.market_range.median && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Median: ${data.market_range.median.toLocaleString()}
            </p>
          )}
        </div>

        {/* Suggested Range */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold">Suggested Range</h3>
          </div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {data.suggested_range.formatted}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Based on market median ± 20% (adjustable)
          </p>
        </div>

        {/* DJ Comparison */}
        {data.dj_comparison && (
          <div className={`border rounded-lg p-4 ${getMarketPositionColor(data.dj_comparison.market_position)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getMarketPositionIcon(data.dj_comparison.market_position)}
                <h3 className="text-sm font-semibold">Your Pricing Position</h3>
              </div>
              <Badge variant="outline">
                {data.dj_comparison.market_position.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-lg font-semibold mb-1">
              ${data.dj_comparison.current_price.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.dj_comparison.positioning_text}
            </p>
          </div>
        )}

        {/* Educational Notes */}
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4" />
            Pricing Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600 dark:text-gray-400">
                {data.educational_notes.higher_pricing_impact}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600 dark:text-gray-400">
                {data.educational_notes.lower_pricing_impact}
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Based on {data.sample_size} anonymized bookings</span>
          </div>
          <span>
            Updated {new Date(data.last_updated).toLocaleDateString()}
          </span>
        </div>

        {/* Legal Disclaimer */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1">{data.disclaimer}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => setShowDisclaimer(!showDisclaimer)}
                >
                  {showDisclaimer ? 'Hide' : 'Read More'}
                </Button>
              </div>
              {showDisclaimer && (
                <div className="mt-2 space-y-2">
                  <p>{data.data_source_note}</p>
                  <p className="font-semibold">
                    Important: This information is for informational purposes only. 
                    You are not required to follow any suggested pricing. 
                    Pricing decisions are entirely at your discretion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

