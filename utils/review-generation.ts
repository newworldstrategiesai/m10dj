/**
 * Review Generation System for M10 DJ Company
 * 
 * This utility helps generate reviews across multiple platforms:
 * - Google Business Profile
 * - The Knot
 * - WeddingWire
 * - The Bash
 * 
 * Usage:
 * - Send review request emails post-event
 * - Track review requests and completions
 * - Generate review links for easy sharing
 */

export interface ReviewPlatform {
  name: string;
  url: string;
  directLink: string;
  instructions: string;
  priority: 'high' | 'medium' | 'low';
}

export const REVIEW_PLATFORMS: ReviewPlatform[] = [
  {
    name: 'Google Business Profile',
    url: 'https://www.google.com/maps/place/M10+DJ+Company',
    directLink: 'https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID', // Replace with actual Place ID
    instructions: 'Search "M10 DJ Company" on Google Maps, click "Write a review"',
    priority: 'high'
  },
  {
    name: 'The Knot',
    url: 'https://www.theknot.com',
    directLink: 'YOUR_THE_KNOT_PROFILE_URL', // Replace when profile is created
    instructions: 'Visit our The Knot profile and click "Write a Review"',
    priority: 'high'
  },
  {
    name: 'WeddingWire',
    url: 'https://www.weddingwire.com',
    directLink: 'YOUR_WEDDINGWIRE_PROFILE_URL', // Replace when profile is created
    instructions: 'Visit our WeddingWire profile and click "Write a Review"',
    priority: 'high'
  },
  {
    name: 'The Bash',
    url: 'https://www.thebash.com',
    directLink: 'YOUR_THE_BASH_PROFILE_URL', // Replace when profile is created
    instructions: 'Visit our The Bash profile and click "Write a Review"',
    priority: 'medium'
  },
  {
    name: 'Yelp',
    url: 'https://www.yelp.com',
    directLink: 'YOUR_YELP_PROFILE_URL', // Replace when profile is created
    instructions: 'Visit our Yelp profile and click "Write a Review"',
    priority: 'medium'
  }
];

export interface ReviewRequestData {
  clientName: string;
  clientEmail: string;
  eventType: string;
  eventDate: string;
  venueName?: string;
  djName?: string;
}

/**
 * Generate review request email HTML
 */
