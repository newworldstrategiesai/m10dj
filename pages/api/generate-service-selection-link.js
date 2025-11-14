/**
 * Generate Service Selection Link for Contact
 * 
 * Creates a secure tokenized link to send to leads so they can select services
 * 
 * Usage: POST /api/generate-service-selection-link
 * Body: { contactId: "uuid" }
 * Returns: { link: "https://m10djcompany.com/select-services/TOKEN" }
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import crypto from 'crypto';

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

    // Check if user is admin
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'
    ];
    const isAdmin = adminEmails.includes(session.user.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Get the contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Generate a secure token
    // In production, you should use JWT or a more sophisticated token system
    // For now, we'll use base64 encoding with a timestamp
    const tokenData = {
      contactId: contact.id,
      email: contact.email_address,
      timestamp: Date.now(),
      // Add a secret hash to prevent tampering
      hash: crypto
        .createHash('sha256')
        .update(`${contact.id}${contact.email_address}${process.env.NEXTAUTH_SECRET || 'default-secret'}`)
        .digest('hex')
        .substring(0, 16)
    };

    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url');

    // Store the token in the contact's custom_fields for tracking
    await supabase
      .from('contacts')
      .update({
        custom_fields: {
          ...contact.custom_fields,
          service_selection_token: token,
          token_generated_at: new Date().toISOString()
        }
      })
      .eq('id', contactId);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
    // Use the new quote builder route instead of token-based route
    const link = `${baseUrl}/quote/${contact.id}`;

    // Log the generation
    console.log(`✅ Generated service selection link for ${contact.first_name} ${contact.last_name}`);
    console.log(`   Email: ${contact.email_address}`);
    console.log(`   Link: ${link}`);

    res.status(200).json({
      success: true,
      link,
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        email: contact.email_address
      }
    });

  } catch (error) {
    console.error('Error generating service selection link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

