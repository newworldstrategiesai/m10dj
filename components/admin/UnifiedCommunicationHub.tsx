'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  FileText, 
  Clock, 
  Send, 
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'call' | 'note';
  direction: 'inbound' | 'outbound';
  content: string;
  subject?: string | null;
  status: string;
  sent_by: string;
  sent_to?: string | null;
  created_at: string;
  metadata?: any;
}

interface CommunicationAnalytics {
  total: number;
  byType: {
    email: number;
    sms: number;
    call: number;
    note: number;
  };
  byDirection: {
    inbound: number;
    outbound: number;
  };
  averageResponseTime: number | null;
  lastContact: string | null;
  responseTimes: number[];
}

interface UnifiedCommunicationHubProps {
  contactId: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactName?: string;
}

export default function UnifiedCommunicationHub({
  contactId,
  contactEmail,
  contactPhone,
  contactName
}: UnifiedCommunicationHubProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<Communication[]>([]);
  const [analytics, setAnalytics] = useState<CommunicationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'sms' | 'call' | 'note'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'analytics' | 'compose'>('timeline');
  
  // Compose states
  const [composeType, setComposeType] = useState<'email' | 'sms'>('email');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [sending, setSending] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
  }, [contactId]);

  useEffect(() => {
    filterCommunications();
  }, [communications, searchQuery, typeFilter, directionFilter]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/communications`);
      if (response.ok) {
        const data = await response.json();
        setCommunications(data.communications || []);
        setAnalytics(data.analytics || null);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch communications",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
      toast({
        title: "Error",
        description: "Error fetching communications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCommunications = () => {
    let filtered = [...communications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comm => 
        comm.content?.toLowerCase().includes(query) ||
        comm.subject?.toLowerCase().includes(query) ||
        comm.sent_by?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(comm => comm.type === typeFilter);
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(comm => comm.direction === directionFilter);
    }

    setFilteredCommunications(filtered);
  };

  const handleSend = async () => {
    if (!composeContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    if (composeType === 'email' && !composeSubject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      if (composeType === 'email') {
        const response = await fetch('/api/admin/communications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId,
            to: contactEmail,
            subject: composeSubject,
            content: composeContent
          })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Email sent successfully"
          });
          setComposeSubject('');
          setComposeContent('');
          fetchCommunications(); // Refresh
        } else {
          throw new Error('Failed to send email');
        }
      } else {
        const response = await fetch('/api/admin/communications/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId,
            to: contactPhone,
            message: composeContent
          })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "SMS sent successfully"
          });
          setComposeContent('');
          fetchCommunications(); // Refresh
        } else {
          throw new Error('Failed to send SMS');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send ${composeType.toUpperCase()}`,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'sms': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'call': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'note': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'sent':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-600" />;
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
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Communications Timeline */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredCommunications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No communications found</p>
              </div>
            ) : (
              filteredCommunications.map((comm) => (
                <div
                  key={comm.id}
                  className={`flex gap-4 p-4 rounded-lg border ${
                    comm.direction === 'inbound'
                      ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(comm.type)}`}>
                    {getTypeIcon(comm.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {comm.sent_by}
                          </span>
                          <Badge className={getTypeColor(comm.type)}>
                            {comm.type.toUpperCase()}
                          </Badge>
                          {comm.direction === 'inbound' && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Inbound
                            </Badge>
                          )}
                        </div>
                        {comm.subject && (
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {comm.subject}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {comm.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {getStatusIcon(comm.status)}
                        <span className="text-xs text-gray-500">
                          {formatDate(comm.created_at)}
                        </span>
                      </div>
                    </div>
                    {comm.sent_to && (
                      <p className="text-xs text-gray-500 mt-2">
                        To: {comm.sent_to}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
                  <div className="text-2xl font-bold">{analytics.total}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Emails</div>
                  <div className="text-2xl font-bold">{analytics.byType.email}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">SMS</div>
                  <div className="text-2xl font-bold">{analytics.byType.sms}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Calls</div>
                  <div className="text-2xl font-bold">{analytics.byType.call}</div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Response Time</h3>
                {analytics.averageResponseTime !== null ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average Response Time</span>
                      <span className="text-2xl font-bold">
                        {analytics.averageResponseTime.toFixed(1)}h
                      </span>
                    </div>
                    {analytics.responseTimes.length > 0 && (
                      <div className="text-sm text-gray-500">
                        Based on {analytics.responseTimes.length} response{analytics.responseTimes.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No response time data available</p>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Communication Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Inbound</span>
                    <Badge>{analytics.byDirection.inbound}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Outbound</span>
                    <Badge>{analytics.byDirection.outbound}</Badge>
                  </div>
                </div>
              </Card>

              {analytics.lastContact && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">Last Contact</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(analytics.lastContact)}
                  </p>
                </Card>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-12">No analytics data available</p>
          )}
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={composeType === 'email' ? 'default' : 'outline'}
              onClick={() => setComposeType('email')}
              disabled={!contactEmail}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              variant={composeType === 'sms' ? 'default' : 'outline'}
              onClick={() => setComposeType('sms')}
              disabled={!contactPhone}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS
            </Button>
          </div>

          {composeType === 'email' && !contactEmail && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                No email address available for this contact
              </p>
            </div>
          )}

          {composeType === 'sms' && !contactPhone && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                No phone number available for this contact
              </p>
            </div>
          )}

          {composeType === 'email' && (
            <Input
              placeholder="Subject"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
            />
          )}

          <Textarea
            placeholder={composeType === 'email' ? 'Email message...' : 'SMS message...'}
            value={composeContent}
            onChange={(e) => setComposeContent(e.target.value)}
            rows={composeType === 'sms' ? 4 : 8}
            maxLength={composeType === 'sms' ? 160 : undefined}
          />

          {composeType === 'sms' && (
            <div className="text-sm text-gray-500 text-right">
              {composeContent.length}/160 characters
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sending || !composeContent.trim() || (composeType === 'email' && !composeSubject.trim())}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : `Send ${composeType.toUpperCase()}`}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

