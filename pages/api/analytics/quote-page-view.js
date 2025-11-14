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
 * - event_type: 'page_view' | 'time_on_page' | 'page_exit'
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
    // Insert tracking event into analytics table (or create one if it doesn't exist)
    // For now, we'll use a simple approach and store in a quote_analytics table
    const { data, error } = await supabase
      .from('quote_analytics')
      .insert({
        quote_id: quote_id,
        event_type: event_type,
        time_spent: time_spent || null,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

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
    console.error('Server error tracking quote page view:', error);
    res.status(500).json({ error: 'Failed to track event', details: error.message });
  }
}

