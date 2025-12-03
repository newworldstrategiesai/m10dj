/**
 * Process Automation Queue
 * Run this as a cron job every 15 minutes to send scheduled automations
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending automations that are due
    const { data: dueAutomations, error: queueError } = await supabase
      .from('automation_queue')
      .select('*, contacts(*), events(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process 50 at a time

    if (queueError) throw queueError;

    if (!dueAutomations || dueAutomations.length === 0) {
      return res.status(200).json({ 
        success: true, 
        processed: 0,
        message: 'No automations due'
      });
    }

    console.log(`📧 Processing ${dueAutomations.length} automations...`);

    let processed = 0;
    let failed = 0;

    for (const automation of dueAutomations) {
      try {
        const contact = automation.contacts;
        
        if (!contact) {
          console.log(`⚠️ Skipping automation ${automation.id} - contact not found`);
          await markAutomationFailed(supabase, automation.id, 'Contact not found');
          failed++;
          continue;
        }

        // Check if contact already left a review (skip reminders)
        if (automation.automation_type === 'review_reminder' && contact.review_completed) {
          console.log(`✓ Skipping reminder for ${contact.email_address} - review already completed`);
          await markAutomationCancelled(supabase, automation.id, 'Review already completed');
          continue;
        }

        // Get the template
        const template = await getTemplate(supabase, automation.metadata?.template);
        
        if (!template) {
          console.log(`⚠️ Template not found: ${automation.metadata?.template}`);
          await markAutomationFailed(supabase, automation.id, 'Template not found');
          failed++;
          continue;
        }

        // Get Google Review link from organization, or use fallback
        let reviewLink = contact.google_review_link || automation.metadata?.review_link;
        
        // If no review link from contact or automation metadata, try to get from organization
        if (!reviewLink && contact.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('google_review_link')
            .eq('id', contact.organization_id)
            .single();
          
          if (org?.google_review_link) {
            reviewLink = org.google_review_link;
          }
        }
        
        // Final fallback to default link
        if (!reviewLink) {
          reviewLink = 'https://g.page/r/CSD9ayo7-MivEBE/review';
        }

        // Render the template with contact data
        const emailData = {
          first_name: contact.first_name || 'there',
          last_name: contact.last_name || '',
          email_address: contact.email_address || contact.primary_email,
          event_type: automation.events?.event_type || automation.metadata?.event_type || 'event',
          event_date: automation.events?.event_date || automation.metadata?.event_date,
          review_link: reviewLink,
          calendar_link: process.env.NEXT_PUBLIC_CALENDAR_LINK || 'https://calendly.com/m10djcompany',
          owner_name: process.env.OWNER_NAME || 'M10 DJ Company'
        };

        const subject = renderTemplate(template.subject_template, emailData);
        const body = renderTemplate(template.body_template, emailData);

        // Send the email
        const emailSent = await sendEmail(emailData.email_address, subject, body, contact.id);

        if (emailSent) {
          // Mark automation as sent
          await supabase
            .from('automation_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', automation.id);

          // Update contact review tracking
          if (automation.automation_type === 'review_request') {
            await supabase
              .from('contacts')
              .update({
                review_requested_at: new Date().toISOString(),
                review_reminder_count: 0
              })
              .eq('id', contact.id);
          } else if (automation.automation_type === 'review_reminder') {
            await supabase
              .from('contacts')
              .update({
                review_reminder_count: (contact.review_reminder_count || 0) + 1,
                last_review_reminder_at: new Date().toISOString()
              })
              .eq('id', contact.id);
          }

          // Log the automation
          await supabase.from('automation_log').insert({
            automation_type: automation.automation_type,
            contact_id: contact.id,
            event_id: automation.event_id,
            template_used: automation.metadata?.template,
            email_sent: true,
            sent_at: new Date().toISOString()
          });

          processed++;
          console.log(`✅ Sent ${automation.automation_type} to ${emailData.email_address}`);
        } else {
          await markAutomationFailed(supabase, automation.id, 'Email send failed');
          failed++;
        }

      } catch (automationError) {
        console.error(`❌ Error processing automation ${automation.id}:`, automationError);
        await markAutomationFailed(supabase, automation.id, automationError.message);
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Processed ${processed} automations, ${failed} failed`);

    res.status(200).json({
      success: true,
      processed,
      failed,
      total: dueAutomations.length
    });

  } catch (error) {
    console.error('❌ Error processing automation queue:', error);
    res.status(500).json({ 
      error: 'Queue processing failed',
      message: error.message 
    });
  }
}

// Helper Functions

async function getTemplate(supabase, templateName) {
  if (!templateName) return null;

  const { data, error } = await supabase
    .from('automation_templates')
    .select('*')
    .eq('template_name', templateName)
    .eq('is_active', true)
    .single();

  return error ? null : data;
}

function renderTemplate(template, data) {
  let rendered = template;

  // Replace {{variable}} with actual values
  Object.keys(data).forEach(key => {
    const value = data[key] || '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  rendered = rendered.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
    return data[variable] ? content : '';
  });

  // Format dates if present
  if (data.event_date) {
    const date = new Date(data.event_date);
    if (!isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      rendered = rendered.replace(/{{event_date}}/g, formatted);
    }
  }

  return rendered;
}

async function sendEmail(to, subject, body, contactId) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        contactId
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

async function markAutomationFailed(supabase, automationId, errorMessage) {
  await supabase
    .from('automation_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    })
    .eq('id', automationId);
}

async function markAutomationCancelled(supabase, automationId, reason) {
  await supabase
    .from('automation_queue')
    .update({
      status: 'cancelled',
      error_message: reason,
      sent_at: new Date().toISOString()
    })
    .eq('id', automationId);
}

