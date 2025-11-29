'use client';

import { useMemo, useState, useEffect } from 'react';
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
  const [contactId, setContactId] = useState<string | null>(null);

  const [existingContact, setExistingContact] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [editableFields, setEditableFields] = useState<Record<string, string | null>>({});
  const [showFieldComparison, setShowFieldComparison] = useState(false);

  // Detect if content is email or SMS
  const isEmail = useMemo(() => {
    if (!threadText.trim()) return false;
    const emailIndicators = [
      /hey\s*[,!]?\s*(ben|dj|m10)/i,
      /hi\s*[,!]?\s*(ben|dj|m10)/i,
      /hello\s*[,!]?\s*(ben|dj|m10)/i,
      /spotify/i,
      /playlist/i,
      /ceremony\s*(is|at)/i,
      /grand\s*entrance/i,
      /grand\s*exit/i,
      /mariachi/i,
      /thank\s*you/i
    ];
    return emailIndicators.some(pattern => pattern.test(threadText));
  }, [threadText]);

  const parsedPreview: ParsedLeadThread | null = useMemo(() => {
    if (!threadText.trim() || isEmail) return null; // Skip SMS parsing for emails
    try {
      const parsed = parseLeadThread(threadText);
      // Initialize editable fields with parsed values
      if (parsed) {
        setEditableFields({
          firstName: parsed.contact.firstName || null,
          lastName: parsed.contact.lastName || null,
          email: parsed.contact.email || null,
          phone: parsed.contact.phoneE164 || parsed.contact.phoneDigits || null,
          eventType: parsed.contact.eventType || null,
          eventDate: parsed.contact.eventDate || null,
          venueName: parsed.contact.venueName || null,
          venueAddress: parsed.contact.venueAddress || null,
          eventTime: parsed.contact.eventTime || null,
          guestCount: parsed.contact.guestCount?.toString() || null,
          budgetRange: parsed.contact.budgetRange || null,
        });
      }
      return parsed;
    } catch (error) {
      console.error('Failed to parse lead thread', error);
      return null;
    }
  }, [threadText, isEmail]);

  // Get contactId from URL if on contact page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/\/admin\/contacts\/([^\/]+)/);
      if (pathMatch) {
        setContactId(pathMatch[1]);
      }
    }
  }, []);

  // Check for existing contact when thread is parsed (SMS only)
  useEffect(() => {
    if (!parsedPreview || !user || isEmail) return;
    
    const checkExisting = async () => {
      setCheckingExisting(true);
      try {
        const phone = parsedPreview.contact.phoneDigits || parsedPreview.contact.phoneE164;
        const email = parsedPreview.contact.email;
        
        if (!phone && !email) {
          setExistingContact(null);
          return;
        }

        const response = await fetch('/api/leads/check-existing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, email }),
        });

        if (response.ok) {
          const data = await response.json();
          setExistingContact(data.contact || null);
        }
      } catch (error) {
        console.error('Error checking existing contact:', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    const timeoutId = setTimeout(checkExisting, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [parsedPreview, user]);

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
      // For emails, we need a contactId - try to find it from existing contact or parsed preview
      let targetContactId = contactId;
      
      if (isEmail && !targetContactId) {
        // Try to find contact by email or phone from parsed preview
        if (parsedPreview?.contact.email) {
          const checkResponse = await fetch('/api/leads/check-existing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: parsedPreview.contact.email,
              phone: parsedPreview.contact.phoneE164 || parsedPreview.contact.phoneDigits 
            }),
          });
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            targetContactId = checkData.contact?.id;
          }
        }
        
        if (!targetContactId && existingContact) {
          targetContactId = existingContact.id;
        }
      }
      
      // Use editable fields if user has made changes
      const fieldsToUse = Object.keys(editableFields).length > 0 
        ? editableFields 
        : parsedPreview?.contact || {};
      
      const response = await fetch('/api/leads/import-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          thread: threadText,
          overrides: existingContact ? fieldsToUse : undefined, // Only send overrides for existing contacts
          contactId: targetContactId || undefined, // Include contactId for email imports
        }),
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
    // Show email preview if detected
    if (isEmail) {
      const spotifyLinks = threadText.match(/(?:spotify\.com|open\.spotify\.com)[^\s\)]+/gi) || [];
      const hasTimes = /(?:ceremony|grand entrance|grand exit)/i.test(threadText);
      const hasSpecialRequests = /(?:mariachi|break)/i.test(threadText);
      
      return (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Email Content Detected</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                We'll extract playlists, event times, and special requests from this email.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Spotify Playlists
              </p>
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {spotifyLinks.length > 0 ? `${spotifyLinks.length} playlist(s) found` : 'No playlists detected'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Event Times
              </p>
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {hasTimes ? 'Times detected' : 'No times detected'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Special Requests
              </p>
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {hasSpecialRequests ? 'Special requests detected' : 'No special requests'}
              </p>
            </div>
          </div>
          
          {!contactId && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              <p className="font-semibold">Note:</p>
              <p className="text-xs mt-1">
                To update an existing contact, please navigate to their contact page first, or we&apos;ll try to match by email/phone.
              </p>
            </div>
          )}
        </div>
      );
    }
    
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

        {existingContact && (
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100">
              <div className="flex items-start gap-2">
                <ClipboardCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Existing Contact Found</p>
                  <p className="text-xs">
                    {existingContact.first_name} {existingContact.last_name} • {existingContact.phone || existingContact.email_address}
                  </p>
                  <p className="mt-1 text-xs">
                    This will update the existing contact. Duplicate messages will be ignored, and new developments will be added.
                  </p>
                  <button
                    onClick={() => setShowFieldComparison(!showFieldComparison)}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    {showFieldComparison ? 'Hide' : 'Show'} field comparison
                  </button>
                </div>
              </div>
            </div>

            {showFieldComparison && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-900/40">
                <p className="mb-2 font-semibold text-amber-900 dark:text-amber-100">Field Comparison</p>
                <div className="space-y-2 text-xs">
                  <ComparisonField 
                    label="Venue" 
                    existing={existingContact.venue_name} 
                    detected={contact.venueName}
                    editable={editableFields.venueName || contact.venueName}
                    onChange={(value) => setEditableFields({...editableFields, venueName: value})}
                  />
                  <ComparisonField 
                    label="Event Date" 
                    existing={existingContact.event_date} 
                    detected={contact.eventDate}
                    editable={editableFields.eventDate || contact.eventDate}
                    onChange={(value) => setEditableFields({...editableFields, eventDate: value})}
                  />
                  <ComparisonField 
                    label="Event Type" 
                    existing={existingContact.event_type} 
                    detected={contact.eventType}
                    editable={editableFields.eventType || contact.eventType}
                    onChange={(value) => setEditableFields({...editableFields, eventType: value})}
                  />
                  <ComparisonField 
                    label="Venue Address" 
                    existing={existingContact.venue_address} 
                    detected={contact.venueAddress}
                    editable={editableFields.venueAddress || contact.venueAddress}
                    onChange={(value) => setEditableFields({...editableFields, venueAddress: value})}
                  />
                </div>
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  💡 Fields will only update if the detected value is more complete or if you edit them above.
                </p>
              </div>
            )}
          </div>
        )}

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
            <span className="hidden sm:inline">Import Conversation</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Conversation</DialogTitle>
            <DialogDescription>
              Paste SMS threads or email content. We will extract key details, create or update
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
                placeholder={`Paste SMS thread or email content here...\n\nSMS Example:\n+1 (901) 562-3974:\n  Hey, I got your number from Tay...\n\nEmail Example:\nHey, Ben! I have collected songs for the first dances...`}
                className="min-h-[160px] resize-vertical"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tip: For SMS, include the lead name, phone, email, event date, and venue. For emails, include playlists, event times, and special requests.
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

