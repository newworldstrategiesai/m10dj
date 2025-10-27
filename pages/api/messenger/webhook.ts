/**
 * Facebook Messenger Webhook Endpoint
 * Receives Facebook Messenger messages in real-time
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Webhook verification (GET request from Facebook)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.MESSENGER_VERIFY_TOKEN) {
      console.log('✅ Messenger webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
    return;
  }

  // Handle webhook events (POST request)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('💬 Messenger webhook received:', JSON.stringify(body, null, 2));

      // Process each entry
      if (body.entry) {
        for (const entry of body.entry) {
          // Process messaging events
          if (entry.messaging) {
            for (const event of entry.messaging) {
              await processMessagingEvent(event);
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Error processing Messenger webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function processMessagingEvent(event: any) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;
    const timestamp = event.timestamp;

    // Handle different event types
    if (event.message) {
      await handleMessage(event, supabase);
    } else if (event.postback) {
      await handlePostback(event, supabase);
    } else if (event.referral) {
      await handleReferral(event, supabase);
    }

  } catch (error) {
    console.error('Error processing messaging event:', error);
  }
}

async function handleMessage(event: any, supabase: any) {
  const senderId = event.sender.id;
  const timestamp = event.timestamp;
  const message = event.message?.text || '';

  // Skip messages with no text (images, stickers, etc.)
  if (!message) {
    console.log('⏭️ Skipping non-text message');
    return;
  }

  console.log(`💬 Messenger message from ${senderId}: ${message}`);

  // Check if this looks like a lead inquiry
  const isLeadInquiry = checkIfLeadInquiry(message);

  if (isLeadInquiry) {
    // Get sender information from Facebook API
    const senderInfo = await getFacebookUserInfo(senderId);

    // Check for existing contact
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('facebook_id', senderId)
      .is('deleted_at', null)
      .single();

    if (!existingContact) {
      // Create new contact from Messenger lead
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert([{
          first_name: senderInfo.first_name || senderInfo.name?.split(' ')[0] || 'Facebook',
          last_name: senderInfo.last_name || senderInfo.name?.split(' ').slice(1).join(' ') || 'Lead',
          facebook_id: senderId,
          facebook_profile_url: senderInfo.profile_pic,
          email_address: senderInfo.email || null,
          lead_source: 'Facebook Messenger',
          lead_status: 'New',
          lead_stage: 'Initial Inquiry',
          notes: `Facebook Messenger inquiry:\n${message}\n\nReceived: ${new Date(timestamp).toLocaleString()}`,
          special_requests: message,
          tags: ['facebook-messenger', 'messenger-inquiry']
        }])
        .select()
        .single();

      if (contactError) {
        console.error('Error creating contact:', contactError);
      } else {
        console.log('✅ Created new contact from Messenger:', newContact.id);
        
        // Send admin notification
        await sendAdminNotification({
          type: 'messenger_lead',
          contactId: newContact.id,
          message: message,
          senderName: senderInfo.name || 'Facebook User'
        });

        // Send auto-reply to user
        await sendMessengerReply(senderId, 
          `Thanks for reaching out! We received your message about DJ services. We'll get back to you shortly. In the meantime, check out our services at m10djcompany.com or call us at (901) 410-2020.`
        );
      }
    } else {
      // Update existing contact with new message
      const { data: contact } = await supabase
        .from('contacts')
        .select('notes')
        .eq('id', existingContact.id)
        .single();

      const updatedNotes = `${contact?.notes || ''}\n\nMessenger (${new Date(timestamp).toLocaleString()}):\n${message}\n`;

      await supabase
        .from('contacts')
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);

      console.log('✅ Updated existing contact with Messenger message');
    }
  }

  // Store the message for reference
  await supabase.from('messenger_messages').insert([{
    sender_id: senderId,
    recipient_id: event.recipient.id,
    message_text: message,
    timestamp: new Date(timestamp).toISOString(),
    is_lead_inquiry: isLeadInquiry,
    message_id: event.message.mid
  }]);
}

async function handlePostback(event: any, supabase: any) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  const title = event.postback.title;

  console.log(`🎯 Messenger postback from ${senderId}: ${title}`);

  // Store postback event
  await supabase.from('messenger_messages').insert([{
    sender_id: senderId,
    recipient_id: event.recipient.id,
    message_text: `Postback: ${title}`,
    timestamp: new Date(event.timestamp).toISOString(),
    is_lead_inquiry: true,
    message_type: 'postback'
  }]);

  // Handle different postback payloads
  if (payload === 'GET_STARTED' || payload === 'PRICING' || payload === 'BOOKING') {
    const senderInfo = await getFacebookUserInfo(senderId);
    
    // Create contact from postback action
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('facebook_id', senderId)
      .is('deleted_at', null)
      .single();

    if (!existingContact) {
      await supabase.from('contacts').insert([{
        first_name: senderInfo.first_name || 'Facebook',
        last_name: senderInfo.last_name || 'Lead',
        facebook_id: senderId,
        lead_source: 'Facebook Messenger',
        lead_status: 'New',
        lead_stage: 'Initial Inquiry',
        notes: `Clicked "${title}" button in Messenger\nPayload: ${payload}\nReceived: ${new Date().toLocaleString()}`,
        tags: ['facebook-messenger', 'postback-inquiry']
      }]);

      console.log('✅ Created contact from Messenger postback');
    }
  }
}

async function handleReferral(event: any, supabase: any) {
  const senderId = event.sender.id;
  const referralSource = event.referral.source;
  const referralType = event.referral.type;

  console.log(`🔗 Messenger referral from ${senderId} via ${referralSource}`);

  // Store referral for analytics
  await supabase.from('messenger_messages').insert([{
    sender_id: senderId,
    recipient_id: event.recipient.id,
    message_text: `Referral via ${referralSource}`,
    timestamp: new Date(event.timestamp).toISOString(),
    is_lead_inquiry: true,
    message_type: 'referral'
  }]);
}

function checkIfLeadInquiry(text: string): boolean {
  if (!text) return false;
  
  const inquiryKeywords = [
    'book', 'booking', 'available', 'price', 'pricing', 'cost', 'quote',
    'wedding', 'event', 'party', 'dj', 'interested', 'inquiry', 'contact',
    'date', 'venue', 'information', 'info', 'details', 'packages',
    'hire', 'reserve', 'reservation', 'schedule', 'ceremony', 'reception'
  ];

  const lowerText = text.toLowerCase();
  return inquiryKeywords.some(keyword => lowerText.includes(keyword));
}

async function getFacebookUserInfo(userId: string) {
  try {
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    
    if (!accessToken) {
      return { name: 'Facebook User', first_name: 'Facebook', last_name: 'User' };
    }

    const response = await fetch(
      `https://graph.facebook.com/${userId}?fields=first_name,last_name,name,profile_pic,email&access_token=${accessToken}`
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching Facebook user info:', error);
  }

  return { name: 'Facebook User', first_name: 'Facebook', last_name: 'User' };
}

async function sendMessengerReply(recipientId: string, message: string) {
  try {
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.warn('⚠️ No Facebook Page Access Token - skipping auto-reply');
      return;
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        })
      }
    );

    if (response.ok) {
      console.log('✅ Sent Messenger auto-reply');
    } else {
      const error = await response.text();
      console.error('❌ Failed to send Messenger reply:', error);
    }
  } catch (error) {
    console.error('Error sending Messenger reply:', error);
  }
}

async function sendAdminNotification(data: {
  type: string;
  contactId: string;
  message: string;
  senderName?: string;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    await supabase.from('notification_log').insert([{
      notification_type: data.type,
      recipient: 'admin',
      subject: `New Messenger Lead from ${data.senderName}`,
      body: data.message,
      status: 'sent',
      sent_at: new Date().toISOString()
    }]);

    console.log('✅ Admin notification sent');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

