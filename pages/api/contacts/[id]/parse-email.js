import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const supabase = createServerSupabaseClient({ req, res });

    const { id } = req.query;
    const { emailContent } = req.body;

    if (!emailContent) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    // Parse email content to extract information
    const extractedData = parseEmailContent(emailContent);

    // Use service role client for updates
    const env = getEnv();
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update contact record
    const contactUpdates = {};
    if (extractedData.ceremonyTime) contactUpdates.event_time = extractedData.ceremonyTime;
    if (extractedData.ceremonyEndTime) contactUpdates.end_time = extractedData.ceremonyEndTime;
    
    // Store grand entrance/exit in custom_fields since those columns don't exist
    if (extractedData.grandEntrance || extractedData.grandExit) {
      const { data: existingContact } = await supabaseAdmin
        .from('contacts')
        .select('custom_fields')
        .eq('id', id)
        .single();
      
      const existingCustomFields = existingContact?.custom_fields || {};
      contactUpdates.custom_fields = {
        ...existingCustomFields,
        ...(extractedData.grandEntrance ? { grand_entrance_time: extractedData.grandEntrance } : {}),
        ...(extractedData.grandExit ? { grand_exit_time: extractedData.grandExit } : {})
      };
    }
    if (extractedData.specialRequests) {
      const existingRequests = await supabaseAdmin
        .from('contacts')
        .select('special_requests')
        .eq('id', id)
        .single();
      
      const currentRequests = existingRequests.data?.special_requests || '';
      contactUpdates.special_requests = currentRequests 
        ? `${currentRequests}\n\n--- Email Update ---\n${extractedData.specialRequests}`
        : extractedData.specialRequests;
    }
    if (extractedData.notes) {
      const existingNotes = await supabaseAdmin
        .from('contacts')
        .select('notes')
        .eq('id', id)
        .single();
      
      const currentNotes = existingNotes.data?.notes || '';
      contactUpdates.notes = currentNotes 
        ? `${currentNotes}\n\n--- Email Update ---\n${extractedData.notes}`
        : extractedData.notes;
    }

    if (Object.keys(contactUpdates).length > 0) {
      contactUpdates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from('contacts')
        .update(contactUpdates)
        .eq('id', id);

      if (updateError) {
        logger.error('Error updating contact from email', { contactId: id, error: updateError });
      }
    }

    // Update questionnaire data if playlists are found
    if (extractedData.playlists && Object.keys(extractedData.playlists).length > 0) {
      // Get existing questionnaire data
      const { data: existingQuestionnaire } = await supabaseAdmin
        .from('music_questionnaires')
        .select('*')
        .eq('lead_id', id)
        .single();

      const playlistLinks = existingQuestionnaire?.playlist_links || {};
      
      // Merge extracted playlists
      Object.keys(extractedData.playlists).forEach(key => {
        if (extractedData.playlists[key]) {
          playlistLinks[key] = extractedData.playlists[key];
        }
      });

      // Update or insert questionnaire data
      const questionnaireData = {
        lead_id: id,
        playlist_links: playlistLinks,
        updated_at: new Date().toISOString()
      };

      if (existingQuestionnaire) {
        await supabaseAdmin
          .from('music_questionnaires')
          .update(questionnaireData)
          .eq('lead_id', id);
      } else {
        questionnaireData.created_at = new Date().toISOString();
        await supabaseAdmin
          .from('music_questionnaires')
          .insert(questionnaireData);
      }
    }

    return res.status(200).json({
      success: true,
      extractedData,
      message: 'Email parsed and contact updated successfully'
    });

  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error parsing email', { contactId: id, error });
    return res.status(500).json({ error: 'Failed to parse email', details: error.message });
  }
}

