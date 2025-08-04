// Enhanced Analytics Data Collector for M10 DJ Company
// This collects real-time tracking data for the admin dashboard

export class AnalyticsCollector {
  constructor() {
    this.events = [];
    this.startTime = Date.now();
    this.init();
  }

  init() {
    // Initialize local storage for tracking data
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('m10_analytics_events');
      if (stored) {
        try {
          this.events = JSON.parse(stored);
        } catch (e) {
          this.events = [];
        }
      }
    }
  }

  // Collect tracking event
  collect(eventType, data = {}) {
    const event = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : 'unknown'
      },
      sessionId: this.getSessionId()
    };

    this.events.push(event);
    this.saveToStorage();
    
    // Send to analytics platforms
    this.sendToGA4(event);
    this.sendToFacebook(event);
    
    // Log for debugging
    console.log('📊 M10 Analytics Event:', event);
  }

  // Get or create session ID
  getSessionId() {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = localStorage.getItem('m10_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('m10_session_id', sessionId);
    }
    return sessionId;
  }

  // Save events to local storage
  saveToStorage() {
    if (typeof window !== 'undefined') {
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = this.events.slice(-1000);
      localStorage.setItem('m10_analytics_events', JSON.stringify(recentEvents));
      this.events = recentEvents;
    }
  }

  // Send to Google Analytics 4
  sendToGA4(event) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.type, {
        event_category: event.data.category || 'engagement',
        event_label: event.data.label || event.data.source,
        value: event.data.value || 1,
        custom_parameter_1: event.data.service_type,
        custom_parameter_2: event.data.location,
        session_id: event.sessionId
      });
    }
  }

  // Send to Facebook Pixel
  sendToFacebook(event) {
    if (typeof window !== 'undefined' && window.fbq) {
      const fbEventMap = {
        'generate_lead': 'Lead',
        'contact_action': 'Contact',
        'view_item': 'ViewContent',
        'engagement_time': 'TimeSpent',
        'scroll': 'PageScroll'
      };

      const fbEventName = fbEventMap[event.type] || 'CustomEvent';
      
      window.fbq('track', fbEventName, {
        content_name: event.data.label || event.type,
        content_category: event.data.category || 'website_interaction',
        value: event.data.value || 1,
        custom_data: event.data
      });
    }
  }

  // Get analytics summary for dashboard
  getAnalyticsSummary(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = this.events.filter(
      event => new Date(event.timestamp) >= cutoffDate
    );

    const summary = {
      totalEvents: recentEvents.length,
      uniqueSessions: [...new Set(recentEvents.map(e => e.sessionId))].length,
      eventTypes: {},
      contactActions: {
        phone: 0,
        email: 0,
        form: 0
      },
      serviceInterest: {},
      leadGeneration: {
        total: 0,
        sources: {}
      },
      engagement: {
        scrollEvents: 0,
        timeSpentEvents: 0,
        avgEngagementScore: 0
      },
      hourlyBreakdown: {},
      dailyBreakdown: {}
    };

    recentEvents.forEach(event => {
      // Event type breakdown
      summary.eventTypes[event.type] = (summary.eventTypes[event.type] || 0) + 1;

      // Contact actions
      if (event.type === 'contact_action') {
        const method = event.data.method || 'unknown';
        summary.contactActions[method] = (summary.contactActions[method] || 0) + 1;
      }

      // Service interest
      if (event.type === 'view_item' && event.data.service_type) {
        summary.serviceInterest[event.data.service_type] = 
          (summary.serviceInterest[event.data.service_type] || 0) + 1;
      }

      // Lead generation
      if (event.type === 'generate_lead') {
        summary.leadGeneration.total++;
        const source = event.data.source || 'unknown';
        summary.leadGeneration.sources[source] = 
          (summary.leadGeneration.sources[source] || 0) + 1;
      }

      // Engagement tracking
      if (event.type === 'scroll') {
        summary.engagement.scrollEvents++;
      }
      if (event.type === 'engagement_time') {
        summary.engagement.timeSpentEvents++;
      }

      // Time-based breakdowns
      const hour = new Date(event.timestamp).getHours();
      const day = new Date(event.timestamp).toDateString();
      
      summary.hourlyBreakdown[hour] = (summary.hourlyBreakdown[hour] || 0) + 1;
      summary.dailyBreakdown[day] = (summary.dailyBreakdown[day] || 0) + 1;
    });

    // Calculate engagement score
    summary.engagement.avgEngagementScore = summary.uniqueSessions > 0 
      ? Math.round(((summary.engagement.scrollEvents + summary.engagement.timeSpentEvents) / summary.uniqueSessions) * 10) / 10
      : 0;

    return summary;
  }

  // Get conversion funnel data
  getConversionFunnel() {
    const funnel = {
      pageViews: this.events.filter(e => e.type === 'page_view').length,
      serviceViews: this.events.filter(e => e.type === 'view_item').length,
      contactActions: this.events.filter(e => e.type === 'contact_action').length,
      leadGeneration: this.events.filter(e => e.type === 'generate_lead').length
    };

    // Calculate conversion rates
    funnel.serviceViewRate = funnel.pageViews > 0 ? 
      ((funnel.serviceViews / funnel.pageViews) * 100).toFixed(1) : 0;
    funnel.contactRate = funnel.serviceViews > 0 ? 
      ((funnel.contactActions / funnel.serviceViews) * 100).toFixed(1) : 0;
    funnel.conversionRate = funnel.contactActions > 0 ? 
      ((funnel.leadGeneration / funnel.contactActions) * 100).toFixed(1) : 0;

    return funnel;
  }

  // Export data for analysis
  exportData(format = 'json') {
    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'sessionId', 'url', 'data'];
      const rows = this.events.map(event => [
        event.timestamp,
        event.type,
        event.sessionId,
        event.data.url || '',
        JSON.stringify(event.data)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.events, null, 2);
  }

  // Clear old data
  clearOldData(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.events = this.events.filter(
      event => new Date(event.timestamp) >= cutoffDate
    );
    
    this.saveToStorage();
  }
}

// Create global instance
let analyticsCollector;

export const getAnalyticsCollector = () => {
  if (typeof window !== 'undefined' && !analyticsCollector) {
    analyticsCollector = new AnalyticsCollector();
  }
  return analyticsCollector;
};

// Convenience functions for tracking
export const trackEvent = (eventType, data) => {
  const collector = getAnalyticsCollector();
  if (collector) {
    collector.collect(eventType, data);
  }
};

export const getAnalyticsSummary = (days) => {
  const collector = getAnalyticsCollector();
  return collector ? collector.getAnalyticsSummary(days) : null;
};

export const getConversionFunnel = () => {
  const collector = getAnalyticsCollector();
  return collector ? collector.getConversionFunnel() : null;
};