/**
 * Email Master Controls
 * 
 * Provides platform-level and organization-level email control functionality.
 * Allows super admin to control platform-wide emails and org admins to control org-specific emails.
 * 
 * Control Priority: Organization-level > Platform-level > Default (all enabled)
 */

import { createClient } from '@supabase/supabase-js';

export type EmailCategory = 'ADMIN_DEV' | 'CUSTOMER' | 'CRITICAL';
export type EmailControlMode = 'all' | 'admin_dev_only' | 'critical_only' | 'disabled';

export interface EmailControl {
  id: string;
  organization_id: string | null;
  control_mode: EmailControlMode;
  updated_by: string | null;
  updated_at: string;
  notes: string | null;
}

export interface EmailCheckResult {
  allowed: boolean;
  reason?: string;
  controlLevel?: 'platform' | 'organization' | 'default';
  controlMode?: EmailControlMode;
}

/**
 * Get Supabase client (server-side with service role, client-side with anon key)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  // Prefer service role key for server-side operations
  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error('Supabase key is not configured');
  }

  return createClient(supabaseUrl, key);
}

/**
 * Check if an email address belongs to an admin or development user
 * Checks against admin_roles table and hardcoded admin emails
 */
export async function isAdminDevEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Hardcoded admin emails (fallback)
  const hardcodedAdminEmails = [
    'djbenmurray@gmail.com',
    'admin@m10djcompany.com',
    'manager@m10djcompany.com',
    'm10djcompany@gmail.com',
  ];

  if (hardcodedAdminEmails.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail)) {
    return true;
  }

  // Check admin domains
  const adminDomains = ['@m10djcompany.com', '@djdash.net'];
  if (adminDomains.some(domain => normalizedEmail.endsWith(domain))) {
    return true;
  }

  // Check development/test email patterns
  const devPatterns = [
    /^test@/i,
    /@test\./i,
    /@example\./i,
    /fake@/i,
    /temp@/i,
    /@temp\./i,
    /@invalid\./i,
    /dev@/i,
    /@dev\./i,
  ];

  if (devPatterns.some(pattern => pattern.test(normalizedEmail))) {
    return true;
  }

  // Check admin_roles table
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn('[Email Controls] Error checking admin_roles:', error);
      // Fallback to hardcoded check
      return false;
    }

    return !!data;
  } catch (error) {
    console.warn('[Email Controls] Error checking admin email:', error);
    return false;
  }
}

/**
 * Get email control setting for an organization
 * Returns organization-level control if exists, otherwise platform-level control
 */
export async function getEmailControl(
  organizationId?: string | null
): Promise<EmailControl | null> {
  try {
    const supabase = getSupabaseClient();

    // First, try to get organization-level control
    if (organizationId) {
      const { data: orgControl, error: orgError } = await supabase
        .from('email_controls')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (orgError) {
        console.warn('[Email Controls] Error fetching org control:', orgError);
      } else if (orgControl) {
        return orgControl as EmailControl;
      }
    }

    // Fall back to platform-level control
    const { data: platformControl, error: platformError } = await supabase
      .from('email_controls')
      .select('*')
      .is('organization_id', null)
      .maybeSingle();

    if (platformError) {
      console.warn('[Email Controls] Error fetching platform control:', platformError);
      return null;
    }

    return platformControl as EmailControl | null;
  } catch (error) {
    console.error('[Email Controls] Error getting email control:', error);
    return null;
  }
}

/**
 * Check if an email can be sent based on category, recipient, and organization context
 * 
 * Priority: Organization-level > Platform-level > Default (all enabled)
 * Critical emails always bypass controls
 */
export async function canSendEmail(
  category: EmailCategory,
  recipientEmail?: string | null,
  organizationId?: string | null
): Promise<EmailCheckResult> {
  // Critical emails always allowed
  if (category === 'CRITICAL') {
    return {
      allowed: true,
      controlLevel: 'default',
      controlMode: 'all',
    };
  }

  // Get the applicable control setting
  const control = await getEmailControl(organizationId);
  const controlMode = control?.control_mode || 'all';
  const controlLevel = control?.organization_id ? 'organization' : (control ? 'platform' : 'default');

  // If control is 'all', allow all emails
  if (controlMode === 'all') {
    return {
      allowed: true,
      controlLevel,
      controlMode,
    };
  }

  // If control is 'disabled', block all non-critical emails
  if (controlMode === 'disabled') {
    return {
      allowed: false,
      reason: `Email sending is disabled at ${controlLevel} level`,
      controlLevel,
      controlMode,
    };
  }

  // If control is 'critical_only', block all non-critical emails
  if (controlMode === 'critical_only') {
    return {
      allowed: false,
      reason: `Only critical emails are allowed at ${controlLevel} level`,
      controlLevel,
      controlMode,
    };
  }

  // If control is 'admin_dev_only', check if recipient is admin/dev
  if (controlMode === 'admin_dev_only') {
    if (!recipientEmail) {
      return {
        allowed: false,
        reason: `Admin/dev only mode requires recipient email to verify`,
        controlLevel,
        controlMode,
      };
    }

    const isAdmin = await isAdminDevEmail(recipientEmail);
    if (isAdmin) {
      return {
        allowed: true,
        controlLevel,
        controlMode,
      };
    }

    return {
      allowed: false,
      reason: `Only admin/dev emails are allowed at ${controlLevel} level. Recipient ${recipientEmail} is not an admin/dev email.`,
      controlLevel,
      controlMode,
    };
  }

  // Default: allow (should not reach here, but safety fallback)
  return {
    allowed: true,
    controlLevel,
    controlMode,
  };
}

/**
 * Log blocked email attempt (for monitoring and debugging)
 */
export async function logBlockedEmail(
  category: EmailCategory,
  recipientEmail: string | null | undefined,
  organizationId: string | null | undefined,
  reason: string
): Promise<void> {
  try {
    console.warn('[Email Blocked]', {
      category,
      recipientEmail,
      organizationId,
      reason,
      timestamp: new Date().toISOString(),
    });

    // TODO: Add to email_logs table if it exists
    // For now, just log to console
  } catch (error) {
    console.error('[Email Controls] Error logging blocked email:', error);
  }
}

/**
 * Get current email control status for display
 */
export async function getEmailControlStatus(
  organizationId?: string | null
): Promise<{
  platform: EmailControl | null;
  organization: EmailControl | null;
  effective: EmailControl | null;
}> {
  try {
    const supabase = getSupabaseClient();

    // Get platform control
    const { data: platformControl } = await supabase
      .from('email_controls')
      .select('*')
      .is('organization_id', null)
      .maybeSingle();

    // Get organization control if org ID provided
    let orgControl: EmailControl | null = null;
    if (organizationId) {
      const { data } = await supabase
        .from('email_controls')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      orgControl = data as EmailControl | null;
    }

    // Effective control is org if exists, otherwise platform
    const effective = orgControl || (platformControl as EmailControl | null);

    return {
      platform: platformControl as EmailControl | null,
      organization: orgControl,
      effective,
    };
  } catch (error) {
    console.error('[Email Controls] Error getting control status:', error);
    return {
      platform: null,
      organization: null,
      effective: null,
    };
  }
}
