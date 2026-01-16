/**
 * Service Selection Button Component
 * 
 * Add this to your admin contacts page to easily generate service selection links
 * with email preview and sending capabilities
 * 
 * Usage:
 * <ServiceSelectionButton contactId={contact.id} contactName={contact.name} contactEmail={contact.email} />
 */

import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, Check, Loader2, Mail, Eye, Settings, Send, TestTube, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ServiceSelectionButtonProps {
  contactId: string;
  contactName: string;
  contactEmail: string;
}

export default function ServiceSelectionButton({ 
  contactId, 
  contactName, 
  contactEmail 
}: ServiceSelectionButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEmailCenter, setShowEmailCenter] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');
  const [loadingState, setLoadingState] = useState<'preview' | 'send' | 'test' | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [previewHasEmail, setPreviewHasEmail] = useState<boolean>(true);
  const [previewLoaded, setPreviewLoaded] = useState<boolean>(false);
  const [testEmails, setTestEmails] = useState<string>('');

  const generateLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-service-selection-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId }),
      });

      const data = await response.json();

      if (data.success) {
        setLink(data.link);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate link',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate link',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard',
      });
    }
  };

  // Auto-load preview when modal opens
  useEffect(() => {
    if (showEmailCenter && !previewLoaded && loadingState === null && link) {
      const timer = setTimeout(() => {
        handlePreview();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmailCenter]);

  const handlePreview = async () => {
    if (loadingState === 'preview') {
      return;
    }
    
    setLoadingState('preview');
    
    try {
      const response = await fetch(`/api/service-selection/${contactId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview email');
      }

      if (!data.html) {
        throw new Error('Preview HTML is empty');
      }

      setPreviewHtml(data.html);
      setPreviewSubject(data.subject || 'Service Selection Link - M10 DJ Company');
      setPreviewHasEmail(data.hasEmail !== false);
      setPreviewLoaded(true);
      
      toast({
        title: 'Preview Loaded',
        description: 'Email preview is ready'
      });
    } catch (error: any) {
      console.error('Error previewing email:', error);
      setPreviewLoaded(false);
      toast({
        title: 'Error Loading Preview',
        description: error.message || 'Failed to preview email',
        variant: 'destructive'
      });
    } finally {
      setLoadingState(null);
    }
  };

  const handleTest = async () => {
    const emails = testEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
    if (emails.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one email address',
        variant: 'destructive'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      toast({
        title: 'Error',
        description: `Invalid email addresses: ${invalidEmails.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setLoadingState('test');
    
    try {
      const response = await fetch(`/api/service-selection/${contactId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmails: emails })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      const sentToEmails = data.testEmails?.join(', ') || emails.join(', ');
      const emailCount = emails.length;
      
      toast({
        title: '✅ Test Email Sent Successfully',
        description: emailCount === 1 
          ? `Test email sent to ${sentToEmails}`
          : `Test email sent to ${emailCount} recipient${emailCount > 1 ? 's' : ''}: ${sentToEmails}`,
        duration: 6000,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setLoadingState(null);
    }
  };

  const handleSend = async () => {
    if (!previewHasEmail) {
      toast({
        title: 'Email Address Required',
        description: 'Please add an email address to the contact to send the email',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Are you sure you want to send the service selection email to ${contactName}?`)) {
      return;
    }

    setLoadingState('send');
    try {
      const response = await fetch(`/api/service-selection/${contactId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'MISSING_EMAIL') {
          setPreviewHasEmail(false);
        }
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: '✅ Email Sent Successfully',
        description: `Service selection email sent to ${contactName}`,
        duration: 6000,
      });

      // Close modal after successful send
      handleCloseEmailCenter();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setLoadingState(null);
    }
  };

  const handleOpenEmailCenter = async () => {
    // Generate link if not already generated
    if (!link) {
      await generateLink();
    }
    setShowEmailCenter(true);
    setPreviewLoaded(false);
    setActiveTab('preview');
  };

  const handleCloseEmailCenter = () => {
    setShowEmailCenter(false);
    setPreviewLoaded(false);
    setTestEmails('');
  };

  if (!link) {
    return (
      <button
        onClick={generateLink}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 mr-2" />
            Generate Service Selection Link
          </>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-green-700">
            <Check className="w-5 h-5 mr-2" />
            <span className="font-semibold">Link Generated!</span>
          </div>
        </div>
        
        <div className="bg-white rounded border border-gray-300 p-3 mb-3 break-all text-sm text-gray-700 font-mono">
          {link}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </button>
          
          <Button
            onClick={handleOpenEmailCenter}
            className="flex-1 bg-brand text-white hover:bg-brand/90"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          This link is unique to {contactName} and will save their selections to their contact record.
        </p>
      </div>

      {/* Email Preview & Send Modal */}
      <Dialog open={showEmailCenter} onOpenChange={handleCloseEmailCenter}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="w-5 h-5" />
              Send Service Selection Email
            </DialogTitle>
            <DialogDescription>
              Preview, configure, and send the service selection email to {contactName}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'options')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 mb-0">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="options" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Options & Test
              </TabsTrigger>
            </TabsList>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 flex flex-col overflow-hidden m-0 px-6 pb-6 data-[state=active]:flex">
              {loadingState === 'preview' && !previewLoaded ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand" />
                    <p className="text-sm text-gray-500">Loading email preview...</p>
                  </div>
                </div>
              ) : previewLoaded && previewHtml ? (
                <>
                  <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900 p-4 mt-4">
                    <div 
                      className="email-preview-container bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-auto"
                      style={{ maxWidth: '600px' }}
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                  
                  {!previewHasEmail && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Email Address Required
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            This contact requires an email address to send the service selection email. Please add one in the contact details.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-4">Preview not loaded</p>
                    <Button 
                      onClick={handlePreview} 
                      variant="outline"
                      disabled={loadingState !== null}
                    >
                      {loadingState !== null ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Load Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Send Button */}
              {previewLoaded && previewHasEmail && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={handleSend}
                    disabled={loadingState !== null}
                    className="w-full bg-brand hover:bg-brand/90 text-white"
                  >
                    {loadingState === 'send' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to Client
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Options & Test Tab */}
            <TabsContent value="options" className="flex-1 flex flex-col overflow-hidden m-0 px-6 pb-6 data-[state=active]:flex">
              <div className="space-y-6 mt-4">
                <div>
                  <Label htmlFor="test-emails" className="text-base font-semibold mb-2 block">
                    Send Test Email
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Enter email address(es) to send a test email. You can enter multiple addresses separated by commas.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="test-emails"
                      type="text"
                      placeholder="test@example.com or test1@example.com, test2@example.com"
                      value={testEmails}
                      onChange={(e) => setTestEmails(e.target.value)}
                      className="flex-1"
                      disabled={loadingState !== null}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loadingState) {
                          handleTest();
                        }
                      }}
                    />
                    <Button
                      onClick={handleTest}
                      disabled={loadingState !== null || !testEmails.trim()}
                      variant="outline"
                    >
                      {loadingState === 'test' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Send Test
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Send Button */}
                {previewHasEmail && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleSend}
                      disabled={loadingState !== null}
                      className="w-full bg-brand hover:bg-brand/90 text-white"
                    >
                      {loadingState === 'send' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send to Client
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
