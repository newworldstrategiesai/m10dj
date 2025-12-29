/**
 * Visitor Tracking System for M10 DJ Company
 * 
 * Generates a stable visitor fingerprint and manages visitor sessions
 * across pages, QR scans, and form submissions.
 */

// Storage keys
const VISITOR_ID_KEY = 'm10dj_visitor_id';
const FINGERPRINT_KEY = 'm10dj_fingerprint';
const SESSION_START_KEY = 'm10dj_session_start';

/**
 * Device information for fingerprinting
 */
interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  colorDepth: number;
  deviceMemory: number | undefined;
  hardwareConcurrency: number;
  touchSupport: boolean;
  cookieEnabled: boolean;
}

/**
 * UTM and referrer parameters
 */
interface TrackingParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
}

/**
 * Visitor session data
 */
export interface VisitorSession {
  visitorId: string | null;
  fingerprint: string;
  deviceInfo: DeviceInfo;
  trackingParams: TrackingParams;
  isNewVisitor: boolean;
  sessionNumber: number;
}

/**
 * Page view data
 */
export interface PageViewData {
  pageUrl: string;
  pagePath: string;
  pageTitle: string;
  pageCategory?: string;
  referrer?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Get device information for fingerprinting
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      screenResolution: '',
      timezone: '',
      language: '',
      platform: '',
      colorDepth: 0,
      deviceMemory: undefined,
      hardwareConcurrency: 0,
      touchSupport: false,
      cookieEnabled: false,
    };
  }

  const nav = navigator as Navigator & { deviceMemory?: number };

  return {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    colorDepth: screen.colorDepth,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cookieEnabled: navigator.cookieEnabled,
  };
}

/**
 * Generate a stable fingerprint hash from device characteristics
 */
function generateFingerprint(deviceInfo: DeviceInfo): string {
  // Combine device characteristics into a string
  const components = [
    deviceInfo.userAgent,
    deviceInfo.screenResolution,
    deviceInfo.timezone,
    deviceInfo.language,
    deviceInfo.platform,
    String(deviceInfo.colorDepth),
    String(deviceInfo.deviceMemory || 'unknown'),
    String(deviceInfo.hardwareConcurrency),
    String(deviceInfo.touchSupport),
    String(deviceInfo.cookieEnabled),
  ];

  const str = components.join('|||');
  
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  
  // Convert to hex and ensure positive
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Parse UTM parameters from URL
 */
function getTrackingParams(): TrackingParams {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmContent: params.get('utm_content') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    referrer: document.referrer || undefined,
    landingPage: window.location.pathname,
  };
}

/**
 * Detect device type from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Get browser name from user agent
 */
export function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
  
  return 'unknown';
}

/**
 * Get OS from user agent
 */
export function getOS(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  
  return 'unknown';
}

/**
 * Get or create visitor session
 */
export function getVisitorSession(): VisitorSession {
  if (typeof window === 'undefined') {
    return {
      visitorId: null,
      fingerprint: '',
      deviceInfo: getDeviceInfo(),
      trackingParams: {},
      isNewVisitor: true,
      sessionNumber: 1,
    };
  }

  const deviceInfo = getDeviceInfo();
  const fingerprint = generateFingerprint(deviceInfo);
  const trackingParams = getTrackingParams();
  
  // Check if we have an existing visitor ID
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
  let isNewVisitor = false;
  let sessionNumber = 1;
  
  // Check if this is a new session (more than 30 minutes since last activity)
  const sessionStart = localStorage.getItem(SESSION_START_KEY);
  const now = Date.now();
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  if (sessionStart) {
    const lastActivity = parseInt(sessionStart, 10);
    if (now - lastActivity > SESSION_TIMEOUT) {
      // New session
      sessionNumber = parseInt(localStorage.getItem('m10dj_session_count') || '0', 10) + 1;
      localStorage.setItem('m10dj_session_count', String(sessionNumber));
    }
  } else {
    isNewVisitor = !visitorId;
  }
  
  // Update session start time
  localStorage.setItem(SESSION_START_KEY, String(now));
  
  // Store fingerprint if new
  if (!storedFingerprint) {
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  }

  return {
    visitorId,
    fingerprint: storedFingerprint || fingerprint,
    deviceInfo,
    trackingParams,
    isNewVisitor,
    sessionNumber,
  };
}

