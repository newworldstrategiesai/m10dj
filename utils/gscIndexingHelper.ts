/**
 * Google Search Console Indexing Helper
 * 
 * This utility provides a checklist and helper functions for requesting
 * indexing of pages in Google Search Console.
 * 
 * Usage:
 * 1. Copy the URL from the checklist below
 * 2. Go to Google Search Console: https://search.google.com/search-console
 * 3. Use URL Inspection tool
 * 4. Paste URL and click "Request Indexing"
 */

export interface IndexingPriority {
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  expectedImpact: string;
}

/**
 * Priority list of pages to request indexing for
 * Ordered by business impact and conversion potential
 */
export const INDEXING_PRIORITY_LIST: IndexingPriority[] = [
  // CRITICAL: Primary conversion pages
  {
    url: 'https://www.m10djcompany.com/memphis-wedding-dj',
    priority: 'critical',
    reason: 'Primary wedding authority page - highest conversion potential',
    expectedImpact: 'Target: 50+ impressions/month, 5-10 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/dj-near-me-memphis',
    priority: 'critical',
    reason: 'High-intent local search page - "near me" queries',
    expectedImpact: 'Target: 30+ impressions/month, 3-5 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/wedding-dj-memphis-tn',
    priority: 'critical',
    reason: 'Tennessee-focused wedding page - state-level targeting',
    expectedImpact: 'Target: 25+ impressions/month, 2-4 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/best-wedding-dj-memphis',
    priority: 'critical',
    reason: 'Review/social proof page - "best" keyword intent',
    expectedImpact: 'Target: 20+ impressions/month, 2-3 clicks/month'
  },
  
  // HIGH: Service and location pages
  {
    url: 'https://www.m10djcompany.com/memphis-dj-services',
    priority: 'high',
    reason: 'Comprehensive service overview page',
    expectedImpact: 'Target: 40+ impressions/month, 3-5 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/memphis-dj-pricing-guide',
    priority: 'high',
    reason: 'Pricing transparency - high conversion intent',
    expectedImpact: 'Target: 15+ impressions/month, 2-3 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/dj-germantown-tn',
    priority: 'high',
    reason: 'Premium location page - affluent market',
    expectedImpact: 'Target: 10+ impressions/month, 1-2 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/dj-collierville-tn',
    priority: 'high',
    reason: 'Location page - family-oriented market',
    expectedImpact: 'Target: 10+ impressions/month, 1-2 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/dj-east-memphis-tn',
    priority: 'high',
    reason: 'Location page - upscale residential area',
    expectedImpact: 'Target: 8+ impressions/month, 1-2 clicks/month'
  },
  
  // MEDIUM: Specialty and service pages
  {
    url: 'https://www.m10djcompany.com/memphis-event-dj-services',
    priority: 'medium',
    reason: 'Event-focused page - broader market',
    expectedImpact: 'Target: 20+ impressions/month, 2-3 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/corporate-events',
    priority: 'medium',
    reason: 'Corporate event page - B2B market',
    expectedImpact: 'Target: 15+ impressions/month, 1-2 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/dj-rentals-memphis',
    priority: 'medium',
    reason: 'Equipment rental page - different intent',
    expectedImpact: 'Target: 10+ impressions/month, 1-2 clicks/month'
  },
  {
    url: 'https://www.m10djcompany.com/memphis-wedding-dj-prices-2025',
    priority: 'medium',
    reason: 'Pricing page with year - current relevance',
    expectedImpact: 'Target: 12+ impressions/month, 1-2 clicks/month'
  },
  
  // LOW: Supporting pages
  {
    url: 'https://www.m10djcompany.com/memphis-specialty-dj-services',
    priority: 'low',
    reason: 'Niche services page',
    expectedImpact: 'Target: 5+ impressions/month, <1 click/month'
  },
  {
    url: 'https://www.m10djcompany.com/multicultural-dj-memphis',
    priority: 'low',
    reason: 'Specialty market page',
    expectedImpact: 'Target: 5+ impressions/month, <1 click/month'
  }
];

/**
 * Get URLs by priority level
 */
export function getUrlsByPriority(priority: IndexingPriority['priority']): string[] {
  return INDEXING_PRIORITY_LIST
    .filter(item => item.priority === priority)
    .map(item => item.url);
}

/**
 * Get all critical and high priority URLs
 */
export function getHighPriorityUrls(): string[] {
  return INDEXING_PRIORITY_LIST
    .filter(item => item.priority === 'critical' || item.priority === 'high')
    .map(item => item.url);
}

/**
 * Generate a formatted checklist for manual indexing requests
 */
export function generateIndexingChecklist(): string {
  const baseUrl = 'https://search.google.com/search-console';
  const inspectionUrl = `${baseUrl}/index?resource_id=sc-domain%3Am10djcompany.com&url=`;
  
  let checklist = '# Google Search Console Indexing Checklist\n\n';
  checklist += '## Instructions\n';
  checklist += '1. Go to: https://search.google.com/search-console\n';
  checklist += '2. Select property: m10djcompany.com\n';
  checklist += '3. Use URL Inspection tool (left sidebar)\n';
  checklist += '4. Paste each URL below and click "Request Indexing"\n';
  checklist += '5. Wait 24-48 hours and check status\n\n';
  
  checklist += '## Priority Order\n\n';
  
  const priorities: IndexingPriority['priority'][] = ['critical', 'high', 'medium', 'low'];
  
  priorities.forEach(priority => {
    const items = INDEXING_PRIORITY_LIST.filter(item => item.priority === priority);
    if (items.length === 0) return;
    
    checklist += `### ${priority.toUpperCase()} Priority (${items.length} pages)\n\n`;
    
    items.forEach((item, index) => {
      checklist += `${index + 1}. **${item.url}**\n`;
      checklist += `   - Reason: ${item.reason}\n`;
      checklist += `   - Expected Impact: ${item.expectedImpact}\n`;
      checklist += `   - [Request Indexing](${inspectionUrl}${encodeURIComponent(item.url)})\n\n`;
    });
  });
  
  return checklist;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('m10djcompany.com');
  } catch {
    return false;
  }
}

