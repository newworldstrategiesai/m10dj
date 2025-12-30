import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

/**
 * Number Pool Management API
 * 
 * This endpoint helps manage a pool of Twilio phone numbers for DJ Dash.
 * 
 * GET - List all available numbers in the pool
 * POST - Purchase numbers and add them to the pool
 * DELETE - Release a number from the pool
 */

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  if (req.method === 'GET') {
    try {
      // Get all Twilio numbers
      const twilioNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 1000 });
      
      // Get assigned numbers from database
      const { data: assignedNumbers } = await supabase
        .from('dj_virtual_numbers')
        .select('virtual_number, twilio_phone_number_sid, is_active, dj_profiles(dj_name)')
        .eq('is_active', true);

      const assignedSids = new Set(
        assignedNumbers?.map(n => n.twilio_phone_number_sid) || []
      );

      // Categorize numbers
      const available = twilioNumbers.filter(n => !assignedSids.has(n.sid));
      const assigned = twilioNumbers.filter(n => assignedSids.has(n.sid));

      return res.status(200).json({
        success: true,
        pool: {
          total: twilioNumbers.length,
          available: available.length,
          assigned: assigned.length,
          numbers: {
            available: available.map(n => ({
              phoneNumber: n.phoneNumber,
              sid: n.sid,
              friendlyName: n.friendlyName,
              dateCreated: n.dateCreated
            })),
            assigned: assigned.map(n => {
              const assignment = assignedNumbers?.find(
                a => a.twilio_phone_number_sid === n.sid
              );
              return {
                phoneNumber: n.phoneNumber,
                sid: n.sid,
                friendlyName: n.friendlyName,
                dateCreated: n.dateCreated,
                assignedTo: assignment?.dj_profiles?.dj_name || 'Unknown',
                isActive: assignment?.is_active || false
              };
            })
          }
        }
      });
    } catch (error) {
      console.error('Error listing number pool:', error);
      return res.status(500).json({ error: 'Failed to list number pool', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { count = 1, areaCode } = req.body;

      if (count > 10) {
        return res.status(400).json({ error: 'Cannot purchase more than 10 numbers at once' });
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/api/djdash/calls/incoming`;
      const statusCallbackUrl = `${baseUrl}/api/djdash/calls/webhook`;

      const purchasedNumbers = [];

      for (let i = 0; i < count; i++) {
        try {
          // Search for available numbers
          const searchParams = { limit: 1 };
          if (areaCode) {
            searchParams.areaCode = areaCode;
          }

          const availableNumbers = await twilioClient.availablePhoneNumbers('US')
            .local
            .list(searchParams);

          if (availableNumbers.length === 0) {
            return res.status(400).json({
              error: `No available numbers found${areaCode ? ` for area code ${areaCode}` : ''}`,
              purchased: purchasedNumbers
            });
          }

          // Purchase the number
          const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
            phoneNumber: availableNumbers[0].phoneNumber,
            voiceUrl: webhookUrl,
            voiceMethod: 'POST',
            statusCallback: statusCallbackUrl,
            statusCallbackMethod: 'POST',
            voiceCallerIdLookup: true
          });

          purchasedNumbers.push({
            phoneNumber: purchasedNumber.phoneNumber,
            sid: purchasedNumber.sid,
            friendlyName: purchasedNumber.friendlyName
          });

          console.log(`Purchased number ${i + 1}/${count}: ${purchasedNumber.phoneNumber}`);
        } catch (error) {
          console.error(`Error purchasing number ${i + 1}:`, error);
          return res.status(500).json({
            error: `Failed to purchase number ${i + 1}`,
            details: error.message,
            purchased: purchasedNumbers
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: `Successfully purchased ${purchasedNumbers.length} number(s)`,
        numbers: purchasedNumbers
      });
    } catch (error) {
      console.error('Error purchasing numbers:', error);
      return res.status(500).json({ error: 'Failed to purchase numbers', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { phone_number_sid } = req.body;

      if (!phone_number_sid) {
        return res.status(400).json({ error: 'phone_number_sid is required' });
      }

      // Check if number is assigned
      const { data: assignment } = await supabase
        .from('dj_virtual_numbers')
        .select('*')
        .eq('twilio_phone_number_sid', phone_number_sid)
        .eq('is_active', true)
        .single();

      if (assignment) {
        return res.status(400).json({
          error: 'Cannot release assigned number',
          message: `This number is assigned to DJ profile ${assignment.dj_profile_id}. Deactivate it first.`
        });
      }

      // Release the number from Twilio
      await twilioClient.incomingPhoneNumbers(phone_number_sid).remove();

      return res.status(200).json({
        success: true,
        message: 'Number released successfully'
      });
    } catch (error) {
      console.error('Error releasing number:', error);
      return res.status(500).json({ error: 'Failed to release number', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}








