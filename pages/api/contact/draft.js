import { createClient } from '@supabase/supabase-js';
import { getClientIp } from '../../../utils/rate-limiter';
import { sanitizeContactFormData } from '../../../utils/input-sanitizer';

/**
 * Draft/Incomplete Submission API
 * Saves form data even if the user hasn't submitted yet
 * This helps capture leads who get sidetracked while filling out the form
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Validate Supabase credentials
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials for draft submission');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { name, email, phone, eventType, eventDate, eventTime, venueName, venueAddress, location, message, guests, honeypot } = req.body;

  // SECURITY: Honeypot check - if filled, it's likely a bot
  if (honeypot && honeypot.trim().length > 0) {
    console.log('🤖 Bot detected via honeypot field from IP:', getClientIp(req));
    return res.status(200).json({ 
      success: true,
      message: 'Draft saved',
      _botDetected: true
    });
  }

  // Minimal validation - only require name and email for drafts
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name is required to save draft' 
    });
  }

  if (!email || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid email is required to save draft' 
    });
  }

  try {
    // Sanitize data
    const sanitizedData = sanitizeContactFormData({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      eventType: eventType || 'Other', // Default to 'Other' if not provided
      eventDate: eventDate || null,
      location: (venueName && venueAddress) 
        ? `${venueName}, ${venueAddress}` 
        : (venueName || venueAddress || location || null),
      message: message?.trim() || null
    });

    // Build location string for backward compatibility
    const finalLocation = (venueName && venueAddress) 
      ? `${venueName}, ${venueAddress}` 
      : (venueName || venueAddress || location || null);

    // Check if a draft already exists for this email
    const { data: existingDraft, error: checkError } = await supabase
      .from('contact_submissions')
      .select('id, name, email, created_at')
      .eq('email', sanitizedData.email)
      .eq('is_draft', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let draftId;
    let isNewDraft = false;

    if (existingDraft && !checkError) {
      // Update existing draft
      const { data: updatedDraft, error: updateError } = await supabase
        .from('contact_submissions')
        .update({
          name: sanitizedData.name,
          phone: sanitizedData.phone,
          event_type: sanitizedData.eventType,
          event_date: sanitizedData.eventDate || null,
          event_time: eventTime || null,
          location: finalLocation,
          message: sanitizedData.message,
          guests: guests || null,
          venue_name: venueName?.trim() || null,
          venue_address: venueAddress?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating draft:', updateError);
        throw updateError;
      }

      draftId = updatedDraft.id;
      console.log('✅ Updated existing draft:', draftId);
    } else {
      // Create new draft
      const { data: newDraft, error: insertError } = await supabase
        .from('contact_submissions')
        .insert([{
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone || null,
          event_type: sanitizedData.eventType,
          event_date: sanitizedData.eventDate || null,
          event_time: eventTime || null,
          location: finalLocation,
          message: sanitizedData.message,
          guests: guests || null,
          venue_name: venueName?.trim() || null,
          venue_address: venueAddress?.trim() || null,
          status: 'new',
          is_draft: true, // Mark as draft
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating draft:', insertError);
        throw insertError;
      }

      draftId = newDraft.id;
      isNewDraft = true;
      console.log('✅ Created new draft:', draftId);
    }

    return res.status(200).json({
      success: true,
      draftId,
      isNewDraft,
      message: 'Draft saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save draft. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

