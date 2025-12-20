/**
 * Twilio Webhook Handler for Call Events
 * Receives call status updates from Twilio
 */

import { NextRequest, NextResponse } from 'next/server';
import { logCallEvent } from '@/utils/callTracking';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Twilio webhook parameters
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string; // Virtual number
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const recordingUrl = formData.get('RecordingUrl') as string | null;
    
    // Map Twilio status to our status
    const statusMap: Record<string, 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail'> = {
      'completed': 'completed',
      'no-answer': 'no_answer',
      'busy': 'busy',
      'failed': 'failed',
      'voicemail': 'voicemail'
    };
    
    const callStatusMapped = statusMap[callStatus] || 'failed';
    const duration = parseInt(callDuration || '0', 10);
    
    // Get attribution from virtual number
    // In production, you'd look up which DJ this number belongs to
    // For now, we'll need to pass this via webhook parameters or store mapping
    
    // Log call event
    const callId = await logCallEvent({
      virtual_number: to,
      caller_number: from,
      call_duration_seconds: duration,
      call_status: callStatusMapped,
      recording_url: recordingUrl || undefined
    }, {
      // Attribution would be looked up from virtual number mapping
      // This is simplified
    });
    
    // Return TwiML response (if needed)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

