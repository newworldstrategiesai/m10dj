/**
 * Automation Dashboard Component
 * View and manage automated email campaigns
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Star,
  Send,
  Calendar,
  RefreshCw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface AutomationStats {
  pending: number;
  sent: number;
  failed: number;
  reviewsRequested: number;
  reviewsCompleted: number;
  conversionRate: number;
}

interface QueuedAutomation {
  id: string;
  automation_type: string;
  scheduled_for: string;
  status: string;
  priority: number;
  contacts: {
    first_name: string;
    last_name: string;
    email_address: string;
  };
}

export default function AutomationDashboard() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [queuedAutomations, setQueuedAutomations] = useState<QueuedAutomation[]>([]);

  useEffect(() => {
    fetchStats();
    fetchQueuedAutomations();
  }, []);

  const fetchStats = async () => {
    try {
      // Get automation queue stats
      const { data: queueData } = await supabase
        .from('automation_queue')
        .select('status');

      const pending = queueData?.filter(a => a.status === 'pending').length || 0;
      const sent = queueData?.filter(a => a.status === 'sent').length || 0;
      const failed = queueData?.filter(a => a.status === 'failed').length || 0;

      // Get review stats
      const { count: reviewsRequested } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('review_requested_at', 'is', null);

      const { count: reviewsCompleted } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('review_completed', true);

      const conversionRate = (reviewsRequested || 0) > 0 
        ? ((reviewsCompleted || 0) / (reviewsRequested || 0)) * 100 
        : 0;

      setStats({
        pending,
        sent,
        failed,
        reviewsRequested: reviewsRequested || 0,
        reviewsCompleted: reviewsCompleted || 0,
        conversionRate: Math.round(conversionRate)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueuedAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_queue')
        .select('*, contacts(first_name, last_name, email_address)')
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true })
        .limit(10);

      if (!error && data) {
        setQueuedAutomations(data);
      }
    } catch (error) {
      console.error('Error fetching queued automations:', error);
    }
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      toast({
        title: "Processing Queue",
        description: "Sending scheduled automations...",
      });

      const response = await fetch('/api/automation/process-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Queue Processed!",
          description: `Sent ${result.processed} emails, ${result.failed} failed`,
        });

        await fetchStats();
        await fetchQueuedAutomations();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process queue",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
  };

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'review_request': return <Star className="h-4 w-4" />;
      case 'review_reminder': return <Clock className="h-4 w-4" />;
      case 'follow_up': return <Send className="h-4 w-4" />;
      case 'thank_you': return <CheckCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getAutomationLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading automation stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automation Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automated email campaigns and review requests</p>
          </div>
          <Button
            onClick={handleProcessQueue}
            disabled={processing || stats?.pending === 0}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
            {processing ? 'Processing...' : 'Process Queue Now'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{stats?.pending || 0}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">Pending Automations</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">{stats?.sent || 0}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Emails Sent</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{stats?.reviewsCompleted || 0}</p>
            <p className="text-sm text-purple-700 dark:text-purple-300">Reviews Collected</p>
          </div>
        </div>

        {/* Review Conversion Stats */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Review Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.conversionRate || 0}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats?.reviewsCompleted} of {stats?.reviewsRequested} requested
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Industry avg: 15-25%
              </p>
            </div>
          </div>
        </div>

        {stats?.failed && stats.failed > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 mt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  {stats.failed} Failed Automations
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Check automation_queue table for details
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Queued Automations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Automations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Next 10 scheduled emails</p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {queuedAutomations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p>No automations scheduled</p>
              <p className="text-sm mt-2">Automations will appear here when events are completed or leads come in</p>
            </div>
          ) : (
            queuedAutomations.map(automation => (
              <div key={automation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      {getAutomationIcon(automation.automation_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {automation.contacts?.first_name} {automation.contacts?.last_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {automation.contacts?.email_address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {getAutomationLabel(automation.automation_type)}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(automation.scheduled_for)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Priority {automation.priority}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💡 Automation Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>• Automations run every 15 minutes via cron job</li>
          <li>• Review requests sent 48 hours after event completion</li>
          <li>• Reminders automatically cancelled when review is completed</li>
          <li>• Lead follow-ups sent 3 and 7 days after initial inquiry</li>
          <li>• Click "Process Queue Now" to send due automations immediately</li>
        </ul>
      </div>
    </div>
  );
}

