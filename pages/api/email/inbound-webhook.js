import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

// Email parsing functions (same as in import-thread.ts)
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

  const entranceMatch = emailContent.match(/(?:grand entrance|entrance)\s*(?:is\s*at|at|:)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (entranceMatch) {
    extracted.grandEntrance = normalizeTime(entranceMatch[1]);
  }

  const exitMatch = emailContent.match(/(?:grand exit|exit)\s*(?:is\s*(?:scheduled\s*)?for|scheduled\s*for|at|:)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (exitMatch) {
    extracted.grandExit = normalizeTime(exitMatch[1]);
  }

  // Extract special requests
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

  // Extract general notes
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
  
  timeStr = timeStr.trim();
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    let ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    
    if (!ampm) {
      if (hours >= 1 && hours <= 11) {
        ampm = 'pm';
      } else if (hours === 12) {
        ampm = 'pm';
      }
    }
    
    if (ampm === 'pm' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
  
  return null;
}

// Verify webhook signature from Resend
function verifyWebhookSignature(payload, signature) {
  if (!RESEND_WEBHOOK_SECRET) {
    console.warn('⚠️ RESEND_WEBHOOK_SECRET not set, skipping signature verification');
    return true; // Allow in development if secret not set
  }

  const hmac = crypto.createHmac('sha256', RESEND_WEBHOOK_SECRET);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature if secret is configured
    const signature = req.headers['resend-signature'];
    if (RESEND_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(req.body, signature);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { type, data } = req.body;

    // Resend sends different event types, we care about 'email.received'
    if (type !== 'email.received') {
      console.log(`ℹ️ Ignoring webhook type: ${type}`);
      return res.status(200).json({ received: true, message: 'Event type not processed' });
    }

    const { from, to, subject, text, html, headers } = data;

    // Extract email content (prefer text, fallback to HTML)
    let emailContent = text || '';
    if (!emailContent && html) {
      // Basic HTML stripping - remove tags and decode entities
      emailContent = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!emailContent) {
      console.error('❌ No email content found');
      return res.status(400).json({ error: 'No email content found' });
    }

    console.log('📧 Processing forwarded email:', {
      from: from?.email,
      to: to?.[0]?.email,
      subject,
      contentLength: emailContent.length
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Find contact by sender email
    const senderEmail = from?.email;
    if (!senderEmail) {
      console.error('❌ No sender email found');
      return res.status(400).json({ error: 'No sender email found' });
    }

    // Search for existing contact by email
    const { data: contacts, error: searchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address')
      .eq('email_address', senderEmail.toLowerCase())
      .limit(1);

    if (searchError) {
      console.error('❌ Error searching for contact:', searchError);
      return res.status(500).json({ error: 'Database error', details: searchError.message });
    }

    if (!contacts || contacts.length === 0) {
      console.log(`ℹ️ No contact found for email: ${senderEmail}`);
      return res.status(200).json({ 
        received: true, 
        message: 'Email processed but no matching contact found',
        suggestion: 'Contact will need to be created manually or email should be forwarded from an existing contact'
      });
    }

    const contact = contacts[0];
    const contactId = contact.id;

    console.log(`✅ Found contact: ${contact.first_name} ${contact.last_name} (${contactId})`);

    // Parse email content
    const extractedData = parseEmailContent(emailContent);

    // Update contact record
    const contactUpdates = {};
    if (extractedData.ceremonyTime) contactUpdates.event_time = extractedData.ceremonyTime;
    if (extractedData.ceremonyEndTime) contactUpdates.end_time = extractedData.ceremonyEndTime;
    
    // Store grand entrance/exit in custom_fields since those columns don't exist
    if (extractedData.grandEntrance || extractedData.grandExit) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('custom_fields')
        .eq('id', contactId)
        .single();
      
      const existingCustomFields = existingContact?.custom_fields || {};
      contactUpdates.custom_fields = {
        ...existingCustomFields,
        ...(extractedData.grandEntrance ? { grand_entrance_time: extractedData.grandEntrance } : {}),
        ...(extractedData.grandExit ? { grand_exit_time: extractedData.grandExit } : {})
      };
    }
    
    if (extractedData.specialRequests) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('special_requests')
        .eq('id', contactId)
        .single();
      
      const currentRequests = existingContact?.special_requests || '';
      contactUpdates.special_requests = currentRequests 
        ? `${currentRequests}\n\n--- Email Update (${new Date().toLocaleString()}) ---\n${extractedData.specialRequests}`
        : extractedData.specialRequests;
    }
    
    if (extractedData.notes) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('notes')
        .eq('id', contactId)
        .single();
      
      const currentNotes = existingContact?.notes || '';
      contactUpdates.notes = currentNotes 
        ? `${currentNotes}\n\n--- Email Update (${new Date().toLocaleString()}) ---\nSubject: ${subject}\n${extractedData.notes}`
        : `--- Email Update (${new Date().toLocaleString()}) ---\nSubject: ${subject}\n${extractedData.notes}`;
    }

    // Always update last_contacted_date
    contactUpdates.last_contacted_date = new Date().toISOString();
    contactUpdates.last_contact_type = 'email';
    contactUpdates.updated_at = new Date().toISOString();

    if (Object.keys(contactUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(contactUpdates)
        .eq('id', contactId);

      if (updateError) {
        console.error('❌ Error updating contact:', updateError);
        return res.status(500).json({ error: 'Failed to update contact', details: updateError.message });
      }

      console.log('✅ Contact updated successfully');
    }

    // Update questionnaire data if playlists are found
    if (extractedData.playlists && Object.keys(extractedData.playlists).length > 0) {
      const { data: existingQuestionnaire } = await supabase
        .from('music_questionnaires')
        .select('*')
        .eq('lead_id', contactId)
        .single();

      const playlistLinks = existingQuestionnaire?.playlist_links || {};
      
      Object.keys(extractedData.playlists).forEach(key => {
        if (extractedData.playlists[key]) {
          playlistLinks[key] = extractedData.playlists[key];
        }
      });

      const questionnaireData = {
        lead_id: contactId,
        playlist_links: playlistLinks,
        updated_at: new Date().toISOString()
      };

      if (existingQuestionnaire) {
        await supabase
          .from('music_questionnaires')
          .update(questionnaireData)
          .eq('lead_id', contactId);
      } else {
        questionnaireData.created_at = new Date().toISOString();
        await supabase
          .from('music_questionnaires')
          .insert(questionnaireData);
      }

      console.log('✅ Playlists updated successfully');
    }

    // Save email as structured communication record
    try {
      // Check if communication_log table exists and save email there
      const { error: commError } = await supabase
        .from('communication_log')
        .insert({
          contact_submission_id: contactId, // Using contactId as reference
          communication_type: 'email',
          direction: 'inbound',
          subject: subject,
          content: emailContent,
          status: 'delivered',
          sent_by: senderEmail,
          sent_to: to?.[0]?.email || 'import@m10djcompany.com',
          metadata: {
            extracted_data: extractedData,
            forwarded: true,
            parsed_at: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (commError) {
        console.warn('⚠️ Could not save to communication_log (table may not exist):', commError.message);
        // Don't fail if communication_log doesn't exist
      } else {
        console.log('✅ Email saved to communication_log');
      }
    } catch (commErr) {
      console.warn('⚠️ Error saving to communication_log:', commErr.message);
      // Continue even if this fails
    }

    return res.status(200).json({
      success: true,
      message: 'Email processed and contact updated successfully',
      contactId,
      extractedData
    });

  } catch (error) {
    console.error('❌ Error processing inbound email:', error);
    return res.status(500).json({ 
      error: 'Failed to process email', 
      details: error.message 
    });
  }
}

