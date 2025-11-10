/**
 * Email Integration Component
 * Manage Gmail connection and monitor email leads
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Mail, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Users,
  TrendingUp,
  ExternalLink,
  Settings,
  Zap,
  Send,
  Inbox,
  Link2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface EmailMessage {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  body_text: string;
  timestamp: string;
  is_lead_inquiry: boolean;
  processed: boolean;
  contact_id: string | null;
  message_type: string;
}

interface EmailStats {
  totalMessages: number;
  leadInquiries: number;
  contactsCreated: number;
  lastSyncTime: string | null;
  connectedEmail: string | null;
}

export default function EmailIntegration() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<EmailMessage[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    checkConnection();
    fetchStats();
    fetchRecentMessages();
    setWebhookUrl(`${window.location.origin}/api/email/webhook`);
  }, []);

  const checkConnection = async () => {
    try {
      // Check if OAuth tokens exist
      const { data, error } = await supabase
        .from('email_oauth_tokens')
        .select('user_email, expires_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setIsConnected(true);
        
        // Update stats with connected email
        setStats(prev => prev ? { ...prev, connectedEmail: data.user_email } : null);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total messages
      const { count: totalMessages } = await supabase
        .from('email_messages')
        .select('*', { count: 'exact', head: true });

      // Lead inquiries
      const { count: leadInquiries } = await supabase
        .from('email_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead_inquiry', true);

      // Contacts created from email
      const { count: contactsCreated } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('primary_email', 'is', null)
        .eq('lead_source', 'Email')
        .is('deleted_at', null);

      // Last sync time
      const { data: lastSync } = await supabase
        .from('email_sync_log')
        .select('completed_at')
        .eq('sync_status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        totalMessages: totalMessages || 0,
        leadInquiries: leadInquiries || 0,
        contactsCreated: contactsCreated || 0,
        lastSyncTime: lastSync?.completed_at || null,
        connectedEmail: null
      });
    } catch (error) {
      console.error('Error fetching email stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentMessages(data);
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  };

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/email/auth/google';
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your email account? This will remove access to sync emails.')) {
      return;
    }

    try {
      const response = await fetch('/api/email/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "Email account has been disconnected",
        });
        await checkConnection();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect email account",
        variant: "destructive"
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      toast({
        title: "Sync Started",
        description: "Syncing emails from your inbox...",
      });

      const response = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'manual', maxMessages: 100 })
      });

      const result = await response.json();

      if (response.ok) {
        await fetchStats();
        await fetchRecentMessages();

        toast({
          title: "Sync Complete",
          description: `Synced ${result.messagesSynced} messages, created ${result.leadsCreated} leads`,
        });
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync emails",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading email integration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Integration</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected && stats?.connectedEmail 
                  ? `Connected: ${stats.connectedEmail}`
                  : 'Monitor inbox for leads'}
              </p>
            </div>
          </div>
          <Badge className={isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}>
            {isConnected ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-1" />
                Not Connected
              </>
            )}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{stats?.totalMessages || 0}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">Total Emails</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{stats?.leadInquiries || 0}</p>
            <p className="text-sm text-purple-700 dark:text-purple-300">Lead Inquiries</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">{stats?.contactsCreated || 0}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Contacts Created</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                variant="slim"
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Connect Gmail Account
            </Button>
          )}
        </div>

        {stats?.lastSyncTime && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Last synced: {formatDate(stats.lastSyncTime)}
          </p>
        )}
      </div>

      {/* Setup Instructions */}
      {isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Real-Time Notifications (Optional)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set up Gmail push notifications to receive emails instantly. This requires Google Cloud Pub/Sub configuration.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Webhook URL:</strong>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-900 px-3 py-2 rounded flex-1">
                {webhookUrl}
              </code>
              <Button onClick={copyWebhookUrl} variant="slim">
                Copy
              </Button>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-3">
              See documentation for setup instructions with Google Cloud Pub/Sub
            </p>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Email Messages</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Mail className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p>No email messages yet</p>
              <p className="text-sm mt-2">
                {isConnected 
                  ? 'Click "Sync Now" to fetch emails from your inbox'
                  : 'Connect your Gmail account to get started'}
              </p>
            </div>
          ) : (
            recentMessages.map(message => (
              <div key={message.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {message.message_type === 'sent' ? (
                        <Send className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      ) : (
                        <Inbox className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {message.message_type === 'sent' ? 'To: ' : 'From: '}
                        {message.from_name || message.from_email}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {truncateText(message.subject || '(No subject)', 50)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {truncateText(message.body_text, 100)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{formatDate(message.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {message.is_lead_inquiry && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Lead
                      </Badge>
                    )}
                    {message.contact_id && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Contact
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

