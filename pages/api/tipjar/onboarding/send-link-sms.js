import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function formatPhoneE164(phoneNumber) {
  if (!phoneNumber) return null;
  const trimmed = String(phoneNumber).trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) {
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+1${digits}`;
  }

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (!digits) return null;
  return `+1${digits}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  try {
    // Auth: get current user from bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const userPhone = user.phone;
    const formattedPhone = formatPhoneE164(userPhone);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'User does not have a valid phone number.' });
    }

    // Use service role for org lookup
    const supabaseAdmin = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabaseAuth;

    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug, product_context')
      .eq('owner_id', user.id)
      .eq('product_context', 'tipjar')
      .maybeSingle();

    if (orgError || !organization) {
      console.error('Organization lookup failed for onboarding SMS:', orgError);
      return res.status(404).json({ error: 'Organization not found for user.' });
    }

    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
    const pageUrl = `${baseUrl.replace(/\/$/, '')}/${organization.slug}/requests`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      pageUrl
    )}`;

    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log(
        'Twilio not fully configured - skipping onboarding SMS for TipJar page link.'
      );
      return res.status(200).json({
        success: false,
        skipped: true,
        reason: 'Twilio not configured'
      });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const messageBody =
      `Your TipJar page is live! 🎶\n\n` +
      `Share this link with your guests so they can send song requests and tips:\n` +
      `${pageUrl}\n\n` +
      `We’ve attached your QR code image. Save it to your photos so you can print or display it at events.`;

    const smsResult = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
      mediaUrl: [qrCodeUrl]
    });

    console.log('TipJar onboarding SMS sent:', {
      to: formattedPhone,
      sid: smsResult.sid,
      status: smsResult.status
    });

    return res.status(200).json({
      success: true,
      sid: smsResult.sid,
      status: smsResult.status
    });
  } catch (error) {
    console.error('Error in TipJar onboarding SMS endpoint:', error);
    return res.status(500).json({
      error: 'Failed to send onboarding SMS',
      message: error.message
    });
  }
}

