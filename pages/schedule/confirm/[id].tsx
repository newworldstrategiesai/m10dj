'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Calendar, Clock, User, Mail, Phone, CheckCircle, Download, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';

interface Booking {
  id: string;
  meeting_type_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  meeting_date: string;
  meeting_time: string;
  duration_minutes: number;
  event_type: string | null;
  event_date: string | null;
  notes: string | null;
  status: string;
  meeting_types?: {
    name: string;
    description: string | null;
  };
}

export default function BookingConfirmation() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = createClientComponentClient();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchBooking(id);
    }
  }, [id]);

  const fetchBooking = async (bookingId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('meeting_bookings')
        .select(`
          *,
          meeting_types (
            name,
            description
          )
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Booking not found');

      setBooking(data);
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const downloadCalendarInvite = () => {
    if (!booking) return;

    const startDate = new Date(`${booking.meeting_date}T${booking.meeting_time}`);
    const endDate = new Date(startDate.getTime() + booking.duration_minutes * 60000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//M10 DJ Company//Booking System//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@m10djcompany.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${booking.meeting_types?.name || 'Consultation'} with M10 DJ Company`,
      `DESCRIPTION:${booking.meeting_types?.description || 'Consultation meeting'}${booking.notes ? `\\n\\nNotes: ${booking.notes}` : ''}`,
      `LOCATION:Phone/Video Call`,
      `ORGANIZER;CN=M10 DJ Company:mailto:info@m10djcompany.com`,
      `ATTENDEE;CN=${booking.client_name};RSVP=TRUE:mailto:${booking.client_email}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consultation-${booking.meeting_date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fcba00] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The booking you\'re looking for doesn\'t exist.'}</p>
              <Button
                onClick={() => router.push('/schedule')}
                className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scheduling
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const meetingDate = new Date(`${booking.meeting_date}T${booking.meeting_time}`);
  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-gray-600">
              Your consultation has been scheduled successfully
            </p>
          </div>

          {/* Booking Details Card */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meeting Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fcba00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#fcba00]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fcba00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#fcba00]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formattedTime}</p>
                  <p className="text-sm text-gray-500">Duration: {booking.duration_minutes} minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fcba00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#fcba00]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Meeting Type</p>
                  <p className="text-lg font-semibold text-gray-900">{booking.meeting_types?.name || 'Consultation'}</p>
                  {booking.meeting_types?.description && (
                    <p className="text-sm text-gray-600 mt-1">{booking.meeting_types.description}</p>
                  )}
                </div>
              </div>

              {booking.event_type && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#fcba00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#fcba00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Event</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.event_type}</p>
                    {booking.event_date && (
                      <p className="text-sm text-gray-600 mt-1">Event Date: {new Date(booking.event_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}

              {booking.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Your Notes:</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Contact Information Card */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{booking.client_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${booking.client_email}`} className="font-semibold text-[#fcba00] hover:underline">
                    {booking.client_email}
                  </a>
                </div>
              </div>

              {booking.client_phone && (
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${booking.client_phone}`} className="font-semibold text-gray-900 hover:text-[#fcba00]">
                      {booking.client_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button
              onClick={downloadCalendarInvite}
              className="w-full bg-white border-2 border-[#fcba00] text-[#fcba00] hover:bg-[#fcba00] hover:text-black"
            >
              <Download className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <Button
              onClick={() => router.push('/contact')}
              className="w-full bg-[#fcba00] hover:bg-[#d99f00] text-black"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Us
            </Button>
          </div>

          {/* Important Information */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>You'll receive a confirmation email with all the details</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>We'll send you a reminder 24 hours before your meeting</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>If you need to reschedule or cancel, please contact us at <a href="tel:+19014102020" className="text-[#fcba00] hover:underline font-semibold">(901) 410-2020</a></span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}

