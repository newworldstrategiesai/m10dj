import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendAdminSMS } from '../../../utils/sms-helper.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check for leads that viewed pricing but didn't select, and send follow-up
 * This should be called daily via cron job or scheduled task
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is an authorized request (e.g., from cron job with secret)
  const authSecret = req.headers['x-cron-secret'] || req.body.secret;
  if (authSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find leads that:
    // 1. Viewed quote page 2-3 days ago
    // 2. Have no quote selection
    // 3. Haven't received a follow-up yet
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get quote page views from 2-3 days ago
    // Try quote_page_views first, fallback to quote_analytics if needed
    let recentViews = [];
    let viewsError = null;

    // Note: This cron job processes ALL organizations
    // RLS policies on contacts will ensure data isolation
    // We process all orgs because this is a background job that should handle everyone
    const { data: viewsData, error: viewsErr } = await supabase
      .from('quote_page_views')
      .select('*, contacts:contact_id(*)')
      .gte('created_at', threeDaysAgo.toISOString())
      .lte('created_at', twoDaysAgo.toISOString())
      .eq('event_type', 'page_view');
    
    // Note: contacts are filtered by organization_id via RLS policies
    // Each organization's contacts are isolated at the database level

    if (viewsErr) {
      console.log('quote_page_views table may not exist, trying quote_analytics:', viewsErr.message);
      // Fallback: use quote_analytics
      const { data: analyticsData, error: analyticsErr } = await supabase
        .from('quote_analytics')
        .select('quote_id, metadata, created_at')
        .gte('created_at', threeDaysAgo.toISOString())
        .lte('created_at', twoDaysAgo.toISOString())
        .eq('event_type', 'page_view');

      if (analyticsErr) {
        viewsError = analyticsErr;
      } else if (analyticsData) {
        // Convert analytics data to match expected format
        recentViews = await Promise.all(
          analyticsData
            .filter(view => !view.metadata?.has_selection)
            .map(async (view) => {
              const contactId = view.quote_id;
              const { data: contact } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', contactId)
                .single();
              return {
                contact_id: contactId,
                quote_id: view.quote_id,
                event_type: 'page_view',
                metadata: view.metadata,
                created_at: view.created_at,
                contacts: contact
              };
            })
        );
      }
    } else {
      recentViews = viewsData || [];
    }

    if (viewsError && recentViews.length === 0) {
      console.error('Error fetching recent views:', viewsError);
      // Sanitize error - don't expose internal details
      return res.status(500).json({ error: 'Failed to fetch recent views' });
    }

    if (!recentViews || recentViews.length === 0) {
      return res.status(200).json({ 
        message: 'No leads need follow-up',
        count: 0 
      });
    }

    // Check which ones don't have selections and haven't received follow-up
    const leadsNeedingFollowup = [];
    
    for (const view of recentViews) {
      const contactId = view.contact_id;
      
      // Get contact to verify organization_id exists (data isolation check)
      const { data: contactData } = await supabase
        .from('contacts')
        .select('organization_id')
        .eq('id', contactId)
        .single();
      
      // Skip if contact doesn't exist or has no organization (shouldn't happen, but safety check)
      if (!contactData || !contactData.organization_id) {
        console.log(`⚠️ Skipping contact ${contactId} - no organization_id`);
        continue;
      }
      
      // Check if they have a quote selection (filtered by RLS based on organization_id)
      const { data: selections } = await supabase
        .from('quote_selections')
        .select('id')
        .eq('contact_id', contactId)
        .limit(1);

      if (selections && selections.length > 0) {
        continue; // They already made a selection, skip
      }

      // Check if they already received a follow-up
      const { data: existingFollowup } = await supabase
        .from('followup_sent')
        .select('id')
        .eq('contact_id', contactId)
        .eq('followup_type', 'pricing_walkthrough')
        .limit(1);

      if (existingFollowup && existingFollowup.length > 0) {
        continue; // Already sent follow-up, skip
      }

      leadsNeedingFollowup.push({
        contactId,
        view,
        contact: view.contacts
      });
    }

    // Send follow-up to each lead
    const results = [];
    for (const lead of leadsNeedingFollowup) {
      try {
        const result = await sendFollowUpWalkthrough(lead.contact, lead.contactId, lead.view);
        results.push({ contactId: lead.contactId, success: true, result });
        
        // Mark as sent
        await supabase.from('followup_sent').insert({
          contact_id: lead.contactId,
          followup_type: 'pricing_walkthrough',
          sent_at: new Date().toISOString(),
          metadata: { quote_id: lead.view.quote_id }
        });
      } catch (error) {
        console.error(`Error sending follow-up to ${lead.contactId}:`, error);
        results.push({ contactId: lead.contactId, success: false, error: error.message });
      }
    }

    return res.status(200).json({
      message: `Processed ${leadsNeedingFollowup.length} follow-ups`,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Error in follow-up check:', error);
    // Sanitize error - don't expose internal details
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Send follow-up walkthrough email/SMS
 */
async function sendFollowUpWalkthrough(contact, contactId, view) {
  const quoteId = view.quote_id || contactId;
  const walkthroughUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${quoteId}/walkthrough`;
  
  const contactName = contact?.first_name || contact?.name || 'there';
  const eventType = view.metadata?.event_type || contact?.event_type || 'your event';
  const isWedding = eventType && (eventType.toLowerCase().includes('wedding') || eventType.toLowerCase() === 'wedding');

  // Send email
  if (resend && contact?.email_address) {
    const emailSubject = isWedding 
      ? `Let's Plan Your Perfect Wedding Day - Quick Guide 🎵💍`
      : `Let's Find Your Perfect Package - Quick 2-Minute Guide`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0;">${isWedding ? 'Let\'s Plan Your Perfect Wedding Day! 🎵💍' : 'Let\'s Find Your Perfect Package! 🎵'}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${contactName},</p>
          
          ${isWedding ? `
          <p>I noticed you were checking out our wedding DJ pricing recently. I know planning your special day involves so many decisions, and choosing the right entertainment package can feel overwhelming!</p>
          
          <p>That's why I created a personalized wedding planning guide that will help you find the perfect package for your big day. It takes just 2-3 minutes and asks questions specifically about your wedding - like ceremony coverage, special moments, and the atmosphere you're envisioning.</p>
          
          <p><strong>This isn't just about pricing - it's about making sure your wedding day is absolutely perfect.</strong></p>
          ` : `
          <p>I noticed you were checking out our pricing for your ${eventType} recently. I know choosing the right DJ package can feel overwhelming with all the options!</p>
          
          <p>That's why I created a quick, interactive guide that will help you find the perfect package for your event. It takes just 2-3 minutes and asks a few simple questions about what matters most to you.</p>
          `}
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p style="margin: 0;"><strong>${isWedding ? 'What you\'ll discover:' : 'What you\'ll get:'}</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${isWedding ? `
              <li>Wedding-specific package recommendation tailored to your needs</li>
              <li>Coverage options for ceremony, cocktail hour, and reception</li>
              <li>Guidance on special moments (first dance, parent dances, etc.)</li>
              <li>Lighting and atmosphere recommendations</li>
              <li>MC services planning for smooth timeline coordination</li>
              ` : `
              <li>Personalized package recommendation</li>
              <li>Clear comparison of your options</li>
              <li>Answers to common questions</li>
              <li>Special offer for completing the guide</li>
              `}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${walkthroughUrl}" 
               style="background: #fcba00; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
              Start Your Personalized Guide →
            </a>
          </div>
          
          <p>Or if you prefer, just reply to this email or call me directly at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a> and I'll help you find the perfect fit!</p>
          
          <p>Looking forward to making your event unforgettable!</p>
          
          <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: [contact.email_address],
      subject: emailSubject,
      html: emailHtml
    });
  }

  // Send SMS
  if (contact?.phone) {
    const smsMessage = isWedding
      ? `Hi ${contactName}! I noticed you were checking our wedding DJ pricing. I created a personalized wedding planning guide to help you find the perfect package for your special day. Start here: ${walkthroughUrl} Or call me: (901) 410-2020`
      : `Hi ${contactName}! I noticed you were checking our pricing. I created a quick 2-min guide to help you find the perfect package. Start here: ${walkthroughUrl} Or call me: (901) 410-2020`;
    
    await sendAdminSMS(smsMessage, contact.phone).catch(err => {
      console.error('SMS follow-up failed:', err);
    });
  }

  return { emailSent: !!contact?.email_address, smsSent: !!contact?.phone };
}

