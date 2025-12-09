import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to log submission attempt
async function logSubmissionAttempt(leadId, requestData, status, error = null, responseData = null) {
  try {
    const logData = {
      lead_id: leadId,
      submission_status: status,
      is_complete: requestData.isComplete || false,
      request_data: {
        bigNoSongs: requestData.bigNoSongs,
        specialDances: requestData.specialDances,
        specialDanceSongs: requestData.specialDanceSongs,
        playlistLinks: requestData.playlistLinks,
        ceremonyMusicType: requestData.ceremonyMusicType,
        ceremonyMusic: requestData.ceremonyMusic,
        mcIntroduction: requestData.mcIntroduction,
        isComplete: requestData.isComplete
      },
      request_timestamp: new Date().toISOString(),
      idempotency_key: requestData._idempotencyKey || null,
      queue_id: requestData._queueId || null,
      ip_address: null, // Can be added from req if needed
      user_agent: null // Can be added from req if needed
    };

    if (error) {
      logData.error_type = categorizeError(error);
      logData.error_message = error.message || String(error);
      logData.error_details = {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      };
      if (error.stack) {
        logData.error_stack = error.stack;
      }
    }

    if (responseData) {
      logData.response_status = responseData.status || 200;
      logData.response_data = responseData;
      logData.response_timestamp = new Date().toISOString();
    }

    const { data: logEntry, error: logError } = await supabase
      .from('questionnaire_submission_log')
      .insert([logData])
      .select()
      .single();

    if (logError) {
      console.error('Failed to log submission attempt:', logError);
    } else {
      return logEntry;
    }
  } catch (err) {
    console.error('Error in logSubmissionAttempt:', err);
  }
  return null;
}

// Helper function to categorize errors
function categorizeError(error) {
  if (!error) return 'unknown';
  if (error.code === 'PGRST301' || error.code === '08000' || error.message?.includes('network') || error.message?.includes('timeout')) {
    return 'network';
  }
  if (error.code === '23503' || error.code === '23505' || error.message?.includes('constraint')) {
    return 'database';
  }
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return 'validation';
  }
  return 'unknown';
}

// Helper function to validate questionnaire data
function validateQuestionnaireData(data, isComplete) {
  const errors = [];
  
  // If marking as complete, require some meaningful data
  if (isComplete) {
    const hasData = !!(
      data.bigNoSongs?.trim() ||
      (data.specialDances && data.specialDances.length > 0) ||
      (data.specialDanceSongs && Object.keys(data.specialDanceSongs).length > 0) ||
      (data.playlistLinks && Object.values(data.playlistLinks).some(link => link && link.trim())) ||
      data.ceremonyMusicType?.trim() ||
      (data.ceremonyMusic && Object.keys(data.ceremonyMusic).length > 0) ||
      data.mcIntroduction !== null
    );
    
    if (!hasData) {
      errors.push('Questionnaire cannot be submitted empty. Please fill in at least one section.');
    }
  }
  
  return errors;
}