function parseEmailContent(emailContent) {
  const extracted = {
    playlists: {},
    ceremonyTime: null,
    ceremonyEndTime: null,
    grandEntrance: null,
    grandExit: null,
    specialRequests: null,
    notes: null
  };

  const lowerContent = emailContent.toLowerCase();

  // Extract Spotify playlist links
  const spotifyRegex = /(?:spotify\.com|open\.spotify\.com)[^\s\)]+/gi;
  const spotifyLinks = emailContent.match(spotifyRegex) || [];
  
  // Try to identify playlist types from context
  spotifyLinks.forEach((link, index) => {
    const contextBefore = emailContent.substring(Math.max(0, emailContent.indexOf(link) - 100), emailContent.indexOf(link));
    const contextLower = contextBefore.toLowerCase();
    
    if (contextLower.includes('first dance') || contextLower.includes('first dances')) {
      extracted.playlists.first_dance = link;
    } else if (contextLower.includes('wedding') && !contextLower.includes('cocktail')) {
      extracted.playlists.reception = link;
    } else if (contextLower.includes('cocktail')) {
      extracted.playlists.cocktail = link;
    } else {
      // Assign in order if no context found
      if (index === 0) extracted.playlists.first_dance = link;
      if (index === 1) extracted.playlists.reception = link;
      if (index === 2) extracted.playlists.cocktail = link;
    }
  });

  // Extract times
  // Ceremony time patterns: "3 pm", "3pm", "3:00 pm", "3:00pm", "3-3:30"
  const ceremonyMatch = emailContent.match(/(?:ceremony|ceremony is)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (ceremonyMatch) {
    extracted.ceremonyTime = normalizeTime(ceremonyMatch[1]);
    extracted.ceremonyEndTime = normalizeTime(ceremonyMatch[2]);
  } else {
    const singleCeremonyMatch = emailContent.match(/(?:ceremony|ceremony is)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (singleCeremonyMatch) {
      extracted.ceremonyTime = normalizeTime(singleCeremonyMatch[1]);
    }
  }

  // Grand entrance
  const entranceMatch = emailContent.match(/(?:grand entrance|entrance)\s*(?:is\s*at|at|:)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (entranceMatch) {
    extracted.grandEntrance = normalizeTime(entranceMatch[1]);
  }

  // Grand exit
  const exitMatch = emailContent.match(/(?:grand exit|exit)\s*(?:is\s*(?:scheduled\s*)?for|scheduled\s*for|at|:)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (exitMatch) {
    extracted.grandExit = normalizeTime(exitMatch[1]);
  }

  // Extract special requests (mariachi, breaks, etc.)
  const specialRequests = [];
  if (lowerContent.includes('mariachi')) {
    const mariachiMatch = emailContent.match(/mariachi[^.]*(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)[^.]*/i);
    if (mariachiMatch) {
      specialRequests.push(mariachiMatch[0].trim());
    }
  }
  if (lowerContent.includes('break') || lowerContent.includes('breaks')) {
    const breakMatch = emailContent.match(/[^.]*(?:break|breaks)[^.]*/i);
    if (breakMatch) {
      specialRequests.push(breakMatch[0].trim());
    }
  }

  if (specialRequests.length > 0) {
    extracted.specialRequests = specialRequests.join('\n');
  }

  // Extract general notes (schedule questions, etc.)
  const notes = [];
  if (emailContent.match(/(?:what does|how does|schedule|arrival|set up|break down)/i)) {
    const scheduleMatch = emailContent.match(/[^.]*(?:what does|how does|schedule|arrival|set up|break down)[^.]*/i);
    if (scheduleMatch) {
      notes.push(scheduleMatch[0].trim());
    }
  }

  if (notes.length > 0) {
    extracted.notes = notes.join('\n');
  }

  return extracted;
}

function normalizeTime(timeStr) {
  if (!timeStr) return null;
  
  // Remove extra spaces
  timeStr = timeStr.trim();
  
  // Handle formats like "3 pm", "3pm", "3:00 pm", "3:00pm"
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    let ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    
    // If no AM/PM specified, assume PM for times 1-11, AM for 12
    if (!ampm) {
      if (hours >= 1 && hours <= 11) {
        // Assume PM for afternoon/evening times
        ampm = 'pm';
      } else if (hours === 12) {
        ampm = 'pm';
      }
    }
    
    // Convert to 24-hour format
    if (ampm === 'pm' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
  
  return null;
}

