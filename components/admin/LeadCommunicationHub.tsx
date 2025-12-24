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
  AlertCircle,
  TestTube,
  Eye,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
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
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCommunications();
    fetchAdminEmail();
  }, [submissionId]);

  const fetchAdminEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setAdminEmail(user.email);
      }
    } catch (error) {
      console.error('Error fetching admin email:', error);
    }
  };

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

  const handleSendTestEmail = async () => {
    if (!adminEmail) {
      toast({
        title: "Error",
        description: "Admin email not found. Please ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    if (!composeSubject.trim() || !composeContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message before sending a test email.",
        variant: "destructive"
      });
      return;
    }

    setSendingTestEmail(true);
    try {
      const response = await fetch('/api/admin/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          to: adminEmail,
          subject: `[TEST] ${composeSubject}`,
          content: `This is a test email. The actual email would be sent to: ${submissionEmail || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST EMAIL PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: ${composeSubject}

${composeContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This test was sent to your email (${adminEmail}) to preview how the email will look when sent to the lead.`
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Test email sent to ${adminEmail}`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setSendingTestEmail(false);
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

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    
    switch (statusLower) {
      case 'opened':
      case 'read':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 flex items-center gap-1.5 px-2 py-0.5">
            <Eye className="w-3 h-3" />
            <span className="font-medium">Opened</span>
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700 flex items-center gap-1.5 px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3" />
            <span className="font-medium">Delivered</span>
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 flex items-center gap-1.5 px-2 py-0.5">
            <Send className="w-3 h-3" />
            <span className="font-medium">Sent</span>
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 flex items-center gap-1.5 px-2 py-0.5">
            <FileText className="w-3 h-3" />
            <span className="font-medium">Draft</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700 flex items-center gap-1.5 px-2 py-0.5">
            <XCircle className="w-3 h-3" />
            <span className="font-medium">Failed</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700 flex items-center gap-1.5 px-2 py-0.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-medium">Pending</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600 flex items-center gap-1.5 px-2 py-0.5">
            <Circle className="w-3 h-3" />
            <span className="font-medium capitalize">{status || 'Unknown'}</span>
          </Badge>
        );
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          {/* Status badge - more prominent */}
                          {comm.type === 'email' && getStatusBadge(comm.status)}
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
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(comm.created_at)}
                        </span>
                        {/* Show status icon for non-email types or as additional indicator */}
                        {comm.type !== 'email' && (
                          <div className="flex items-center">
                            {comm.status === 'read' || comm.status === 'delivered' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : comm.status === 'sent' ? (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            ) : comm.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
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

          <div className="flex gap-2">
            {composeType === 'email' && (
              <Button
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail || !adminEmail || !composeSubject.trim() || !composeContent.trim()}
                variant="outline"
                className="flex-1"
              >
                {sendingTestEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={sending || !composeContent.trim() || (composeType === 'email' && !composeSubject.trim())}
              className={composeType === 'email' ? 'flex-1' : 'w-full'}
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
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

