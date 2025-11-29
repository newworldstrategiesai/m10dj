/**
 * Generate Service Selection Link for Contact
 * 
 * Creates a secure tokenized link to send to leads so they can select services
 * 
 * Usage: POST /api/generate-service-selection-link
 * Body: { contactId: "uuid" }
 * Returns: { link: "https://m10djcompany.com/select-services/TOKEN" }
 */

import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const { createServerSupabaseClient } = await import('@supabase/auth-helpers-nextjs');
    const supabase = createServerSupabaseClient({ req, res });

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

    const env = getEnv();
    const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
    // Use the new quote builder route instead of token-based route
    const link = `${baseUrl}/quote/${contact.id}`;

    // Log the generation
    logger.info('Generated service selection link', {
      contactId: contact.id,
      name: `${contact.first_name} ${contact.last_name}`,
      email: contact.email_address,
      link
    });

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
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error generating service selection link', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

