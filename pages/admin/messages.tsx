/**
 * Admin Messages Page
 * Consolidated view of all communications (SMS, Email, etc.)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  MessageSquare,
  Mail,
  Phone,
  Search,
  Filter,
  Calendar,
  User,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layouts/AdminLayout';
import Link from 'next/link';

interface SMSMessage {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  phone_number: string;
  message_body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  created_at: string;
  read: boolean;
}

interface EmailMessage {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  email_address: string;
  subject: string;
  body: string;
  direction: 'inbound' | 'outbound';
  read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [emailMessages, setEmailMessages] = useState<EmailMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sms' | 'email'>('all');
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'sms' | 'email'>('all');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, filterDirection]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin?redirect=/admin/messages');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/signin?redirect=/admin/messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Fetch SMS messages
      let smsQuery = supabase
        .from('sms_conversations')
        .select(`
          id,
          contact_id,
          phone_number,
          message_body,
          direction,
          status,
          created_at,
          read,
          contacts!inner(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterDirection !== 'all') {
        smsQuery = smsQuery.eq('direction', filterDirection);
      }

      const { data: smsData, error: smsError } = await smsQuery;

      if (!smsError && smsData) {
        const formattedSms = smsData.map((msg: any) => ({
          id: msg.id,
          contact_id: msg.contact_id,
          contact_name: msg.contacts 
            ? `${msg.contacts.first_name || ''} ${msg.contacts.last_name || ''}`.trim() || null
            : null,
          phone_number: msg.phone_number,
          message_body: msg.message_body,
          direction: msg.direction,
          status: msg.status,
          created_at: msg.created_at,
          read: msg.read || false
        }));
        setSmsMessages(formattedSms);
      }

      // Fetch email messages (if email table exists)
      // Note: Adjust table name based on your schema
      const { data: emailData, error: emailError } = await supabase
        .from('emails')
        .select(`
          id,
          contact_id,
          email_address,
          subject,
          body,
          direction,
          created_at,
          read,
          contacts!inner(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)
        .maybeSingle();

      // If emails table doesn't exist, that's okay - just set empty array
      if (!emailError && emailData) {
        const formattedEmails = Array.isArray(emailData) ? emailData.map((msg: any) => ({
          id: msg.id,
          contact_id: msg.contact_id,
          contact_name: msg.contacts 
            ? `${msg.contacts.first_name || ''} ${msg.contacts.last_name || ''}`.trim() || null
            : null,
          email_address: msg.email_address,
          subject: msg.subject,
          body: msg.body,
          direction: msg.direction,
          created_at: msg.created_at,
          read: msg.read || false
        })) : [];
        setEmailMessages(formattedEmails);
      } else {
        setEmailMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredMessages = () => {
    let allMessages: any[] = [];

    if (activeTab === 'all' || activeTab === 'sms') {
      allMessages = [...allMessages, ...smsMessages.map(msg => ({ ...msg, type: 'sms' }))];
    }
    if (activeTab === 'all' || activeTab === 'email') {
      allMessages = [...allMessages, ...emailMessages.map(msg => ({ ...msg, type: 'email' }))];
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allMessages = allMessages.filter(msg => {
        const searchableText = msg.type === 'sms' 
          ? `${msg.message_body} ${msg.contact_name || ''} ${msg.phone_number}`.toLowerCase()
          : `${msg.subject} ${msg.body} ${msg.contact_name || ''} ${msg.email_address}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Apply direction filter
    if (filterDirection !== 'all') {
      allMessages = allMessages.filter(msg => msg.direction === filterDirection);
    }

    return allMessages.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  if (loading && !user) {
    return (
      <AdminLayout title="Messages" description="All Communications">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto mb-6"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading messages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const filteredMessages = getFilteredMessages();
  const unreadCount = filteredMessages.filter(m => !m.read).length;

  return (
    <AdminLayout title="Messages" description="All Communications - M10 DJ Admin">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-[#fcba00]" />
              Messages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All communications with contacts
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/admin/chat">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS Chat
              </Button>
            </Link>
            <Link href="/admin/email-client">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterDirection} onValueChange={(value: any) => setFilterDirection(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Messages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="mb-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="all" className="relative">
              All
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sms">
              <Phone className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Messages List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No messages found matching your search' : 'No messages yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMessages.map((message) => (
                <div
                  key={`${message.type}-${message.id}`}
                  className={`
                    p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    ${!message.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      p-2 rounded-lg flex-shrink-0
                      ${message.type === 'sms' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }
                    `}>
                      {message.type === 'sms' ? (
                        <Phone className="h-5 w-5" />
                      ) : (
                        <Mail className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {message.contact_name ? (
                              <Link
                                href={message.contact_id ? `/admin/contacts/${message.contact_id}` : '#'}
                                className="font-semibold text-gray-900 dark:text-white hover:text-[#fcba00] transition-colors"
                              >
                                {message.contact_name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {message.type === 'sms' ? message.phone_number : message.email_address}
                              </span>
                            )}
                            <Badge variant={message.direction === 'inbound' ? 'default' : 'secondary'}>
                              {message.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                            </Badge>
                            {!message.read && (
                              <Badge className="bg-red-500 text-white">New</Badge>
                            )}
                          </div>
                          {message.type === 'email' && (
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {message.subject || '(No Subject)'}
                            </p>
                          )}
                          <p className={`
                            text-sm text-gray-600 dark:text-gray-400 line-clamp-2
                            ${message.type === 'email' ? 'mt-1' : ''}
                          `}>
                            {message.type === 'sms' ? message.message_body : message.body}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(message.created_at)}
                          </span>
                          {message.contact_id && (
                            <Link href={`/admin/contacts/${message.contact_id}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

