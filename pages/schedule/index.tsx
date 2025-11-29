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
}

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [selectedMeetingType, setSelectedMeetingType] = useState<string | null>(null);
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
    eventDate: ''
  });

  // Fetch meeting types
  useEffect(() => {
    fetchMeetingTypes();
  }, []);

  // Pre-fill form from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const { name, email, phone } = router.query;
      if (name || email || phone) {
        setFormData(prev => ({
          ...prev,
          name: typeof name === 'string' ? name : prev.name,
          email: typeof email === 'string' ? email : prev.email,
          phone: typeof phone === 'string' ? phone : prev.phone
        }));
      }
    }
  }, [router.isReady, router.query]);

  // Fetch available slots when date or meeting type changes
  useEffect(() => {
    if (selectedDate && selectedMeetingType) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedMeetingType]);

  const fetchMeetingTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setMeetingTypes(data || []);
      if (data && data.length > 0) {
        setSelectedMeetingType(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching meeting types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load meeting types',
        variant: 'destructive'
      });
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedMeetingType) return;

    setLoadingSlots(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/schedule/available-slots?date=${dateString}&meeting_type_id=${selectedMeetingType}`
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
    if (!selectedDate || !selectedTime || !selectedMeetingType) {
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
      
      const { data, error } = await supabase
        .from('meeting_bookings')
        .insert({
          meeting_type_id: selectedMeetingType,
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone || null,
          meeting_date: meetingDate,
          meeting_time: selectedTime,
          duration_minutes: meetingTypes.find(mt => mt.id === selectedMeetingType)?.duration_minutes || 30,
          notes: formData.notes || null,
          event_type: formData.eventType || null,
          event_date: formData.eventDate || null,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email (this will be implemented)
      // await sendBookingConfirmation(data);

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

  const selectedMeetingTypeData = meetingTypes.find(mt => mt.id === selectedMeetingType);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Can't book same day

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Meeting Type & Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Type Selection */}
            {meetingTypes.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Meeting Type</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meetingTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedMeetingType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedMeetingType === type.id
                          ? 'border-[#fcba00] bg-[#fcba00]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-[#fcba00]" />
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                      <p className="text-xs text-gray-500">{type.duration_minutes} minutes</p>
                    </button>
                  ))}
                </div>
              </Card>
            )}

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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00]"></div>
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
              
              {selectedMeetingTypeData && selectedDate && selectedTime && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{selectedMeetingTypeData.name}</span>
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

