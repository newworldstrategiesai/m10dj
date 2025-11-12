/**
 * Advanced Multi-Agent SMS Webhook for M10 DJ Company
 * Uses OpenAI Agents SDK with specialized routing and tools
 */

import { runDJWorkflow } from '../../../lib/dj-agent-workflow';
import { getCustomerContext } from '../../../utils/chatgpt-sms-assistant.js';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid } = req.body;
    
    console.log(`📱 Multi-Agent SMS from ${From}: ${Body}`);
    
    // 1. Get customer context from database
    const customerContext = await getCustomerContext(From);
    console.log('Customer context:', {
      isExisting: customerContext.isExistingCustomer,
      name: customerContext.customerName,
      eventType: customerContext.eventType
    });
    
    // 2. Process with multi-agent workflow
    console.log('🤖 Running multi-agent workflow...');
    const workflowResult = await runDJWorkflow({
      phone_number: From,
      message: Body,
      customer_context: customerContext
    });
    
    console.log('✅ Workflow completed:', {
      classification: workflowResult.classification,
      agent_used: workflowResult.agent_used,
      confidence: workflowResult.confidence
    });
    
    const aiResponse = workflowResult.output_text;
    
    // 3. Send enhanced admin notification
    await sendEnhancedAdminNotification(
      From, 
      Body, 
      customerContext, 
      aiResponse,
      workflowResult
    );
    
    // 4. Return response to customer via Twilio
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${aiResponse}</Message>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse);
    
  } catch (error) {
    console.error('❌ Multi-agent SMS webhook error:', error);
    
    // Fallback response
    const fallbackMessage = `Thank you for contacting M10 DJ Company! 🎵 Ben will personally respond within 30 minutes. For immediate assistance, call (901) 410-2020.`;
    
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${fallbackMessage}</Message>
</Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(errorResponse);
  }
}

/**
 * Send enhanced admin notification with multi-agent context
 */
async function sendEnhancedAdminNotification(customerPhone, customerMessage, context, aiResponse, workflowResult) {
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (!adminPhone) return;
    
    // Format timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format phone number
    const displayFrom = customerPhone.startsWith('+1') ? customerPhone.substring(2) : customerPhone;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    // Build enhanced admin message with agent insights
    let adminMessage = `🤖 MULTI-AGENT RESPONSE\n\n`;
    
    // Customer info
    if (context.isExistingCustomer) {
      adminMessage += `👤 Customer: ${context.customerName}\n`;
      adminMessage += `📞 Phone: ${formattedFrom}\n`;
      if (context.eventType) adminMessage += `🎉 Event: ${context.eventType}\n`;
      if (context.eventDate) adminMessage += `📅 Date: ${context.eventDate}\n`;
      if (context.venue) adminMessage += `🏢 Venue: ${context.venue}\n`;
      adminMessage += `📊 Status: ${context.leadStatus}\n`;
    } else {
      adminMessage += `👤 New Lead: ${formattedFrom}\n`;
      adminMessage += `🆕 First contact\n`;
    }
    
    adminMessage += `⏰ Time: ${timestamp}\n\n`;
    
    // Agent classification and routing
    adminMessage += `🎯 Classification: ${workflowResult.classification}\n`;
    adminMessage += `🤖 Agent Used: ${workflowResult.agent_used}\n`;
    if (workflowResult.confidence) {
      adminMessage += `📊 Confidence: ${(workflowResult.confidence * 100).toFixed(0)}%\n`;
    }
    adminMessage += `\n`;
    
    // Customer message
    adminMessage += `💬 Customer:\n"${customerMessage}"\n\n`;
    
    // AI response
    adminMessage += `🤖 AI Response:\n"${aiResponse}"\n\n`;
    
    // Action items based on classification
    adminMessage += `💡 Recommended Actions:\n`;
    
    switch (workflowResult.classification) {
      case 'check_availability':
        adminMessage += `• Verify calendar for mentioned date\n`;
        adminMessage += `• Prepare to send quote if interested\n`;
        break;
      case 'get_pricing':
        adminMessage += `• Review AI pricing provided\n`;
        adminMessage += `• Prepare customized quote\n`;
        break;
      case 'book_service':
        adminMessage += `• Follow up ASAP - hot lead!\n`;
        adminMessage += `• Prepare contract/service link\n`;
        break;
      case 'existing_customer':
        adminMessage += `• Check customer's booking status\n`;
        adminMessage += `• Address their specific question\n`;
        break;
      case 'general_question':
        adminMessage += `• Review if more info needed\n`;
        adminMessage += `• Consider follow-up call\n`;
        break;
    }
    
    adminMessage += `\n📱 Dashboard: m10djcompany.com/admin/contacts`;

    // Send admin notification
    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await twilioClient.messages.create({
      body: adminMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: adminPhone
    });
    
    console.log('✅ Enhanced admin notification sent');
    
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
  }
}

