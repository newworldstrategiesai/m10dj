'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { IconX, IconSend, IconMail, IconPhone, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

interface ComposeMessageModalProps {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  initialMessage?: string;
  initialSubject?: string;
  initialType?: 'sms' | 'email';
}

export function ComposeMessageModal({
  open,
  onClose,
  contactId,
  contactName,
  contactEmail,
  contactPhone,
  initialMessage = '',
  initialSubject = '',
  initialType = 'email',
}: ComposeMessageModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'sms' | 'email'>(initialType);
  const [smsMessage, setSmsMessage] = useState(initialMessage);
  const [emailSubject, setEmailSubject] = useState(initialSubject);
  const [emailMessage, setEmailMessage] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);

  // Reset form when modal opens/closes or when initial values change
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialType);
      setSmsMessage(initialMessage);
      setEmailSubject(initialSubject);
      setEmailMessage(initialMessage);
      setIsSending(false);
    }
  }, [open, initialType, initialMessage, initialSubject]);

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }

    if (!contactPhone) {
      toast({
        title: 'Phone number required',
        description: 'This contact does not have a phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Call the assistant's send_sms function via the chat API
      const response = await fetch('/api/admin-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Send SMS to contact ${contactId}: ${smsMessage}`,
          conversation_history: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send SMS');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'SMS sent!',
        description: `Message sent to ${contactName || contactPhone}`,
      });

      // Reset and close
      setSmsMessage('');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to send SMS',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: 'Subject and message required',
        description: 'Please enter both a subject and message',
        variant: 'destructive',
      });
      return;
    }

    if (!contactEmail) {
      toast({
        title: 'Email address required',
        description: 'This contact does not have an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Call the assistant's send_email function via the chat API
      const response = await fetch('/api/admin-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Send email to contact ${contactId} with subject "${emailSubject}": ${emailMessage}`,
          conversation_history: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Email sent!',
        description: `Email sent to ${contactName || contactEmail}`,
      });

      // Reset and close
      setEmailSubject('');
      setEmailMessage('');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to send email',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            {contactName && `To: ${contactName}`}
            {contactEmail && ` (${contactEmail})`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sms' | 'email')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sms" disabled={!contactPhone}>
              <IconPhone className="w-4 h-4 mr-2" />
              SMS {!contactPhone && '(No phone)'}
            </TabsTrigger>
            <TabsTrigger value="email" disabled={!contactEmail}>
              <IconMail className="w-4 h-4 mr-2" />
              Email {!contactEmail && '(No email)'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                maxLength={1600}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {smsMessage.length}/1600 characters
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendSMS} 
                disabled={isSending || !smsMessage.trim() || !contactPhone}
              >
                {isSending ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <IconSend className="w-4 h-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail} 
                disabled={isSending || !emailSubject.trim() || !emailMessage.trim() || !contactEmail}
              >
                {isSending ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <IconSend className="w-4 h-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

