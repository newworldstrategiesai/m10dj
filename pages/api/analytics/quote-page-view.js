import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Track quote page views and time on page
 * POST /api/analytics/quote-page-view
 * 
 * Body:
 * - quote_id: string (the quote/contact ID)
 * - event_type: 'page_view' | 'time_on_page' | 'page_exit' | 'package_expanded' | 'package_selected'
 * - time_spent?: number (seconds, for time_on_page events)
 * - metadata?: object (additional data like selected package, addons, etc.)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quote_id, event_type, time_spent, metadata } = req.body;

  if (!quote_id || !event_type) {
    return res.status(400).json({ error: 'quote_id and event_type are required' });
  }

  try {
    // Insert tracking event into analytics table
    // Also track in quote_page_views for follow-up system
    const insertData = {
      quote_id: quote_id,
      event_type: event_type,
      time_spent: time_spent || null,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    // Insert into quote_analytics
    const { data, error } = await supabase
      .from('quote_analytics')
      .insert(insertData)
      .select()
      .single();

    // Also track in quote_page_views for follow-up system (if it's a page_view event)
    if (event_type === 'page_view') {
      // Get contact_id from quote_id (they might be the same)
      const contactId = quote_id;
      
      await supabase
        .from('quote_page_views')
        .insert({
          contact_id: contactId,
          quote_id: quote_id,
          event_type: 'page_view',
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })
        .catch(err => {
          // Table might not exist yet, that's okay
          console.log('Could not log to quote_page_views:', err.message);
        });
    }

    if (error) {
      // If table doesn't exist, log the error but don't fail
      console.error('Error tracking quote page view:', error);
      
      // Try to create the table structure (this would need a migration in production)
      // For now, just log the event
      console.log('Quote Analytics Event:', {
        quote_id,
        event_type,
        time_spent,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Event logged (table may not exist yet)',
        logged: true
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    // Always return 200 for tracking errors - we don't want to break the user experience
    console.error('Server error tracking quote page view:', error);
    console.log('Quote Analytics Event (fallback):', {
      quote_id,
      event_type,
      time_spent,
      metadata,
      timestamp: new Date().toISOString()
    });
    res.status(200).json({ 
      success: true, 
      message: 'Event logged (error handled gracefully)',
      logged: true
    });
  }
}

