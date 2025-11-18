import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Track that a lead viewed pricing but hasn't made a selection
 * This will be used to trigger follow-up emails 2-3 days later
 */
export async function trackPricingViewWithoutSelection(contactId, quoteId, metadata = {}) {
  try {
    // Check if they already have a selection
    const { data: existingSelection } = await supabase
      .from('quote_selections')
      .select('id')
      .eq('contact_id', contactId)
      .limit(1);

    if (existingSelection && existingSelection.length > 0) {
      // They already have a selection, don't track for follow-up
      return { tracked: false, reason: 'selection_exists' };
    }

    // Check if we already tracked this view recently (within 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentView } = await supabase
      .from('quote_page_views')
      .select('id')
      .eq('contact_id', contactId)
      .eq('event_type', 'page_view')
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1);

    if (recentView && recentView.length > 0) {
      // Already tracked recently, just update timestamp
      return { tracked: false, reason: 'already_tracked_recently' };
    }

    // Track the view
    const { data, error } = await supabase
      .from('quote_page_views')
      .insert({
        contact_id: contactId,
        quote_id: quoteId,
        event_type: 'page_view',
        metadata: {
          ...metadata,
          has_selection: false,
          viewed_pricing: true
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking pricing view:', error);
      return { tracked: false, error: error.message };
    }

    return { tracked: true, data };
  } catch (error) {
    console.error('Error in trackPricingViewWithoutSelection:', error);
    return { tracked: false, error: error.message };
  }
}

/**
 * Mark that a follow-up was sent to prevent duplicates
 */
export async function markFollowUpSent(contactId, followupType = 'pricing_walkthrough', metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('followup_sent')
      .insert({
        contact_id: contactId,
        followup_type: followupType,
        sent_at: new Date().toISOString(),
        metadata: metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking follow-up as sent:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in markFollowUpSent:', error);
    return { success: false, error: error.message };
  }
}

