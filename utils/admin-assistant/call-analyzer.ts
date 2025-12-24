/**
 * Analyze call transcripts using the admin assistant AI
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CallAnalysisResult {
  success: boolean;
  notesCreated?: number;
  statusUpdated?: boolean;
  errors?: string[];
}

export async function analyzeCallTranscript(
  contactId: string,
  transcript: string,
  callMetadata?: {
    duration?: number;
    callType?: string;
    clientPhone?: string;
  }
): Promise<CallAnalysisResult> {
  const errors: string[] = [];
  let notesCreated = 0;
  let statusUpdated = false;

  try {
    // Get contact details for context
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }

    // Prepare analysis prompt for admin assistant
    const analysisPrompt = `Analyze this phone call transcript and extract key information:

Contact: ${contact.first_name} ${contact.last_name}
Event Type: ${contact.event_type || 'TBD'}
Event Date: ${contact.event_date || 'TBD'}

Call Transcript:
${transcript}

Please:
1. Extract any new information mentioned (event date, guest count, venue, budget, etc.)
2. Identify action items or follow-ups needed
3. Determine if lead status should be updated (e.g., "Qualified", "Booked", "Lost")
4. Create a summary note of the call

Format your response as function calls to update the contact record.`;

    // Call admin assistant API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin-assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will need admin authentication in production
        // For now, we'll use service role or add auth header
      },
      body: JSON.stringify({
        message: analysisPrompt,
        context: {
          contactId,
          type: 'call_analysis',
          callMetadata,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to analyze transcript');
    }

    const data = await response.json();
    
    // The assistant will have called functions like:
    // - update_contact() - to update event details
    // - update_lead_status() - to change status
    // - add_contact_note() - to add call summary

    // Log the functions that were called
    if (data.functions_called) {
      const functionNames = data.functions_called.map((f: any) => f.name);
      
      if (functionNames.includes('add_contact_note')) {
        notesCreated++;
      }
      
      if (functionNames.includes('update_lead_status')) {
        statusUpdated = true;
      }
    }

    // Also create a basic note if assistant didn't
    if (notesCreated === 0) {
      try {
        await supabase.from('contact_notes').insert({
          contact_id: contactId,
          note: `Call transcript: ${transcript.substring(0, 500)}${transcript.length > 500 ? '...' : ''}`,
          is_internal: true,
          created_at: new Date().toISOString(),
        });
        notesCreated++;
      } catch (noteError) {
        console.error('Error creating call note:', noteError);
        errors.push('Failed to create call note');
      }
    }

    return {
      success: true,
      notesCreated,
      statusUpdated,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error analyzing call transcript:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

