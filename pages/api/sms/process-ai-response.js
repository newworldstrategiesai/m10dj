// Delayed AI processing endpoint for SMS conversations using OpenAI Agents
import { processSMSWithAgent, extractLeadInfo } from '../../../utils/sms-agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, originalMessage, messageId } = req.body;

    if (!phoneNumber || !originalMessage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`🤖 Processing delayed AI response for ${phoneNumber}: ${originalMessage}`);

    // Note: The new SMS agent handles all database operations internally
    // including checking for admin responses, saving messages, and updating contacts

    // 1. Generate AI response using OpenAI Agents (handles all database operations)
    const aiResponse = await processSMSWithAgent(phoneNumber, originalMessage);
    console.log('AI Response generated with OpenAI Agents:', aiResponse);

    // 2. Send AI response to customer via Twilio
    const twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await twilioClient.messages.create({
      body: aiResponse,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('✅ AI response sent successfully via Twilio:', message.sid);

    res.status(200).json({
      success: true,
      message: 'AI response sent',
      aiResponse: aiResponse,
      twilioSid: message.sid
    });

  } catch (error) {
    console.error('❌ AI processing error:', error);
    res.status(500).json({
      success: false,
      error: 'AI processing failed',
      details: error.message
    });
  }
}
