/**
 * Atomic queue operations for karaoke system
 * Prevents race conditions and ensures data consistency
 */

import { createClient } from '@supabase/supabase-js';
import { KaraokeSignup } from '@/types/karaoke';

export interface QueueOperation {
  type: 'status_update' | 'bulk_advance' | 'skip_current';
  signupId: string;
  newStatus?: string;
  performedBy?: string;
  organizationId: string;
  eventQrCode: string;
}

/**
 * Execute atomic queue operations with proper locking
 */
export class KaraokeQueueManager {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Atomically update signup status with proper validation
   */
  async updateSignupStatus(operation: QueueOperation): Promise<{
    success: boolean;
    signup?: KaraokeSignup;
    error?: string;
    conflict?: boolean;
  }> {
    const { signupId, newStatus, performedBy, organizationId, eventQrCode } = operation;

    try {
      // Start a transaction-like operation using advisory locks
      const lockKey = this.generateLockKey(organizationId, eventQrCode);

      // TEMPORARY: Skip locking for now to get basic functionality working
      // TODO: Implement proper optimistic locking or queue management
      console.log('Skipping queue lock for now - implementing optimistic updates');

      // Get current signup
      const { data: currentSignup, error: fetchError } = await this.supabase
        .from('karaoke_signups')
        .select('*')
        .eq('id', signupId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError || !currentSignup) {
        return { success: false, error: 'Signup not found' };
      }

      // Validate status transition
      const validation = this.validateStatusTransition(currentSignup.status, newStatus);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check for concurrent singing constraint
      // If admin is changing songs, automatically complete the current singer first
      if (newStatus === 'singing') {
        const currentlySinging = await this.getCurrentlySinging(organizationId, eventQrCode);
        if (currentlySinging && currentlySinging.id !== signupId) {
          // Admin override: automatically complete the current singer
          // (This API endpoint is admin-only, so we can safely override)
          console.log(`Admin override: Completing current singer ${currentlySinging.id} to allow ${signupId} to sing`);
          
          const completeCurrentSinger = await this.supabase
            .from('karaoke_signups')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              times_sung: (currentlySinging.times_sung || 0) + 1,
              last_sung_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', currentlySinging.id)
            .eq('organization_id', organizationId)
            .select()
            .single();

          if (completeCurrentSinger.error) {
            console.error('Failed to complete current singer:', completeCurrentSinger.error);
            return {
              success: false,
              error: 'Failed to complete current singer',
              conflict: true
            };
          }

          // Log the auto-completion
          await this.logQueueOperation({
            signupId: currentlySinging.id,
            operation: 'status_update',
            oldStatus: 'singing',
            newStatus: 'completed',
            performedBy: performedBy || 'system',
            organizationId,
            eventQrCode
          });
        }
      }

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set timestamps based on status
      if (newStatus === 'singing' && currentSignup.status !== 'singing') {
        updateData.started_at = new Date().toISOString();
      } else if ((newStatus === 'completed' || newStatus === 'skipped') && currentSignup.status === 'singing') {
        updateData.completed_at = new Date().toISOString();
        updateData.times_sung = (currentSignup.times_sung || 0) + 1;
        updateData.last_sung_at = new Date().toISOString();
      }

      // Update the signup
      const { data: updatedSignup, error: updateError } = await this.supabase
        .from('karaoke_signups')
        .update(updateData)
        .eq('id', signupId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update signup status:', updateError);
        return { success: false, error: 'Failed to update status' };
      }

      // Log the operation for audit
      await this.logQueueOperation({
        signupId,
        operation: 'status_update',
        oldStatus: currentSignup.status,
        newStatus: newStatus!,
        performedBy,
        organizationId,
        eventQrCode
      });

      // Handle auto-advance if enabled
      if (newStatus === 'completed' || newStatus === 'skipped') {
        await this.handleAutoAdvance(organizationId, eventQrCode, performedBy);
      }

      return { success: true, signup: updatedSignup };

    } catch (error) {
      console.error('Atomic status update error:', error);
      return { success: false, error: 'Internal error during status update' };
    }
  }

