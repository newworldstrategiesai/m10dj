/**
 * Email Recommendation Toasts Component
 * Shows toast notifications for recommended email templates
 */

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { ToastAction } from '@/components/ui/Toasts/toast';
import { Eye, TestTube, Send, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

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

interface EmailRecommendationToastsProps {
  contactId: string;
  contractId?: string;
  invoiceId?: string;
  contractNumber?: string;
  invoiceNumber?: string;
  eventName?: string;
  minUrgencyLevel?: 'critical' | 'high' | 'medium' | 'low';
  maxToasts?: number;
  onTemplateSent?: () => void;
}

export default function EmailRecommendationToasts({
  contactId,
  contractId,
  invoiceId,
  minUrgencyLevel = 'high',
  maxToasts = 3,
  onTemplateSent
}: EmailRecommendationToastsProps) {
  const { toast, dismiss } = useToast();
  const shownToastIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!contactId) return;

    // Delay to avoid showing toasts immediately on page load
    const delayTimeout = setTimeout(() => {
      fetchAndShowRecommendations();
    }, 1000); // 1 second delay

    // Cleanup on unmount
    return () => {
      clearTimeout(delayTimeout);
      toastTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      toastTimeoutsRef.current = [];
    };
  }, [contactId, contractId, invoiceId]);

  const fetchAndShowRecommendations = async () => {
    try {
      const response = await fetch('/api/templates/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      });

      const data = await response.json();

      if (!response.ok || !data.recommendations || data.recommendations.length === 0) {
        return;
      }

      const recommendations = data.recommendations as TemplateRecommendation[];
      showRecommendationToasts(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations for toasts:', error);
    }
  };

  const showRecommendationToasts = (recs: TemplateRecommendation[]) => {
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const minUrgency = urgencyOrder[minUrgencyLevel];

    // Filter and sort recommendations
    const relevantRecs = recs
      .filter(rec => {
        if (!rec.can_send_now) return false;
        if (urgencyOrder[rec.urgency_level] < minUrgency) return false;
        if (shownToastIdsRef.current.has(`${contactId}-${rec.template_key}`)) return false;
        return true;
      })
      .sort((a, b) => {
        const urgencyDiff = urgencyOrder[b.urgency_level] - urgencyOrder[a.urgency_level];
        if (urgencyDiff !== 0) return urgencyDiff;
        const scoreDiff = b.recommendation_score - a.recommendation_score;
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        return b.priority - a.priority;
      })
      .slice(0, maxToasts);

    // Show toasts with delays
    relevantRecs.forEach((rec, index) => {
      const timeout = setTimeout(() => {
        showRecommendationToast(rec);
        shownToastIdsRef.current.add(`${contactId}-${rec.template_key}`);
      }, index * 700); // 700ms delay between each toast
      
      toastTimeoutsRef.current.push(timeout);
    });
  };

  const showRecommendationToast = (rec: TemplateRecommendation) => {
    const urgencyColors = {
      critical: 'destructive' as const,
      high: 'default' as const,
      medium: 'default' as const,
      low: 'default' as const
    };

    const urgencyIcons = {
      critical: <AlertCircle className="w-4 h-4 text-red-500" />,
      high: <TrendingUp className="w-4 h-4 text-orange-500" />,
      medium: <Clock className="w-4 h-4 text-yellow-500" />,
      low: <CheckCircle className="w-4 h-4 text-green-500" />
    };

    const handlePreview = async () => {
      const toastId = `recommendation-${rec.template_key}`;
      dismiss(toastId);
      
      try {
        if (rec.template_key === 'contract-invoice-ready' && contractId && invoiceId) {
          const response = await fetch('/api/contracts/preview-contract-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId, invoiceId })
          });

          if (response.ok) {
            const data = await response.json();
            // Scroll to recommendations section which will show preview
            toast({
              title: 'Email Preview',
              description: `Scroll down to view the preview for ${rec.template_name}`,
            });
            // Could open modal here in the future
          }
        } else {
          toast({
            title: 'Preview Available',
            description: `Preview for ${rec.template_name} is available in the recommendations panel below.`,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load preview',
          variant: 'destructive'
        });
      }
    };

    const handleTest = async () => {
      const toastId = `recommendation-${rec.template_key}`;
      dismiss(toastId);
      
      try {
        if (rec.template_key === 'contract-invoice-ready' && contractId && invoiceId) {
          const response = await fetch('/api/contracts/test-contract-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId, invoiceId })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send test email');
          }

          toast({
            title: 'Test Email Sent',
            description: `Test email sent to ${data.testEmail || 'admin'} for ${rec.template_name}`,
          });
        } else {
          toast({
            title: 'Test Email',
            description: `Test functionality for ${rec.template_name} coming soon`,
          });
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send test email',
          variant: 'destructive'
        });
      }
    };

    const handleSend = async () => {
      const toastId = `recommendation-${rec.template_key}`;
      dismiss(toastId);
      
      try {
        if (rec.template_key === 'contract-invoice-ready' && contractId && invoiceId) {
          if (!confirm(`Send ${rec.template_name} to the client?`)) {
            return;
          }

          const response = await fetch('/api/contracts/send-contract-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId, invoiceId })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
          }

          toast({
            title: 'Email Sent',
            description: `${rec.template_name} sent successfully to client`,
          });

          onTemplateSent?.();
        } else {
          toast({
            title: 'Send Email',
            description: `Sending ${rec.template_name} - scroll down to use the recommendations panel.`,
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

    const scoreColor = rec.recommendation_score >= 0.8 
      ? 'text-green-600 dark:text-green-400' 
      : rec.recommendation_score >= 0.6 
      ? 'text-blue-600 dark:text-blue-400' 
      : 'text-yellow-600 dark:text-yellow-400';

    // Build title string with urgency indicator
    const titleText = `${rec.urgency_level === 'critical' ? '🚨 ' : ''}${rec.template_name}${rec.time_sensitive ? ' ⏰' : ''}`;

    toast({
      title: titleText,
      description: (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {urgencyIcons[rec.urgency_level]}
            {rec.urgency_level === 'critical' && (
              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full font-semibold">
                URGENT
              </span>
            )}
            {rec.time_sensitive && (
              <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full">
                ⏰ Time Sensitive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {rec.recommendation_reason}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className={`font-medium ${scoreColor}`}>
              {Math.round(rec.recommendation_score * 100)}% match
            </span>
            {rec.category && (
              <>
                <span>•</span>
                <span className="capitalize">{rec.category}</span>
              </>
            )}
            {rec.context_summary && (
              <>
                <span>•</span>
                <span className="truncate max-w-[180px]">{rec.context_summary}</span>
              </>
            )}
          </div>
        </div>
      ),
      variant: urgencyColors[rec.urgency_level],
      action: (
        <div className="flex flex-col gap-1.5 mt-2 w-full">
          <ToastAction
            altText="Preview email"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePreview();
            }}
            className="h-8 text-xs justify-start bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          >
            <Eye className="w-3 h-3 mr-1.5" />
            Preview
          </ToastAction>
          <ToastAction
            altText="Send test email to admin"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTest();
            }}
            className="h-8 text-xs justify-start bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          >
            <TestTube className="w-3 h-3 mr-1.5" />
            Test
          </ToastAction>
          <ToastAction
            altText="Send email to client"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }}
            className="h-8 text-xs bg-[#fcba00] hover:bg-[#f5a500] text-black font-semibold border-0 justify-start"
          >
            <Send className="w-3 h-3 mr-1.5" />
            Send
          </ToastAction>
        </div>
      )
    });
  };

  // This component doesn't render anything, it just triggers toasts
  return null;
}
