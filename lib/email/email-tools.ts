/**
 * Email Tools for LiveKit Agent Function Calling
 * 
 * Provides email-related functions that the voice agent can call
 */

import { llm } from '@livekit/agents';
import { z } from 'zod';
import { EmailAssistant, SendEmailParams } from './email-assistant';

/**
 * Tool: Send Email
 * Allows the voice agent to send emails
 */
export function createSendEmailTool(emailAssistant: EmailAssistant) {
  return llm.tool({
    description: 'Send an email to a contact or email address. Use this when the user asks to send an email, send a message, or email someone.',
    parameters: z.object({
      to: z.string().describe('Recipient email address'),
      subject: z.string().describe('Email subject line'),
      body: z.string().describe('Email body content (plain text)'),
      html: z.string().optional().describe('Email body content (HTML format, optional)'),
      cc: z.array(z.string()).optional().describe('CC email addresses (optional)'),
      bcc: z.array(z.string()).optional().describe('BCC email addresses (optional)'),
    }),
    execute: async ({ to, subject, body, html, cc, bcc }) => {
      try {
        const params: SendEmailParams = {
          to,
          subject,
          body,
          html,
          cc,
          bcc,
        };

        const result = await emailAssistant.sendEmail(params);

        if (result.success) {
          return {
            success: true,
            message: `Email sent successfully to ${to}`,
            emailId: result.emailId,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to send email',
          };
        }
      } catch (error) {
        console.error('Error in sendEmail tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
}

/**
 * Tool: Read Emails
 * Allows the voice agent to read recent emails
 */
export function createReadEmailsTool(emailAssistant: EmailAssistant) {
  return llm.tool({
    description: 'Read recent emails from the inbox. Use this when the user asks to check emails, read messages, or see what emails they have.',
    parameters: z.object({
      limit: z.number().optional().default(10).describe('Number of emails to read (default: 10)'),
      unreadOnly: z.boolean().optional().default(false).describe('Only show unread emails (default: false)'),
    }),
    execute: async ({ limit, unreadOnly }) => {
      try {
        const emails = await emailAssistant.readEmails(limit, unreadOnly);

        if (emails.length === 0) {
          return {
            success: true,
            message: unreadOnly ? 'No unread emails' : 'No emails found',
            emails: [],
          };
        }

        // Format emails for the agent
        const formattedEmails = emails.map(email => ({
          id: email.id,
          from: email.from_address,
          subject: email.subject,
          preview: email.body_text?.substring(0, 200) || '',
          receivedAt: email.received_at || email.sent_at,
          isRead: email.is_read,
        }));

        return {
          success: true,
          message: `Found ${emails.length} email(s)`,
          emails: formattedEmails,
          count: emails.length,
        };
      } catch (error) {
        console.error('Error in readEmails tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
}

/**
 * Tool: Search Emails
 * Allows the voice agent to search emails
 */
export function createSearchEmailsTool(emailAssistant: EmailAssistant) {
  return llm.tool({
    description: 'Search emails by keyword. Use this when the user asks to find an email, search for a message, or look for emails about a topic.',
    parameters: z.object({
      query: z.string().describe('Search query (searches in subject, body, and sender)'),
      limit: z.number().optional().default(20).describe('Maximum number of results (default: 20)'),
    }),
    execute: async ({ query, limit }) => {
      try {
        const emails = await emailAssistant.searchEmails(query, limit);

        if (emails.length === 0) {
          return {
            success: true,
            message: `No emails found matching "${query}"`,
            emails: [],
          };
        }

        // Format emails for the agent
        const formattedEmails = emails.map(email => ({
          id: email.id,
          from: email.from_address,
          subject: email.subject,
          preview: email.body_text?.substring(0, 200) || '',
          receivedAt: email.received_at || email.sent_at,
        }));

        return {
          success: true,
          message: `Found ${emails.length} email(s) matching "${query}"`,
          emails: formattedEmails,
          count: emails.length,
        };
      } catch (error) {
        console.error('Error in searchEmails tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
}

/**
 * Tool: Get Email Details
 * Allows the voice agent to get full details of a specific email
 */
export function createGetEmailTool(emailAssistant: EmailAssistant) {
  return llm.tool({
    description: 'Get full details of a specific email by ID. Use this when the user asks to read a specific email or get details about an email.',
    parameters: z.object({
      emailId: z.string().describe('Email ID to retrieve'),
    }),
    execute: async ({ emailId }) => {
      try {
        const email = await emailAssistant.getEmail(emailId);

        if (!email) {
          return {
            success: false,
            error: 'Email not found',
          };
        }

        // Mark as read if not already
        if (!email.is_read) {
          await emailAssistant.markAsRead(emailId);
        }

        return {
          success: true,
          email: {
            id: email.id,
            from: email.from_address,
            to: email.to_address,
            subject: email.subject,
            body: email.body_text || email.body_html || '',
            html: email.body_html,
            receivedAt: email.received_at || email.sent_at,
            isRead: email.is_read,
            threadId: email.thread_id,
          },
        };
      } catch (error) {
        console.error('Error in getEmail tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
}

/**
 * Tool: Mark Email as Read
 * Allows the voice agent to mark emails as read
 */
export function createMarkEmailReadTool(emailAssistant: EmailAssistant) {
  return llm.tool({
    description: 'Mark an email as read. Use this when the user has read or acknowledged an email.',
    parameters: z.object({
      emailId: z.string().describe('Email ID to mark as read'),
    }),
    execute: async ({ emailId }) => {
      try {
        const success = await emailAssistant.markAsRead(emailId);

        if (success) {
          return {
            success: true,
            message: 'Email marked as read',
          };
        } else {
          return {
            success: false,
            error: 'Failed to mark email as read',
          };
        }
      } catch (error) {
        console.error('Error in markEmailRead tool:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
}

/**
 * Create all email tools for an EmailAssistant instance
 */
export function createEmailTools(emailAssistant: EmailAssistant) {
  return [
    createSendEmailTool(emailAssistant),
    createReadEmailsTool(emailAssistant),
    createSearchEmailsTool(emailAssistant),
    createGetEmailTool(emailAssistant),
    createMarkEmailReadTool(emailAssistant),
  ];
}