function ComparisonField({
  label,
  existing,
  detected,
  editable,
  onChange,
}: {
  label: string;
  existing: string | null;
  detected: string | null;
  editable: string | null;
  onChange: (value: string) => void;
}) {
  const existingValue = existing || '(not set)';
  const detectedValue = detected || '(not detected)';
  const isDifferent = existing && detected && existing.toLowerCase() !== detected.toLowerCase();
  
  return (
    <div className="space-y-1">
      <p className="font-medium text-amber-900 dark:text-amber-100">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Currently Saved:</p>
          <p className="text-xs bg-white dark:bg-zinc-900 rounded px-2 py-1 border border-amber-200 dark:border-amber-800">
            {existingValue}
          </p>
        </div>
        <div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Detected from Thread:</p>
          <input
            type="text"
            value={editable || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "text-xs w-full rounded px-2 py-1 border",
              isDifferent
                ? "border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/60"
                : "border-amber-200 bg-white dark:border-amber-800 dark:bg-zinc-900"
            )}
            placeholder={detectedValue}
          />
        </div>
      </div>
      {isDifferent && (
        <p className="text-xs text-amber-700 dark:text-amber-300 italic">
          ⚠️ Different from saved value - will keep existing unless you edit above
        </p>
      )}
    </div>
  );
}


