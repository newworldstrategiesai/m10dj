/**
 * Invoice Email Actions Component
 * Provides buttons to preview, send, and test invoice emails
 */

import React, { useState } from 'react';
import { Mail, Eye, Send, TestTube, Loader2, X, AlertCircle, FileText, Download } from 'lucide-react';
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
  const [loading, setLoading] = useState<'preview' | 'send' | 'test' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [previewHasEmail, setPreviewHasEmail] = useState<boolean>(true);
  const [previewContactId, setPreviewContactId] = useState<string | undefined>(contactId);
  const [attachPDF, setAttachPDF] = useState<boolean>(false);
  const [downloadingPDF, setDownloadingPDF] = useState<boolean>(false);

  const handlePreview = async () => {
    setLoading('preview');
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview email');
      }

      setPreviewHtml(data.html);
      setPreviewSubject(data.subject);
      setPreviewHasEmail(data.hasEmail !== false);
      if (data.contactId) {
        setPreviewContactId(data.contactId);
      }
      setShowPreview(true);
      
      toast({
        title: 'Preview Ready',
        description: 'Email preview loaded successfully'
      });
    } catch (error: any) {
      console.error('Error previewing email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to preview email',
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

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Response is not a PDF:', contentType);
        throw new Error('Server returned invalid PDF format');
      }

      // Create blob and download
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

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle missing email address - show error in modal UI
        if (data.code === 'MISSING_EMAIL') {
          // Keep modal open and show error message in UI
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
          return; // Don't throw error, just show in modal
        }
        throw new Error(data.error || data.message || 'Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: 'Invoice email sent successfully to client'
      });

      // Close preview if open
      setShowPreview(false);
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
    setLoading('test');
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if response is JSON before parsing
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
        description: `Test email sent to ${data.testEmail || 'admin email'}`
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

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={disabled || loading !== null}
          className="flex items-center gap-2"
        >
          {loading === 'preview' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Previewing...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview Email
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={disabled || loading !== null}
          className="flex items-center gap-2"
        >
          {loading === 'test' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending Test...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4" />
              Send Test Email
            </>
          )}
        </Button>

        <Button
          size="sm"
          onClick={handleSend}
          disabled={disabled || loading !== null || !hasEmail}
          className="flex items-center gap-2 bg-[#fcba00] hover:bg-[#f5a500] text-black"
        >
          {loading === 'send' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to Client
            </>
          )}
        </Button>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Email Preview: {previewSubject || `Invoice ${invoiceNumber || ''}`}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Preview how the email will appear to the client
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
            <div 
              className="email-preview-container bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-auto"
              style={{ maxWidth: '600px' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t">
            {!previewHasEmail && previewContactId && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Email Address Required
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      This invoice requires a contact email address to send. Please add an email address to the contact.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        window.location.href = `/admin/contacts/${previewContactId}`;
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Add Email Address
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attach-pdf"
                    checked={attachPDF}
                    onCheckedChange={(checked) => setAttachPDF(checked === true)}
                  />
                  <Label
                    htmlFor="attach-pdf"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Attach PDF version of invoice
                  </Label>
                </div>
                {attachPDF && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center gap-2"
                  >
                    {downloadingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This is a preview. The actual email will be sent to the client.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPreview(false);
                      handleSend();
                    }}
                    disabled={!previewHasEmail}
                    className="bg-[#fcba00] hover:bg-[#f5a500] text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
