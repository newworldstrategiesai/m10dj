/**
 * Custom EmailAssistant for LiveKit Voice Agents
 * 
 * Uses Resend for sending emails and Supabase for storage/real-time notifications
 * Provides email capabilities to voice agents without external dependencies
 */

import { Resend } from 'resend';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export interface Email {
  id: string;
  inbox_email: string;
  from_address: string;
  to_address: string;
  subject: string;
  body_text: string;
  body_html?: string;
  received_at?: string;
  sent_at?: string;
  read_at?: string;
  is_read: boolean;
  thread_id?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailAssistantOptions {
  organizationId: string;
  productId: string;
  emailAddress: string; // e.g., "assistant@m10djcompany.com"
  contactId?: string;
}

export class EmailAssistant {
  private resend: Resend;
  private supabase: SupabaseClient;
  private realtimeChannel: RealtimeChannel | null = null;
  private organizationId: string;
  private productId: string;
  private emailAddress: string;
  private contactId?: string;
  private emailCallbacks: Array<(email: Email) => void> = [];

  constructor(options: EmailAssistantOptions) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(resendApiKey);
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.organizationId = options.organizationId;
    this.productId = options.productId;
    this.emailAddress = options.emailAddress;
    this.contactId = options.contactId;
  }

  /**
   * Initialize the EmailAssistant
   * Sets up Supabase Realtime subscription for email notifications
   */
  async initialize(): Promise<void> {
    try {
      // Ensure inbox exists in database
      await this.ensureInboxExists();

      // Subscribe to Supabase Realtime for email notifications
      this.realtimeChannel = this.supabase
        .channel(`email-notifications:${this.organizationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'emails',
            filter: `inbox_email=eq.${this.emailAddress}`,
          },
          (payload) => {
            this.handleNewEmail(payload.new as Email);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'emails',
            filter: `inbox_email=eq.${this.emailAddress}`,
          },
          (payload) => {
            // Handle email updates (e.g., read status)
            console.log('Email updated:', payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ EmailAssistant subscribed to real-time updates for ${this.emailAddress}`);
          }
        });

      console.log(`✅ EmailAssistant initialized for ${this.emailAddress}`);
    } catch (error) {
      console.error('Error initializing EmailAssistant:', error);
      throw error;
    }
  }

  /**
   * Ensure the inbox exists in the database
   */
  private async ensureInboxExists(): Promise<void> {
    const { data: existing } = await this.supabase
      .from('email_inboxes')
      .select('id')
      .eq('email_address', this.emailAddress)
      .eq('organization_id', this.organizationId)
      .single();

    if (!existing) {
      const { error } = await this.supabase
        .from('email_inboxes')
        .insert({
          organization_id: this.organizationId,
          contact_id: this.contactId,
          email_address: this.emailAddress,
          product_id: this.productId,
          display_name: `Assistant Inbox for ${this.organizationId}`,
          is_active: true,
        });

      if (error) {
        console.error('Error creating inbox:', error);
        // Don't throw - might already exist from concurrent creation
      }
    }
  }

  /**
   * Send an email via Resend
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      const { to, subject, body, html, cc, bcc, attachments } = params;

      // Send via Resend
      const result = await this.resend.emails.send({
        from: this.emailAddress,
        to: [to],
        subject,
        html: html || body,
        text: body,
        cc: cc,
        bcc: bcc,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' 
            ? Buffer.from(att.content) 
            : att.content,
          content_type: att.contentType,
        })),
      });

      if (result.error) {
        console.error('Resend API error:', result.error);
        return { success: false, error: JSON.stringify(result.error) };
      }

      const resendEmailId = result.data?.id;

      // Store in Supabase
      const { data: emailData, error: dbError } = await this.supabase
        .from('emails')
        .insert({
          inbox_email: this.emailAddress,
          resend_email_id: resendEmailId,
          from_address: this.emailAddress,
          to_address: to,
          cc_addresses: cc,
          bcc_addresses: bcc,
          subject,
          body_text: body,
          body_html: html || body,
          sent_at: new Date().toISOString(),
          metadata: {
            resend_id: resendEmailId,
            product_id: this.productId,
            organization_id: this.organizationId,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error storing email in database:', dbError);
        // Email was sent but not stored - still return success
      }

      // Trigger real-time notification
      await this.notifyEmailSent(emailData?.id || resendEmailId);

      return {
        success: true,
        emailId: emailData?.id || resendEmailId,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Read emails from the inbox
   */
  async readEmails(limit: number = 10, unreadOnly: boolean = false): Promise<Email[]> {
    try {
      let query = this.supabase
        .from('emails')
        .select('*')
        .eq('inbox_email', this.emailAddress)
        .order('received_at', { ascending: false })
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error reading emails:', error);
        return [];
      }

      return (data || []) as Email[];
    } catch (error) {
      console.error('Error reading emails:', error);
      return [];
    }
  }

  /**
   * Search emails by query
   */
  async searchEmails(query: string, limit: number = 20): Promise<Email[]> {
    try {
      const { data, error } = await this.supabase
        .from('emails')
        .select('*')
        .eq('inbox_email', this.emailAddress)
        .or(`subject.ilike.%${query}%,body_text.ilike.%${query}%,from_address.ilike.%${query}%`)
        .order('received_at', { ascending: false })
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching emails:', error);
        return [];
      }

      return (data || []) as Email[];
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(emailId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('emails')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', emailId)
        .eq('inbox_email', this.emailAddress);

      if (error) {
        console.error('Error marking email as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  /**
   * Get email by ID
   */
  async getEmail(emailId: string): Promise<Email | null> {
    try {
      const { data, error } = await this.supabase
        .from('emails')
        .select('*')
        .eq('id', emailId)
        .eq('inbox_email', this.emailAddress)
        .single();

      if (error || !data) {
        return null;
      }

      return data as Email;
    } catch (error) {
      console.error('Error getting email:', error);
      return null;
    }
  }

  /**
   * Handle new email received
   */
  private async handleNewEmail(email: Email): Promise<void> {
    console.log(`📧 New email received: ${email.subject} from ${email.from_address}`);

    // Mark as unread if not already
    if (email.is_read === undefined || email.is_read === null) {
      await this.supabase
        .from('emails')
        .update({ is_read: false })
        .eq('id', email.id);
    }

    // Call all registered callbacks
    this.emailCallbacks.forEach(callback => {
      try {
        callback(email);
      } catch (error) {
        console.error('Error in email callback:', error);
      }
    });
  }

  /**
   * Register callback for new emails
   */
  onEmailReceived(callback: (email: Email) => void): void {
    this.emailCallbacks.push(callback);
  }

  /**
   * Notify via Supabase Realtime that an email was sent
   */
  private async notifyEmailSent(emailId: string): Promise<void> {
    try {
      await this.supabase
        .channel(`email-notifications:${this.organizationId}`)
        .send({
          type: 'broadcast',
          event: 'email.sent',
          payload: {
            emailId,
            inboxEmail: this.emailAddress,
            timestamp: new Date().toISOString(),
          },
        });
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw - notification is not critical
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.emailCallbacks = [];
  }
}