export function generateReviewRequestEmail(data: ReviewRequestData): string {
  const { clientName, eventType, eventDate, venueName } = data;
  
  const googleReviewLink = REVIEW_PLATFORMS.find(p => p.name === 'Google Business Profile')?.directLink || 
    'https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fcba00 0%, #d99f00 100%); padding: 30px; text-align: center;">
      <h1 style="color: #000; margin: 0; font-size: 28px;">Thank You, ${clientName}! 🎉</h1>
      <p style="color: #000; margin: 10px 0 0 0; font-size: 16px;">We Hope You Had an Amazing ${eventType}!</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-top: 0;">Hi ${clientName},</p>
      
      <p style="font-size: 16px;">
        Thank you for choosing M10 DJ Company for your ${eventType}${venueName ? ` at ${venueName}` : ''} on ${new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}!
      </p>
      
      <p style="font-size: 16px;">
        We had an amazing time helping make your celebration unforgettable. Your feedback means the world to us and helps other couples find the perfect DJ for their special day.
      </p>
      
      <!-- Review Request CTA -->
      <div style="background: #f0f9ff; border-left: 4px solid #fcba00; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h2 style="color: #000; margin-top: 0; font-size: 20px;">⭐ Would You Mind Leaving Us a Review?</h2>
        <p style="font-size: 16px; margin-bottom: 15px;">
          It only takes 2 minutes, but it helps us tremendously! Your review helps other Memphis couples find quality DJ services.
        </p>
        <a href="${googleReviewLink}" 
           style="display: inline-block; background: #fcba00; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 5px 10px 0;">
          Leave Google Review →
        </a>
      </div>
      
      <!-- Alternative Platforms -->
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #000; margin-top: 0; font-size: 18px;">You Can Also Review Us On:</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #333;">
          <li style="margin: 8px 0;">
            <strong>The Knot:</strong> Help other couples find us on The Knot
          </li>
          <li style="margin: 8px 0;">
            <strong>WeddingWire:</strong> Share your experience with the wedding community
          </li>
          <li style="margin: 8px 0;">
            <strong>The Bash:</strong> Help us reach more event planners
          </li>
        </ul>
        <p style="font-size: 14px; color: #666; margin-top: 15px;">
          <em>Every review helps! Even a quick 5-star rating makes a huge difference.</em>
        </p>
      </div>
      
      <!-- Personal Touch -->
      <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 25px;">
        <p style="font-size: 16px;">
          If you have any questions or need anything else, please don't hesitate to reach out. We're here to help!
        </p>
        <p style="font-size: 16px; margin-top: 20px;">
          Thank you again for choosing M10 DJ Company. We wish you all the best! 🎵
        </p>
        <p style="font-size: 16px; margin-top: 20px;">
          Best regards,<br>
          <strong>Ben Murray</strong><br>
          M10 DJ Company<br>
          <a href="tel:+19014102020" style="color: #fcba00; text-decoration: none;">(901) 410-2020</a><br>
          <a href="mailto:info@m10djcompany.com" style="color: #fcba00; text-decoration: none;">info@m10djcompany.com</a>
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        M10 DJ Company | Professional DJ Services in Memphis, TN<br>
        <a href="https://www.m10djcompany.com" style="color: #fcba00; text-decoration: none;">www.m10djcompany.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate review request email subject
 */
export function generateReviewRequestSubject(eventType: string): string {
  return `Thank You for Choosing M10 DJ Company! ⭐ Quick Review Request`;
}

/**
 * Generate follow-up review request (if no review after 1 week)
 */
export function generateFollowUpReviewEmail(data: ReviewRequestData): string {
  const { clientName } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #fcba00 0%, #d99f00 100%); padding: 30px; text-align: center;">
      <h1 style="color: #000; margin: 0; font-size: 28px;">Quick Reminder, ${clientName} 📝</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-top: 0;">Hi ${clientName},</p>
      
      <p style="font-size: 16px;">
        I wanted to send a quick reminder about leaving a review. I know you're busy, so this will only take 2 minutes!
      </p>
      
      <p style="font-size: 16px;">
        Your review helps other Memphis couples find quality DJ services and means the world to our small business.
      </p>
      
      <div style="background: #f0f9ff; border-left: 4px solid #fcba00; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <a href="${REVIEW_PLATFORMS.find(p => p.name === 'Google Business Profile')?.directLink || '#'}" 
           style="display: inline-block; background: #fcba00; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Leave 2-Minute Review →
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
        If you've already left a review, thank you so much! 🙏
      </p>
      
      <p style="font-size: 16px; margin-top: 20px;">
        Best regards,<br>
        <strong>Ben Murray</strong><br>
        M10 DJ Company
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate review request SMS text
 */
export function generateReviewRequestSMS(data: ReviewRequestData): string {
  const { clientName, eventType } = data;
  const googleReviewLink = 'https://g.page/r/YOUR_PLACE_ID/review'; // Shortened link preferred
  
  return `Hi ${clientName}! Thank you for choosing M10 DJ Company for your ${eventType}! We'd love a quick review if you have 2 minutes: ${googleReviewLink} - Ben, M10 DJ Company`;
}

/**
 * Get review platform links for a contact
 */
export function getReviewLinks(): Array<{platform: string, link: string, priority: string}> {
  return REVIEW_PLATFORMS.map(platform => ({
    platform: platform.name,
    link: platform.directLink,
    priority: platform.priority
  }));
}

/**
 * Generate review request tracking data
 */
export interface ReviewRequestTracking {
  contactId: string;
  eventDate: string;
  reviewRequestSent: boolean;
  reviewRequestDate: string;
  followUpSent: boolean;
  followUpDate?: string;
  reviewReceived: boolean;
  reviewPlatform?: string;
  reviewDate?: string;
}

export function createReviewRequestTracking(contactId: string, eventDate: string): ReviewRequestTracking {
  return {
    contactId,
    eventDate,
    reviewRequestSent: false,
    reviewRequestDate: new Date().toISOString(),
    followUpSent: false,
    reviewReceived: false
  };
}