// Helper function to send admin failure alert
async function sendAdminFailureAlert(leadId, error, submissionData) {
  try {
    const { sendAdminNotification } = await import('../../../utils/admin-notifications');
    await sendAdminNotification('questionnaire_submission_failed', {
      leadId: leadId,
      error: error.message || String(error),
      errorType: categorizeError(error),
      timestamp: new Date().toISOString(),
      submissionData: {
        hasData: !!(submissionData.bigNoSongs || submissionData.specialDances || submissionData.playlistLinks)
      }
    });
  } catch (notifError) {
    console.error('Failed to send admin failure alert:', notifError);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestStartTime = Date.now();
  let submissionLogId = null;

  // Log the request for debugging
  console.log('📝 Questionnaire save request received:', {
    leadId: req.body?.leadId,
    hasFormData: !!req.body,
    isComplete: req.body?.isComplete,
    timestamp: new Date().toISOString()
  });

  try {
    const { leadId, bigNoSongs, specialDances, specialDanceSongs, playlistLinks, ceremonyMusicType, ceremonyMusic, mcIntroduction, isComplete, _idempotencyKey, _queueId } = req.body;
    
    const requestData = {
      leadId,
      bigNoSongs,
      specialDances,
      specialDanceSongs,
      playlistLinks,
      ceremonyMusicType,
      ceremonyMusic,
      mcIntroduction,
      isComplete,
      _idempotencyKey,
      _queueId
    };

    // Log submission attempt
    const logEntry = await logSubmissionAttempt(leadId, requestData, 'attempted');
    if (logEntry) {
      submissionLogId = logEntry.id;
    }
    
    if (!leadId) {
      const error = new Error('Lead ID is required');
      console.error('Questionnaire save failed: Missing leadId', { body: req.body });
      
      // Log error
      if (submissionLogId) {
        await supabase
          .from('questionnaire_submission_log')
          .update({
            submission_status: 'failed',
            error_type: 'validation',
            error_message: error.message,
            response_status: 400,
            response_timestamp: new Date().toISOString()
          })
          .eq('id', submissionLogId);
      }
      
      return res.status(400).json({ 
        error: 'Lead ID is required',
        message: 'Missing contact ID. Please refresh the page and try again.',
        details: 'The questionnaire link may be invalid or expired.'
      });
    }

    // Validate data if completing
    if (isComplete) {
      const validationErrors = validateQuestionnaireData(requestData, isComplete);
      if (validationErrors.length > 0) {
        const error = new Error(validationErrors[0]);
        console.error('Questionnaire validation failed:', validationErrors);
        
        // Log error
        if (submissionLogId) {
          await supabase
            .from('questionnaire_submission_log')
            .update({
              submission_status: 'failed',
              error_type: 'validation',
              error_message: error.message,
              response_status: 400,
              response_timestamp: new Date().toISOString()
            })
            .eq('id', submissionLogId);
        }
        
        return res.status(400).json({
          error: 'Validation failed',
          message: validationErrors[0],
          details: validationErrors
        });
      }
    }

    // Idempotency check - prevent duplicate submissions
    if (_idempotencyKey && isComplete) {
      const { data: existingSubmission } = await supabase
        .from('music_questionnaires')
        .select('id, completed_at')
        .eq('lead_id', leadId)
        .not('completed_at', 'is', null)
        .single();
      
      if (existingSubmission && existingSubmission.completed_at) {
        console.log('Duplicate submission prevented:', _idempotencyKey);
        
        // Update log
        if (submissionLogId) {
          await supabase
            .from('questionnaire_submission_log')
            .update({
              submission_status: 'success',
              response_status: 200,
              response_data: { _duplicate: true },
              response_timestamp: new Date().toISOString()
            })
            .eq('id', submissionLogId);
        }
        
        return res.status(200).json({
          success: true,
          message: 'Questionnaire already submitted',
          data: existingSubmission,
          _duplicate: true
        });
      }
    }

    // Validate leadId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      console.error('Questionnaire save failed: Invalid leadId format', { leadId });
      return res.status(400).json({ 
        error: 'Invalid contact ID format',
        message: 'The questionnaire link appears to be invalid.',
        details: `Received ID: ${leadId}`
      });
    }

    // Verify that the lead/contact exists
    const { data: leadData, error: leadError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) {
      console.error('Questionnaire save failed: Lead not found', { leadId, error: leadError });
      return res.status(404).json({ 
        error: 'Contact not found',
        message: 'The contact associated with this questionnaire could not be found.',
        details: leadError?.message || 'Contact may have been deleted or the link is invalid.'
      });
    }

    // Check if questionnaire already exists to preserve started_at
    const { data: existing, error: existingError } = await supabase
      .from('music_questionnaires')
      .select('started_at')
      .eq('lead_id', leadId)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
      console.error('Error checking existing questionnaire:', existingError);
    }

    const now = new Date().toISOString();
    const updateData = {
      lead_id: leadId,
      big_no_songs: bigNoSongs || null,
      special_dances: specialDances || [],
      special_dance_songs: specialDanceSongs || {},
      playlist_links: playlistLinks || {},
      ceremony_music_type: ceremonyMusicType || null,
      ceremony_music: ceremonyMusic || {},
      mc_introduction: mcIntroduction !== undefined ? (mcIntroduction === null ? null : mcIntroduction) : null,
      updated_at: now
    };

    // Set started_at if this is the first time
    if (!existing?.started_at) {
      updateData.started_at = now;
    }

    // Set completed_at only if explicitly marked as complete
    if (isComplete === true) {
      updateData.completed_at = now;
    }

    // Save questionnaire data with retry logic
    let data, error;
    let retries = 3;
    
    while (retries > 0) {
      const result = await supabase
        .from('music_questionnaires')
        .upsert(updateData, {
          onConflict: 'lead_id'
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
      
      if (!error) {
        break; // Success, exit retry loop
      }
      
      // If it's a network/connection error, retry
      if (error.code === 'PGRST301' || error.code === '08000' || error.message?.includes('network') || error.message?.includes('timeout')) {
        retries--;
        if (retries > 0) {
          console.log(`Retrying questionnaire save (${4 - retries}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }
      } else {
        // Non-retryable error, break immediately
        break;
      }
    }

    if (error) {
      console.error('Error saving questionnaire:', {
        error,
        leadId,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      
      // Log failure
      if (submissionLogId) {
        await supabase
          .from('questionnaire_submission_log')
          .update({
            submission_status: 'failed',
            error_type: categorizeError(error),
            error_message: error.message,
            error_details: {
              code: error.code,
              details: error.details,
              hint: error.hint,
              message: error.message
            },
            error_stack: error.stack,
            response_status: 500,
            response_timestamp: new Date().toISOString()
          })
          .eq('id', submissionLogId);
      }
      
      // Send admin alert
      await sendAdminFailureAlert(leadId, error, requestData);
      
      // Provide more helpful error messages
      let userMessage = 'Failed to save questionnaire';
      if (error.code === '23503') { // Foreign key violation
        userMessage = 'The contact associated with this questionnaire could not be found.';
      } else if (error.code === '23505') { // Unique violation
        userMessage = 'A questionnaire already exists for this contact.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      return res.status(500).json({ 
        error: 'Failed to save questionnaire',
        message: userMessage,
        details: error.message,
        errorCode: error.code,
        submissionLogId: submissionLogId // Include log ID for recovery
      });
    }

    // Update log with success
    if (submissionLogId) {
      await supabase
        .from('questionnaire_submission_log')
        .update({
          submission_status: 'success',
          questionnaire_id: data.id,
          response_status: 200,
          response_data: { success: true, questionnaireId: data.id },
          response_timestamp: new Date().toISOString()
        })
        .eq('id', submissionLogId);
    }

    // Send admin notification (only for completed submissions)
    if (isComplete) {
      try {
        const { sendAdminNotification } = await import('../../../utils/admin-notifications');
        await sendAdminNotification('questionnaire_completed', {
          leadId: leadId,
          completedAt: new Date().toISOString(),
          questionnaireId: data.id
        });
      } catch (notifError) {
        console.error('Failed to send admin notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Questionnaire saved successfully',
      data,
      submissionLogId: submissionLogId // Include log ID for verification
    });
  } catch (error) {
    console.error('Error in save questionnaire API:', error);
    
    // Log unexpected error
    if (req.body?.leadId) {
      await logSubmissionAttempt(
        req.body.leadId,
        req.body,
        'failed',
        error,
        { status: 500, error: 'Internal server error' }
      );
      
      // Send admin alert
      await sendAdminFailureAlert(req.body.leadId, error, req.body);
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      submissionLogId: submissionLogId
    });
  }
}

