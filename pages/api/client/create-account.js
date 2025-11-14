import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  try {
    // Check if a contact exists with this email
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email_address, first_name, last_name')
      .eq('email_address', email.toLowerCase().trim())
      .is('deleted_at', null)
      .maybeSingle();

    if (contactError) {
      console.error('Error checking contact:', contactError);
      return res.status(500).json({ error: 'Failed to check contact' });
    }

    if (!contact) {
      return res.status(404).json({ 
        error: 'No booking found',
        message: 'We couldn\'t find any bookings associated with this email address.'
      });
    }

    // Check if user already has an account
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email.toLowerCase().trim());

    if (userError && userError.status !== 404) {
      console.error('Error checking user:', userError);
      return res.status(500).json({ error: 'Failed to check account status' });
    }

    if (user) {
      // User already has an account
      return res.status(200).json({ 
        hasAccount: true,
        message: 'An account already exists for this email. Please sign in instead.'
      });
    }

    // Send magic link email to create account
    // This will automatically create the account when they click the link
    const callbackURL = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?redirect=${encodeURIComponent('/client/dashboard')}`;
    
    const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: callbackURL,
        shouldCreateUser: true // This will create the account when they click the link
      }
    });

    if (otpError) {
      console.error('Error sending magic link:', otpError);
      return res.status(500).json({ error: 'Failed to send account creation link', details: otpError.message });
    }

    return res.status(200).json({ 
      success: true,
      hasAccount: false,
      message: 'Account creation link sent! Check your email for a magic link to create your account. The link will expire in 1 hour.'
    });

  } catch (error) {
    console.error('Error in create-account API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

