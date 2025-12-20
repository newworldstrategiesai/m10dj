'use client';

import { useState, useEffect } from 'react';
import { Calculator, Calendar, MapPin, Clock, Users, Mic, Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CalculatorInputs {
  eventType: string;
  eventDate?: string;
  city: string;
  state?: string;
  durationHours: number;
  venueType?: 'indoor' | 'outdoor';
  guestCountRange?: 'small' | 'medium' | 'large';
  needsMC?: boolean;
  addOns?: {
    lighting?: boolean;
    ceremonyAudio?: boolean;
    extraHours?: number;
  };
}

interface CalculatorResult {
  estimatedLow: number;
  estimatedHigh: number;
  estimatedMedian: number;
  confidence: 'high' | 'medium' | 'early_market';
  sampleSize: number;
  displayText: string;
  aiSearchText: string;
}

interface DJCostCalculatorProps {
  city: string;
  state?: string;
  eventType?: string;
  onInquiryClick?: (inputs: CalculatorInputs, result: CalculatorResult) => void;
  embedded?: boolean;
}

export default function DJCostCalculator({
  city,
  state,
  eventType: initialEventType,
  onInquiryClick,
  embedded = false
}: DJCostCalculatorProps) {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    eventType: initialEventType || 'wedding',
    city,
    state,
    durationHours: 4,
    venueType: 'indoor',
    guestCountRange: 'medium',
    needsMC: false,
    addOns: {
      lighting: false,
      ceremonyAudio: false,
      extraHours: 0
    }
  });

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/calculator/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputs)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate estimate');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate estimate');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  };

  const getConfidenceBadge = () => {
    if (!result) return null;
    
    switch (result.confidence) {
      case 'high':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            High Confidence
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Medium Confidence
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Early Market
          </Badge>
        );
    }
  };

  const isPeakDate = () => {
    if (!inputs.eventDate) return false;
    const date = new Date(inputs.eventDate);
    const month = date.getMonth() + 1;
    
    if (inputs.eventType === 'wedding') {
      return month >= 5 && month <= 10;
    }
    if (inputs.eventType === 'corporate' || inputs.eventType === 'holiday_party') {
      return month >= 11 || month === 12;
    }
    return false;
  };

  return (
    <Card className={embedded ? '' : 'max-w-4xl mx-auto'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          DJ Cost Calculator
        </CardTitle>
        <CardDescription>
          Get an instant estimate based on real DJ Dash booking data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Type */}
          <div>
            <Label htmlFor="eventType">Event Type *</Label>
            <Select
              value={inputs.eventType}
              onValueChange={(value) => setInputs({ ...inputs, eventType: value })}
            >
              <SelectTrigger id="eventType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="corporate">Corporate Event</SelectItem>
                <SelectItem value="private_party">Private Party</SelectItem>
                <SelectItem value="school_dance">School Dance</SelectItem>
                <SelectItem value="holiday_party">Holiday Party</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Date */}
          <div>
            <Label htmlFor="eventDate">Event Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="eventDate"
                type="date"
                value={inputs.eventDate || ''}
                onChange={(e) => setInputs({ ...inputs, eventDate: e.target.value })}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            {isPeakDate() && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Peak season — prices may be higher
              </p>
            )}
          </div>

          {/* City (read-only if provided) */}
          <div>
            <Label htmlFor="city">City *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="city"
                value={inputs.city}
                onChange={(e) => setInputs({ ...inputs, city: e.target.value })}
                className="pl-10"
                readOnly={!!city}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="durationHours">Duration (hours) *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="durationHours"
                type="number"
                min="1"
                max="12"
                value={inputs.durationHours}
                onChange={(e) => setInputs({ ...inputs, durationHours: parseInt(e.target.value) || 4 })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <Label htmlFor="guestCount">Guest Count</Label>
            <Select
              value={inputs.guestCountRange || 'medium'}
              onValueChange={(value: 'small' | 'medium' | 'large') => 
                setInputs({ ...inputs, guestCountRange: value })
              }
            >
              <SelectTrigger id="guestCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (&lt;50 guests)</SelectItem>
                <SelectItem value="medium">Medium (50-150 guests)</SelectItem>
                <SelectItem value="large">Large (150+ guests)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Venue Type */}
          <div>
            <Label htmlFor="venueType">Venue Type</Label>
            <Select
              value={inputs.venueType || 'indoor'}
              onValueChange={(value: 'indoor' | 'outdoor') => 
                setInputs({ ...inputs, venueType: value })
              }
            >
              <SelectTrigger id="venueType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add-ons */}
        <div className="space-y-3">
          <Label>Add-ons (optional)</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsMC"
                checked={inputs.needsMC || false}
                onCheckedChange={(checked) => 
                  setInputs({ ...inputs, needsMC: checked as boolean })
                }
              />
              <Label htmlFor="needsMC" className="flex items-center gap-2 cursor-pointer">
                <Mic className="w-4 h-4" />
                MC Services
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lighting"
                checked={inputs.addOns?.lighting || false}
                onCheckedChange={(checked) => 
                  setInputs({ 
                    ...inputs, 
                    addOns: { ...inputs.addOns, lighting: checked as boolean }
                  })
                }
              />
              <Label htmlFor="lighting" className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                Lighting Package
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ceremonyAudio"
                checked={inputs.addOns?.ceremonyAudio || false}
                onCheckedChange={(checked) => 
                  setInputs({ 
                    ...inputs, 
                    addOns: { ...inputs.addOns, ceremonyAudio: checked as boolean }
                  })
                }
              />
              <Label htmlFor="ceremonyAudio" className="flex items-center gap-2 cursor-pointer">
                <Users className="w-4 h-4" />
                Ceremony Audio
              </Label>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={calculate}
          disabled={loading || !inputs.eventType || !inputs.city || !inputs.durationHours}
          className="w-full"
          size="lg"
        >
          {loading ? 'Calculating...' : 'Calculate Estimate'}
        </Button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{result.displayText}</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on recent DJ Dash bookings
                  </p>
                </div>
                {getConfidenceBadge()}
              </div>

              {/* Price Range Visual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Estimated Range</span>
                  <span>{formatPrice(result.estimatedLow)} – {formatPrice(result.estimatedHigh)}</span>
                </div>
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{
                      left: '0%',
                      width: '100%'
                    }}
                  />
                  <div
                    className="absolute h-full w-1 bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-white -translate-x-1/2"
                    style={{
                      left: '50%',
                      top: '0'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(result.estimatedLow)}</span>
                  <span className="font-semibold">Median: {formatPrice(result.estimatedMedian)}</span>
                  <span>{formatPrice(result.estimatedHigh)}</span>
                </div>
              </div>

              {/* AI Search Text (hidden but in DOM) */}
              <div className="sr-only" aria-hidden="true">
                {result.aiSearchText}
              </div>
            </div>

            {/* Legal Disclaimer */}
            <p className="text-xs text-muted-foreground italic">
              * Estimates only. Actual pricing varies by DJ, availability, and specific event requirements.
            </p>

            {/* CTAs */}
            {onInquiryClick && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => onInquiryClick(inputs, result)}
                  className="flex-1"
                  size="lg"
                >
                  See Available DJs in This Price Range
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onInquiryClick(inputs, result)}
                  className="flex-1"
                  size="lg"
                >
                  Send One Inquiry to Multiple DJs
                </Button>
              </div>
            )}
            
            {!onInquiryClick && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    const citySlug = inputs.city.toLowerCase().replace(/\s+/g, '-');
                    const params = new URLSearchParams({
                      event_type: inputs.eventType,
                      duration: inputs.durationHours.toString(),
                      ...(inputs.state && { state: inputs.state }),
                      ...(inputs.eventDate && { date: inputs.eventDate }),
                      estimated_low: result.estimatedLow.toString(),
                      estimated_high: result.estimatedHigh.toString()
                    });
                    window.location.href = `/djdash/find-dj/${citySlug}/${inputs.eventType}?${params.toString()}`;
                  }}
                  className="flex-1"
                  size="lg"
                >
                  See Available DJs in This Price Range
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

