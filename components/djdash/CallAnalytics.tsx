'use client';

import React, { useState, useEffect } from 'react';
import { Phone, TrendingUp, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CallAnalyticsProps {
  djProfileId: string;
}

interface AnalyticsData {
  totalCalls: number;
  bookedCalls: number;
  conversionRate: number;
  totalRevenue: number;
  platformCut: number;
  djRevenue: number;
  leadScoreBreakdown: {
    hot: number;
    warm: number;
    cold: number;
  };
  eventTypeBreakdown: Record<string, number>;
  avgCallDuration: number;
  tipjarLinksSent: number;
  tipjarPaymentsReceived: number;
  recordingsCount: number;
  transcriptionsCount: number;
  transcriptionSuccessRate: number;
}

export default function CallAnalytics({ djProfileId }: CallAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [djProfileId, dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate(dateRange);
      const params = new URLSearchParams({
        dj_profile_id: djProfileId,
        ...(startDate && { start_date: startDate })
      });

      const response = await fetch(`/api/djdash/calls/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDate = (range: string): string | null => {
    const now = new Date();
    switch (range) {
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      default:
        return null;
    }
    return now.toISOString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <p className="text-gray-600 dark:text-gray-400">No call data available yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalCalls}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Booked</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.bookedCalls}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {analytics.conversionRate.toFixed(1)}% conversion
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${analytics.totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Platform: ${analytics.platformCut.toFixed(2)} | You: ${analytics.djRevenue.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatDuration(analytics.avgCallDuration)}
          </p>
        </Card>
      </div>

      {/* Lead Score Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lead Score Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analytics.leadScoreBreakdown.hot}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hot Leads</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.leadScoreBreakdown.warm}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Warm Leads</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.leadScoreBreakdown.cold}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cold Leads</p>
          </div>
        </div>
      </Card>

      {/* TipJar Stats */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">TipJar Follow-up</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Links Sent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.tipjarLinksSent}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Payments Received</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.tipjarPaymentsReceived}
            </p>
          </div>
        </div>
      </Card>

      {/* Recording & Transcription Stats */}
      {(analytics.recordingsCount > 0 || analytics.transcriptionsCount > 0) && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recordings & Transcriptions</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recordings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.recordingsCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transcriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.transcriptionsCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.transcriptionSuccessRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Event Type Breakdown */}
      {Object.keys(analytics.eventTypeBreakdown).length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Calls by Event Type</h3>
          <div className="space-y-2">
            {Object.entries(analytics.eventTypeBreakdown).map(([eventType, count]) => (
              <div key={eventType} className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {eventType.replace(/_/g, ' ')}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

