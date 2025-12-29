'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Calendar as CalendarIcon, Clock, CheckCircle, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MeetingType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  color: string;
}

interface TimeSlot {
  time: string;
  formatted: string;
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  eventType: string;
  eventDate: string;
  venueName?: string;
  venueAddress?: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [defaultMeetingType, setDefaultMeetingType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    eventType: '',
    eventDate: '',
    venueName: '',
    venueAddress: ''
  });

  // Fetch default meeting type (for admin use only, not shown to clients)
  useEffect(() => {
    fetchDefaultMeetingType();
  }, []);

  // Pre-fill form from URL query parameters or sessionStorage
  useEffect(() => {
    if (router.isReady) {
      const { name, email, phone, eventType, eventDate, venueName, venueAddress, notes } = router.query;
      
      // Check sessionStorage first (from contact form submission)
      let contactFormData = null;
      if (typeof window !== 'undefined') {
        try {
          const saved = sessionStorage.getItem('contact_form_data');
          if (saved) {
            contactFormData = JSON.parse(saved);
          }
        } catch (e) {
          console.debug('Could not read contact form data from sessionStorage:', e);
        }
      }
      
      // Prefer URL params, fallback to sessionStorage, then to existing form data
      setFormData(prev => ({
        ...prev,
        name: typeof name === 'string' ? decodeURIComponent(name) : (contactFormData?.name || prev.name),
        email: typeof email === 'string' ? decodeURIComponent(email) : (contactFormData?.email || prev.email),
        phone: typeof phone === 'string' ? decodeURIComponent(phone) : (contactFormData?.phone || prev.phone),
        eventType: typeof eventType === 'string' ? decodeURIComponent(eventType) : (contactFormData?.eventType || prev.eventType),
        eventDate: typeof eventDate === 'string' ? eventDate : (contactFormData?.eventDate || prev.eventDate),
        venueName: typeof venueName === 'string' ? decodeURIComponent(venueName) : (contactFormData?.venueName || prev.venueName || ''),
        venueAddress: typeof venueAddress === 'string' ? decodeURIComponent(venueAddress) : (contactFormData?.venueAddress || prev.venueAddress || ''),
        notes: typeof notes === 'string' ? decodeURIComponent(notes) : (contactFormData?.message || prev.notes)
      }));
      
      // Clear sessionStorage after using it (one-time use)
      if (contactFormData && typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('contact_form_data');
        } catch (e) {
          // Ignore errors
        }
      }
    }
  }, [router.isReady, router.query]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate]);

  const fetchDefaultMeetingType = async () => {
    try {
      // Get the first active meeting type (default is Consultation)
      // This is used internally but not shown to clients
      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setDefaultMeetingType(data);
      }
    } catch (error) {
      console.error('Error fetching default meeting type:', error);
      // Don't show error to user, just log it
      // The booking will still work with a default duration
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      // API will use default meeting type if not provided
      const response = await fetch(
        `/api/schedule/available-slots?date=${dateString}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots',
        variant: 'destructive'
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name and email',
        variant: 'destructive'
      });
      return;
    }

    setBooking(true);
    try {
      const meetingDate = selectedDate.toISOString().split('T')[0];
      
      // Use default meeting type if available, otherwise use NULL (database allows it)
      const meetingTypeId = defaultMeetingType?.id || null;
      const durationMinutes = defaultMeetingType?.duration_minutes || 30;
      
      const { data, error } = await supabase
        .from('meeting_bookings')
        .insert({
          meeting_type_id: meetingTypeId,
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone || null,
          meeting_date: meetingDate,
          meeting_time: selectedTime,
          duration_minutes: durationMinutes,
          notes: formData.notes || null,
          event_type: formData.eventType || null,
          event_date: formData.eventDate || null,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation emails
      if (data && defaultMeetingType) {
        // Send emails in background (don't wait for them)
        fetch('/api/schedule/send-confirmation-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.id,
            clientName: formData.name,
            clientEmail: formData.email,
            clientPhone: formData.phone,
            meetingType: defaultMeetingType.name,
            meetingDate: meetingDate,
            meetingTime: selectedTime,
            durationMinutes: defaultMeetingType.duration_minutes,
            eventType: formData.eventType || null,
            eventDate: formData.eventDate || null,
            notes: formData.notes || null,
            meetingDescription: defaultMeetingType.description
          })
        }).catch(err => console.error('Failed to send confirmation emails:', err));
      }

      toast({
        title: 'Booking Confirmed!',
        description: 'Your meeting has been scheduled. Check your email for confirmation details.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        notes: '',
        eventType: '',
        eventDate: ''
      });
      setSelectedDate(undefined);
      setSelectedTime(null);

      // Redirect to confirmation page
      router.push(`/schedule/confirm/${data.id}`);
    } catch (error: any) {
      console.error('Error booking meeting:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to book meeting. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setBooking(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Can't book same day

  // Check if we have pre-filled event information
  const hasEventInfo = formData.eventType || formData.eventDate || formData.venueName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Schedule a Meeting
          </h1>
          <p className="text-lg text-gray-600">
            Book a time to discuss your event with Ben
          </p>
        </div>

        {/* Event Information Display (when pre-filled) */}
        {hasEventInfo && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-[#fcba00]/10 to-[#fcba00]/5 border-[#fcba00]/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="w-6 h-6 text-[#fcba00]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Your Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {formData.eventType && (
                    <div>
                      <span className="font-medium text-gray-700">Event Type:</span>{' '}
                      <span className="text-gray-900">{formData.eventType}</span>
                    </div>
                  )}
                  {formData.eventDate && (
                    <div>
                      <span className="font-medium text-gray-700">Event Date:</span>{' '}
                      <span className="text-gray-900">
                        {new Date(formData.eventDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {formData.venueName && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Venue:</span>{' '}
                      <span className="text-gray-900">{formData.venueName}</span>
                      {formData.venueAddress && (
                        <span className="text-gray-600"> - {formData.venueAddress}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#fcba00]" />
                Select a Date
              </h2>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < minDate}
                className="rounded-md border"
              />
            </Card>

            {/* Available Time Slots */}
            {selectedDate && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Available Times</h2>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <img
                      src="/M10-Rotating-Logo.gif"
                      alt="M10 DJ Company Loading"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No available time slots for this date. Please select another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTime === slot.time
                            ? 'border-[#fcba00] bg-[#fcba00] text-black font-semibold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {slot.formatted}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              
              {selectedDate && selectedTime && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{defaultMeetingType?.name || 'Consultation'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">
                      {availableSlots.find(s => s.time === selectedTime)?.formatted}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(901) 555-1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type (optional)
                  </label>
                  <Input
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    placeholder="Wedding, Corporate, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>

                {(formData.venueName || formData.venueAddress) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Information
                    </label>
                    <div className="space-y-2">
                      {formData.venueName && (
                        <Input
                          value={formData.venueName}
                          disabled
                          className="bg-gray-50 text-gray-600"
                          placeholder="Venue name"
                        />
                      )}
                      {formData.venueAddress && (
                        <Input
                          value={formData.venueAddress}
                          disabled
                          className="bg-gray-50 text-gray-600"
                          placeholder="Venue address"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pre-filled from your contact form</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requests or information..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || !formData.name || !formData.email || booking}
                  className="w-full bg-[#fcba00] hover:bg-[#d99f00] text-black font-semibold"
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

