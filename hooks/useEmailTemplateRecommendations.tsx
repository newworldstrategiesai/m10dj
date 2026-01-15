/**
 * Hook for Email Template Recommendations
 * Fetches recommendations and shows toast notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { ToastAction } from '@/components/ui/Toasts/toast';
import { Eye, TestTube, Send, X, Sparkles, AlertCircle } from 'lucide-react';

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

interface UseEmailTemplateRecommendationsOptions {
  contactId: string;
  contractId?: string;
  invoiceId?: string;
  showToasts?: boolean;
  minUrgencyLevel?: 'critical' | 'high' | 'medium' | 'low';
  maxToasts?: number;
}

export function useEmailTemplateRecommendations({
  contactId,
  contractId,
  invoiceId,
  showToasts = true,
  minUrgencyLevel = 'high', // Only show high/critical by default
  maxToasts = 3 // Max 3 toast notifications
}: UseEmailTemplateRecommendationsOptions) {
  const { toast, dismiss } = useToast();
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [shownToastIds, setShownToastIds] = useState<Set<string>>(new Set());

  const fetchRecommendations = useCallback(async () => {
    if (!contactId) return;

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

      // Show toast notifications for high-priority recommendations
      if (showToasts && data.recommendations) {
        showRecommendationToasts(data.recommendations);
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [contactId, showToasts]);

  const showRecommendationToasts = useCallback((recs: TemplateRecommendation[]) => {
    if (!showToasts) return;

    // Filter by urgency level and can_send_now
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const minUrgency = urgencyOrder[minUrgencyLevel];

    const relevantRecs = recs
      .filter(rec => 
        rec.can_send_now && 
        urgencyOrder[rec.urgency_level] >= minUrgency &&
        !shownToastIds.has(rec.template_key)
      )
      .sort((a, b) => urgencyOrder[b.urgency_level] - urgencyOrder[a.urgency_level])
      .slice(0, maxToasts);

    relevantRecs.forEach((rec, index) => {
      // Add delay between toasts to avoid overwhelming
      setTimeout(() => {
        showRecommendationToast(rec, index);
        setShownToastIds(prev => new Set(prev).add(rec.template_key));
      }, index * 500); // 500ms delay between each toast
    });
  }, [showToasts, minUrgencyLevel, maxToasts, shownToastIds]);

  const showRecommendationToast = useCallback((rec: TemplateRecommendation, index: number) => {
    const urgencyColors = {
      critical: 'destructive',
      high: 'default',
      medium: 'default',
      low: 'default'
    } as const;

    const urgencyIcons = {
      critical: <AlertCircle className="w-4 h-4" />,
      high: <Sparkles className="w-4 h-4" />,
      medium: <Eye className="w-4 h-4" />,
      low: <Eye className="w-4 h-4" />
    };

    const handlePreview = async () => {
      dismiss(); // Close toast
      // TODO: Open preview modal
      toast({
        title: 'Preview Email',
        description: `Opening preview for ${rec.template_name}...`,
      });
    };

    const handleTest = async () => {
      dismiss(); // Close toast
      
      try {
        const response = await fetch('/api/contracts/test-contract-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractId: contractId || null,
            invoiceId: invoiceId || null
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send test email');
        }

        toast({
          title: 'Test Email Sent',
          description: `Test email sent to admin for ${rec.template_name}`,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send test email',
          variant: 'destructive'
        });
      }
    };

    const handleSend = async () => {
      dismiss(); // Close toast
      
      try {
        // This will need to be generalized for all template types
        // For now, handle contract-invoice specifically
        if (rec.template_key === 'contract-invoice-ready' && contractId && invoiceId) {
          const response = await fetch('/api/contracts/send-contract-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId,
              invoiceId
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
          }

          toast({
            title: 'Email Sent',
            description: `${rec.template_name} sent successfully to client`,
          });

          // Refresh recommendations
          setTimeout(() => fetchRecommendations(), 1000);
        } else {
          // TODO: Generic template sending endpoint
          toast({
            title: 'Not Yet Implemented',
            description: `Sending ${rec.template_name} will be available soon`,
          });
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send email',
          variant: 'destructive'
        });
      }
    };

    // Build title string with urgency indicator
    const titleText = `${rec.urgency_level === 'critical' ? '🚨 ' : ''}${rec.template_name}`;

    toast({
      id: `recommendation-${rec.template_key}-${index}`,
      title: titleText,
      description: (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {urgencyIcons[rec.urgency_level]}
          </div>
        <div className="space-y-1">
          <p className="text-sm">{rec.recommendation_reason}</p>
          {rec.urgency_level === 'critical' && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              ⚠️ Action Required
            </p>
          )}
          {rec.time_sensitive && (
            <p className="text-xs text-orange-600 dark:text-orange-400">
              ⏰ Time Sensitive
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Match: {Math.round(rec.recommendation_score * 100)}% • {rec.context_summary}
          </p>
        </div>
      ),
      variant: urgencyColors[rec.urgency_level],
      duration: rec.urgency_level === 'critical' ? 10000 : 5000, // Longer for critical
      action: (
        <div className="flex flex-col gap-1">
          <ToastAction
            altText="Preview email"
            onClick={handlePreview}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </ToastAction>
          <ToastAction
            altText="Send test email"
            onClick={handleTest}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <TestTube className="w-3 h-3 mr-1" />
            Test
          </ToastAction>
          <ToastAction
            altText="Send to client"
            onClick={handleSend}
            className="bg-[#fcba00] hover:bg-[#f5a500] text-black font-semibold"
          >
            <Send className="w-3 h-3 mr-1" />
            Send
          </ToastAction>
        </div>
      )
    });
  }, [dismiss, contractId, invoiceId, fetchRecommendations, toast]);

  useEffect(() => {
    if (contactId) {
      fetchRecommendations();
    }
  }, [contactId, fetchRecommendations]);

  return {
    recommendations,
    loading,
    refresh: fetchRecommendations
  };
}
