'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, MapPin, Calendar, Users, DollarSign, Send, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/Toasts/use-toast';
import VenueInput from '@/components/company/VenueInput';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface CityInquiryFormProps {
  city: string;
  state: string;
  featuredDJs?: Array<{
    id: string;
    dj_name: string;
    dj_slug: string;
    starting_price_range: string | null;
    availability_status: string;
    event_types: string[] | null;
  }>;
  className?: string;
  onSuccess?: () => void;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function CityInquiryForm({
  city,
  state,
  featuredDJs = [],
  className = '',
  onSuccess
}: CityInquiryFormProps) {
  const [formData, setFormData] = useState({
    planner_name: '',
    planner_email: '',
    planner_phone: '',
    event_type: '',
    event_date: null as Date | null,
    event_time: '',
    venue_name: '',
    venue_address: '',
    guest_count: '',
    budget_range: '',
    budget_amount: '',
    special_requests: '',
    preferred_dj_ids: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestedDJs, setSuggestedDJs] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  // Auto-detect city from venue or suggest DJs based on form data
  useEffect(() => {
    const fetchSuggestedDJs = async () => {
      if (!formData.event_type && !formData.venue_name && !formData.budget_amount) {
        setSuggestedDJs(featuredDJs.slice(0, 3));
        return;
      }

      setLoadingSuggestions(true);
      try {
        let query = supabase
          .from('dj_profiles')
          .select(`
            id,
            dj_name,
            dj_slug,
            tagline,
            profile_image_url,
            starting_price_range,
            availability_status,
            event_types,
            city,
            state,
            organizations!inner(product_context)
          `)
          .eq('is_published', true)
          .eq('organizations.product_context', 'djdash')
          .or(`city.ilike.%${city}%,primary_city.ilike.%${city}%`);

        // Filter by event type if selected
        if (formData.event_type) {
          query = query.contains('event_types', [formData.event_type]);
        }

        // Filter by availability
        query = query.in('availability_status', ['available', 'limited']);

        const { data, error } = await query
          .order('is_featured', { ascending: false })
          .order('page_views', { ascending: false })
          .limit(6);

        if (error) throw error;

        // Filter by budget if provided
        let filtered = data || [];
        if (formData.budget_amount) {
          const budget = parseFloat(formData.budget_amount);
          // This is a simple filter - in production, you'd check price_range_min/max
          filtered = filtered.filter((dj) => {
            // Basic budget matching logic
            return true; // For now, show all DJs
          });
        }

        setSuggestedDJs(filtered.slice(0, 3));
      } catch (error) {
        console.error('Error fetching suggested DJs:', error);
        setSuggestedDJs(featuredDJs.slice(0, 3));
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Debounce the suggestion fetch
    const timeoutId = setTimeout(fetchSuggestedDJs, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.event_type, formData.venue_name, formData.budget_amount, city, featuredDJs]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.planner_name.trim()) {
      newErrors.planner_name = 'Name is required';
    }

    if (!formData.planner_email.trim()) {
      newErrors.planner_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.planner_email)) {
      newErrors.planner_email = 'Please enter a valid email';
    }

    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLeadScore = () => {
    let score = 0;

    // Budget scoring
    if (formData.budget_amount) {
      const budget = parseFloat(formData.budget_amount);
      if (budget >= 5000) score += 30;
      else if (budget >= 2500) score += 20;
      else if (budget >= 1000) score += 10;
    }

    // Event type scoring
    if (formData.event_type === 'wedding') score += 15;
    else if (formData.event_type === 'corporate') score += 10;

    // Completeness scoring
    if (formData.event_date) score += 10;
    if (formData.venue_name) score += 10;
    if (formData.guest_count) score += 5;
    if (formData.planner_phone) score += 5;
    if (formData.preferred_dj_ids.length > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Please fix errors',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const leadScore = calculateLeadScore();

      // Submit inquiry to all selected DJs (or all suggested if none selected)
      const djIdsToNotify = formData.preferred_dj_ids.length > 0
        ? formData.preferred_dj_ids
        : suggestedDJs.map(dj => dj.id);

      const inquiries = await Promise.all(
        djIdsToNotify.map(async (djId) => {
          const response = await fetch('/api/djdash/inquiries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dj_profile_id: djId,
              planner_name: formData.planner_name.trim(),
              planner_email: formData.planner_email.trim().toLowerCase(),
              planner_phone: formData.planner_phone?.trim() || null,
              event_type: formData.event_type,
              event_date: formData.event_date ? format(formData.event_date, 'yyyy-MM-dd') : null,
              event_time: formData.event_time || null,
              venue_name: formData.venue_name?.trim() || null,
              venue_address: formData.venue_address?.trim() || null,
              guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
              budget_range: formData.budget_range || null,
              budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
              special_requests: formData.special_requests?.trim() || null,
              lead_score: leadScore,
              lead_quality: leadScore >= 50 ? 'high' : leadScore >= 30 ? 'medium' : 'low',
              lead_temperature: leadScore >= 60 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold',
              custom_fields: {
                city: city,
                state: state,
                source: 'city_page'
              }
            })
          });

          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to submit inquiry');
          }

          return response.json();
        })
      );

      setSubmitted(true);
      toast({
        title: 'Inquiries sent!',
        description: `Your inquiry has been sent to ${djIdsToNotify.length} DJ${djIdsToNotify.length > 1 ? 's' : ''} in ${city}.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'city_inquiry_submitted', {
          city: city,
          state: state,
          event_type: formData.event_type,
          dj_count: djIdsToNotify.length,
          lead_score: leadScore
        });
      }

    } catch (error: any) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit inquiry. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDJSelection = (djId: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_dj_ids: prev.preferred_dj_ids.includes(djId)
        ? prev.preferred_dj_ids.filter(id => id !== djId)
        : [...prev.preferred_dj_ids, djId]
    }));
  };

  if (submitted) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg', className)}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Inquiries Sent!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your inquiry has been sent to DJs in {city}. They will review your request and get back to you soon.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                planner_name: '',
                planner_email: '',
                planner_phone: '',
                event_type: '',
                event_date: null,
                event_time: '',
                venue_name: '',
                venue_address: '',
                guest_count: '',
                budget_range: '',
                budget_amount: '',
                special_requests: '',
                preferred_dj_ids: []
              });
            }}
            variant="outline"
          >
            Send Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Get Free Quotes from {city} DJs
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Fill out the form below and we'll connect you with the best DJs in {city}, {state}.
          </p>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="planner_name">Your Name *</Label>
            <Input
              id="planner_name"
              value={formData.planner_name}
              onChange={(e) => setFormData({ ...formData, planner_name: e.target.value })}
              className={errors.planner_name ? 'border-red-500' : ''}
            />
            {errors.planner_name && (
              <p className="text-sm text-red-500 mt-1">{errors.planner_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="planner_email">Email *</Label>
            <Input
              id="planner_email"
              type="email"
              value={formData.planner_email}
              onChange={(e) => setFormData({ ...formData, planner_email: e.target.value })}
              className={errors.planner_email ? 'border-red-500' : ''}
            />
            {errors.planner_email && (
              <p className="text-sm text-red-500 mt-1">{errors.planner_email}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="planner_phone">Phone (Optional)</Label>
          <Input
            id="planner_phone"
            type="tel"
            value={formData.planner_phone}
            onChange={(e) => setFormData({ ...formData, planner_phone: e.target.value })}
            placeholder="(901) 555-1234"
          />
        </div>

        {/* Event Type */}
        <div>
          <Label htmlFor="event_type">Event Type *</Label>
          <Select
            value={formData.event_type}
            onValueChange={(value) => setFormData({ ...formData, event_type: value })}
          >
            <SelectTrigger className={errors.event_type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="corporate">Corporate Event</SelectItem>
              <SelectItem value="birthday">Birthday Party</SelectItem>
              <SelectItem value="school_dance">School Dance</SelectItem>
              <SelectItem value="holiday_party">Holiday Party</SelectItem>
              <SelectItem value="private_party">Private Party</SelectItem>
            </SelectContent>
          </Select>
          {errors.event_type && (
            <p className="text-sm text-red-500 mt-1">{errors.event_type}</p>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.event_date && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.event_date ? (
                    format(formData.event_date, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.event_date || undefined}
                  onSelect={(date) => setFormData({ ...formData, event_date: date || null })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="event_time">Event Time (Optional)</Label>
            <Input
              id="event_time"
              type="time"
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
            />
          </div>
        </div>

        {/* Venue */}
        <VenueInput
          venueName={formData.venue_name}
          venueAddress={formData.venue_address}
          onVenueNameChange={(name) => {
            setFormData({ ...formData, venue_name: name });
          }}
          onVenueAddressChange={(address) => {
            setFormData({ ...formData, venue_address: address });
          }}
        />

        {/* Guest Count & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="guest_count">Guest Count (Optional)</Label>
            <Input
              id="guest_count"
              type="number"
              min="1"
              value={formData.guest_count}
              onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
              placeholder="150"
            />
          </div>

          <div>
            <Label htmlFor="budget_amount">Budget (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="budget_amount"
                type="number"
                min="0"
                step="100"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                className="pl-8"
                placeholder="2500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Help us match you with DJs in your budget range
            </p>
          </div>
        </div>

        {/* Suggested DJs */}
        {suggestedDJs.length > 0 && (
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Suggested DJs (Select to send inquiry to specific DJs, or leave unselected to send to all)
            </Label>
            <div className="grid gap-3">
              {suggestedDJs.map((dj) => (
                <Card
                  key={dj.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all',
                    formData.preferred_dj_ids.includes(dj.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                  onClick={() => toggleDJSelection(dj.id)}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={formData.preferred_dj_ids.includes(dj.id)}
                      onChange={() => toggleDJSelection(dj.id)}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {dj.dj_name}
                        </h4>
                        <Badge variant={dj.availability_status === 'available' ? 'default' : 'secondary'}>
                          {dj.availability_status}
                        </Badge>
                      </div>
                      {dj.tagline && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {dj.tagline}
                        </p>
                      )}
                      {dj.starting_price_range && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Starting at {dj.starting_price_range}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dj/${dj.dj_slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View Profile →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
            {formData.preferred_dj_ids.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                No DJs selected - inquiry will be sent to all suggested DJs
              </p>
            )}
          </div>
        )}

        {/* Special Requests */}
        <div>
          <Label htmlFor="special_requests">Special Requests or Notes (Optional)</Label>
          <Textarea
            id="special_requests"
            value={formData.special_requests}
            onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
            rows={4}
            placeholder="Tell us about your event, music preferences, or any special requirements..."
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || loadingSuggestions}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Get Free Quotes from {city} DJs
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By submitting this form, you agree to be contacted by DJs in {city} regarding your event.
        </p>
      </form>
    </div>
  );
}

