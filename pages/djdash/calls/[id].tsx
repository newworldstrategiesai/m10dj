import React from 'react';
import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Phone, Calendar, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CallTranscriptionView from '@/components/djdash/CallTranscriptionView';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';

interface CallDetailPageProps {
  call: any;
  error?: string;
}

export default function CallDetailPage({ call, error }: CallDetailPageProps) {
  if (error || !call) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DJDashHeader />
        <div className="container mx-auto px-4 py-12">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Call Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This call record does not exist.'}</p>
            <Button asChild>
              <Link href="/djdash/dashboard">Back to Dashboard</Link>
            </Button>
          </Card>
        </div>
        <DJDashFooter />
      </div>
    );
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DJDashHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/djdash/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Call Transcription */}
            <CallTranscriptionView
              callId={call.id}
              recordingUrl={call.recording_url}
              transcriptionText={call.transcription_text}
              transcriptionStatus={call.transcription_status}
              transcriptionConfidence={call.transcription_confidence}
              extractedMetadata={call.extracted_metadata}
              callDuration={call.call_duration_seconds}
            />

            {/* Call Notes */}
            {call.notes && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notes</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{call.notes}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Call Details */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Call Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Caller</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {call.caller_name || 'Unknown'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                    {formatPhoneNumber(call.caller_number)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date & Time</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-900 dark:text-white">{formatDate(call.timestamp)}</p>
                  </div>
                </div>

                {call.page_url && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Source</p>
                    <a
                      href={call.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      {call.page_url}
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                  <Badge
                    variant={
                      call.call_status === 'completed' ? 'default' :
                      call.call_status === 'voicemail' ? 'secondary' : 'outline'
                    }
                  >
                    {call.call_status || 'Unknown'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Lead Score</p>
                  <Badge
                    variant={
                      call.lead_score === 'hot' ? 'default' :
                      call.lead_score === 'warm' ? 'secondary' : 'outline'
                    }
                  >
                    {call.lead_score || 'Unknown'}
                  </Badge>
                </div>

                {call.is_booked && (
                  <div>
                    <Badge className="bg-green-500 text-white">Booked</Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Extracted Metadata Summary */}
            {call.extracted_metadata && Object.keys(call.extracted_metadata).length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Information</h3>
                <div className="space-y-3">
                  {call.extracted_metadata.event_type && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Event Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {call.extracted_metadata.event_type}
                      </p>
                    </div>
                  )}
                  {call.extracted_metadata.event_date && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Event Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {call.extracted_metadata.event_date}
                      </p>
                    </div>
                  )}
                  {call.extracted_metadata.budget && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {call.extracted_metadata.budget}
                        </p>
                      </div>
                    </div>
                  )}
                  {call.extracted_metadata.guest_count && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Guest Count</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {call.extracted_metadata.guest_count}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* TipJar Status */}
            {call.tipjar_link_sent && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Follow-up</h3>
                <div className="space-y-2">
                  <Badge className="bg-green-500 text-white">TipJar Link Sent</Badge>
                  {call.tipjar_payment_received && (
                    <div>
                      <Badge className="bg-blue-500 text-white">Payment Received</Badge>
                      {call.tipjar_payment_amount && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Amount: ${parseFloat(call.tipjar_payment_amount).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <DJDashFooter />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const supabase = createServerSupabaseClient(context);

  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { props: { call: null, error: 'Unauthorized' } };
    }

    // Get call record with DJ profile info
    const { data: call, error: callError } = await supabase
      .from('dj_calls')
      .select(`
        *,
        dj_profiles!inner(
          id,
          dj_name,
          organization_id,
          organizations!inner(product_context)
        )
      `)
      .eq('id', id)
      .eq('product_context', 'djdash')
      .single();

    if (callError || !call) {
      return { props: { call: null, error: 'Call not found' } };
    }

    // Verify user has access (is DJ owner or admin)
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .eq('organization_id', call.dj_profiles.organization_id)
      .single();

    // Check if admin
    const { data: adminCheck } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!orgMember && !adminCheck) {
      return { props: { call: null, error: 'Access denied' } };
    }

    return { props: { call } };
  } catch (error) {
    console.error('Error fetching call:', error);
    return { props: { call: null, error: 'Failed to load call' } };
  }
};






