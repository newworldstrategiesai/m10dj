/**
 * Create Standalone Contract Component
 * 
 * Allows admins to create contracts that aren't tied to events/bookings.
 * Used for NDAs, personal agreements, etc.
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Send, 
  X, 
  Loader2, 
  Copy, 
  Check,
  User,
  Mail,
  Phone,
  Shield,
  FileSignature,
  ExternalLink
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  template_type: string;
  variables: Record<string, any>;
}

interface CreateStandaloneContractProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateStandaloneContract({ 
  isOpen, 
  onClose,
  onSuccess 
}: CreateStandaloneContractProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ signingUrl: string; contractNumber: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    senderName: '',
    senderEmail: '',
    purpose: '',
    governingState: 'Tennessee',
    termYears: 7,
    sendImmediately: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Filter to show personal/NDA templates first
      const personalTemplates = (data || []).filter(t => 
        t.template_type === 'personal_agreement' || 
        t.template_type === 'nda' ||
        t.name.includes('nda')
      );
      
      setTemplates(personalTemplates.length > 0 ? personalTemplates : (data || []));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate) {
      toast({
        title: 'Select Template',
        description: 'Please select a contract template',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.recipientName || !formData.recipientEmail) {
      toast({
        title: 'Missing Information',
        description: 'Recipient name and email are required',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
      
      const response = await fetch('/api/contracts/create-standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          templateName: selectedTemplateData?.name,
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          recipientPhone: formData.recipientPhone,
          senderName: formData.senderName,
          senderEmail: formData.senderEmail,
          purpose: formData.purpose || selectedTemplateData?.description,
          governingState: formData.governingState,
          termYears: formData.termYears,
          isPersonal: selectedTemplateData?.template_type === 'personal_agreement',
          sendImmediately: formData.sendImmediately
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contract');
      }

      setResult({
        signingUrl: data.signingUrl,
        contractNumber: data.contract.contract_number
      });

      toast({
        title: 'Contract Created',
        description: formData.sendImmediately 
          ? `Signing link sent to ${formData.recipientEmail}` 
          : 'Contract created as draft',
      });

      onSuccess?.();

    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contract',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.signingUrl) {
      await navigator.clipboard.writeText(result.signingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Signing link copied to clipboard',
      });
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedTemplate('');
    setFormData({
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      senderName: '',
      senderEmail: '',
      purpose: '',
      governingState: 'Tennessee',
      termYears: 7,
      sendImmediately: true
    });
    onClose();
  };

  if (!isOpen) return null;

  // Success state
  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contract Created!</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {formData.sendImmediately 
                ? `Signing link has been emailed to ${formData.recipientEmail}`
                : 'Share the signing link below'}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contract Number</p>
            <p className="font-mono text-gray-900 dark:text-white">{result.contractNumber}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Signing Link</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={result.signingUrl}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-300"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => window.open(result.signingUrl, '_blank')}
              variant="outline"
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileSignature className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Create Contract</h2>
              <p className="text-sm text-gray-500">Send for e-signature</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Template Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contract Template
            </Label>
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading templates...
              </div>
            ) : (
              <div className="grid gap-2 mt-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${
                        selectedTemplate === template.id ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {template.description || template.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      {template.template_type === 'personal_agreement' ? 'Personal Agreement' : 'Business NDA'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recipient Info */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Recipient Information
            </h3>
            
            <div>
              <Label htmlFor="recipientName" className="sr-only">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="Full Legal Name"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="recipientEmail" className="sr-only">Recipient Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="Email Address"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recipientPhone" className="sr-only">Recipient Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="recipientPhone"
                  type="tel"
                  placeholder="Phone (optional)"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Sender Info (Pre-filled) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Your Information (Party A)
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Your Name"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Your Email"
                value={formData.senderEmail}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="sendImmediately"
              checked={formData.sendImmediately}
              onChange={(e) => setFormData({ ...formData, sendImmediately: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="sendImmediately" className="text-sm text-gray-600 dark:text-gray-400">
              Send signing invitation email immediately
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              disabled={submitting || !selectedTemplate}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {formData.sendImmediately ? 'Create & Send' : 'Create Contract'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}






