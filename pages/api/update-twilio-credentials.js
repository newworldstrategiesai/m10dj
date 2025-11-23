import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import twilio from 'twilio';

/**
 * API endpoint to update Twilio credentials in the database
 * Also tests the credentials before saving
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { twilio_sid, twilio_auth_token } = req.body;

    if (!twilio_sid || !twilio_auth_token) {
      return res.status(400).json({ error: 'Missing twilio_sid or twilio_auth_token' });
    }

    // Trim whitespace
    const trimmedSid = twilio_sid.trim();
    const trimmedToken = twilio_auth_token.trim();

    // Test credentials before saving
    try {
      const testClient = twilio(trimmedSid, trimmedToken);
      const account = await testClient.api.accounts(trimmedSid).fetch();
      
      console.log('Twilio credentials test successful:', {
        accountName: account.friendlyName,
        accountStatus: account.status
      });
    } catch (testError) {
      console.error('Twilio credentials test failed:', testError);
      return res.status(400).json({
        error: 'Invalid Twilio credentials',
        details: {
          code: testError.code,
          message: testError.message,
          moreInfo: testError.moreInfo
        }
      });
    }

    // Upsert credentials into database
    const { data, error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: session.user.id,
        twilio_sid: trimmedSid,
        twilio_auth_token: trimmedToken,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Twilio credentials:', error);
      return res.status(500).json({
        error: 'Failed to save credentials',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Twilio credentials updated successfully',
      saved: {
        hasSid: !!data.twilio_sid,
        sidLength: data.twilio_sid?.length || 0,
        hasToken: !!data.twilio_auth_token,
        tokenLength: data.twilio_auth_token?.length || 0
      }
    });

  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({
      error: 'Failed to update Twilio credentials',
      details: error.message
    });
  }
}

