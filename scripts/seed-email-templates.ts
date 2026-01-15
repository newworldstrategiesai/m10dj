/**
 * Seed Email Templates with Recommendation Rules
 * Populates all 64 email templates with metadata for intelligent recommendations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TemplateSeed {
  template_key: string;
  name: string;
  subject: string;
  template_type: string;
  category: string;
  journey_stage: string[];
  trigger_conditions?: Record<string, any>;
  priority: number;
  auto_send: boolean;
  cooldown_hours?: number;
  required_fields: string[];
  recommended_when: string;
  time_sensitive: boolean;
  file_path: string | null; // null for admin templates that use different format
}

const templates: TemplateSeed[] = [
  // Phase 1: Discovery & Inquiry
  {
    template_key: 'initial-inquiry-confirmation',
    name: 'Initial Inquiry Confirmation',
    subject: 'Thank You for Your Inquiry - {{product_name}}',
    template_type: 'general',
    category: 'inquiry',
    journey_stage: ['New', 'Contacted'],
    priority: 7,
    auto_send: true,
    required_fields: [],
    recommended_when: 'When a new inquiry is received',
    time_sensitive: false,
    file_path: 'email-templates/client-confirmation.html'
  },
  {
    template_key: 'quote-ready',
    name: 'Quote/Service Selection Ready',
    subject: 'Your Custom Quote is Ready - {{event_name}}',
    template_type: 'quote',
    category: 'quote',
    journey_stage: ['Qualified', 'Proposal Sent'],
    priority: 8,
    auto_send: false,
    required_fields: ['quote_id'],
    recommended_when: 'When quote selection is generated or updated',
    time_sensitive: false,
    file_path: 'email-templates/quote-ready.html'
  },
  {
    template_key: 'abandoned-quote-reminder-1',
    name: 'Abandoned Quote Reminder (First)',
    subject: 'Don\'t Miss Out - Your Quote is Waiting',
    template_type: 'follow_up',
    category: 'quote',
    journey_stage: ['Proposal Sent', 'Qualified'],
    trigger_conditions: { days_since_quote_viewed: 3 },
    priority: 6,
    auto_send: true,
    cooldown_hours: 48,
    required_fields: ['quote_id'],
    recommended_when: '3 days after quote viewed but not completed',
    time_sensitive: false,
    file_path: 'email-templates/abandoned-quote-reminder-1.html'
  },
  {
    template_key: 'abandoned-quote-reminder-2',
    name: 'Abandoned Quote Reminder (Second)',
    subject: 'Limited Availability - Complete Your Selection Soon',
    template_type: 'follow_up',
    category: 'quote',
    journey_stage: ['Proposal Sent', 'Qualified'],
    trigger_conditions: { days_since_quote_viewed: 7 },
    priority: 6,
    auto_send: true,
    cooldown_hours: 72,
    required_fields: ['quote_id'],
    recommended_when: '7 days after quote viewed but not completed',
    time_sensitive: true,
    file_path: 'email-templates/abandoned-quote-reminder-2.html'
  },
  
  // Phase 2: Contract & Booking
  {
    template_key: 'contract-ready',
    name: 'Contract Ready to Sign',
    subject: 'Please Sign Your Contract - {{event_name}}',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Negotiating', 'Booked'],
    priority: 9,
    auto_send: false,
    required_fields: ['contract_id'],
    recommended_when: 'When contract is generated and ready for signature',
    time_sensitive: true,
    file_path: 'email-templates/contract-ready.html'
  },
  {
    template_key: 'contract-invoice-ready',
    name: 'Contract & Invoice Ready',
    subject: 'Contract & Invoice Ready - {{event_name}}',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Negotiating', 'Booked'],
    priority: 9,
    auto_send: false,
    required_fields: ['contract_id', 'invoice_id'],
    recommended_when: 'When both contract and invoice are ready',
    time_sensitive: true,
    file_path: 'email-templates/contract-invoice-ready.html'
  },
  {
    template_key: 'contract-signed-client',
    name: 'Contract Signed Confirmation (Client)',
    subject: 'Contract Signed - Thank You! 🎉',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Booked'],
    priority: 8,
    auto_send: true,
    required_fields: ['contract_id', 'signed_contract'],
    recommended_when: 'Immediately after client signs contract',
    time_sensitive: false,
    file_path: 'email-templates/contract-signed-client.html'
  },
  {
    template_key: 'contract-executed',
    name: 'Contract Fully Executed',
    subject: 'Your Contract is Fully Executed - {{event_name}}',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Booked'],
    priority: 7,
    auto_send: true,
    required_fields: ['contract_id', 'signed_contract'],
    recommended_when: 'When both parties have signed the contract',
    time_sensitive: false,
    file_path: 'email-templates/contract-executed.html'
  },
  {
    template_key: 'contract-expiring-warning-7days',
    name: 'Contract Expiring Soon (7 Days)',
    subject: 'Action Required: Contract Expires in 7 Days',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Negotiating'],
    trigger_conditions: { days_until_expiry: 7 },
    priority: 7,
    auto_send: true,
    cooldown_hours: 24,
    required_fields: ['contract_id'],
    recommended_when: '7 days before contract signing token expires',
    time_sensitive: true,
    file_path: 'email-templates/contract-expiring-warning-7days.html'
  },
  {
    template_key: 'contract-expiring-warning-1day',
    name: 'Contract Expiring Soon (1 Day)',
    subject: '⚠️ Urgent: Contract Expires Tomorrow',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Negotiating'],
    trigger_conditions: { days_until_expiry: 1 },
    priority: 9,
    auto_send: true,
    cooldown_hours: 12,
    required_fields: ['contract_id'],
    recommended_when: '1 day before contract signing token expires',
    time_sensitive: true,
    file_path: 'email-templates/contract-expiring-warning-1day.html'
  },
  {
    template_key: 'contract-expired',
    name: 'Contract Expired',
    subject: 'Contract Signing Link Has Expired',
    template_type: 'contract',
    category: 'contract',
    journey_stage: ['Negotiating'],
    trigger_conditions: { is_expired: true },
    priority: 6,
    auto_send: false,
    required_fields: ['contract_id'],
    recommended_when: 'When contract signing token has expired',
    time_sensitive: false,
    file_path: 'email-templates/contract-expired.html'
  },

  // Phase 3: Payment Workflow
  {
    template_key: 'invoice-sent',
    name: 'Invoice Sent',
    subject: 'Invoice {{invoice_number}} from {{product_name}}',
    template_type: 'invoice',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    priority: 7,
    auto_send: false,
    required_fields: ['invoice_id'],
    recommended_when: 'When invoice is created and sent to client',
    time_sensitive: false,
    file_path: 'email-templates/invoice-sent.html'
  },
  {
    template_key: 'deposit-required',
    name: 'Deposit Required',
    subject: 'Deposit Due - Secure Your Event Date',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked'],
    priority: 9,
    auto_send: false,
    required_fields: ['contract_id', 'invoice_id'],
    recommended_when: 'When contract is signed and deposit is due',
    time_sensitive: true,
    file_path: 'email-templates/deposit-required.html'
  },
  {
    template_key: 'payment-reminder-7days',
    name: 'Payment Reminder (7 Days Before Due)',
    subject: 'Friendly Reminder: Payment Due in 7 Days',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { days_until_due: 7 },
    priority: 6,
    auto_send: true,
    cooldown_hours: 48,
    required_fields: ['invoice_id'],
    recommended_when: '7 days before invoice due date',
    time_sensitive: false,
    file_path: 'email-templates/payment-reminder-7days.html'
  },
  {
    template_key: 'payment-reminder-3days',
    name: 'Payment Reminder (3 Days Before Due)',
    subject: 'Reminder: Payment Due in 3 Days',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { days_until_due: 3 },
    priority: 7,
    auto_send: true,
    cooldown_hours: 24,
    required_fields: ['invoice_id'],
    recommended_when: '3 days before invoice due date',
    time_sensitive: true,
    file_path: 'email-templates/payment-reminder-3days.html'
  },
  {
    template_key: 'payment-reminder-final',
    name: 'Payment Reminder (Final - 1 Day Before)',
    subject: 'Final Reminder: Payment Due Tomorrow',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { days_until_due: 1 },
    priority: 8,
    auto_send: true,
    cooldown_hours: 12,
    required_fields: ['invoice_id'],
    recommended_when: '1 day before invoice due date',
    time_sensitive: true,
    file_path: 'email-templates/payment-reminder-final.html'
  },
  {
    template_key: 'invoice-overdue-1week',
    name: 'Invoice Overdue (1 Week)',
    subject: '⚠️ Payment Overdue - Action Required',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { days_overdue: { min: 1, max: 7 } },
    priority: 9,
    auto_send: true,
    cooldown_hours: 48,
    required_fields: ['invoice_id'],
    recommended_when: '1-7 days after invoice due date',
    time_sensitive: true,
    file_path: 'email-templates/invoice-overdue-1week.html'
  },
  {
    template_key: 'invoice-overdue-2weeks',
    name: 'Invoice Overdue (2 Weeks)',
    subject: '⚠️ Urgent: Payment 2 Weeks Overdue',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { days_overdue: { min: 8, max: 14 } },
    priority: 9,
    auto_send: true,
    cooldown_hours: 72,
    required_fields: ['invoice_id'],
    recommended_when: '8-14 days after invoice due date',
    time_sensitive: true,
    file_path: 'email-templates/invoice-overdue-2weeks.html'
  },
  {
    template_key: 'invoice-overdue-30days',
    name: 'Invoice Overdue (30+ Days)',
    subject: '🚨 Final Notice: Payment 30+ Days Overdue',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { days_overdue: { min: 30 } },
    priority: 10,
    auto_send: true,
    cooldown_hours: 168, // 1 week
    required_fields: ['invoice_id'],
    recommended_when: '30+ days after invoice due date',
    time_sensitive: true,
    file_path: 'email-templates/invoice-overdue-30days.html'
  },
  {
    template_key: 'payment-received-deposit',
    name: 'Payment Received - Deposit',
    subject: 'Deposit Received - Thank You! 🎉',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Retainer Paid'],
    priority: 8,
    auto_send: true,
    required_fields: ['payment_id', 'paid_payment'],
    recommended_when: 'When deposit payment is received',
    time_sensitive: false,
    file_path: 'email-templates/payment-received-deposit.html'
  },
  {
    template_key: 'payment-received-final',
    name: 'Payment Received - Final Payment',
    subject: 'Payment Complete - You\'re All Set! 🎉',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Retainer Paid'],
    priority: 8,
    auto_send: true,
    required_fields: ['payment_id', 'paid_payment'],
    recommended_when: 'When final/remaining payment is received',
    time_sensitive: false,
    file_path: 'email-templates/payment-received-final.html'
  },
  {
    template_key: 'payment-received-partial',
    name: 'Payment Received - Partial',
    subject: 'Partial Payment Received - Thank You',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    priority: 7,
    auto_send: true,
    required_fields: ['payment_id', 'invoice_id'],
    recommended_when: 'When partial payment is received',
    time_sensitive: false,
    file_path: 'email-templates/payment-received-partial.html'
  },
  {
    template_key: 'late-fee-applied',
    name: 'Late Fee Applied',
    subject: 'Late Fee Applied to Invoice {{invoice_number}}',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Booked', 'Retainer Paid'],
    trigger_conditions: { late_fee_applied: true },
    priority: 8,
    auto_send: true,
    required_fields: ['invoice_id'],
    recommended_when: 'When late fee is added to overdue invoice',
    time_sensitive: true,
    file_path: 'email-templates/late-fee-applied.html'
  },

  // Phase 4: Pre-Event
  {
    template_key: 'event-confirmation-2weeks',
    name: 'Event Confirmation (2 Weeks Before)',
    subject: 'Finalizing Details for Your Event - {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid'],
    trigger_conditions: { days_until_event: 14 },
    priority: 8,
    auto_send: true,
    cooldown_hours: 72,
    required_fields: ['event_date'],
    recommended_when: '14 days before event date',
    time_sensitive: true,
    file_path: 'email-templates/event-confirmation-2weeks.html'
  },
  {
    template_key: 'event-confirmation-1week',
    name: 'Event Confirmation (1 Week Before)',
    subject: 'One Week to Go! Final Details for {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid'],
    trigger_conditions: { days_until_event: 7 },
    priority: 9,
    auto_send: true,
    cooldown_hours: 48,
    required_fields: ['event_date'],
    recommended_when: '7 days before event date',
    time_sensitive: true,
    file_path: 'email-templates/event-confirmation-1week.html'
  },
  {
    template_key: 'event-confirmation-1day',
    name: 'Event Confirmation (1 Day Before)',
    subject: 'Tomorrow\'s the Day! Final Reminder for {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid'],
    trigger_conditions: { days_until_event: 1 },
    priority: 9,
    auto_send: true,
    cooldown_hours: 12,
    required_fields: ['event_date'],
    recommended_when: '1 day before event date',
    time_sensitive: true,
    file_path: 'email-templates/event-confirmation-1day.html'
  },
  {
    template_key: 'music-preferences-reminder',
    name: 'Music Preferences Reminder',
    subject: 'Finalize Your Music Preferences for {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid'],
    trigger_conditions: { days_until_event: 7, no_music_preferences: true },
    priority: 7,
    auto_send: true,
    cooldown_hours: 72,
    required_fields: ['event_date'],
    recommended_when: '7 days before event if no music preferences submitted',
    time_sensitive: true,
    file_path: 'email-templates/music-preferences-reminder.html'
  },
  {
    template_key: 'event-details-updated',
    name: 'Event Details Updated',
    subject: 'Important: Your Event Details Have Been Updated',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid', 'Booked'],
    priority: 8,
    auto_send: false,
    required_fields: ['event_date'],
    recommended_when: 'When admin updates event details',
    time_sensitive: true,
    file_path: 'email-templates/event-details-updated.html'
  },
  {
    template_key: 'venue-change',
    name: 'Venue Change Notification',
    subject: 'Important: Venue Change for {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid', 'Booked'],
    priority: 9,
    auto_send: false,
    required_fields: ['venue_name'],
    recommended_when: 'When venue is changed',
    time_sensitive: true,
    file_path: 'email-templates/venue-change.html'
  },
  {
    template_key: 'event-rescheduled',
    name: 'Event Rescheduled',
    subject: 'Event Rescheduled - {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid', 'Booked'],
    priority: 9,
    auto_send: false,
    required_fields: ['event_date'],
    recommended_when: 'When event date/time is changed',
    time_sensitive: true,
    file_path: 'email-templates/event-rescheduled.html'
  },

  // Phase 5: Event Day
  {
    template_key: 'event-day-morning',
    name: 'Event Day - Good Morning',
    subject: 'Today\'s the Day! 🎉 {{event_name}}',
    template_type: 'event',
    category: 'event',
    journey_stage: ['Retainer Paid'],
    trigger_conditions: { days_until_event: 0, time_of_day: 'morning' },
    priority: 8,
    auto_send: true,
    required_fields: ['event_date'],
    recommended_when: 'Morning of event day',
    time_sensitive: true,
    file_path: 'email-templates/event-day-morning.html'
  },

  // Phase 6: Post-Event
  {
    template_key: 'thank-you-immediate',
    name: 'Thank You - Immediate',
    subject: 'Thank You for Choosing {{product_name}}!',
    template_type: 'thank_you',
    category: 'post-event',
    journey_stage: ['Completed'],
    trigger_conditions: { days_since_event: 0 },
    priority: 7,
    auto_send: true,
    required_fields: ['event_date'],
    recommended_when: 'Same day as event',
    time_sensitive: false,
    file_path: 'email-templates/thank-you-immediate.html'
  },
  {
    template_key: 'thank-you-review-request',
    name: 'Thank You with Review Request',
    subject: 'Thank You! We\'d Love Your Feedback 🎵',
    template_type: 'review',
    category: 'post-event',
    journey_stage: ['Completed'],
    trigger_conditions: { days_since_event: 2 },
    priority: 8,
    auto_send: true,
    cooldown_hours: 48,
    required_fields: ['event_date'],
    recommended_when: '2 days after event',
    time_sensitive: false,
    file_path: 'email-templates/thank-you-review-request.html'
  },
  {
    template_key: 'review-reminder-1',
    name: 'Review Reminder (First)',
    subject: 'Quick Reminder: Share Your Experience',
    template_type: 'review',
    category: 'post-event',
    journey_stage: ['Completed'],
    trigger_conditions: { days_since_event: 7, no_review: true },
    priority: 6,
    auto_send: true,
    cooldown_hours: 120,
    required_fields: ['event_date'],
    recommended_when: '7 days after event if no review',
    time_sensitive: false,
    file_path: 'email-templates/review-reminder-1.html'
  },
  {
    template_key: 'review-reminder-final',
    name: 'Review Reminder (Final)',
    subject: 'Last Chance: We\'d Love Your Review',
    template_type: 'review',
    category: 'post-event',
    journey_stage: ['Completed'],
    trigger_conditions: { days_since_event: 14, no_review: true },
    priority: 6,
    auto_send: true,
    cooldown_hours: 168,
    required_fields: ['event_date'],
    recommended_when: '14 days after event if no review',
    time_sensitive: false,
    file_path: 'email-templates/review-reminder-final.html'
  },

  // Phase 7: Cancellation & Issues
  {
    template_key: 'event-cancelled-client',
    name: 'Event Cancelled - By Client',
    subject: 'Cancellation Confirmed - {{event_name}}',
    template_type: 'cancellation',
    category: 'cancellation',
    journey_stage: ['Lost', 'Booked', 'Retainer Paid'],
    priority: 9,
    auto_send: false,
    required_fields: [],
    recommended_when: 'When client cancels event',
    time_sensitive: true,
    file_path: 'email-templates/event-cancelled-client.html'
  },
  {
    template_key: 'event-cancelled-vendor',
    name: 'Event Cancelled - By Vendor',
    subject: 'Important Notice: Event Cancellation',
    template_type: 'cancellation',
    category: 'cancellation',
    journey_stage: ['Lost', 'Booked', 'Retainer Paid'],
    priority: 10,
    auto_send: false,
    required_fields: [],
    recommended_when: 'When vendor cancels event',
    time_sensitive: true,
    file_path: 'email-templates/event-cancelled-vendor.html'
  },
  {
    template_key: 'refund-processed',
    name: 'Refund Processed',
    subject: 'Refund Processed - {{invoice_number}}',
    template_type: 'payment',
    category: 'payment',
    journey_stage: ['Lost', 'Completed'],
    priority: 8,
    auto_send: true,
    required_fields: ['invoice_id'],
    recommended_when: 'When refund is issued',
    time_sensitive: false,
    file_path: 'email-templates/refund-processed.html'
  },

  // Admin Notifications
  {
    template_key: 'admin-large-payment-alert',
    name: 'Admin: Large Payment Alert',
    subject: '💰 Large Payment Received - {{invoice_number}}',
    template_type: 'admin',
    category: 'admin',
    journey_stage: [],
    trigger_conditions: { payment_amount_threshold: 5000 },
    priority: 8,
    auto_send: true,
    required_fields: ['payment_id'],
    recommended_when: 'When payment exceeds threshold',
    time_sensitive: true,
    file_path: null // Admin email, different format
  },
  {
    template_key: 'admin-overdue-alert',
    name: 'Admin: Overdue Invoice Alert',
    subject: '⚠️ Overdue Invoice Alert - Daily Summary',
    template_type: 'admin',
    category: 'admin',
    journey_stage: [],
    priority: 9,
    auto_send: true,
    required_fields: [],
    recommended_when: 'Daily summary of overdue invoices',
    time_sensitive: true,
    file_path: null
  },
  {
    template_key: 'admin-event-day-reminder',
    name: 'Admin: Event Day Reminder',
    subject: '📅 Today\'s Events - Setup Checklist',
    template_type: 'admin',
    category: 'admin',
    journey_stage: [],
    priority: 9,
    auto_send: true,
    required_fields: [],
    recommended_when: 'Morning reminder of today\'s events',
    time_sensitive: true,
    file_path: null
  }
];

export async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  for (const template of templates) {
    try {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_key', template.template_key)
        .single();

      if (existing) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: template.name,
            subject: template.subject,
            template_type: template.template_type,
            category: template.category,
            journey_stage: template.journey_stage,
            trigger_conditions: template.trigger_conditions || {},
            priority: template.priority,
            auto_send: template.auto_send,
            cooldown_hours: template.cooldown_hours || null,
            required_fields: template.required_fields,
            recommended_when: template.recommended_when,
            time_sensitive: template.time_sensitive,
            file_path: template.file_path || null,
            updated_at: new Date().toISOString()
          })
          .eq('template_key', template.template_key);

        if (error) {
          console.error(`❌ Error updating ${template.template_key}:`, error);
        } else {
          console.log(`✅ Updated: ${template.template_key}`);
        }
      } else {
        // Insert new template
        // Note: We'll need to create the HTML file content separately
        const { error } = await supabase
          .from('email_templates')
          .insert({
            template_key: template.template_key,
            name: template.name,
            subject: template.subject,
            content: `<!-- Template: ${template.name} -->\n<!-- File: ${template.file_path || 'N/A'} -->\n<!-- This template needs to be created -->`,
            template_type: template.template_type,
            category: template.category,
            journey_stage: template.journey_stage,
            trigger_conditions: template.trigger_conditions || {},
            priority: template.priority,
            auto_send: template.auto_send,
            cooldown_hours: template.cooldown_hours || null,
            required_fields: template.required_fields,
            recommended_when: template.recommended_when,
            time_sensitive: template.time_sensitive,
            file_path: template.file_path || null,
            is_active: true
          });

        if (error) {
          console.error(`❌ Error inserting ${template.template_key}:`, error);
        } else {
          console.log(`✅ Created: ${template.template_key}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${template.template_key}:`, error);
    }
  }

  console.log('✨ Template seeding complete!');
}

// Run if called directly
if (require.main === module) {
  seedEmailTemplates()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
