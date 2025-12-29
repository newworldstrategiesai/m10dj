/**
 * API endpoint to get customer journey timeline
 * 
 * GET /api/tracking/customer-timeline
 * 
 * Query params:
 * - visitorId: UUID - Get timeline by visitor ID
 * - email: string - Get timeline by email
 * - phone: string - Get timeline by phone
 * - contactId: UUID - Get timeline by contact ID
 * - limit: number - Max number of events (default 100)
 * 
 * Returns: Array of timeline events sorted by time (newest first)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      visitorId,
      email,
      phone,
      contactId,
      limit = 100,
    } = req.query;

    // At least one identifier is required
    if (!visitorId && !email && !phone && !contactId) {
      return res.status(400).json({ 
        error: 'At least one identifier (visitorId, email, phone, or contactId) is required' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let visitorIds = [];
    let visitorInfo = null;

    // Find visitor_ids based on provided identifiers
    if (visitorId) {
      visitorIds.push(visitorId);
      
      // Get visitor info
      const { data: visitor } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('id', visitorId)
        .single();
      
      if (visitor) {
        visitorInfo = visitor;
      }
    } else if (contactId) {
      // Find all visitors linked to this contact
      const { data: visitors } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('contact_id', contactId);
      
      if (visitors && visitors.length > 0) {
        visitorIds = visitors.map(v => v.id);
        visitorInfo = visitors[0]; // Use the first one for summary
      }
      
      // Also try to find by email/phone from the contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('email_address, phone')
        .eq('id', contactId)
        .single();
      
      if (contact) {
        // Find additional visitors by email/phone
        const { data: additionalVisitors } = await supabase
          .from('visitor_sessions')
          .select('id')
          .or(`email.eq.${contact.email_address},phone.eq.${contact.phone}`);
        
        if (additionalVisitors) {
          const additionalIds = additionalVisitors.map(v => v.id);
          visitorIds = [...new Set([...visitorIds, ...additionalIds])];
        }
      }
    } else {
      // Find by email or phone
      const conditions = [];
      if (email) conditions.push(`email.eq.${email}`);
      if (phone) conditions.push(`phone.eq.${phone}`);
      
      const { data: visitors } = await supabase
        .from('visitor_sessions')
        .select('*')
        .or(conditions.join(','));
      
      if (visitors && visitors.length > 0) {
        visitorIds = visitors.map(v => v.id);
        visitorInfo = visitors[0];
      }
    }

    if (visitorIds.length === 0) {
      return res.status(200).json({
        timeline: [],
        visitor: null,
        message: 'No visitor found with provided identifiers'
      });
    }

    // Build the timeline from all data sources
    const timeline = [];

    // 1. Get page views
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('*')
      .in('visitor_id', visitorIds)
      .order('viewed_at', { ascending: false })
      .limit(parseInt(limit));

    if (pageViews) {
      pageViews.forEach(pv => {
        timeline.push({
          event_type: 'page_view',
          event_id: pv.id,
          visitor_id: pv.visitor_id,
          organization_id: pv.organization_id,
          event_time: pv.viewed_at,
          title: pv.page_title || pv.page_path,
          description: `Viewed ${pv.page_path}`,
          metadata: {
            page_url: pv.page_url,
            page_path: pv.page_path,
            page_category: pv.page_category,
            referrer: pv.referrer,
            device_type: pv.device_type,
            time_on_page: pv.time_on_page_seconds,
          }
        });
      });
    }

    // 2. Get QR scans
    const { data: qrScans } = await supabase
      .from('qr_scans')
      .select('*')
      .in('visitor_id', visitorIds)
      .order('scanned_at', { ascending: false })
      .limit(parseInt(limit));

    if (qrScans) {
      qrScans.forEach(qs => {
        timeline.push({
          event_type: qs.converted ? 'qr_scan_converted' : 'qr_scan',
          event_id: qs.id,
          visitor_id: qs.visitor_id,
          organization_id: qs.organization_id,
          event_time: qs.scanned_at,
          title: 'QR Code Scan',
          description: qs.converted ? 'Scanned QR and made a request' : 'Scanned QR code',
          metadata: {
            event_qr_code: qs.event_qr_code,
            converted: qs.converted,
            request_id: qs.request_id,
            referrer: qs.referrer,
          }
        });
      });
    }

    // 3. Get song requests (crowd_requests)
    const { data: songRequests } = await supabase
      .from('crowd_requests')
      .select('*')
      .in('visitor_id', visitorIds)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (songRequests) {
      songRequests.forEach(cr => {
        timeline.push({
          event_type: 'song_request',
          event_id: cr.id,
          visitor_id: cr.visitor_id,
          organization_id: cr.organization_id,
          event_time: cr.created_at,
          title: `${cr.song_title || 'Song Request'} by ${cr.song_artist || 'Unknown Artist'}`,
          description: `Requested: ${cr.song_title || 'Unknown Song'}`,
          metadata: {
            song_title: cr.song_title,
            artist_name: cr.song_artist,
            requester_name: cr.requester_name,
            requester_email: cr.requester_email,
            requester_phone: cr.requester_phone,
            amount: cr.amount_requested,
            status: cr.status,
            payment_status: cr.payment_status,
          }
        });
      });
    }

    // 4. Get form submissions
    const { data: formSubmissions } = await supabase
      .from('contact_submissions')
      .select('*')
      .in('visitor_id', visitorIds)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (formSubmissions) {
      formSubmissions.forEach(cs => {
        timeline.push({
          event_type: 'form_submission',
          event_id: cs.id,
          visitor_id: cs.visitor_id,
          organization_id: cs.organization_id,
          event_time: cs.created_at,
          title: `Event Inquiry: ${cs.event_type || 'Unknown Event'}`,
          description: `${cs.name} submitted an inquiry`,
          metadata: {
            name: cs.name,
            email: cs.email,
            phone: cs.phone,
            event_type: cs.event_type,
            event_date: cs.event_date,
            location: cs.location,
            message: cs.message,
            status: cs.status,
          }
        });
      });
    }

    // Sort timeline by event time (newest first)
    timeline.sort((a, b) => new Date(b.event_time) - new Date(a.event_time));

    // Limit the total results
    const limitedTimeline = timeline.slice(0, parseInt(limit));

    // Build summary stats
    const summary = {
      total_events: limitedTimeline.length,
      page_views: limitedTimeline.filter(e => e.event_type === 'page_view').length,
      qr_scans: limitedTimeline.filter(e => e.event_type.startsWith('qr_scan')).length,
      song_requests: limitedTimeline.filter(e => e.event_type === 'song_request').length,
      form_submissions: limitedTimeline.filter(e => e.event_type === 'form_submission').length,
      first_seen: visitorInfo?.first_seen_at,
      last_seen: visitorInfo?.last_seen_at,
      visitor_ids: visitorIds,
    };

    return res.status(200).json({
      timeline: limitedTimeline,
      visitor: visitorInfo,
      summary,
    });
  } catch (error) {
    console.error('Error fetching customer timeline:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

