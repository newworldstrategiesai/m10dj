/**
 * Update Onboarding Progress API
 * 
 * Tracks onboarding progress and completion
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { stepId, completed, allStepsCompleted } = req.body;

    // Get user's organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, onboarding_progress')
      .eq('owner_id', session.user.id)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Update progress
    const currentProgress = org.onboarding_progress || {};
    const updatedProgress = { ...currentProgress };

    if (stepId) {
      updatedProgress[stepId] = {
        completed: completed !== false, // Default to true if not specified
        completedAt: completed !== false ? new Date().toISOString() : null
      };
    }

    // Prepare update data
    const updateData = {
      onboarding_progress: updatedProgress
    };

    // If all steps are completed, mark onboarding as complete
    if (allStepsCompleted) {
      updateData.onboarding_completed_at = new Date().toISOString();
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', org.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating onboarding progress:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update onboarding progress',
        details: updateError.message 
      });
    }

    return res.status(200).json({
      success: true,
      onboardingProgress: updatedOrg.onboarding_progress,
      onboardingCompletedAt: updatedOrg.onboarding_completed_at
    });
  } catch (error) {
    console.error('Error in update-onboarding API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

