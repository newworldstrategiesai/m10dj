'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface ParseTextThreadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ParseTextThreadModal({ open, onClose }: ParseTextThreadModalProps) {
  const [textThread, setTextThread] = useState('');
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleParse = async () => {
    if (!textThread.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste a text thread',
        variant: 'destructive',
      });
      return;
    }

    setParsing(true);
    try {
      const response = await fetch('/api/admin/parse-text-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textThread }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse text thread');
      }

      setPreview(data);
      
      // Show detailed notifications
      if (data.project) {
        // Event was created - show prominent notification
        toast({
          title: '🎉 New Event Created!',
          description: (
            <div className="space-y-1">
              <p className="font-medium">{data.project.event_name}</p>
              {data.project.event_date && (
                <p className="text-sm text-muted-foreground">
                  {new Date(data.project.event_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              {data.project.venue_name && (
                <p className="text-sm text-muted-foreground">
                  📍 {data.project.venue_name}
                </p>
              )}
              {data.contact && (
                <p className="text-xs text-muted-foreground mt-1">
                  Contact: {data.contact.first_name} {data.contact.last_name}
                </p>
              )}
              {data.project.id && (
                <Link 
                  href={`/admin/projects/${data.project.id}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/projects/${data.project.id}`);
                  }}
                >
                  View Event →
                </Link>
              )}
            </div>
          ),
          duration: 8000, // Show for 8 seconds since it's important
        });
      } else {
        // Just contact created/updated
        toast({
          title: 'Success',
          description: `Contact ${data.action === 'created' ? 'created' : 'updated'} successfully!`,
        });
      }

      // Close modal and refresh
      setTimeout(() => {
        onClose();
        setTextThread('');
        setPreview(null);
        router.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Error parsing text thread:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to parse text thread',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleClose = () => {
    setTextThread('');
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Import Text Thread
          </DialogTitle>
          <DialogDescription>
            Paste a text message thread to automatically create a contact and event. The system will extract names, dates, times, locations, and other details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Text Thread
            </label>
            <Textarea
              value={textThread}
              onChange={(e) => setTextThread(e.target.value)}
              placeholder="Paste your text message thread here...

Example:
+1 (901) 481-5037:
Hey Ben! I'm Joe, Spike's cousin looking for a DJ for my wife's surprise birthday party. He said you're available?

Ben Murray:
Hey Joe, yessir I am.
Jan. 31st am I right?

+1 (901) 481-5037:
Awesome. That's right
We have the clubhouse all day, but I told guests to arrive at 7. Probably go until 11 at the latest."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {preview && (
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Contact {preview.action === 'created' ? 'Created' : 'Updated'} Successfully!
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-green-800 dark:text-green-200">
                    {preview.contact && (
                      <>
                        <p><strong>Name:</strong> {preview.contact.first_name} {preview.contact.last_name}</p>
                        {preview.contact.email_address && <p><strong>Email:</strong> {preview.contact.email_address}</p>}
                        {preview.contact.phone && <p><strong>Phone:</strong> {preview.contact.phone}</p>}
                        {preview.contact.event_date && <p><strong>Event Date:</strong> {new Date(preview.contact.event_date).toLocaleDateString()}</p>}
                        {preview.contact.venue_name && <p><strong>Venue:</strong> {preview.contact.venue_name}</p>}
                      </>
                    )}
                    {preview.project && (
                      <p className="mt-2"><strong>Event Created:</strong> {preview.project.event_name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={parsing}>
              Cancel
            </Button>
            <Button onClick={handleParse} disabled={parsing || !textThread.trim()}>
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Parse & Create
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
