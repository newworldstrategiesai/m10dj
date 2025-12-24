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

interface LeadCommunicationHubProps {
  submissionId: string;
  submissionEmail?: string | null;
  submissionPhone?: string | null;
  submissionName?: string;
  initialEmailSubject?: string;
  initialEmailBody?: string;
  onEmailGenerated?: () => void;
}

export default function LeadCommunicationHub({
  submissionId,
  submissionEmail,
  submissionPhone,
  submissionName,
  initialEmailSubject,
  initialEmailBody,
  onEmailGenerated
}: LeadCommunicationHubProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'sms' | 'call' | 'note'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'compose'>('timeline');
  
  // Compose states
  const [composeType, setComposeType] = useState<'email' | 'sms'>('email');
  const [composeSubject, setComposeSubject] = useState(initialEmailSubject || '');
  const [composeContent, setComposeContent] = useState(initialEmailBody || '');
  const [sending, setSending] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Update compose fields when initial values change (from parent)
  useEffect(() => {
    if (initialEmailSubject || initialEmailBody) {
      if (initialEmailSubject) {
        setComposeSubject(initialEmailSubject);
      }
      if (initialEmailBody) {
        setComposeContent(initialEmailBody);
      }
      setComposeType('email');
      setActiveTab('compose');
      onEmailGenerated?.();
    }
  }, [initialEmailSubject, initialEmailBody, onEmailGenerated]);

  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
  }, [submissionId]);

  useEffect(() => {
    filterCommunications();
  }, [communications, searchQuery, typeFilter, directionFilter]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${submissionId}/communications`);
      if (response.ok) {
        const data = await response.json();
        setCommunications(data.communications || []);
        
        // Load draft if available and no initial email provided
        if (data.draft && !initialEmailSubject && !initialEmailBody) {
          setComposeSubject(data.draft.subject || '');
          setComposeContent(data.draft.content || '');
          setComposeType('email');
          setDraftId(data.draft.id);
        }
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
            submissionId,
            to: submissionEmail,
            subject: composeSubject,
            content: composeContent,
            draftId: draftId // Include draft ID if sending a draft
          })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Email sent successfully"
          });
          setComposeSubject('');
          setComposeContent('');
          setDraftId(null); // Clear draft ID after sending
          fetchCommunications();
        } else {
          throw new Error('Failed to send email');
        }
      } else {
        const response = await fetch('/api/admin/communications/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            to: submissionPhone,
            message: composeContent
          })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "SMS sent successfully"
          });
          setComposeContent('');
          fetchCommunications();
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00]"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
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

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={composeType === 'email' ? 'default' : 'outline'}
              onClick={() => setComposeType('email')}
              disabled={!submissionEmail}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              variant={composeType === 'sms' ? 'default' : 'outline'}
              onClick={() => setComposeType('sms')}
              disabled={!submissionPhone}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS
            </Button>
          </div>

          {composeType === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <Input value={submissionEmail || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="Your message..."
                  rows={10}
                />
              </div>
            </div>
          )}

          {composeType === 'sms' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <Input value={submissionPhone || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="Your SMS message..."
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {composeContent.length}/160 characters
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sending || !composeContent.trim() || (composeType === 'email' && !composeSubject.trim())}
            className="w-full"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send {composeType.toUpperCase()}
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

