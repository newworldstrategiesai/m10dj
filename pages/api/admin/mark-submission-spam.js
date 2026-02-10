/**
 * Mark a contact_submission as spam and add the submission email to blocked_emails.
 * Called from the Form Submissions detail modal "Mark as Spam" button.
 */

import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await requireAdmin(req, res);
    const supabase = createServerSupabaseClient({ req, res });
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    const isAdmin = isPlatformAdmin(user.email);
    const orgId = await getOrganizationContext(supabase, user.id, user.email);
    if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Organization required' });
    }

    const env = getEnv();
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    let submissionQuery = supabaseAdmin
      .from('contact_submissions')
      .select('id, email, organization_id')
      .eq('id', submissionId);

    if (!isAdmin && orgId) {
      submissionQuery = submissionQuery.eq('organization_id', orgId);
    }

    const { data: submission, error: subError } = await submissionQuery.single();

    if (subError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const email = (submission.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Submission has no email' });
    }

    const organizationId = submission.organization_id || orgId || null;

    const { error: updateError } = await supabaseAdmin
      .from('contact_submissions')
      .update({ status: 'spam', updated_at: new Date().toISOString() })
      .eq('id', submissionId);

    if (updateError) {
      if (updateError.message?.includes('check constraint') || updateError.message?.includes('violates check constraint')) {
        return res.status(400).json({
          error: "Database doesn't support 'spam' status yet. Run migration: supabase/migrations/add_spam_status_to_submissions.sql",
        });
      }
      logger.error('mark-submission-spam: update status failed', updateError);
      return res.status(500).json({ error: 'Failed to mark as spam', details: updateError.message });
    }

    const { error: blockError } = await supabaseAdmin.from('blocked_emails').insert({
      email_lower: email,
      organization_id: organizationId,
      reason: 'Marked as spam from contact submissions',
      source: 'spam_submission',
    });
    if (blockError && blockError.code !== '23505') {
      logger.warn('mark-submission-spam: could not add to blocked_emails (may already exist)', blockError);
    }

    return res.status(200).json({
      success: true,
      message: 'Marked as spam and email added to blocklist.',
    });
  } catch (err) {
    if (res.headersSent) return;
    logger.error('mark-submission-spam', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
