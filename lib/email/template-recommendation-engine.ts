/**
 * Intelligent Email Template Recommendation Engine
 * Analyzes customer journey state and recommends appropriate email templates
 */

import { createClient } from '@supabase/supabase-js';

interface Contact {
  id: string;
  lead_status?: string;
  lead_stage?: string;
  event_date?: string | null;
  event_type?: string | null;
  quoted_price?: number | null;
  budget_range?: string | null;
  last_contacted_date?: string | null;
  proposal_sent_date?: string | null;
  deposit_paid?: boolean;
  payment_status?: string;
  venue_name?: string | null;
  email_address?: string | null;
}

interface Contract {
  id: string;
  status: string;
  signed_at?: string | null;
  signing_token_expires_at?: string | null;
  contract_number?: string;
  event_date?: string | null;
  total_amount?: number;
}

interface Invoice {
  id: string;
  invoice_status: string;
  due_date?: string | null;
  total_amount?: number;
  amount_paid?: number;
  balance_due?: number;
  invoice_number?: string;
}

interface Payment {
  id: string;
  payment_status: string;
  amount?: number;
  payment_date?: string | null;
  payment_type?: string;
}

interface QuoteSelection {
  id: string;
  package_name?: string;
  total_price?: number;
}

interface TemplateRecommendation {
  template_key: string;
  template_name: string;
  subject: string;
  category: string;
  recommendation_score: number;
  recommendation_reason: string;
  priority: number;
  time_sensitive: boolean;
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  context_summary: string;
  can_send_now: boolean;
  cooldown_expires_at?: string | null;
  last_sent_at?: string | null;
  required_fields: string[];
  missing_fields: string[];
}

interface CustomerContext {
  contact: Contact;
  contracts: Contract[];
  invoices: Invoice[];
  payments: Payment[];
  quoteSelections: QuoteSelection[];
  journey_stage: string;
  days_until_event?: number | null;
  days_since_event?: number | null;
  days_since_last_contact?: number | null;
  has_unsigned_contract: boolean;
  has_overdue_invoice: boolean;
  has_missing_payment: boolean;
  contract_expiring_soon: boolean;
  event_this_week: boolean;
  event_tomorrow: boolean;
  event_passed: boolean;
}

