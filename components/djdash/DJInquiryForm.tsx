'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Calendar, Users, DollarSign, Send, AlertCircle, CheckCircle } from 'lucide-react';
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

interface DJInquiryFormProps {
  djProfileId: string;
  djName: string;
  minimumBudget?: number;
  eventTypes?: string[];
  className?: string;
  onSuccess?: () => void;
}

export default function DJInquiryForm({
  djProfileId,
  djName,
  minimumBudget = 0,
  eventTypes = ['wedding', 'corporate', 'private_party', 'school_dance', 'holiday_party'],
  className = '',
  onSuccess
}: DJInquiryFormProps) {
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
    special_requests: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};

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

    // Budget validation
    if (formData.budget_amount) {
      const budget = parseFloat(formData.budget_amount);
      if (minimumBudget > 0 && budget < minimumBudget) {
        newWarnings.budget_amount = `Minimum budget is $${minimumBudget.toLocaleString()}. Your inquiry may receive lower priority.`;
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
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
      else if (budget < minimumBudget) score -= 10;
    }

    // Event type scoring
    if (formData.event_type === 'wedding') score += 15;
    else if (formData.event_type === 'corporate') score += 10;

    // Completeness scoring
    if (formData.event_date) score += 10;
    if (formData.venue_name) score += 10;
    if (formData.guest_count) score += 5;
    if (formData.planner_phone) score += 5;

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
      const minimumBudgetMet = formData.budget_amount 
        ? parseFloat(formData.budget_amount) >= minimumBudget 
        : false;

      const response = await fetch('/api/djdash/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dj_profile_id: djProfileId,
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
          minimum_budget_met: minimumBudgetMet,
          lead_quality: leadScore >= 50 ? 'high' : leadScore >= 30 ? 'medium' : 'low',
          lead_temperature: leadScore >= 60 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit inquiry');
      }

      setSubmitted(true);
      toast({
        title: 'Inquiry sent!',
        description: `${djName} will get back to you soon.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'inquiry_submitted', {
          dj_profile_id: djProfileId,
          event_type: formData.event_type,
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

  if (submitted) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg', className)}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Inquiry Sent!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {djName} will review your inquiry and get back to you soon.
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
                special_requests: ''
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
    <form onSubmit={handleSubmit} className={cn('bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-6', className)}>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Request a Quote
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Fill out the form below and {djName} will get back to you soon.
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
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </SelectItem>
            ))}
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
              className={cn('pl-8', warnings.budget_amount ? 'border-yellow-500' : '')}
              placeholder="2500"
            />
          </div>
          {warnings.budget_amount && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {warnings.budget_amount}
            </p>
          )}
          {minimumBudget > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Minimum budget: ${minimumBudget.toLocaleString()}
            </p>
          )}
        </div>
      </div>

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
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Request Quote
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By submitting this form, you agree to be contacted by {djName} regarding your event.
      </p>
    </form>
  );
}

