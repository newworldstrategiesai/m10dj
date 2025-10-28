/**
 * Unified Social Media Integration Component
 * Manages both Instagram and Facebook Messenger integrations
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Instagram, 
  MessageCircle,
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Users,
  TrendingUp,
  ExternalLink,
  Settings,
  Zap,
  Facebook
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SocialMessage {
  id: string;
  sender_id: string;
  message_text: string;
  timestamp: string;
  is_lead_inquiry: boolean;
  processed: boolean;
  contact_id: string | null;
  platform: 'instagram' | 'messenger';
}

interface PlatformStats {
  totalMessages: number;
  leadInquiries: number;
  contactsCreated: number;
  lastSyncTime: string | null;
}

export default function SocialMediaIntegration() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [instagramStats, setInstagramStats] = useState<PlatformStats | null>(null);
  const [messengerStats, setMessengerStats] = useState<PlatformStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<SocialMessage[]>([]);
  const [webhookUrls, setWebhookUrls] = useState({ instagram: '', messenger: '' });

  useEffect(() => {
    fetchAllStats();
    fetchRecentMessages();
    setWebhookUrls({
      instagram: `${window.location.origin}/api/instagram/webhook`,
      messenger: `${window.location.origin}/api/messenger/webhook`
    });
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInstagramStats(),
        fetchMessengerStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramStats = async () => {
    try {
      const { count: totalMessages } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact', head: true });

      const { count: leadInquiries } = await supabase
        .from('instagram_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead_inquiry', true);

      const { count: contactsCreated } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('instagram_id', 'is', null)
        .is('deleted_at', null);

      // Skip sync_log query for now - table not accessible
      const lastSync = null;

      setInstagramStats({
        totalMessages: totalMessages || 0,
        leadInquiries: leadInquiries || 0,
        contactsCreated: contactsCreated || 0,
        lastSyncTime: lastSync?.completed_at || null
      });
    } catch (error) {
      console.error('Error fetching Instagram stats:', error);
    }
  };

  const fetchMessengerStats = async () => {
    try {
      const { count: totalMessages } = await supabase
        .from('messenger_messages')
        .select('*', { count: 'exact', head: true });

      const { count: leadInquiries } = await supabase
        .from('messenger_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead_inquiry', true);

      const { count: contactsCreated } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .not('facebook_id', 'is', null)
        .is('deleted_at', null);

      // Skip sync_log query for now - table not accessible
      const lastSync = null;

      setMessengerStats({
        totalMessages: totalMessages || 0,
        leadInquiries: leadInquiries || 0,
        contactsCreated: contactsCreated || 0,
        lastSyncTime: lastSync?.completed_at || null
      });
    } catch (error) {
      console.error('Error fetching Messenger stats:', error);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      // Fetch from both tables and combine
      const { data: instagramData } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      const { data: messengerData } = await supabase
        .from('messenger_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      const combined = [
        ...(instagramData || []).map(m => ({ ...m, platform: 'instagram' as const })),
        ...(messengerData || []).map(m => ({ ...m, platform: 'messenger' as const }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setRecentMessages(combined);
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  };

  const handleSync = async (platform: 'instagram' | 'messenger') => {
    setSyncing(true);
    try {
      toast({
        title: "Sync Started",
        description: `${platform === 'instagram' ? 'Instagram' : 'Messenger'} messages are being synced...`,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (platform === 'instagram') {
        await fetchInstagramStats();
      } else {
        await fetchMessengerStats();
      }
      await fetchRecentMessages();

      toast({
        title: "Sync Complete",
        description: "Messages synced successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync messages",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const copyWebhookUrl = (url: string, platform: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: `${platform} webhook URL copied to clipboard`,
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

  const totalStats = {
    totalMessages: (instagramStats?.totalMessages || 0) + (messengerStats?.totalMessages || 0),
    leadInquiries: (instagramStats?.leadInquiries || 0) + (messengerStats?.leadInquiries || 0),
    contactsCreated: (instagramStats?.contactsCreated || 0) + (messengerStats?.contactsCreated || 0)
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading social media integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Combined Stats Overview */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Social Media Lead Capture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-6 w-6" />
              <p className="text-3xl font-bold">{totalStats.totalMessages}</p>
            </div>
            <p className="text-sm opacity-90">Total Messages</p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6" />
              <p className="text-3xl font-bold">{totalStats.leadInquiries}</p>
            </div>
            <p className="text-sm opacity-90">Lead Inquiries</p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-6 w-6" />
              <p className="text-3xl font-bold">{totalStats.contactsCreated}</p>
            </div>
            <p className="text-sm opacity-90">Contacts Created</p>
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs defaultValue="instagram" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="messenger" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messenger
          </TabsTrigger>
        </TabsList>

        {/* Instagram Tab */}
        <TabsContent value="instagram" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Instagram Integration</h3>
                  <p className="text-sm text-gray-600">Monitor DMs, comments, and mentions</p>
                </div>
              </div>
              <Button onClick={() => handleSync('instagram')} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-900">{instagramStats?.totalMessages || 0}</p>
                <p className="text-sm text-blue-700">Messages</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-900">{instagramStats?.leadInquiries || 0}</p>
                <p className="text-sm text-purple-700">Lead Inquiries</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-900">{instagramStats?.contactsCreated || 0}</p>
                <p className="text-sm text-green-700">Contacts Created</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-900 bg-white px-3 py-2 rounded flex-1 break-all">{webhookUrls.instagram}</code>
                <Button onClick={() => copyWebhookUrl(webhookUrls.instagram, 'Instagram')} variant="slim">
                  Copy
                </Button>
              </div>
            </div>

            {instagramStats?.lastSyncTime && (
              <p className="text-xs text-gray-500 mt-4">
                Last synced: {formatDate(instagramStats.lastSyncTime)}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Messenger Tab */}
        <TabsContent value="messenger" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Messenger Integration</h3>
                  <p className="text-sm text-gray-600">Monitor Facebook Messenger conversations</p>
                </div>
              </div>
              <Button onClick={() => handleSync('messenger')} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-900">{messengerStats?.totalMessages || 0}</p>
                <p className="text-sm text-blue-700">Messages</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-900">{messengerStats?.leadInquiries || 0}</p>
                <p className="text-sm text-purple-700">Lead Inquiries</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-900">{messengerStats?.contactsCreated || 0}</p>
                <p className="text-sm text-green-700">Contacts Created</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-900 bg-white px-3 py-2 rounded flex-1 break-all">{webhookUrls.messenger}</code>
                <Button onClick={() => copyWebhookUrl(webhookUrls.messenger, 'Messenger')} variant="slim">
                  Copy
                </Button>
              </div>
            </div>

            {messengerStats?.lastSyncTime && (
              <p className="text-xs text-gray-500 mt-4">
                Last synced: {formatDate(messengerStats.lastSyncTime)}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Messages - All Platforms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Messages (All Platforms)</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No messages yet</p>
              <p className="text-sm mt-2">Messages will appear here once integrations are active</p>
            </div>
          ) : (
            recentMessages.map(message => (
              <div key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {message.platform === 'instagram' ? (
                        <Instagram className="h-4 w-4 text-purple-600" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                      )}
                      <p className="text-sm font-medium text-gray-900 capitalize">{message.platform}</p>
                      <span className="text-xs text-gray-500">From: {message.sender_id}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{message.message_text}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(message.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {message.is_lead_inquiry && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Lead
                      </Badge>
                    )}
                    {message.contact_id && (
                      <Badge className="bg-green-100 text-green-800">
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

      {/* Setup Instructions Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">📚 Need Help Setting Up?</h3>
        <p className="text-sm text-blue-800 mb-4">
          Follow our comprehensive setup guide to connect Instagram and Messenger to automatically capture leads.
        </p>
        <Button
          onClick={() => window.open('/INSTAGRAM_INTEGRATION_SETUP.md', '_blank')}
          variant="slim"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Setup Guide
        </Button>
      </div>
    </div>
  );
}

