/**
 * Comprehensive audit logging for karaoke admin actions
 * Tracks all changes, access, and security events
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AuditEvent {
  action: string;
  organization_id: string;
  signup_id?: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log an audit event
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const auditData = {
      organization_id: event.organization_id,
      signup_id: event.signup_id,
      action: event.action,
      performed_by_email: event.user_email,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      old_value: event.old_value ? JSON.stringify(event.old_value) : null,
      new_value: event.new_value ? JSON.stringify(event.new_value) : null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('karaoke_audit_log')
      .insert(auditData);

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Get audit trail for an organization
 */
export async function getAuditTrail(
  organizationId: string,
  options: {
    limit?: number;
    offset?: number;
    actions?: string[];
    userEmail?: string;
    dateFrom?: string;
    dateTo?: string;
    signupId?: string;
  } = {}
) {
  let query = supabase
    .from('karaoke_audit_log')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
  }

  if (options.actions && options.actions.length > 0) {
    query = query.in('action', options.actions);
  }

  if (options.userEmail) {
    query = query.ilike('performed_by_email', `%${options.userEmail}%`);
  }

  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom);
  }

  if (options.dateTo) {
    query = query.lte('created_at', options.dateTo);
  }

  if (options.signupId) {
    query = query.eq('signup_id', options.signupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch audit trail:', error);
    return [];
  }

  // Parse JSON fields
  return data.map(entry => ({
    ...entry,
    old_value: entry.old_value ? JSON.parse(entry.old_value) : null,
    new_value: entry.new_value ? JSON.parse(entry.new_value) : null,
    metadata: entry.metadata ? JSON.parse(entry.metadata) : null
  }));
}

/**
 * Log admin authentication/authorization events
 */
export async function logAdminAuth(
  organizationId: string,
  userId: string,
  userEmail: string,
  action: 'login' | 'logout' | 'access_denied' | 'session_expired',
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    action: `admin_${action}`,
    organization_id: organizationId,
    user_id: userId,
    user_email: userEmail,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata,
    severity: action === 'access_denied' ? 'high' : 'low'
  });
}

/**
 * Log signup modifications
 */
export async function logSignupChange(
  organizationId: string,
  signupId: string,
  action: 'status_change' | 'priority_update' | 'payment_update' | 'signup_modified' | 'signup_deleted',
  userEmail: string,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    organization_id: organizationId,
    signup_id: signupId,
    user_email: userEmail,
    old_value: oldValue,
    new_value: newValue,
    ip_address: ipAddress,
    user_agent: userAgent,
    severity: action === 'signup_deleted' ? 'high' : 'medium'
  });
}

/**
 * Log bulk operations
 */
export async function logBulkOperation(
  organizationId: string,
  action: 'bulk_status_update' | 'bulk_delete' | 'bulk_priority_update',
  userEmail: string,
  affectedSignups: string[],
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    organization_id: organizationId,
    user_email: userEmail,
    old_value: oldValues,
    new_value: newValues,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      affected_count: affectedSignups.length,
      affected_signups: affectedSignups.slice(0, 10), // Limit for storage
      total_affected: affectedSignups.length
    },
    severity: 'high'
  });
}

/**
 * Log settings changes
 */
export async function logSettingsChange(
  organizationId: string,
  action: 'settings_updated' | 'settings_reset',
  userEmail: string,
  oldSettings?: any,
  newSettings?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    organization_id: organizationId,
    user_email: userEmail,
    old_value: oldSettings,
    new_value: newSettings,
    ip_address: ipAddress,
    user_agent: userAgent,
    severity: 'high'
  });
}

/**
 * Log payment-related events
 */
export async function logPaymentEvent(
  organizationId: string,
  signupId: string,
  action: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'refund_processed' | 'payment_disputed',
  userEmail: string,
  paymentData?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action,
    organization_id: organizationId,
    signup_id: signupId,
    user_email: userEmail,
    new_value: paymentData,
    ip_address: ipAddress,
    user_agent: userAgent,
    severity: action.includes('failed') || action.includes('disputed') ? 'high' : 'medium'
  });
}

/**
 * Log system events (errors, warnings, maintenance)
 */
export async function logSystemEvent(
  organizationId: string,
  action: 'error_occurred' | 'warning_logged' | 'maintenance_performed' | 'rate_limit_exceeded',
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  await logAuditEvent({
    action,
    organization_id: organizationId,
    new_value: details,
    severity
  });
}

/**
 * Get audit statistics for an organization
 */
export async function getAuditStats(organizationId: string, days: number = 30) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase
    .from('karaoke_audit_log')
    .select('action, severity, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', dateFrom.toISOString());

  if (error) {
    console.error('Failed to get audit stats:', error);
    return null;
  }

  const stats = {
    total_events: data.length,
    by_action: {} as Record<string, number>,
    by_severity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    recent_activity: data.slice(0, 10)
  };

  data.forEach(event => {
    // Count by action
    stats.by_action[event.action] = (stats.by_action[event.action] || 0) + 1;

    // Count by severity
    const severity = (event.severity || 'medium') as keyof typeof stats.by_severity;
    stats.by_severity[severity]++;
  });

  return stats;
}

/**
 * Extract client information from request
 */
export function getClientInfo(req: any): { ipAddress?: string; userAgent?: string } {
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress;

  const userAgent = req.headers['user-agent'];

  return { ipAddress, userAgent };
}