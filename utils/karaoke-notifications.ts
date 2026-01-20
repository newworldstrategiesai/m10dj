/**
 * SMS notifications for karaoke signups
 */

/**
 * Format phone number for Twilio (E.164 format)
 */
function formatPhoneNumberForTwilio(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1 and is 11 digits, it's already US format
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  // If it's 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already starts with +, return as-is
  if (phone.trim().startsWith('+')) {
    return phone.trim();
  }
  
  // Otherwise, try to format as US number
  return `+1${digits}`;
}

/**
 * Send SMS notification to karaoke singer
 */
export async function sendKaraokeSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string; smsId?: string }> {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('Twilio not configured - SMS notification skipped');
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    const formattedPhone = formatPhoneNumberForTwilio(phoneNumber);
    
    // Validate phone number
    if (!formattedPhone || formattedPhone.length < 10) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    const twilio = require('twilio');
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const smsResult = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ Karaoke SMS sent successfully: ${smsResult.sid} to ${formattedPhone}`);
    
    return {
      success: true,
      smsId: smsResult.sid
    };

  } catch (error: any) {
    console.error('Error sending karaoke SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Send "next up" notification to karaoke singer
 */
export async function sendNextUpNotification(
  signup: {
    id: string;
    singer_name: string;
    group_members: string[] | null;
    group_size: number;
    song_title: string;
    song_artist: string | null;
    singer_phone: string;
    event_qr_code: string;
    organization_id: string;
  },
  organizationName?: string
): Promise<{ success: boolean; error?: string }> {
  if (!signup.singer_phone) {
    return {
      success: false,
      error: 'No phone number provided'
    };
  }

  const groupLabel = signup.group_size === 1 
    ? signup.singer_name
    : signup.group_members?.join(' & ') || signup.singer_name;

  const songInfo = signup.song_artist
    ? `"${signup.song_title}" by ${signup.song_artist}`
    : `"${signup.song_title}"`;

  const message = `🎤 You're next up for karaoke!\n\n` +
    `Hi ${signup.singer_name}!\n\n` +
    `You're next in the queue. Get ready to sing:\n` +
    `${songInfo}\n\n` +
    `Head to the stage when the current performer finishes! 🎵`;

  return await sendKaraokeSMS(signup.singer_phone, message);
}

/**
 * Send "currently singing" notification (optional - when they start)
 */
export async function sendCurrentlySingingNotification(
  signup: {
    singer_name: string;
    song_title: string;
    song_artist: string | null;
    singer_phone: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!signup.singer_phone) {
    return {
      success: false,
      error: 'No phone number provided'
    };
  }

  const songInfo = signup.song_artist
    ? `"${signup.song_title}" by ${signup.song_artist}`
    : `"${signup.song_title}"`;

  const message = `🎤 It's your turn!\n\n` +
    `Hi ${signup.singer_name}!\n\n` +
    `You're up! Time to sing:\n` +
    `${songInfo}\n\n` +
    `Break a leg! 🎵`;

  return await sendKaraokeSMS(signup.singer_phone, message);
}
