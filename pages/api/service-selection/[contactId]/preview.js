// Preview route for service selection emails
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { generateServiceSelectionLink } from '@/utils/service-selection-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate service selection email HTML
 */
function generateServiceSelectionEmailHtml(contact, serviceSelectionLink) {
  const firstName = contact.first_name || 'there';
  const eventType = contact.event_type || 'event';
  
  // Format event date without timezone issues (parse as local date)
  let eventDate = 'your upcoming event';
  if (contact.event_date) {
    try {
      if (typeof contact.event_date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(contact.event_date)) {
        const datePart = contact.event_date.split('T')[0];
        const [year, month, day] = datePart.split('-');
        // Create date in local timezone, not UTC (prevents day from shifting)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        eventDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      } else {
        eventDate = new Date(contact.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {
      eventDate = 'your upcoming event';
    }
  }
  
  // Only include venue if it's not "Client's Home"
  const venue = (contact.venue_name || '').trim();
  const shouldIncludeVenue = venue && !venue.toLowerCase().includes("client's home") && !venue.toLowerCase().includes("clients home");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://m10djcompany.com/m10-black-clear-png.png" alt="M10 DJ Company" style="max-width: 200px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="color: #000; margin: 0; font-size: 28px;">Select Your Perfect Package</h1>
        <p style="color: #000; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">M10 DJ Company - Premium Wedding Entertainment</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 18px; margin-bottom: 20px;">
          Hi ${firstName},
        </p>
        
        <p style="color: #555; line-height: 1.8; margin-bottom: 20px;">
          Thank you for reaching out about DJ services for ${eventDate}${shouldIncludeVenue ? ` at ${venue}` : ''}! 
          I'm excited to help make your ${eventType} unforgettable.
        </p>
        
        <p style="color: #555; line-height: 1.8; margin-bottom: 25px;">
          To help me prepare the perfect proposal for you, I've created a personalized service selection page where you can:
        </p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #fcba00; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
          <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 2;">
            <li>✨ Compare our 3 wedding packages side-by-side</li>
            <li>🎵 Choose premium add-ons (uplighting, monogram projection, special effects)</li>
            <li>💰 See your total investment in real-time</li>
            <li>📝 Add any special requests or questions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${serviceSelectionLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #fcba00, #e6a800); color: #000; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;">
            🎯 Select Your Services Now
          </a>
        </div>
        
        <p style="color: #777; font-size: 14px; text-align: center; margin-bottom: 25px;">
          This will only take 2-3 minutes • All prices shown • No signup required
        </p>
        
        <div style="background: #fff5e6; border: 2px solid #fcba00; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="color: #333; margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">
            ⚡ What Happens Next?
          </p>
          <p style="color: #555; margin: 0; line-height: 1.8;">
            Once you submit your selections, I'll review your choices and prepare a detailed custom proposal. 
            You'll hear back from me within <strong>24 hours</strong> with pricing, next steps, and answers to any questions you have.
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.8; margin-top: 25px;">
          Have questions right now? Feel free to call or text me anytime at <strong style="color: #fcba00;">(901) 410-2020</strong>.
          I'm here to help!
        </p>
        
        <p style="color: #555; margin-top: 25px;">
          Looking forward to making your celebration unforgettable! 🎉
        </p>
        
        <p style="color: #333; margin-top: 20px;">
          Best,<br>
          <strong>Ben Murray</strong><br>
          <span style="color: #888;">M10 DJ Company</span>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #fcba00; text-align: center;">
          <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">📞 Phone:</strong> (901) 410-2020</p>
          <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">📧 Email:</strong> djbenmurray@gmail.com</p>
          <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">🌐 Website:</strong> m10djcompany.com</p>
          <p style="color: #999; font-size: 12px; margin-top: 15px;">
            M10 DJ Company - Memphis, TN & Surrounding Areas<br>
            Premium Wedding & Event Entertainment
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">
          You're receiving this email because you contacted us about DJ services.<br>
          If you have any questions, just reply to this email or give us a call.
        </p>
      </div>
    </div>
  `;
}

/**
 * Preview the service selection email HTML
 * Returns the rendered HTML without sending
 */
export default async function handler(req, res) {
  // Always set JSON content type first
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Missing required environment variables'
    });
  }

  // Require admin authentication
  try {
    await requireAdmin(req, res);
  } catch (authError) {
    if (res.headersSent) return;
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }

  const { contactId } = req.query;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  const contactIdString = Array.isArray(contactId) ? contactId[0] : contactId;

  if (!contactIdString || typeof contactIdString !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID format' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactIdString)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Generate service selection link
    const serviceSelectionLink = generateServiceSelectionLink(contact);

    // Generate email subject
    const eventType = contact.event_type || 'Event';
    const eventTypeCapitalized = eventType.charAt(0).toUpperCase() + eventType.slice(1);
    const subject = `🎵 Select Your ${eventTypeCapitalized} DJ Package - M10 DJ Company`;

    // Generate email HTML
    const html = generateServiceSelectionEmailHtml(contact, serviceSelectionLink);

    return res.status(200).json({
      success: true,
      html,
      subject,
      email: contact.email_address || null,
      hasEmail: !!contact.email_address,
      contactId: contact.id
    });
  } catch (error) {
    console.error('Error previewing service selection email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
