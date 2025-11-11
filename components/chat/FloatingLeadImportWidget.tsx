'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MessageCirclePlus,
  ClipboardCheck,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/useUser';
import { parseLeadThread, ParsedLeadThread } from '@/utils/lead-thread-parser';
import { cn } from '@/utils/cn';

const ADMIN_EMAILS = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com',
];

type ImportStatus =
  | { state: 'idle' }
  | { state: 'processing' }
  | { state: 'success'; message: string; contactId: string; action: 'created' | 'updated' }
  | { state: 'error'; message: string };

export default function FloatingLeadImportWidget() {
  const { user, loading } = useUser();
  const [open, setOpen] = useState(false);
  const [threadText, setThreadText] = useState('');
  const [status, setStatus] = useState<ImportStatus>({ state: 'idle' });

  const parsedPreview: ParsedLeadThread | null = useMemo(() => {
    if (!threadText.trim()) return null;
    try {
      return parseLeadThread(threadText);
    } catch (error) {
      console.error('Failed to parse lead thread', error);
      return null;
    }
  }, [threadText]);

  if (loading) return null;

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  if (!isAdmin) return null;

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setThreadText('');
      setStatus({ state: 'idle' });
    }
  };

  const handleImport = async () => {
    if (!threadText.trim()) return;

    setStatus({ state: 'processing' });

    try {
      const response = await fetch('/api/leads/import-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thread: threadText }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const errorMessage = payload?.error || 'Failed to import lead.';
        const errorDetails = payload?.details 
          ? (typeof payload.details === 'string' 
              ? payload.details 
              : payload.details?.message || JSON.stringify(payload.details))
          : null;
        
        throw new Error(
          errorDetails 
            ? `${errorMessage}\n\nDetails: ${errorDetails}`
            : errorMessage
        );
      }

      setStatus({
        state: 'success',
        message:
          payload.action === 'created'
            ? 'New lead created successfully.'
            : 'Existing lead updated with thread details.',
        contactId: payload.contactId,
        action: payload.action,
      });
      setThreadText('');
    } catch (error: any) {
      setStatus({
        state: 'error',
        message: error?.message || 'Something went wrong while importing the lead.',
      });
    }
  };

  const renderPreview = () => {
    if (!parsedPreview) {
      return (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
          Paste the text thread above to see what we can extract automatically.
        </div>
      );
    }

    const contact = parsedPreview.contact;

    return (
      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Detected Details</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Review before importing. You can adjust inside the contact record later if needed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <PreviewField label="Name" value={contact.fullName || 'Not detected'} fallback />
          <PreviewField label="Email" value={contact.email || 'Not detected'} fallback />
          <PreviewField
            label="Phone"
            value={contact.phoneE164 || contact.phoneDigits || 'Not detected'}
            fallback
          />
          <PreviewField
            label="Event Time"
            value={contact.eventTime || 'Not detected'}
            fallback
          />
          <PreviewField
            label="Event Date"
            value={contact.eventDate || 'Not detected'}
            fallback
          />
          <PreviewField
            label="Event Type"
            value={contact.eventType ? contact.eventType.replace('_', ' ') : 'Not detected'}
            fallback
          />
          <PreviewField label="Venue" value={contact.venueName || 'Not detected'} fallback />
          <PreviewField
            label="Venue Address"
            value={contact.venueAddress || contact.venueName || 'Not detected'}
            fallback
          />
          <PreviewField
            label="Guest Count"
            value={
              contact.guestCount !== null && contact.guestCount !== undefined
                ? String(contact.guestCount)
                : 'Not detected'
            }
            fallback
          />
          <PreviewField
            label="Budget Range"
            value={contact.budgetRange || 'Not detected'}
            fallback
          />
        </div>

        {parsedPreview.messages.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              Conversation Preview
            </p>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
              {parsedPreview.messages.slice(0, 6).map((message, index) => (
                <div key={`${message.speakerLabel}-${index}`} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={message.role === 'team' ? 'secondary' : 'outline'}
                      className={cn(
                        'capitalize',
                        message.role === 'contact'
                          ? 'border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-900/40 dark:text-green-200'
                          : message.role === 'team'
                          ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
                          : ''
                      )}
                    >
                      {message.role === 'team'
                        ? 'Team'
                        : message.role === 'contact'
                        ? 'Lead'
                        : 'Unknown'}
                    </Badge>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {message.speakerLabel}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300">{message.message}</p>
                </div>
              ))}

              {parsedPreview.messages.length > 6 && (
                <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                  + {parsedPreview.messages.length - 6} more lines will be stored in the notes.
                </p>
              )}
            </div>
          </div>
        )}

        {contact.notes.length > 0 && (
          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">
            {contact.notes.map((note, index) => (
              <p key={index}>• {note}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <button
            className="group flex items-center gap-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:from-blue-600 dark:to-purple-600"
            aria-label="Import SMS Lead"
          >
            <div className="rounded-full bg-white/10 p-2 transition group-hover:bg-white/20">
              <MessageCirclePlus className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Import SMS Lead</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Paste SMS Thread</DialogTitle>
            <DialogDescription>
              Drop in any text conversation with a lead. We will extract key details, create or update
              the contact, and archive the transcript automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {status.state === 'error' && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="whitespace-pre-wrap break-words">{status.message}</p>
              </div>
            )}

            {status.state === 'success' && (
              <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardCheck className="h-4 w-4" />
                  {status.message}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
                    Action: {status.action === 'created' ? 'New Lead Created' : 'Lead Updated'}
                  </p>
                  <Link
                    href={`/admin/contacts/${status.contactId}`}
                    className="text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-200"
                  >
                    View Contact →
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Conversation Transcript
              </label>
              <Textarea
                value={threadText}
                onChange={(event) => setThreadText(event.target.value)}
                placeholder={`Example:\n+1 (901) 562-3974:\n  Hey, I got your number from Tay...`}
                className="min-h-[160px] resize-vertical"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tip: include the lead name, phone, email, event date, and venue if available for best
                results.
              </p>
            </div>

            {renderPreview()}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="flat"
              className="w-full sm:w-auto"
              onClick={handleImport}
              disabled={!threadText.trim() || status.state === 'processing'}
            >
              {status.state === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Import Lead'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewField({
  label,
  value,
  fallback = false,
}: {
  label: string;
  value: string;
  fallback?: boolean;
}) {
  const isMissing = fallback && value.toLowerCase().includes('not detected');
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          'rounded-md border px-3 py-2 text-sm',
          isMissing
            ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
            : 'border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
        )}
      >
        {value}
      </p>
    </div>
  );
}