export class TemplateRecommendationEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Analyze customer context and determine journey stage
   */
  analyzeCustomerContext(
    contact: Contact,
    contracts: Contract[] = [],
    invoices: Invoice[] = [],
    payments: Payment[] = [],
    quoteSelections: QuoteSelection[] = []
  ): CustomerContext {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate time-based metrics
    const eventDate = contact.event_date ? new Date(contact.event_date) : null;
    const daysUntilEvent = eventDate 
      ? Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const daysSinceEvent = eventDate && eventDate < today
      ? Math.ceil((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const lastContactDate = contact.last_contacted_date 
      ? new Date(contact.last_contacted_date)
      : null;
    const daysSinceLastContact = lastContactDate
      ? Math.ceil((today.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine journey stage
    const journey_stage = this.determineJourneyStage(
      contact,
      contracts,
      invoices,
      payments,
      quoteSelections,
      daysSinceEvent
    );

    // Check contract statuses
    const hasSignedContract = contracts.some(
      c => c.status === 'signed' || c.signed_at || c.signed_by_vendor_at
    );
    const hasUnsignedContract = contracts.some(
      c => c.status !== 'signed' && c.status !== 'completed' && !c.signed_at
    );
    const contractExpiringSoon = contracts.some(c => {
      if (!c.signing_token_expires_at) return false;
      const expiresAt = new Date(c.signing_token_expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    // Check invoice statuses
    const hasOverdueInvoice = invoices.some(
      i => i.invoice_status === 'Overdue' || 
           (i.due_date && new Date(i.due_date) < today && i.invoice_status !== 'Paid')
    );
    const hasUnpaidInvoice = invoices.some(
      i => i.invoice_status !== 'Paid' && i.invoice_status !== 'Cancelled'
    );
    const hasPartialPayment = payments.some(p => p.payment_type === 'partial');

    // Check payment statuses
    const hasPaidPayment = payments.some(
      p => p.payment_status === 'paid' || p.payment_status === 'succeeded'
    );
    const hasMissingPayment = hasUnsignedContract && !hasPaidPayment;

    // Event timing checks
    const eventThisWeek = daysUntilEvent !== null && daysUntilEvent >= 0 && daysUntilEvent <= 7;
    const eventTomorrow = daysUntilEvent === 1;
    const eventPassed = daysSinceEvent !== null && daysSinceEvent > 0;

    return {
      contact,
      contracts,
      invoices,
      payments,
      quoteSelections,
      journey_stage,
      days_until_event: daysUntilEvent,
      days_since_event: daysSinceEvent,
      days_since_last_contact: daysSinceLastContact,
      has_unsigned_contract: hasUnsignedContract && !hasSignedContract,
      has_overdue_invoice: hasOverdueInvoice,
      has_missing_payment: hasMissingPayment,
      contract_expiring_soon: contractExpiringSoon,
      event_this_week: eventThisWeek,
      event_tomorrow: eventTomorrow,
      event_passed: eventPassed
    };
  }

  /**
   * Determine journey stage from customer data
   */
  private determineJourneyStage(
    contact: Contact,
    contracts: Contract[],
    invoices: Invoice[],
    payments: Payment[],
    quoteSelections: QuoteSelection[],
    daysSinceEvent: number | null
  ): string {
    // Check explicit status first
    if (contact.lead_status === 'Lost') return 'Lost';
    if (contact.lead_status === 'Completed' && daysSinceEvent && daysSinceEvent > 0) {
      return 'Completed';
    }

    // Check for completed event
    if (daysSinceEvent !== null && daysSinceEvent > 0) {
      const hasPaidPayment = payments.some(
        p => p.payment_status === 'paid' || p.payment_status === 'succeeded'
      );
      if (hasPaidPayment) return 'Completed';
    }

    // Check for paid deposit/full payment
    const hasPaidPayment = payments.some(
      p => p.payment_status === 'paid' || p.payment_status === 'succeeded'
    );
    const depositPaid = contact.deposit_paid === true || hasPaidPayment;
    if (depositPaid || hasPaidPayment) return 'Retainer Paid';

    // Check for signed contract
    const signedContract = contracts.some(
      c => c.status === 'signed' || c.signed_at || c.signed_by_vendor_at
    );
    const hasContract = contracts.length > 0;
    const hasInvoice = invoices.length > 0;

    if (signedContract || (hasContract && hasInvoice)) {
      return 'Booked';
    }

    // Check for unsigned contract
    if (hasContract && !signedContract) {
      return 'Negotiating';
    }

    // Check for quote/proposal
    const hasQuote = quoteSelections.length > 0;
    if (hasQuote) {
      return 'Proposal Sent';
    }

    // Check for qualification
    if (contact.quoted_price || contact.budget_range) {
      return 'Qualified';
    }

    // Check for contact
    if (contact.last_contacted_date || contact.proposal_sent_date) {
      return 'Contacted';
    }

    return 'New';
  }

  /**
   * Get recommended templates based on customer context
   */
  async getRecommendedTemplates(
    contactId: string
  ): Promise<TemplateRecommendation[]> {
    // Fetch all customer data
    const { data: contact } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      throw new Error('Contact not found');
    }

    const { data: contracts } = await this.supabase
      .from('contracts')
      .select('*')
      .eq('contact_id', contactId);

    const { data: invoices } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('contact_id', contactId);

    const { data: payments } = await this.supabase
      .from('payments')
      .select('*')
      .eq('contact_id', contactId);

    const { data: quoteSelections } = await this.supabase
      .from('quote_selections')
      .select('*')
      .eq('lead_id', contactId);

    // Analyze context
    const context = this.analyzeCustomerContext(
      contact,
      contracts || [],
      invoices || [],
      payments || [],
      quoteSelections || []
    );

    // Get all active templates
    const { data: templates } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true);

    if (!templates) {
      return [];
    }

    // Get template history for this contact
    const { data: history } = await this.supabase
      .from('email_template_history')
      .select('*')
      .eq('contact_id', contactId)
      .order('recommended_at', { ascending: false });

    // Score and filter templates
    const recommendations = templates
      .map(template => this.scoreTemplate(template, context, history || []))
      .filter(rec => rec !== null)
      .sort((a, b) => {
        // Sort by urgency first, then score, then priority
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgency_level] - urgencyOrder[a.urgency_level];
        if (urgencyDiff !== 0) return urgencyDiff;
        
        const scoreDiff = b.recommendation_score - a.recommendation_score;
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        
        return b.priority - a.priority;
      })
      .slice(0, 10); // Top 10 recommendations

    return recommendations as TemplateRecommendation[];
  }

  /**
   * Score a template based on context
   */
  private scoreTemplate(
    template: any,
    context: CustomerContext,
    history: any[]
  ): TemplateRecommendation | null {
    let score = 0.5; // Base score
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
    const reasons: string[] = [];
    const missingFields: string[] = [];

    // Check journey stage match
    const journeyStages = template.journey_stage || [];
    if (journeyStages.length > 0) {
      if (journeyStages.includes(context.journey_stage)) {
        score += 0.2;
        reasons.push(`Matches your current stage: ${context.journey_stage}`);
      } else {
        // Still consider, but lower score
        score += 0.05;
      }
    } else {
      // Universal template
      score += 0.1;
    }

    // Check cooldown period
    const templateHistory = history.filter(h => h.template_key === template.template_key);
    const lastSent = templateHistory.find(h => h.sent_at);
    const cooldownHours = template.cooldown_hours || 0;
    
    if (lastSent && cooldownHours > 0) {
      const lastSentDate = new Date(lastSent.sent_at);
      const hoursSinceSent = (Date.now() - lastSentDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSent < cooldownHours) {
        // In cooldown, reduce score significantly
        score *= 0.1;
        return null; // Don't recommend if in cooldown
      }
    }

    // Check required fields
    const requiredFields = template.required_fields || [];
    for (const field of requiredFields) {
      if (!this.hasRequiredField(field, context)) {
        missingFields.push(field);
        score *= 0.5; // Reduce score if missing required field
      }
    }

    // Check time-sensitive conditions
    if (template.time_sensitive) {
      if (context.event_tomorrow) {
        score += 0.3;
        urgency = 'critical';
        reasons.push('Event is tomorrow - time sensitive');
      } else if (context.event_this_week) {
        score += 0.2;
        urgency = 'high';
        reasons.push('Event is this week');
      }
    }

    // Context-specific scoring
    if (context.has_overdue_invoice && template.category === 'payment') {
      score += 0.3;
      urgency = 'high';
      reasons.push('You have overdue invoices');
    }

    if (context.contract_expiring_soon && template.category === 'contract') {
      score += 0.25;
      urgency = 'high';
      reasons.push('Contract expiring soon');
    }

    if (context.has_unsigned_contract && template.template_key?.includes('contract')) {
      score += 0.2;
      urgency = 'medium';
      reasons.push('You have an unsigned contract');
    }

    if (context.event_passed && template.category === 'post-event') {
      score += 0.2;
      reasons.push('Event has passed - follow up needed');
    }

    // Priority boost
    if (template.priority >= 8) {
      score += 0.15;
      urgency = Math.max(urgency, 'high');
    } else if (template.priority >= 6) {
      score += 0.1;
      urgency = Math.max(urgency, 'medium');
    }

    // Normalize score to 0-1
    score = Math.min(1, Math.max(0, score));

    // Don't recommend if score is too low or missing critical fields
    if (score < 0.3) {
      return null;
    }

    const recommendation: TemplateRecommendation = {
      template_key: template.template_key || template.id,
      template_name: template.name,
      subject: template.subject,
      category: template.category || 'general',
      recommendation_score: score,
      recommendation_reason: reasons.length > 0 
        ? reasons.join('. ')
        : template.recommended_when || 'Recommended based on your current stage',
      priority: template.priority || 5,
      time_sensitive: template.time_sensitive || false,
      urgency_level: urgency,
      context_summary: this.generateContextSummary(context),
      can_send_now: missingFields.length === 0 && (!lastSent || hoursSinceSent >= cooldownHours),
      cooldown_expires_at: lastSent && cooldownHours > 0
        ? new Date(lastSent.sent_at.getTime() + cooldownHours * 60 * 60 * 1000).toISOString()
        : null,
      last_sent_at: lastSent?.sent_at || null,
      required_fields: requiredFields,
      missing_fields: missingFields
    };

    return recommendation;
  }

  /**
   * Check if required field exists in context
   */
  private hasRequiredField(field: string, context: CustomerContext): boolean {
    switch (field) {
      case 'contract_id':
        return context.contracts.length > 0;
      case 'invoice_id':
        return context.invoices.length > 0;
      case 'payment_id':
        return context.payments.length > 0;
      case 'quote_id':
        return context.quoteSelections.length > 0;
      case 'event_date':
        return !!context.contact.event_date;
      case 'venue_name':
        return !!context.contact.venue_name;
      case 'signed_contract':
        return context.contracts.some(c => c.status === 'signed' || c.signed_at);
      case 'paid_payment':
        return context.payments.some(p => p.payment_status === 'paid');
      default:
        return true;
    }
  }

  /**
   * Generate human-readable context summary
   */
  private generateContextSummary(context: CustomerContext): string {
    const parts: string[] = [];
    
    parts.push(`Stage: ${context.journey_stage}`);
    
    if (context.days_until_event !== null && context.days_until_event >= 0) {
      if (context.days_until_event === 0) {
        parts.push('Event is today');
      } else if (context.days_until_event === 1) {
        parts.push('Event is tomorrow');
      } else {
        parts.push(`Event in ${context.days_until_event} days`);
      }
    } else if (context.days_since_event !== null) {
      parts.push(`Event was ${context.days_since_event} days ago`);
    }

    if (context.has_overdue_invoice) {
      parts.push('Has overdue invoices');
    }

    if (context.contract_expiring_soon) {
      parts.push('Contract expiring soon');
    }

    if (context.has_unsigned_contract) {
      parts.push('Has unsigned contract');
    }

    return parts.join(' • ');
  }
}
