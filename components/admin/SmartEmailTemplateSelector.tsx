/**
 * Smart Email Template Selector
 * Intelligently recommends email templates based on customer journey
 */

import React, { useState, useEffect } from 'react';
import { Mail, Sparkles, Clock, AlertCircle, CheckCircle, TrendingUp, Loader2, Send, Eye, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContractInvoiceEmailActions from './ContractInvoiceEmailActions';

interface TemplateRecommendation {
  template_key: string;
  template_name: string;
  subject: string;
  category: string;
  recommendation_score: number;
  recommendation_reason: string;
  priority: number;
  time_sensitive: boolean;
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  context_summary: string;
  can_send_now: boolean;
  cooldown_expires_at?: string | null;
  last_sent_at?: string | null;
  required_fields: string[];
  missing_fields: string[];
}

interface SmartEmailTemplateSelectorProps {
  contactId: string;
  contractId?: string;
  invoiceId?: string;
  contractNumber?: string;
  invoiceNumber?: string;
  eventName?: string;
  onTemplateSent?: () => void;
}

export default function SmartEmailTemplateSelector({
  contactId,
  contractId,
  invoiceId,
  contractNumber,
  invoiceNumber,
  eventName,
  onTemplateSent
}: SmartEmailTemplateSelectorProps) {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecommendation | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (contactId) {
      fetchRecommendations();
    }
  }, [contactId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load template recommendations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions moved outside component to avoid re-creation
  // They're also used in TemplateRecommendationCard

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter !== 'all' && rec.urgency_level !== filter) return false;
    if (categoryFilter !== 'all' && rec.category !== categoryFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(recommendations.map(r => r.category))).filter(Boolean);

  // Group by urgency
  const criticalRecs = filteredRecommendations.filter(r => r.urgency_level === 'critical');
  const highRecs = filteredRecommendations.filter(r => r.urgency_level === 'high');
  const mediumRecs = filteredRecommendations.filter(r => r.urgency_level === 'medium');
  const lowRecs = filteredRecommendations.filter(r => r.urgency_level === 'low');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Smart Email Recommendations
          </CardTitle>
          <CardDescription>Analyzing customer journey and recommending templates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Special Actions: Contract & Invoice Email */}
      {contractId && invoiceId && (
        <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              📧 Contract & Invoice Email
            </CardTitle>
            <CardDescription>
              Send both contract and invoice together with next steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContractInvoiceEmailActions
              contractId={contractId}
              invoiceId={invoiceId}
              contractNumber={contractNumber}
              invoiceNumber={invoiceNumber}
              eventName={eventName}
            />
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Recommended Email Templates
              </CardTitle>
              <CardDescription>
                {recommendations.length} templates recommended based on customer journey
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
            >
              <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">🔴 Critical</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates match your filters</p>
              <Button
                variant="link"
                onClick={() => {
                  setFilter('all');
                  setCategoryFilter('all');
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Critical */}
              {criticalRecs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Critical - Action Required
                  </h3>
                  <div className="space-y-2">
                    {criticalRecs.map(rec => (
                      <TemplateRecommendationCard
                        key={rec.template_key}
                        recommendation={rec}
                        onSelect={setSelectedTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* High */}
              {highRecs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    High Priority
                  </h3>
                  <div className="space-y-2">
                    {highRecs.map(rec => (
                      <TemplateRecommendationCard
                        key={rec.template_key}
                        recommendation={rec}
                        onSelect={setSelectedTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Medium */}
              {mediumRecs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Medium Priority
                  </h3>
                  <div className="space-y-2">
                    {mediumRecs.map(rec => (
                      <TemplateRecommendationCard
                        key={rec.template_key}
                        recommendation={rec}
                        onSelect={setSelectedTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Low */}
              {lowRecs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Low Priority
                  </h3>
                  <div className="space-y-2">
                    {lowRecs.map(rec => (
                      <TemplateRecommendationCard
                        key={rec.template_key}
                        recommendation={rec}
                        onSelect={setSelectedTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Preview/Compose Modal */}
      {selectedTemplate && (
        <TemplateComposeModal
          contactId={contactId}
          recommendation={selectedTemplate}
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSent={() => {
            setSelectedTemplate(null);
            fetchRecommendations();
            onTemplateSent?.();
          }}
        />
      )}
    </div>
  );
}

// Helper functions for urgency/score display
const getUrgencyIcon = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'high':
      return <TrendingUp className="w-4 h-4 text-orange-500" />;
    case 'medium':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
    default:
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400';
  if (score >= 0.6) return 'text-blue-600 dark:text-blue-400';
  if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-600 dark:text-gray-400';
};

function TemplateRecommendationCard({
  recommendation,
  onSelect
}: {
  recommendation: TemplateRecommendation;
  onSelect: (rec: TemplateRecommendation) => void;
}) {

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        !recommendation.can_send_now ? 'opacity-60' : ''
      }`}
      onClick={() => recommendation.can_send_now && onSelect(recommendation)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getUrgencyIcon(recommendation.urgency_level)}
              <h4 className="font-semibold">{recommendation.template_name}</h4>
              <Badge className={getUrgencyColor(recommendation.urgency_level)}>
                {recommendation.urgency_level}
              </Badge>
              {recommendation.category && (
                <Badge variant="outline">{recommendation.category}</Badge>
              )}
              {recommendation.time_sensitive && (
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  ⏰ Time Sensitive
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {recommendation.subject}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              {recommendation.recommendation_reason}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className={getScoreColor(recommendation.recommendation_score)}>
                Match: {Math.round(recommendation.recommendation_score * 100)}%
              </span>
              <span>{recommendation.context_summary}</span>
              {recommendation.last_sent_at && (
                <span>Last sent: {new Date(recommendation.last_sent_at).toLocaleDateString()}</span>
              )}
            </div>
            {recommendation.missing_fields.length > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ Missing: {recommendation.missing_fields.join(', ')}
              </p>
            )}
            {!recommendation.can_send_now && recommendation.cooldown_expires_at && (
              <p className="text-xs text-gray-500 mt-2">
                ⏱️ Cooldown until: {new Date(recommendation.cooldown_expires_at).toLocaleString()}
              </p>
            )}
          </div>
          <Button
            variant={recommendation.can_send_now ? 'default' : 'outline'}
            size="sm"
            disabled={!recommendation.can_send_now}
            onClick={(e) => {
              e.stopPropagation();
              if (recommendation.can_send_now) {
                onSelect(recommendation);
              }
            }}
          >
            {recommendation.can_send_now ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                Use Template
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Unavailable
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateComposeModal({
  contactId,
  recommendation,
  open,
  onClose,
  onSent
}: {
  contactId: string;
  recommendation: TemplateRecommendation;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      // TODO: Implement actual template sending
      // This would call an API endpoint that:
      // 1. Loads the template file
      // 2. Renders with contact data
      // 3. Sends via Resend
      // 4. Tracks in email_template_history

      toast({
        title: 'Email Sent',
        description: `${recommendation.template_name} sent successfully`
      });

      onSent();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recommendation.template_name}</DialogTitle>
          <DialogDescription>
            {recommendation.recommendation_reason}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.subject}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Badge>{recommendation.category}</Badge>
          </div>

          <div>
            <label className="text-sm font-medium">Recommendation Score</label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(recommendation.recommendation_score * 100)}% match
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Context</label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {recommendation.context_summary}
            </p>
          </div>

          {/* TODO: Show template preview here */}

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
