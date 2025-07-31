// SMS Helper utility for sending admin notifications
let twilioClient = null;

// Initialize Twilio client
try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.log('Twilio package not installed or configured. Run: npm install twilio');
}

/**
 * Format phone number to E.164 format for Twilio
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} E.164 formatted phone number
 */
function formatPhoneNumberForTwilio(phoneNumber) {
  if (!phoneNumber) return null;
  
  // If it starts with +, check if it's properly formatted
  if (phoneNumber.startsWith('+')) {
    const digitsAfterPlus = phoneNumber.substring(1).replace(/\D/g, '');

    
    // If it's +1xxxxxxxxxx (11 digits after +), it's correct US format
    if (digitsAfterPlus.length === 11 && digitsAfterPlus.startsWith('1')) {

      return phoneNumber;
    }
    
    // If it's +xxxxxxxxxx (10 digits after +), assume US and add 1
    if (digitsAfterPlus.length === 10) {
      const corrected = `+1${digitsAfterPlus}`;

      return corrected;
    }
    
    // If it's some other format, treat as if no + was there

    const digitsOnly = digitsAfterPlus;
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    return `+1${digitsOnly}`;
  }
  
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  

  
  // If it's 10 digits, assume US number and add +1
  if (digitsOnly.length === 10) {
    const formatted = `+1${digitsOnly}`;

    return formatted;
  }
  
  // If it's 11 digits and starts with 1, add +
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    const formatted = `+${digitsOnly}`;

    return formatted;
  }
  
  // For other cases, assume it needs +1 prefix (most common case for US)
  const formatted = `+1${digitsOnly}`;

  return formatted;
}

/**
 * Get admin phone number from database or environment fallback
 * @returns {string|null} Formatted admin phone number in E.164 format
 */
export async function getAdminPhoneNumber() {
  try {
    // Try to get from database first
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get admin phone from database - we'll get the first admin user's phone
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_phone_number')
        .limit(1)
        .single();
      
      if (!error && data?.setting_value) {
        return formatPhoneNumberForTwilio(data.setting_value);
      }
    }
  } catch (error) {
    console.log('Could not fetch admin phone from database:', error.message);
  }
  
  // Fallback to environment variable or default (now with proper E.164 format)
  const fallbackPhone = process.env.ADMIN_PHONE_NUMBER || '9014977001';
  return formatPhoneNumberForTwilio(fallbackPhone);
}

/**
 * Send SMS notification to admin
 * @param {string} message - SMS message content
 * @param {string} phoneNumber - Optional phone number (uses admin default if not provided)
 * @returns {Object} Result object with success status and details
 */
export async function sendAdminSMS(message, phoneNumber = null) {
  try {
    let adminPhone;
    
    if (phoneNumber) {
      // Format manually provided phone number
      adminPhone = formatPhoneNumberForTwilio(phoneNumber);
    } else {
      // Get admin phone from database/config
      adminPhone = await getAdminPhoneNumber();
    }
    
    if (!adminPhone) {
      console.log('No admin phone number configured');
      return {
        success: false,
        error: 'No admin phone number configured'
      };
    }

    console.log('Attempting to send SMS to:', adminPhone);

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('Twilio not configured - SMS notification skipped');
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    if (twilioClient) {
      // Send real SMS via Twilio
      const smsResult = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: adminPhone
      });

      console.log('SMS sent successfully to admin:', smsResult.sid);
      
      return {
        success: true,
        smsId: smsResult.sid,
        status: smsResult.status,
        to: adminPhone
      };
    } else {
      // Fallback simulation for development
      console.log('Twilio client not available - simulating SMS to:', adminPhone);
      console.log('SMS Message:', message);
      
      return {
        success: true,
        smsId: 'sim_' + Date.now(),
        status: 'simulated',
        to: adminPhone,
        message: 'SMS simulated (Twilio not available)'
      };
    }

  } catch (error) {
    console.error('Error sending admin SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format contact form submission for SMS
 * @param {Object} submissionData - Contact form data
 * @returns {string} Formatted SMS message
 */
export function formatContactSubmissionSMS(submissionData) {
  const { name, email, phone, eventType, eventDate, location, message } = submissionData;
  
  let smsMessage = `🎵 NEW CONTACT FORM SUBMISSION\n\n`;
  smsMessage += `Name: ${name}\n`;
  smsMessage += `Email: ${email}\n`;
  smsMessage += `Phone: ${phone || 'Not provided'}\n`;
  smsMessage += `Event: ${eventType}\n`;
  
  if (eventDate) {
    smsMessage += `Date: ${eventDate}\n`;
  }
  
  if (location) {
    smsMessage += `Location: ${location}\n`;
  }
  
  if (message) {
    // Truncate message if too long for SMS
    const truncatedMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
    smsMessage += `Message: ${truncatedMessage}\n`;
  }
  
  smsMessage += `\nView full details at: m10djcompany.com/admin/dashboard`;
  
  return smsMessage;
}