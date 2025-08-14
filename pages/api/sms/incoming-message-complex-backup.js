// Twilio webhook for incoming SMS messages
import { sendAdminSMS } from '../../../utils/sms-helper.js';
import { sendEnhancedNotifications } from '../../../utils/notification-system.js';
import { createClient } from '@supabase/supabase-js';

/**
 * Log incoming SMS message to database
 */
async function logIncomingMessage(messageData) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create a record in contact_submissions for incoming SMS
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name: `SMS Contact ${messageData.from}`,
        email: 'sms-inquiry@m10djcompany.com',
        phone: messageData.from,
        event_type: 'SMS Inquiry',
        event_date: new Date().toISOString().split('T')[0],
        location: 'SMS',
        message: `Incoming SMS: ${messageData.body}${messageData.numMedia > 0 ? ` [${messageData.numMedia} media attachment(s)]` : ''}`,
        status: 'new'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error logging incoming SMS:', error);
      return null;
    }

    console.log('✅ Incoming SMS logged to database:', data.id);
    return data;

  } catch (error) {
    console.error('Database logging error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`📱 Incoming SMS from ${From}: ${Body}`);
    console.log('Environment check:', {
      hasAdminPhone: !!process.env.ADMIN_PHONE_NUMBER,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER
    });

    // Store incoming message in database for tracking
    let incomingMessageRecord = null;
    try {
      incomingMessageRecord = await logIncomingMessage({
        from: From,
        to: To,
        body: Body,
        messageSid: MessageSid,
        numMedia: NumMedia || 0,
        mediaUrl: MediaUrl0,
        mediaContentType: MediaContentType0
      });
    } catch (dbError) {
      console.error('Failed to log incoming message:', dbError);
    }
    
    // Enhanced message formatting with better context
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format phone number for display (remove +1 for US numbers)
    const displayFrom = From.startsWith('+1') ? From.substring(2) : From;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    let forwardedMessage = `📱 NEW TEXT MESSAGE\n\n`;
    forwardedMessage += `👤 From: ${formattedFrom}\n`;
    forwardedMessage += `📞 To: M10 DJ Business Line\n`;
    forwardedMessage += `⏰ Time: ${timestamp}\n\n`;
    forwardedMessage += `💬 Message:\n"${Body}"\n\n`;
    
    // Add media notification if present
    if (NumMedia && parseInt(NumMedia) > 0) {
      forwardedMessage += `📎 Media: ${NumMedia} attachment(s)\n`;
      if (MediaContentType0) {
        forwardedMessage += `📄 Type: ${MediaContentType0}\n`;
      }
      forwardedMessage += `\n`;
    }
    
    forwardedMessage += `🆔 Message ID: ${MessageSid}\n\n`;
    forwardedMessage += `💡 Reply directly to respond to customer\n`;
    forwardedMessage += `📱 View details: m10djcompany.com/admin/dashboard`;

               console.log('🔄 Attempting to forward SMS to admin...');
           
           // PRIMARY: Try basic SMS forwarding first (most reliable)
           let smsForwardSuccessful = false;
           
           try {
             console.log('📱 Trying basic SMS forwarding...');
             const basicSmsResult = await sendAdminSMS(forwardedMessage);
             console.log('📱 Basic SMS forward result:', basicSmsResult);
             
             if (basicSmsResult.success) {
               console.log(`✅ SMS successfully forwarded from ${From}: ${Body}`);
               smsForwardSuccessful = true;
             } else {
               console.error('❌ Basic SMS forward failed:', basicSmsResult.error);
             }
           } catch (basicError) {
             console.error('❌ Basic SMS forward error:', basicError);
           }
           
           // SECONDARY: Try enhanced notification system as backup
           if (!smsForwardSuccessful) {
             try {
               console.log('🔄 Basic SMS failed, trying enhanced notifications...');
               
               // Create a pseudo-submission for the notification system
               const pseudoSubmission = {
                 name: `SMS from ${formattedFrom}`,
                 email: 'sms-contact@m10djcompany.com',
                 phone: From,
                 eventType: 'SMS Inquiry',
                 eventDate: new Date().toISOString().split('T')[0],
                 location: 'SMS',
                 message: Body
               };

               const pseudoDbSubmission = incomingMessageRecord || { 
                 id: `sms-${MessageSid}` 
               };

               // Send enhanced notifications (SMS + Email backup)
               const notificationResults = await sendEnhancedNotifications(pseudoSubmission, pseudoDbSubmission);
               
               console.log('📊 Enhanced SMS Forward Results:', {
                 smsSuccess: notificationResults.sms.success,
                 emailSuccess: notificationResults.email.success,
                 totalSuccessfulMethods: notificationResults.summary.successfulMethods
               });

               if (notificationResults.summary.successfulMethods > 0) {
                 console.log('✅ Enhanced notifications succeeded!');
                 smsForwardSuccessful = true;
               } else {
                 console.error('🚨 CRITICAL: All enhanced notification methods failed!');
               }

             } catch (enhancedError) {
               console.error('🚨 Enhanced SMS forwarding also failed:', enhancedError);
             }
           }
           
           // TERTIARY: Try backup phone numbers if everything else fails
           if (!smsForwardSuccessful && (process.env.BACKUP_ADMIN_PHONE || process.env.EMERGENCY_CONTACT_PHONE)) {
             console.log('🆘 Trying emergency backup phone numbers...');
             
             const backupNumbers = [
               process.env.BACKUP_ADMIN_PHONE,
               process.env.EMERGENCY_CONTACT_PHONE
             ].filter(Boolean);
             
             for (const backupNumber of backupNumbers) {
               try {
                 const emergencyMessage = `🚨 EMERGENCY SMS FORWARD\n\n${forwardedMessage}\n\n⚠️ Primary forwarding failed!`;
                 const backupResult = await sendAdminSMS(emergencyMessage, backupNumber);
                 console.log(`📱 Emergency backup to ${backupNumber}:`, backupResult);
                 
                 if (backupResult.success) {
                   console.log('✅ Emergency backup SMS successful!');
                   smsForwardSuccessful = true;
                   break;
                 }
               } catch (backupError) {
                 console.error(`❌ Emergency backup to ${backupNumber} failed:`, backupError);
               }
             }
           }
           
           // Final status log
           if (smsForwardSuccessful) {
             console.log('🎉 SMS forwarding completed successfully!');
           } else {
             console.error('💥 ALL SMS FORWARDING METHODS FAILED - CRITICAL ISSUE!');
           }
    
    // Send enhanced auto-reply to sender
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 9 && currentHour < 17; // 9 AM to 5 PM
    
    let autoReplyMessage = `Thank you for contacting M10 DJ Company! 🎵\n\n`;
    autoReplyMessage += `We've received your message and `;
    
    if (isBusinessHours) {
      autoReplyMessage += `will respond within 30 minutes during business hours.\n\n`;
    } else {
      autoReplyMessage += `will respond first thing during business hours (9 AM - 5 PM CST).\n\n`;
    }
    
    autoReplyMessage += `For immediate assistance:\n`;
    autoReplyMessage += `📞 Call Ben: (901) 497-7001\n`;
    autoReplyMessage += `💻 Visit: m10djcompany.com\n`;
    autoReplyMessage += `📧 Email: djbenmurray@gmail.com\n\n`;
    autoReplyMessage += `We're excited to help make your event unforgettable!`;

    const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${autoReplyMessage}</Message>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(response);
    
  } catch (error) {
    console.error('Error forwarding SMS:', error);
    
    // Still return valid TwiML even on error
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(errorResponse);
  }
}