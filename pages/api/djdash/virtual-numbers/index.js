import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// GET /api/djdash/virtual-numbers?dj_profile_id=xxx - Get virtual number for a DJ
// POST /api/djdash/virtual-numbers - Assign/create virtual number for a DJ
// PUT /api/djdash/virtual-numbers - Update virtual number configuration
export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (req.method === 'GET') {
    try {
      const { dj_profile_id } = req.query;

      if (!dj_profile_id) {
        return res.status(400).json({ error: 'dj_profile_id is required' });
      }

      // Get existing virtual number
      const { data: virtualNumber, error: vnError } = await supabase
        .from('dj_virtual_numbers')
        .select('*')
        .eq('dj_profile_id', dj_profile_id)
        .eq('product_context', 'djdash')
        .eq('is_active', true)
        .single();

      if (vnError && vnError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching virtual number:', vnError);
        return res.status(500).json({ error: 'Failed to fetch virtual number' });
      }

      if (!virtualNumber) {
        return res.status(404).json({ error: 'No virtual number assigned' });
      }

      return res.status(200).json({ success: true, virtualNumber });
    } catch (error) {
      console.error('Error in GET /api/djdash/virtual-numbers:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { dj_profile_id, real_phone_number } = req.body;

      if (!dj_profile_id || !real_phone_number) {
        return res.status(400).json({
          error: 'Missing required fields: dj_profile_id, real_phone_number'
        });
      }

      // Verify DJ profile exists
      const { data: profile, error: profileError } = await supabase
        .from('dj_profiles')
        .select('id, organization_id, dj_slug, organizations!inner(product_context)')
        .eq('id', dj_profile_id)
        .eq('is_published', true)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'DJ profile not found or not published' });
      }

      if (profile.organizations?.product_context !== 'djdash') {
        return res.status(403).json({ error: 'Invalid product context' });
      }

      // Check if virtual number already exists
      const { data: existing } = await supabase
        .from('dj_virtual_numbers')
        .select('*')
        .eq('dj_profile_id', dj_profile_id)
        .eq('product_context', 'djdash')
        .single();

      if (existing) {
        // Update existing record
        const { data: updated, error: updateError } = await supabase
          .from('dj_virtual_numbers')
          .update({
            real_phone_number,
            is_active: true
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({ error: 'Failed to update virtual number' });
        }

        return res.status(200).json({ success: true, virtualNumber: updated });
      }

      // Create new virtual number via Twilio
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return res.status(500).json({ error: 'Twilio credentials not configured' });
      }

      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/api/djdash/calls/incoming`;
      const statusCallbackUrl = `${baseUrl}/api/djdash/calls/webhook`;

      // Strategy: Try to get an available number from existing Twilio numbers first
      // If none available, search for and purchase a new number
      let phoneNumber;
      let phoneNumberSid;

      try {
        // First, try to find an available number from existing Twilio numbers
        // Check if there's a number pool table or use existing numbers
        const existingNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 100 });
        
        // Find numbers that aren't already assigned
        const { data: assignedNumbers } = await supabase
          .from('dj_virtual_numbers')
          .select('virtual_number, twilio_phone_number_sid')
          .eq('is_active', true);

        const assignedSids = new Set(
          assignedNumbers?.map(n => n.twilio_phone_number_sid) || []
        );

        // Find an unassigned number from existing Twilio numbers
        const availableExisting = existingNumbers.find(
          num => !assignedSids.has(num.sid)
        );

        if (availableExisting) {
          phoneNumber = availableExisting.phoneNumber;
          phoneNumberSid = availableExisting.sid;
          
          console.log(`Using existing Twilio number: ${phoneNumber} (${phoneNumberSid})`);
        } else {
          // No available existing numbers, search for and purchase a new one
          console.log('No available existing numbers, searching for new number...');
          
          // Search for available local numbers (you can customize area code)
          const availableNumbers = await twilioClient.availablePhoneNumbers('US')
            .local
            .list({ 
              limit: 1,
              // Optional: filter by area code
              // areaCode: '901' // Memphis area code
            });

          if (availableNumbers.length === 0) {
            return res.status(500).json({
              error: 'No available phone numbers found. Please purchase numbers in Twilio console or contact support.',
              suggestion: 'You can purchase numbers in bulk from Twilio and they will be automatically assigned.'
            });
          }

          // Purchase the number
          const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
            phoneNumber: availableNumbers[0].phoneNumber,
            voiceUrl: webhookUrl,
            voiceMethod: 'POST',
            statusCallback: statusCallbackUrl,
            statusCallbackMethod: 'POST',
            voiceCallerIdLookup: true // Enable caller ID lookup
          });

          phoneNumber = purchasedNumber.phoneNumber;
          phoneNumberSid = purchasedNumber.sid;
          
          console.log(`Purchased new Twilio number: ${phoneNumber} (${phoneNumberSid})`);
        }

        // Configure the number with webhooks (if using existing number)
        if (availableExisting) {
          await twilioClient.incomingPhoneNumbers(phoneNumberSid)
            .update({
              voiceUrl: webhookUrl,
              voiceMethod: 'POST',
              statusCallback: statusCallbackUrl,
              statusCallbackMethod: 'POST',
              voiceCallerIdLookup: true
            });
          
          console.log(`Configured webhooks for existing number: ${phoneNumber}`);
        }

      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        return res.status(500).json({
          error: 'Failed to acquire phone number from Twilio',
          details: twilioError.message,
          code: twilioError.code
        });
      }

      // Create the virtual number record
      const { data: virtualNumber, error: insertError } = await supabase
        .from('dj_virtual_numbers')
        .insert({
          dj_profile_id,
          virtual_number: phoneNumber,
          twilio_phone_number_sid: phoneNumberSid,
          real_phone_number: real_phone_number,
          product_context: 'djdash',
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating virtual number record:', insertError);
        // If database insert fails, we should release the Twilio number
        // (in production, you might want to keep it for manual cleanup)
        return res.status(500).json({ 
          error: 'Failed to create virtual number record',
          details: insertError.message
        });
      }

      return res.status(201).json({ 
        success: true, 
        virtualNumber,
        message: 'Virtual number assigned successfully'
      });
    } catch (error) {
      console.error('Error in POST /api/djdash/virtual-numbers:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { dj_profile_id, real_phone_number, is_active } = req.body;

      if (!dj_profile_id) {
        return res.status(400).json({ error: 'dj_profile_id is required' });
      }

      // Find existing virtual number
      const { data: existing, error: findError } = await supabase
        .from('dj_virtual_numbers')
        .select('*')
        .eq('dj_profile_id', dj_profile_id)
        .eq('product_context', 'djdash')
        .single();

      if (findError || !existing) {
        return res.status(404).json({ error: 'Virtual number not found' });
      }

      // Update fields
      const updateData = {};
      if (real_phone_number !== undefined) updateData.real_phone_number = real_phone_number;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updated, error: updateError } = await supabase
        .from('dj_virtual_numbers')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update virtual number' });
      }

      return res.status(200).json({ success: true, virtualNumber: updated });
    } catch (error) {
      console.error('Error in PUT /api/djdash/virtual-numbers:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
