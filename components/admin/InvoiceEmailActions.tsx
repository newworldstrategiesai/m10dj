/**
 * Invoice Email Actions Component
 * Unified email center with preview, options, and actions
 * Improved UX with single entry point and progressive disclosure
 */

import React, { useState, useEffect } from 'react';
import { Mail, Eye, Send, TestTube, Loader2, X, AlertCircle, FileText, Download, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface InvoiceEmailActionsProps {
  invoiceId: string;
  invoiceNumber?: string;
  disabled?: boolean;
  hasEmail?: boolean;
  contactId?: string;
}

export default function InvoiceEmailActions({
  invoiceId,
  invoiceNumber,
  disabled = false,
  hasEmail = true,
  contactId
}: InvoiceEmailActionsProps) {
  const { toast } = useToast();
  const [showEmailCenter, setShowEmailCenter] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');
  const [loading, setLoading] = useState<'preview' | 'send' | 'test' | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [previewHasEmail, setPreviewHasEmail] = useState<boolean>(true);
  const [previewContactId, setPreviewContactId] = useState<string | undefined>(contactId);
  const [attachPDF, setAttachPDF] = useState<boolean>(false);
  const [downloadingPDF, setDownloadingPDF] = useState<boolean>(false);
  const [testEmails, setTestEmails] = useState<string>('');
  const [testAttachPDF, setTestAttachPDF] = useState<boolean>(false);
  const [previewLoaded, setPreviewLoaded] = useState<boolean>(false);
  const [editingEmail, setEditingEmail] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [savingEmail, setSavingEmail] = useState<boolean>(false);

  // Auto-load preview when modal opens
  useEffect(() => {
    if (showEmailCenter && !previewLoaded && loading === null && invoiceId) {
      console.log('Auto-loading preview for invoice:', invoiceId);
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        handlePreview();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmailCenter]);

  const handlePreview = async () => {
    if (loading === 'preview') {
      console.log('Preview already loading, skipping...');
      return; // Prevent multiple simultaneous requests
    }
    
    setLoading('preview');
    console.log('Starting preview load for invoice:', invoiceId);
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Preview response status:', response.status, response.statusText);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Preview data received:', { 
        hasHtml: !!data.html, 
        hasSubject: !!data.subject,
        hasEmail: data.hasEmail 
      });

      if (!response.ok) {
        console.error('Preview API error:', data);
        throw new Error(data.error || 'Failed to preview email');
      }

      if (!data.html) {
        throw new Error('Preview HTML is empty');
      }

      setPreviewHtml(data.html);
      setPreviewSubject(data.subject || `Invoice ${invoiceNumber || ''}`);
      setPreviewHasEmail(data.hasEmail !== false);
      if (data.contactId) {
        setPreviewContactId(data.contactId);
      }
      // Initialize email input with current email if available
      if (data.email) {
        setEmailInput(data.email);
      }
      setPreviewLoaded(true);
      
      console.log('Preview loaded successfully');
      
      // Show toast notification
      toast({
        title: 'Preview Loaded',
        description: 'Email preview is ready'
      });
    } catch (error: any) {
      console.error('Error previewing email:', error);
      setPreviewLoaded(false); // Reset on error so user can retry
      toast({
        title: 'Error Loading Preview',
        description: error.message || 'Failed to preview email. Please check the console for details.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch('/api/invoices/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', response.status, errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Response is not a PDF:', contentType);
        throw new Error('Server returned invalid PDF format');
      }

      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded',
        description: 'Invoice PDF has been downloaded successfully',
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleSend = async () => {
    if (!previewHasEmail) {
      toast({
        title: 'Email Address Required',
        description: 'Please add an email address to the contact to send the invoice',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Are you sure you want to send the invoice email to the client?`)) {
      return;
    }

    setLoading('send');
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachPDF })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'MISSING_EMAIL') {
          setPreviewHasEmail(false);
          if (data.contactId) {
            setPreviewContactId(data.contactId);
          }
          setLoading(null);
          toast({
            title: 'Email Address Required',
            description: 'Please add an email address to the contact to send the invoice',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(data.error || data.message || 'Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: 'Invoice email sent successfully to client'
      });

      // Close modal and reset
      setShowEmailCenter(false);
      setPreviewLoaded(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleTest = async () => {
    // Validate email addresses
    const emails = testEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
    if (emails.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one email address',
        variant: 'destructive'
      });
      return;
    }

    // Validate email format
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

    setLoading('test');
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmails: emails,
          attachPDF: testAttachPDF
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast({
        title: 'Test Email Sent',
        description: `Test email sent to ${data.testEmails?.join(', ') || data.testEmail || 'admin email'}`
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleOpenEmailCenter = () => {
    setShowEmailCenter(true);
    setPreviewLoaded(false);
    setActiveTab('preview');
  };

  const handleCloseEmailCenter = () => {
    setShowEmailCenter(false);
    setPreviewLoaded(false);
    setTestEmails('');
    setTestAttachPDF(false);
    setEditingEmail(false);
    setEmailInput('');
  };

  const handleSaveEmail = async () => {
    // Validate email format
    if (emailInput.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setSavingEmail(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/update-email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: emailInput.trim() || '' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email address');
      }

      // Update state immediately - hide warning and show preview
      setPreviewHasEmail(!!emailInput.trim());
      setEditingEmail(false);
      
      toast({
        title: 'Email Updated',
        description: 'Invoice email address has been updated successfully'
      });

      // Reload preview immediately to show updated email
      setPreviewLoaded(false);
      await handlePreview();
    } catch (error: any) {
      console.error('Error saving email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email address',
        variant: 'destructive'
      });
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <>
      {/* Single Primary Button */}
      <Button
        size="sm"
        onClick={handleOpenEmailCenter}
        disabled={disabled}
        className="flex items-center gap-2 bg-[#fcba00] hover:bg-[#f5a500] text-black"
      >
        <Mail className="w-4 h-4" />
        Send Email
      </Button>

      {/* Unified Email Center Modal */}
      <Dialog open={showEmailCenter} onOpenChange={handleCloseEmailCenter}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="w-5 h-5" />
              Send Invoice Email
            </DialogTitle>
            <DialogDescription>
              Preview, configure, and send the invoice email to your client
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
              {loading === 'preview' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#fcba00]" />
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
                  
                  {!previewHasEmail && previewContactId && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                              Email Address Required
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              This invoice requires an email address to send. Add one below:
                            </p>
                          </div>
                          {editingEmail ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="client@example.com"
                                className="flex-1"
                                disabled={savingEmail}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !savingEmail) {
                                    handleSaveEmail();
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveEmail}
                                disabled={savingEmail}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                {savingEmail ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEmail(false);
                                  setEmailInput('');
                                }}
                                disabled={savingEmail}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setEditingEmail(true)}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              Add Email Address
                            </Button>
                          )}
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
                      disabled={loading !== null || savingEmail}
                    >
                      {(loading === 'preview' || savingEmail) ? (
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
            </TabsContent>

            {/* Options & Test Tab */}
            <TabsContent value="options" className="flex-1 flex flex-col overflow-auto m-0 px-6 pb-6">
              <div className="space-y-6 mt-4">
                {/* Email Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email Settings</h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="attach-pdf"
                        checked={attachPDF}
                        onCheckedChange={(checked) => setAttachPDF(checked === true)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="attach-pdf"
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Attach PDF version of invoice
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          The invoice PDF will be attached to the email sent to the client
                        </p>
                        {attachPDF && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                            className="mt-2 flex items-center gap-2"
                          >
                            {downloadingPDF ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Preview PDF
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Email Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Send Test Email</h3>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Send a test email to verify the invoice looks correct before sending to the client.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="test-emails" className="text-sm font-medium">
                        Recipient Email Addresses
                      </Label>
                      <input
                        id="test-emails"
                        type="text"
                        value={testEmails}
                        onChange={(e) => setTestEmails(e.target.value)}
                        placeholder="your-email@example.com, colleague@example.com"
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enter one or more email addresses separated by commas
                      </p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="test-attach-pdf"
                        checked={testAttachPDF}
                        onCheckedChange={(checked) => setTestAttachPDF(checked === true)}
                        className="mt-1"
                      />
                      <Label
                        htmlFor="test-attach-pdf"
                        className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Attach PDF to test email
                      </Label>
                    </div>

                    <Button
                      onClick={handleTest}
                      disabled={loading === 'test' || !testEmails.trim()}
                      variant="outline"
                      className="w-full"
                    >
                      {loading === 'test' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Test Email...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Send Test Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="border-t px-6 py-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {previewHasEmail ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Ready to send
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Email address required
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseEmailCenter}
                  disabled={loading !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={loading !== null || !previewHasEmail}
                  className="bg-[#fcba00] hover:bg-[#f5a500] text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'send' ? (
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
