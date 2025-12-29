/**
 * Customer Journey Timeline Component
 * 
 * Displays a visual timeline of all customer interactions:
 * - Page views
 * - QR code scans
 * - Song requests
 * - Form submissions
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  QrCode, 
  Music, 
  FileText, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TimelineEvent {
  event_type: 'page_view' | 'qr_scan' | 'qr_scan_converted' | 'song_request' | 'form_submission';
  event_id: string;
  visitor_id: string;
  organization_id: string;
  event_time: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
}

interface VisitorInfo {
  id: string;
  fingerprint: string;
  email?: string;
  phone?: string;
  name?: string;
  first_seen_at: string;
  last_seen_at: string;
  total_page_views: number;
  total_sessions: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landing_page?: string;
}

interface CustomerTimelineProps {
  contactId?: string;
  email?: string;
  phone?: string;
  visitorId?: string;
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

const eventTypeConfig = {
  page_view: {
    icon: Eye,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    borderColor: 'border-blue-500',
    label: 'Page View',
  },
  qr_scan: {
    icon: QrCode,
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
    borderColor: 'border-purple-500',
    label: 'QR Scan',
  },
  qr_scan_converted: {
    icon: QrCode,
    color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    borderColor: 'border-green-500',
    label: 'QR Scan → Request',
  },
  song_request: {
    icon: Music,
    color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300',
    borderColor: 'border-orange-500',
    label: 'Song Request',
  },
  form_submission: {
    icon: FileText,
    color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
    borderColor: 'border-emerald-500',
    label: 'Form Submission',
  },
};

const DeviceIcon = ({ type }: { type?: string }) => {
  switch (type?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="w-3 h-3" />;
    case 'tablet':
      return <Tablet className="w-3 h-3" />;
    default:
      return <Monitor className="w-3 h-3" />;
  }
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function CustomerTimeline({
  contactId,
  email,
  phone,
  visitorId,
  limit = 50,
  showHeader = true,
  compact = false,
}: CustomerTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [visitor, setVisitor] = useState<VisitorInfo | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (contactId) params.set('contactId', contactId);
      if (email) params.set('email', email);
      if (phone) params.set('phone', phone);
      if (visitorId) params.set('visitorId', visitorId);
      params.set('limit', String(limit));

      const response = await fetch(`/api/tracking/customer-timeline?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTimeline(data.timeline || []);
        setVisitor(data.visitor);
        setSummary(data.summary);
      } else {
        setError(data.error || 'Failed to fetch timeline');
      }
    } catch (err) {
      setError('Failed to fetch timeline');
      console.error('Error fetching customer timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contactId || email || phone || visitorId) {
      fetchTimeline();
    } else {
      setLoading(false);
    }
  }, [contactId, email, phone, visitorId, limit]);

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchTimeline}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No tracking data available</p>
        <p className="text-sm mt-1">Customer journey will appear here once they visit the website</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      {showHeader && summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Journey
            </h3>
            <button 
              onClick={fetchTimeline}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Visitor info */}
          {visitor && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex flex-wrap gap-4 text-sm">
                {visitor.name && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{visitor.name}</span>
                  </div>
                )}
                {visitor.email && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{visitor.email}</span>
                  </div>
                )}
                {visitor.phone && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{visitor.phone}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                <span>First seen: {formatDateTime(visitor.first_seen_at)}</span>
                <span>Last seen: {formatTimeAgo(visitor.last_seen_at)}</span>
                <span>{visitor.total_sessions} session(s)</span>
              </div>
              {(visitor.utm_source || visitor.referrer) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {visitor.utm_source && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {visitor.utm_source}
                    </span>
                  )}
                  {visitor.utm_medium && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      {visitor.utm_medium}
                    </span>
                  )}
                  {visitor.referrer && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full truncate max-w-[200px]" title={visitor.referrer}>
                      from: {new URL(visitor.referrer).hostname}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.page_views}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Page Views</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{summary.qr_scans}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">QR Scans</div>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{summary.song_requests}</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Song Requests</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.form_submissions}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">Form Submissions</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-3">
          {timeline.map((event, index) => {
            const config = eventTypeConfig[event.event_type] || eventTypeConfig.page_view;
            const Icon = config.icon;
            const isExpanded = expandedEvents.has(event.event_id);

            return (
              <div 
                key={event.event_id} 
                className="relative pl-10"
              >
                {/* Event icon */}
                <div className={`absolute left-0 p-2 rounded-full ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event card */}
                <div 
                  className={`bg-white dark:bg-gray-800 border ${isExpanded ? config.borderColor : 'border-gray-200 dark:border-gray-700'} rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow`}
                  onClick={() => toggleEventExpanded(event.event_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(event.event_time)}
                        </span>
                        {event.metadata?.device_type && (
                          <span className="text-xs text-gray-400">
                            <DeviceIcon type={event.metadata.device_type} />
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-sm font-medium text-gray-900 dark:text-white ${compact ? 'truncate' : ''}`}>
                        {event.title}
                      </p>
                      {!compact && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <button className="ml-2 p-1 text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded metadata */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs space-y-1.5 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(event.event_time)}</span>
                        </div>
                        
                        {/* Event-specific metadata */}
                        {event.event_type === 'page_view' && (
                          <>
                            {event.metadata.page_url && (
                              <div className="flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                <a 
                                  href={event.metadata.page_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate max-w-[250px]"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {event.metadata.page_path}
                                </a>
                              </div>
                            )}
                            {event.metadata.referrer && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">From:</span>
                                <span className="truncate max-w-[200px]">{event.metadata.referrer}</span>
                              </div>
                            )}
                            {event.metadata.time_on_page && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{event.metadata.time_on_page}s on page</span>
                              </div>
                            )}
                          </>
                        )}

                        {(event.event_type === 'qr_scan' || event.event_type === 'qr_scan_converted') && (
                          <>
                            <div className="flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              <span>Event Code: {event.metadata.event_qr_code}</span>
                            </div>
                            {event.metadata.converted && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span>Converted to request</span>
                              </div>
                            )}
                          </>
                        )}

                        {event.event_type === 'song_request' && (
                          <>
                            <div className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              <span>{event.metadata.song_title} - {event.metadata.artist_name}</span>
                            </div>
                            {event.metadata.amount && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>${event.metadata.amount}</span>
                                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                                  event.metadata.payment_status === 'paid' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {event.metadata.payment_status}
                                </span>
                              </div>
                            )}
                            {event.metadata.requester_name && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{event.metadata.requester_name}</span>
                              </div>
                            )}
                          </>
                        )}

                        {event.event_type === 'form_submission' && (
                          <>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{event.metadata.name}</span>
                            </div>
                            {event.metadata.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{event.metadata.email}</span>
                              </div>
                            )}
                            {event.metadata.event_type && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{event.metadata.event_type}</span>
                                {event.metadata.event_date && (
                                  <span className="text-gray-400">
                                    on {new Date(event.metadata.event_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {event.metadata.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{event.metadata.location}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

