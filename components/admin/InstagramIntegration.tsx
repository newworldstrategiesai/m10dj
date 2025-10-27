/**
 * Instagram Integration Component
 * Manage Instagram business account connection and monitor leads
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Instagram, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Users,
  TrendingUp,
  ExternalLink,
  Settings,
  Zap
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface InstagramMessage {
  id: string;
  sender_id: string;
  message_text: string;
  timestamp: string;
  is_lead_inquiry: boolean;
  processed: boolean;
  contact_id: string | null;
}

interface InstagramStats {
  totalMessages: number;
  leadInquiries: number;
  contactsCreated: number;
  lastSyncTime: string | null;
}

export default function InstagramIntegration() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<InstagramStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<InstagramMessage[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    checkConnection();
    fetchStats();
    fetchRecentMessages();
    setWebhookUrl(`${window.location.origin}/api/instagram/webhook`);
  }, []);

  const checkConnection = async () => {
    // Check if Instagram is connected by verifying environment variables exist
    // In production, you'd check against a settings table
    setIsConnected(false); // You'll need to implement actual check
  };

  const fetchStats = async () => {
    try {
      // Total messages
      const { count: totalMessages } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact', head: true });

      // Lead inquiries
      const { count: leadInquiries } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead_inquiry', true);

      // Contacts created from Instagram
      const { count: contactsCreated } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('instagram_id', 'is', null)
        .is('deleted_at', null);

      // Last sync time
      const { data: lastSync } = await supabase
        .from('instagram_sync_log')
        .select('completed_at')
        .eq('sync_status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        totalMessages: totalMessages || 0,
        leadInquiries: leadInquiries || 0,
        contactsCreated: contactsCreated || 0,
        lastSyncTime: lastSync?.completed_at || null
      });
    } catch (error) {
      console.error('Error fetching Instagram stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_messages')
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      // This would trigger a manual sync
      // In production, you'd call your Instagram API sync function
      
      toast({
        title: "Sync Started",
        description: "Instagram messages are being synced...",
      });

      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      await fetchStats();
      await fetchRecentMessages();

      toast({
        title: "Sync Complete",
        description: "Instagram messages synced successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync Instagram messages",
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading Instagram integration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Instagram Integration</h2>
              <p className="text-sm text-gray-600">Monitor DMs and comments for leads</p>
            </div>
          </div>
          <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
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
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats?.totalMessages || 0}</p>
            <p className="text-sm text-blue-700">Total Messages</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats?.leadInquiries || 0}</p>
            <p className="text-sm text-purple-700">Lead Inquiries</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">{stats?.contactsCreated || 0}</p>
            <p className="text-sm text-green-700">Contacts Created</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSync}
            disabled={syncing || !isConnected}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          
          {!isConnected && (
            <Button
              variant="outline"
              onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Connect Instagram
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>

        {stats?.lastSyncTime && (
          <p className="text-xs text-gray-500 mt-4">
            Last synced: {formatDate(stats.lastSyncTime)}
          </p>
        )}
      </div>

      {/* Webhook Setup Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Webhook Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Use this webhook URL in your Instagram Business Account settings to receive real-time messages:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-sm text-gray-900 break-all">{webhookUrl}</code>
            <Button onClick={copyWebhookUrl} size="sm" variant="outline">
              Copy
            </Button>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Setup Instructions:</strong>
          </p>
          <ol className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-decimal">
            <li>Go to Facebook Developers Console</li>
            <li>Select your Instagram Business App</li>
            <li>Navigate to Instagram → Configuration → Webhooks</li>
            <li>Add this webhook URL</li>
            <li>Subscribe to: messages, comments, mentions</li>
            <li>Verify token: <code className="bg-blue-100 px-2 py-0.5 rounded">{process.env.INSTAGRAM_VERIFY_TOKEN || 'SET_IN_ENV'}</code></li>
          </ol>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Instagram Messages</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No Instagram messages yet</p>
              <p className="text-sm mt-2">Messages will appear here once Instagram is connected</p>
            </div>
          ) : (
            recentMessages.map(message => (
              <div key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">From: {message.sender_id}</p>
                    <p className="text-sm text-gray-600 mt-1">{message.message_text}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(message.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {message.is_lead_inquiry && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Lead
                      </Badge>
                    )}
                    {message.contact_id && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Contact Created
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