/**
 * Store visitor ID in local storage
 */
export function setVisitorId(visitorId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
}

/**
 * Get stored visitor ID
 */
export function getStoredVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VISITOR_ID_KEY);
}

/**
 * Get fingerprint
 */
export function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem(FINGERPRINT_KEY);
  if (stored) return stored;
  
  const deviceInfo = getDeviceInfo();
  const fingerprint = generateFingerprint(deviceInfo);
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}

/**
 * Determine page category from path
 */
export function getPageCategory(path: string): string {
  const lowerPath = path.toLowerCase();
  
  if (lowerPath === '/' || lowerPath === '') return 'home';
  if (lowerPath.includes('/services')) return 'services';
  if (lowerPath.includes('/pricing') || lowerPath.includes('/packages')) return 'pricing';
  if (lowerPath.includes('/contact')) return 'contact';
  if (lowerPath.includes('/about')) return 'about';
  if (lowerPath.includes('/gallery') || lowerPath.includes('/photos')) return 'gallery';
  if (lowerPath.includes('/testimonials') || lowerPath.includes('/reviews')) return 'testimonials';
  if (lowerPath.includes('/requests') || lowerPath.includes('/crowd-request')) return 'requests';
  if (lowerPath.includes('/bid') || lowerPath.includes('/tip')) return 'tipping';
  if (lowerPath.includes('/checkout') || lowerPath.includes('/payment')) return 'checkout';
  if (lowerPath.includes('/schedule') || lowerPath.includes('/book')) return 'booking';
  if (lowerPath.includes('/admin')) return 'admin';
  if (lowerPath.includes('/faq')) return 'faq';
  if (lowerPath.includes('/blog')) return 'blog';
  
  return 'other';
}

/**
 * Get current page view data
 */
export function getCurrentPageData(): PageViewData {
  if (typeof window === 'undefined') {
    return {
      pageUrl: '',
      pagePath: '',
      pageTitle: '',
      deviceType: 'desktop',
    };
  }

  const pagePath = window.location.pathname;
  
  return {
    pageUrl: window.location.href,
    pagePath,
    pageTitle: document.title,
    pageCategory: getPageCategory(pagePath),
    referrer: document.referrer || undefined,
    deviceType: getDeviceType(),
  };
}

/**
 * Track page view - call this on page load
 */
export async function trackPageView(organizationId?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const session = getVisitorSession();
    const pageData = getCurrentPageData();
    
    const response = await fetch('/api/tracking/page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint: session.fingerprint,
        organizationId,
        ...pageData,
        userAgent: session.deviceInfo.userAgent,
        screenResolution: session.deviceInfo.screenResolution,
        timezone: session.deviceInfo.timezone,
        language: session.deviceInfo.language,
        platform: session.deviceInfo.platform,
        ...session.trackingParams,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.visitorId) {
        setVisitorId(data.visitorId);
      }
    }
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

/**
 * Link visitor to contact info (call when user provides email/phone)
 */
export async function linkVisitorToContact(params: {
  email?: string;
  phone?: string;
  name?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const visitorId = getStoredVisitorId();
  if (!visitorId) return;

  try {
    await fetch('/api/tracking/link-contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        ...params,
      }),
    });
  } catch (error) {
    console.error('Failed to link visitor to contact:', error);
  }
}

/**
 * Get visitor ID to include in form submissions, QR scans, etc.
 */
export function getVisitorIdForSubmission(): string | null {
  return getStoredVisitorId();
}