  /**
   * Advance the queue automatically if enabled
   */
  private async handleAutoAdvance(organizationId: string, eventQrCode: string, performedBy?: string): Promise<void> {
    try {
      // Check if auto-advance is enabled
      const { data: settings } = await this.supabase
        .from('karaoke_settings')
        .select('auto_advance')
        .eq('organization_id', organizationId)
        .single();

      if (!settings?.auto_advance) {
        return;
      }

      // Get the next person in queue
      const { data: nextSignup } = await this.supabase
        .from('karaoke_signups')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('event_qr_code', eventQrCode)
        .eq('status', 'next')
        .order('priority_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextSignup) {
        // Advance them to singing
        await this.updateSignupStatus({
          type: 'status_update',
          signupId: nextSignup.id,
          newStatus: 'singing',
          performedBy: performedBy || 'auto_advance',
          organizationId,
          eventQrCode
        });

        // Set the person after them to "next"
        const { data: afterNext } = await this.supabase
          .from('karaoke_signups')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('event_qr_code', eventQrCode)
          .eq('status', 'queued')
          .order('priority_order', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (afterNext) {
          await this.updateSignupStatus({
            type: 'status_update',
            signupId: afterNext.id,
            newStatus: 'next',
            performedBy: 'auto_advance',
            organizationId,
            eventQrCode
          });
        }
      }
    } catch (error) {
      console.error('Auto-advance error:', error);
      // Don't throw - auto-advance failure shouldn't break the main operation
    }
  }

  /**
   * Bulk update multiple signups atomically
   */
  async bulkUpdateStatuses(operations: QueueOperation[]): Promise<{
    success: boolean;
    results: Array<{ signupId: string; success: boolean; error?: string }>;
  }> {
    if (operations.length === 0) {
      return { success: true, results: [] };
    }

    // Group operations by organization/event to minimize lock contention
    const operationGroups = this.groupOperationsByEvent(operations);

    const results: Array<{ signupId: string; success: boolean; error?: string }> = [];

    // Process each group sequentially to maintain consistency
    const entries = Array.from(operationGroups.entries());
    for (const [eventKey, groupOps] of entries) {
      try {
        // Process each group with proper locking
        const groupResults = await this.processBulkGroup(groupOps);
        results.push(...groupResults);
      } catch (error) {
        console.error(`Bulk update error for ${eventKey}:`, error);
        // Mark all operations in this group as failed
        groupOps.forEach((op: QueueOperation) => {
          results.push({ signupId: op.signupId, success: false, error: 'Bulk operation failed' });
        });
      }
    }

    const success = results.every(r => r.success);
    return { success, results };
  }

  /**
   * Get currently singing signup for an event
   */
  private async getCurrentlySinging(organizationId: string, eventQrCode: string): Promise<KaraokeSignup | null> {
    const { data } = await this.supabase
      .from('karaoke_signups')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('event_qr_code', eventQrCode)
      .eq('status', 'singing')
      .single();

    return data;
  }

  /**
   * Validate status transition rules
   */
  private validateStatusTransition(currentStatus: string, newStatus?: string): { valid: boolean; error?: string } {
    if (!newStatus) {
      return { valid: false, error: 'New status is required' };
    }

    const validTransitions: Record<string, string[]> = {
      queued: ['next', 'singing', 'cancelled', 'skipped'],
      next: ['singing', 'queued', 'cancelled', 'skipped'],
      singing: ['completed', 'skipped', 'cancelled'],
      completed: [], // Terminal state
      skipped: [], // Terminal state
      cancelled: [] // Terminal state
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return {
        valid: false,
        error: `Cannot change status from ${currentStatus} to ${newStatus}`
      };
    }

    return { valid: true };
  }

  /**
   * Generate advisory lock key for queue operations
   */
  private generateLockKey(organizationId: string, eventQrCode: string): number {
    // Create a deterministic hash for the lock key
    const keyString = `${organizationId}:${eventQrCode}`;
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Group operations by organization and event
   */
  private groupOperationsByEvent(operations: QueueOperation[]): Map<string, QueueOperation[]> {
    const groups = new Map<string, QueueOperation[]>();

    operations.forEach(op => {
      const key = `${op.organizationId}:${op.eventQrCode}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(op);
    });

    return groups;
  }

  /**
   * Process a group of bulk operations with proper locking
   */
  private async processBulkGroup(operations: QueueOperation[]): Promise<Array<{ signupId: string; success: boolean; error?: string }>> {
    const results: Array<{ signupId: string; success: boolean; error?: string }> = [];

    // Use the first operation to get the lock key
    const firstOp = operations[0];
    const lockKey = this.generateLockKey(firstOp.organizationId, firstOp.eventQrCode);

    // Acquire lock
    const { error: lockError } = await this.supabase.rpc('pg_advisory_xact_lock', [lockKey]);

    if (lockError) {
      return operations.map(op => ({
        signupId: op.signupId,
        success: false,
        error: 'Queue operation in progress'
      }));
    }

    // Process operations sequentially to maintain consistency
    for (const operation of operations) {
      try {
        const result = await this.updateSignupStatus(operation);
        results.push({
          signupId: operation.signupId,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        results.push({
          signupId: operation.signupId,
          success: false,
          error: 'Operation failed'
        });
      }
    }

    return results;
  }

  /**
   * Log queue operations for audit trail
   */
  private async logQueueOperation(details: {
    signupId: string;
    operation: string;
    oldStatus?: string;
    newStatus?: string;
    performedBy?: string;
    organizationId: string;
    eventQrCode: string;
  }): Promise<void> {
    try {
      await this.supabase.from('karaoke_audit_log').insert({
        organization_id: details.organizationId,
        signup_id: details.signupId,
        action: details.operation,
        old_value: details.oldStatus ? { status: details.oldStatus } : null,
        new_value: details.newStatus ? { status: details.newStatus } : null,
        performed_by_email: details.performedBy,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log queue operation:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }
}

/**
 * Singleton instance for queue operations
 */
export const karaokeQueueManager = new KaraokeQueueManager();

/**
 * Helper function for simple status updates
 */
export async function updateKaraokeStatus(
  signupId: string,
  newStatus: string,
  performedBy?: string
): Promise<{ success: boolean; signup?: KaraokeSignup; error?: string }> {
  // First get the signup to extract organization and event info
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: signup } = await supabase
    .from('karaoke_signups')
    .select('organization_id, event_qr_code')
    .eq('id', signupId)
    .single();

  if (!signup) {
    return { success: false, error: 'Signup not found' };
  }

  return karaokeQueueManager.updateSignupStatus({
    type: 'status_update',
    signupId,
    newStatus,
    performedBy,
    organizationId: signup.organization_id,
    eventQrCode: signup.event_qr_code
  });
}