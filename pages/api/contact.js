import { Resend } from 'resend';
import { db } from '../../utils/company_lib/supabase';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, phone, eventType, eventDate, location, message } = req.body;

  // Basic validation
  if (!name || !email || !eventType) {
    return res.status(400).json({ message: 'Name, email, and event type are required' });
  }

  try {
    // Save to database first
    const submissionData = {
      name,
      email,
      phone,
      eventType,
      eventDate,
      location,
      message
    };

    const dbSubmission = await db.createContactSubmission(submissionData);
    console.log('Contact submission saved to database:', dbSubmission.id);

    // Format the customer email content
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0; font-size: 28px;">Thank You for Contacting M10 DJ Company!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 18px; margin-bottom: 20px;">
            Hi ${name},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            We've received your inquiry and are excited to learn about your ${eventType.toLowerCase()} event! Our team will review your request and get back to you within 24 hours with a personalized quote and next steps.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #000; margin-top: 0;">Your Event Details:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li><strong>Event Type:</strong> ${eventType}</li>
              ${eventDate ? `<li><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</li>` : ''}
              ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
              ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
            </ul>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">
              Reference ID: ${dbSubmission.id}
            </p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            In the meantime, feel free to check out our social media pages to see photos and videos from recent events:
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://facebook.com/m10djcompany" style="display: inline-block; margin: 0 10px; text-decoration: none;">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width: 30px; height: 30px;">
            </a>
            <a href="https://instagram.com/m10djcompany" style="display: inline-block; margin: 0 10px; text-decoration: none;">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" alt="Instagram" style="width: 30px; height: 30px;">
            </a>
          </div>
          
          <div style="background: #000; color: #fcba00; padding: 20px; border-radius: 6px; text-align: center; margin-top: 30px;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Questions? Call or text us at (901) 410-2020</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const businessNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #000; color: #fcba00; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">New Contact Form Submission - M10 DJ Company</h2>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd;">
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #0369a1; font-weight: bold;">
              📊 Database ID: ${dbSubmission.id}
            </p>
          </div>
          
          <h3 style="color: #000; margin-top: 0;">Customer Information:</h3>
          <ul style="line-height: 1.8; color: #333;">
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
            <li><strong>Event Type:</strong> ${eventType}</li>
            ${eventDate ? `<li><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</li>` : ''}
            ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
          </ul>
          
          ${message ? `
            <h3 style="color: #000;">Additional Message:</h3>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; color: #333; line-height: 1.6;">
              ${message}
            </p>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; margin: 0;">
              <strong>Action Required:</strong> Follow up with this lead within 24 hours for best conversion rates.
            </p>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
              💡 <strong>Tip:</strong> This submission has been automatically saved to your Supabase dashboard for tracking.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send customer confirmation email
    const customerEmailResult = await resend.emails.send({
      from: 'M10 DJ Company <noreply@m10djcompany.com>',
      to: [email],
      subject: `Thank you for your interest in M10 DJ Company - ${eventType} Inquiry`,
      html: customerEmailHtml,
    });

    // Send business notification email
    const businessEmailResult = await resend.emails.send({
      from: 'M10 Website <noreply@m10djcompany.com>',
      to: ['m10djcompany@gmail.com'],
      subject: `New ${eventType} Inquiry from ${name}`,
      html: businessNotificationHtml,
      replyTo: email,
    });

    console.log('Customer email sent:', customerEmailResult);
    console.log('Business email sent:', businessEmailResult);

    res.status(200).json({ 
      message: 'Contact submission successful',
      submissionId: dbSubmission.id,
      customerEmailId: customerEmailResult.data?.id,
      businessEmailId: businessEmailResult.data?.id
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    
    // Return a generic error message to avoid exposing internal details
    res.status(500).json({ 
      message: 'Failed to process contact submission. Please try again or contact us directly.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 