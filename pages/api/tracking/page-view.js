/**
 * API endpoint to track page views
 * 
 * POST /api/tracking/page-view
 * 
 * Records a page view and creates/updates the visitor session
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      fingerprint,
      organizationId,
      pageUrl,
      pagePath,
      pageTitle,
      pageCategory,
      referrer,
      deviceType,
      userAgent,
      screenResolution,
      timezone,
      language,
      platform,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ error: 'fingerprint is required' });
    }

    if (!pagePath) {
      return res.status(400).json({ error: 'pagePath is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get IP address from request headers
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     null;

    // Get browser from user agent
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Get or create visitor session
    const { data: visitorData, error: visitorError } = await supabase
      .rpc('get_or_create_visitor', {
        p_fingerprint: fingerprint,
        p_organization_id: organizationId || null,
        p_user_agent: userAgent || null,
        p_ip_address: ipAddress,
        p_screen_resolution: screenResolution || null,
        p_timezone: timezone || null,
        p_language: language || null,
        p_platform: platform || null,
        p_utm_source: utmSource || null,
        p_utm_medium: utmMedium || null,
        p_utm_campaign: utmCampaign || null,
        p_referrer: referrer || null,
        p_landing_page: pagePath,
      });

    if (visitorError) {
      console.error('Error getting/creating visitor:', visitorError);
      // Continue anyway - we'll try to record the page view without a visitor_id
    }

    const visitorId = visitorData;

    // Record the page view
    const { data: pageViewData, error: pageViewError } = await supabase
      .rpc('record_page_view', {
        p_visitor_id: visitorId,
        p_page_url: pageUrl || `https://www.m10djcompany.com${pagePath}`,
        p_page_path: pagePath,
        p_page_title: pageTitle || null,
        p_page_category: pageCategory || null,
        p_referrer: referrer || null,
        p_user_agent: userAgent || null,
        p_device_type: deviceType || null,
        p_organization_id: organizationId || null,
      });

    if (pageViewError) {
      console.error('Error recording page view:', pageViewError);
      // Don't fail the request - tracking shouldn't break the user experience
    }

    return res.status(200).json({ 
      success: true, 
      visitorId,
      pageViewId: pageViewData,
    });
  } catch (error) {
    console.error('Error in track page view:', error);
    // Return success anyway - tracking shouldn't fail the page load
    return res.status(200).json({ success: false, error: 'Tracking failed' });
  }
}

/**
 * Get browser name from user agent
 */
function getBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('SamsungBrowser')) return 'Samsung';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'IE';
  
  return 'unknown';
}

/**
 * Get OS from user agent
 */
function getOS(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'unknown';
}

