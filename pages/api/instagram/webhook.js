/**
 * Instagram Webhook Endpoint
 * Receives Instagram messages, comments, and mentions in real-time
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Webhook verification (GET request from Instagram)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      console.log('✅ Instagram webhook verified');
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
      console.log('📱 Instagram webhook received:', JSON.stringify(body, null, 2));

      // Process each entry
      if (body.entry) {
        for (const entry of body.entry) {
          // Process messaging events
          if (entry.messaging) {
            for (const event of entry.messaging) {
              await processMessagingEvent(event);
            }
          }

          // Process comments
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'comments') {
                await processComment(change.value);
              }
              if (change.field === 'mentions') {
                await processMention(change.value);
              }
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Error processing Instagram webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function processMessagingEvent(event) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;
    const timestamp = event.timestamp;
    const message = event.message?.text || '';

    console.log(`📨 Instagram DM from ${senderId}: ${message}`);

    // Check if this looks like a lead inquiry
    const isLeadInquiry = checkIfLeadInquiry(message);

    if (isLeadInquiry) {
      // Get sender information from Instagram API
      const senderInfo = await getInstagramUserInfo(senderId);

      // Create or update contact
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('instagram_id', senderId)
        .is('deleted_at', null)
        .single();

      if (!existingContact) {
        // Create new contact from Instagram lead
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert([{
            first_name: senderInfo.name || 'Instagram',
            last_name: 'Lead',
            instagram_id: senderId,
            instagram_username: senderInfo.username,
            lead_source: 'Instagram DM',
            lead_status: 'New',
            lead_stage: 'Initial Inquiry',
            notes: `Instagram DM inquiry:\n${message}\n\nReceived: ${new Date(timestamp).toLocaleString()}`,
            special_requests: message,
            tags: ['instagram', 'dm-inquiry']
          }])
          .select()
          .single();

        if (contactError) {
          console.error('Error creating contact:', contactError);
        } else {
          console.log('✅ Created new contact from Instagram DM:', newContact.id);
          
          // Send admin notification
          await sendAdminNotification({
            type: 'instagram_lead',
            contactId: newContact.id,
            message: message,
            username: senderInfo.username
          });
        }
      } else {
        // Update existing contact with new message
        await supabase
          .from('contacts')
          .update({
            notes: supabase.rpc('append_notes', {
              contact_id: existingContact.id,
              new_note: `Instagram DM (${new Date(timestamp).toLocaleString()}):\n${message}\n\n`
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContact.id);

        console.log('✅ Updated existing contact with Instagram DM');
      }
    }

    // Store the message for reference
    await supabase.from('instagram_messages').insert([{
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: message,
      timestamp: new Date(timestamp).toISOString(),
      is_lead_inquiry: isLeadInquiry
    }]);

  } catch (error) {
    console.error('Error processing messaging event:', error);
  }
}

async function processComment(commentData) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const commentText = commentData.text || '';
    const username = commentData.from?.username;
    const userId = commentData.from?.id;

    console.log(`💬 Instagram comment from @${username}: ${commentText}`);

    // Check if comment contains inquiry keywords
    const isInquiry = checkIfLeadInquiry(commentText);

    if (isInquiry) {
      // Create contact from comment
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('instagram_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existingContact) {
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert([{
            first_name: username || 'Instagram',
            last_name: 'Comment',
            instagram_id: userId,
            instagram_username: username,
            lead_source: 'Instagram Comment',
            lead_status: 'New',
            lead_stage: 'Initial Inquiry',
            notes: `Instagram comment inquiry:\n${commentText}\n\nReceived: ${new Date().toLocaleString()}`,
            special_requests: commentText,
            tags: ['instagram', 'comment-inquiry']
          }])
          .select()
          .single();

        if (!error) {
          console.log('✅ Created contact from Instagram comment:', newContact.id);
          await sendAdminNotification({
            type: 'instagram_comment',
            contactId: newContact.id,
            message: commentText,
            username: username
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing comment:', error);
  }
}

async function processMention(mentionData) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const caption = mentionData.caption || '';
    const username = mentionData.from?.username;
    const userId = mentionData.from?.id;

    console.log(`@️ Instagram mention from @${username}`);

    // Create contact from mention if it looks like an inquiry
    const isInquiry = checkIfLeadInquiry(caption);

    if (isInquiry) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('instagram_id', userId)
        .is('deleted_at', null)
        .single();

      if (!existingContact) {
        await supabase
          .from('contacts')
          .insert([{
            first_name: username || 'Instagram',
            last_name: 'Mention',
            instagram_id: userId,
            instagram_username: username,
            lead_source: 'Instagram Mention',
            lead_status: 'New',
            lead_stage: 'Initial Inquiry',
            notes: `Instagram mention:\n${caption}\n\nReceived: ${new Date().toLocaleString()}`,
            tags: ['instagram', 'mention']
          }]);

        console.log('✅ Created contact from Instagram mention');
      }
    }
  } catch (error) {
    console.error('Error processing mention:', error);
  }
}

function checkIfLeadInquiry(text) {
  if (!text) return false;
  
  const inquiryKeywords = [
    'book', 'booking', 'available', 'price', 'pricing', 'cost', 'quote',
    'wedding', 'event', 'party', 'dj', 'interested', 'inquiry', 'contact',
    'date', 'venue', 'information', 'info', 'details', 'packages'
  ];

  const lowerText = text.toLowerCase();
  return inquiryKeywords.some(keyword => lowerText.includes(keyword));
}

async function getInstagramUserInfo(userId) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!accessToken) {
      return { name: 'Instagram User', username: userId };
    }

    const response = await fetch(
      `https://graph.instagram.com/${userId}?fields=name,username&access_token=${accessToken}`
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching Instagram user info:', error);
  }

  return { name: 'Instagram User', username: userId };
}

async function sendAdminNotification(data: {
  type;
  contactId;
  message;
  username?;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    await supabase.from('notification_log').insert([{
      notification_type: data.type,
      recipient: 'admin',
      subject: `New Instagram Lead from @${data.username}`,
      body: data.message,
      status: 'sent',
      sent_at: new Date().toISOString()
    }]);

    console.log('✅ Admin notification sent');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

