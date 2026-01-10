'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  IconRobot, 
  IconSend, 
  IconLoader2, 
  IconX, 
  IconSparkles,
  IconMessageCirclePlus,
  IconClipboardCheck,
  IconAlertCircle,
  IconEdit,
  IconCheck,
  IconFileUpload,
  IconKeyboard,
  IconClipboard,
  IconSettings,
  IconUser,
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconClock,
  IconMail,
  IconPhone,
  IconMusic,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconArrowRight,
  IconMicrophone,
  IconMicrophoneOff,
  IconQrcode,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import dayjs from 'dayjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/hooks/useUser';
import { parseLeadThread, ParsedLeadThread } from '@/utils/lead-thread-parser';
import { parseEmailContent, ParsedEmailData } from '@/utils/email-parser';
import { MessageContentRenderer } from './MessageContentRenderer';
import { isAdminEmail } from '@/utils/auth-helpers/admin-roles';
import { VoiceAssistant } from './VoiceAssistant';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { getCurrentOrganization } from '@/utils/organization-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Admin emails removed - now using centralized admin roles system
// See: utils/auth-helpers/admin-roles.ts

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | any; // Can be string or structured content
  timestamp?: string;
  functions_called?: Array<{ name: string; arguments: any }>;
}

type ImportStatus =
  | { state: 'idle' }
  | { state: 'processing'; step?: string }
  | { state: 'success'; message: string; contactId: string; action: 'created' | 'updated' }
  | { state: 'error'; message: string };

export default function FloatingAdminAssistant() {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assistant' | 'import'>('assistant');
  
  // Assistant state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your admin assistant. I can help you manage contacts, quotes, invoices, contracts, and more.\n\nTry asking me:\n• \"Show me all new leads from this week\"\n• \"Create a quote for contact ID...\"\n• \"Update Sarah Johnson's status to booked\"\n• \"What's on my dashboard today?\"",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  
  // Import state
  const [threadText, setThreadText] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ state: 'idle' });
  const [contactId, setContactId] = useState<string | null>(null);
  const [existingContact, setExistingContact] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [editableFields, setEditableFields] = useState<Record<string, string | null>>({});
  const [showFieldComparison, setShowFieldComparison] = useState(false);
  // Field update choices: 'update' | 'keep' | 'new' (new means field doesn't exist in existing contact)
  const [fieldUpdateChoices, setFieldUpdateChoices] = useState<Record<string, 'update' | 'keep' | 'new'>>({});
  
  // Enhanced import state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(true); // Default to showing comparison
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importOptions, setImportOptions] = useState({
    createProject: true,
    generateQuote: true,
    generateInvoice: true,
    generateContract: true,
    leadSource: 'Conversation Import',
    leadStatus: 'New',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [emailExtractedData, setEmailExtractedData] = useState<ParsedEmailData | null>(null);
  const [parsingEmail, setParsingEmail] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!threadText.trim() || isEmail) return null;
    try {
      const parsed = parseLeadThread(threadText);
      if (parsed) {
        const initialFields = {
          firstName: parsed.contact.firstName || null,
          lastName: parsed.contact.lastName || null,
          email: parsed.contact.email || null,
          phone: parsed.contact.phoneE164 || parsed.contact.phoneDigits || null,
          eventType: parsed.contact.eventType || null,
          eventDate: parsed.contact.eventDate || null,
          venueName: parsed.contact.venueName || null,
          venueAddress: parsed.contact.venueAddress || null,
          eventTime: parsed.contact.eventTime || null,
          endTime: parsed.contact.endTime || null,
          guestCount: parsed.contact.guestCount?.toString() || null,
          budgetRange: parsed.contact.budgetRange || null,
        };
        // Only update if editableFields is empty (initial load) or if thread text changed significantly
        const hasNoFields = Object.values(editableFields).every(v => !v);
        if (hasNoFields) {
          setEditableFields(initialFields);
        }
      }
      return parsed;
    } catch (error) {
      console.error('Failed to parse lead thread', error);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadText, isEmail]);

  // Parse email content
  useEffect(() => {
    if (isEmail && threadText.trim()) {
      setParsingEmail(true);
      try {
        const extracted = parseEmailContent(threadText);
        setEmailExtractedData(extracted);
      } catch (error) {
        console.error('Failed to parse email:', error);
        setEmailExtractedData(null);
      } finally {
        setParsingEmail(false);
      }
    } else {
      setEmailExtractedData(null);
    }
  }, [isEmail, threadText]);

  // Auto-expand comparison when data is detected (moved after parsedPreview is defined)
  useEffect(() => {
    if ((parsedPreview || emailExtractedData || Object.keys(editableFields).length > 0) && !showComparison) {
      setShowComparison(true);
    }
  }, [parsedPreview, emailExtractedData, editableFields, showComparison]);

  // Validation
  const validateFields = useCallback(() => {
    const errors: Record<string, string> = {};
    const fields = editableFields;

    // Email validation
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation (basic)
    if (fields.phone && fields.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Phone number must include area code';
    }

    // Date validation
    if (fields.eventDate) {
      const date = new Date(fields.eventDate);
      if (isNaN(date.getTime())) {
        errors.eventDate = 'Invalid date format';
      }
    }

    // Time validation
    if (fields.eventTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]/.test(fields.eventTime)) {
      errors.eventTime = 'Invalid time format (use HH:MM)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editableFields]);

  useEffect(() => {
    if (Object.keys(editableFields).length > 0) {
      validateFields();
    }
  }, [editableFields, validateFields]);

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setThreadText(text);
        setInputMode('paste');
        toast({
          title: "Content pasted",
          description: "Content from clipboard has been loaded",
        });
        // Focus textarea after a brief delay
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(text.length, text.length);
        }, 100);
      } else {
        toast({
          title: "Clipboard empty",
          description: "No text found in clipboard",
          variant: "destructive"
        });
      }
    } catch (err) {
      // Fallback: focus textarea and let user paste manually
      textareaRef.current?.focus();
      toast({
        title: "Paste ready",
        description: "Textarea focused - use Ctrl/Cmd+V to paste",
      });
    }
  }, [toast]);

  // Handle paste events in textarea
  const handleTextareaPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Auto-detect paste and switch to paste mode
    setInputMode('paste');
  }, []);

  // File upload handlers
  const handleFileUpload = useCallback(async (file: File) => {
    const text = await file.text();
    setThreadText(text);
    setInputMode('upload');
    toast({
      title: "File loaded",
      description: `Loaded content from ${file.name}`,
    });
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.eml'))) {
      handleFileUpload(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a text file (.txt) or email file (.eml)",
        variant: "destructive"
      });
    }
  }, [handleFileUpload, toast]);

  // Field editor component
  const updateField = useCallback((key: string, value: string) => {
    setEditableFields(prev => ({ ...prev, [key]: value || null }));
    setEditingField(null);
  }, []);

  const FieldEditor = ({ fieldKey, label, value, type = 'text', options }: {
    fieldKey: string;
    label: string;
    value: string | null;
    type?: 'text' | 'date' | 'time' | 'select' | 'email' | 'tel';
    options?: string[];
  }) => {
    const isEditing = editingField === fieldKey;
    const hasError = validationErrors[fieldKey];

    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => updateField(fieldKey, val)}
            onOpenChange={(open) => !open && setEditingField(null)}
          >
            <SelectTrigger className={cn(
              "h-8 text-sm",
              hasError && "border-red-500"
            )}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {opt.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Input
            type={type === 'date' ? 'date' : type === 'time' ? 'time' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => setEditableFields(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                updateField(fieldKey, e.currentTarget.value);
              }
              if (e.key === 'Escape') {
                setEditingField(null);
              }
            }}
            className={cn(
              "h-8 text-sm",
              hasError && "border-red-500"
            )}
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingField(null)}
            className="h-8 w-8 p-0"
          >
            <IconX className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateField(fieldKey, editableFields[fieldKey] || '')}
            className="h-8 w-8 p-0"
          >
            <IconCheck className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="group flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
        <span className={cn(
          "flex-1",
          !value && "text-zinc-400 italic"
        )}>
          {value || `Not detected`}
          {hasError && (
            <span className="ml-2 text-red-500 text-xs">⚠️ {hasError}</span>
          )}
        </span>
        <button
          onClick={() => setEditingField(fieldKey)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
        >
          <IconEdit className="h-3 w-3" />
        </button>
      </div>
    );
  };

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
          setFieldUpdateChoices({});
          return;
        }

        const response = await fetch('/api/leads/check-existing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, email }),
        });

        if (response.ok) {
          const data = await response.json();
          const contact = data.contact || null;
          setExistingContact(contact);
          
          // Initialize field update choices
          if (contact) {
            const choices: Record<string, 'update' | 'keep' | 'new'> = {};
            const detectedFields = {
              firstName: editableFields.firstName || parsedPreview.contact.firstName,
              lastName: editableFields.lastName || parsedPreview.contact.lastName,
              email: editableFields.email || parsedPreview.contact.email,
              phone: editableFields.phone || parsedPreview.contact.phoneE164 || parsedPreview.contact.phoneDigits,
              eventType: editableFields.eventType || parsedPreview.contact.eventType,
              eventDate: editableFields.eventDate || parsedPreview.contact.eventDate,
              venueName: editableFields.venueName || parsedPreview.contact.venueName,
              venueAddress: editableFields.venueAddress || parsedPreview.contact.venueAddress,
              eventTime: editableFields.eventTime || parsedPreview.contact.eventTime,
              endTime: editableFields.endTime || parsedPreview.contact.endTime,
              guestCount: editableFields.guestCount || parsedPreview.contact.guestCount?.toString(),
              budgetRange: editableFields.budgetRange || parsedPreview.contact.budgetRange,
            };
            
            // For each detected field, check if it exists in existing contact
            Object.entries(detectedFields).forEach(([key, detectedValue]) => {
              if (detectedValue) {
                const existingValue = contact[getContactFieldName(key)] || contact[key];
                if (existingValue) {
                  // Field exists - default to 'keep' (user can change to 'update')
                  choices[key] = 'keep';
                } else {
                  // Field doesn't exist - it's new
                  choices[key] = 'new';
                }
              }
            });
            
            setFieldUpdateChoices(choices);
          } else {
            setFieldUpdateChoices({});
          }
        }
      } catch (error) {
        console.error('Error checking existing contact:', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    const timeoutId = setTimeout(checkExisting, 500);
    return () => clearTimeout(timeoutId);
  }, [parsedPreview, user, isEmail, editableFields]);

  // Helper to map field keys to contact database field names
  const getContactFieldName = (fieldKey: string): string => {
    const mapping: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email_address',
      phone: 'phone',
      eventType: 'event_type',
      eventDate: 'event_date',
      venueName: 'venue_name',
      venueAddress: 'venue_address',
      eventTime: 'event_time',
      endTime: 'end_time',
      guestCount: 'guest_count',
      budgetRange: 'budget_range',
    };
    return mapping[fieldKey] || fieldKey;
  };

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Helper function to send a message
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const trimmedContent = messageContent.trim();
    setInput('');
    setIsLoading(true);

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: trimmedContent }
    ];

    try {
      const response = await fetch('/api/admin-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmedContent,
          conversationHistory: updatedHistory.slice(-10)
        })
      });

      if (!response.ok) {
        // Try to parse JSON error response
        let errorMessage = `Server error: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // If not JSON, read as text to see if there's useful info
            const text = await response.text();
            // Try to extract error message from HTML error page if possible
            const jsonMatch = text.match(/"message":"([^"]+)"/);
            if (jsonMatch) {
              errorMessage = jsonMatch[1];
            } else {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
          }
        } catch (parseError) {
          // If parsing fails, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        functions_called: data.functions_called || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: assistantMessage.content }
      ]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check your connection.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to get response from assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Assistant handlers
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
  };

  // Handle voice transcription
  const handleVoiceTranscription = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    // Send transcribed text as a message
    await sendMessage(text);
    
    // Show feedback
    toast({
      title: "Voice command received",
      description: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    });
  }, [isLoading, sendMessage, toast]);

  // Import handlers
  const handleImport = useCallback(async () => {
    if (!threadText.trim()) return;

    // Validate fields before importing
    if (!validateFields()) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors before importing",
        variant: "destructive"
      });
      return;
    }

    setImportStatus({ state: 'processing', step: 'Parsing thread...' });

    try {
      let targetContactId = contactId;
      
      setImportStatus({ state: 'processing', step: 'Checking for existing contact...' });
      
      if (isEmail && !targetContactId) {
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
      
      // Build fieldsToUse based on fieldUpdateChoices
      // Only include fields marked as 'update' or 'new'
      const fieldsToUse: Record<string, any> = {};
      const allDetectedFields = {
        firstName: editableFields.firstName || parsedPreview?.contact.firstName,
        lastName: editableFields.lastName || parsedPreview?.contact.lastName,
        email: editableFields.email || parsedPreview?.contact.email,
        phone: editableFields.phone || parsedPreview?.contact.phoneE164 || parsedPreview?.contact.phoneDigits,
        eventType: editableFields.eventType || parsedPreview?.contact.eventType,
        eventDate: editableFields.eventDate || parsedPreview?.contact.eventDate,
        venueName: editableFields.venueName || parsedPreview?.contact.venueName,
        venueAddress: editableFields.venueAddress || parsedPreview?.contact.venueAddress,
        eventTime: editableFields.eventTime || parsedPreview?.contact.eventTime,
        endTime: editableFields.endTime || parsedPreview?.contact.endTime,
        guestCount: editableFields.guestCount || parsedPreview?.contact.guestCount?.toString(),
        budgetRange: editableFields.budgetRange || parsedPreview?.contact.budgetRange,
      };
      
      // Only include fields that should be updated
      Object.entries(allDetectedFields).forEach(([key, value]) => {
        const choice = fieldUpdateChoices[key];
        if (value && (choice === 'update' || choice === 'new')) {
          fieldsToUse[key] = value;
        }
      });
      
      setImportStatus({ state: 'processing', step: 'Importing contact data...' });
      
      const response = await fetch('/api/leads/import-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          thread: threadText,
          overrides: existingContact && Object.keys(fieldsToUse).length > 0 ? fieldsToUse : undefined,
          contactId: targetContactId || undefined,
          leadSource: importOptions.leadSource,
          leadStatus: importOptions.leadStatus,
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

      setImportStatus({
        state: 'success',
        message:
          payload.action === 'created'
            ? 'New lead created successfully.'
            : 'Existing lead updated with thread details.',
        contactId: payload.contactId,
        action: payload.action,
      });
      setThreadText('');
      setEditableFields({});
      setEmailExtractedData(null);
      setFieldUpdateChoices({});
    } catch (error: any) {
      setImportStatus({
        state: 'error',
        message: error?.message || 'Something went wrong while importing the lead.',
      });
    }
  }, [threadText, validateFields, toast, contactId, isEmail, parsedPreview, existingContact, editableFields, importOptions, fieldUpdateChoices]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'assistant') {
        handleSend();
      }
    }
  };

  // Keyboard shortcuts for import tab
  useEffect(() => {
    if (activeTab !== 'import') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to import
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (threadText.trim() && importStatus.state !== 'processing') {
          handleImport();
        }
      }
      // Escape to cancel editing
      if (e.key === 'Escape' && editingField) {
        setEditingField(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, threadText, editingField, importStatus.state, handleImport]);

  const handleClose = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setThreadText('');
      setImportStatus({ state: 'idle' });
      setEditableFields({});
      setEmailExtractedData(null);
      setFieldUpdateChoices({});
      setEditingField(null);
      setShowComparison(true);
      setShowImportOptions(false);
      setShowHelp(false);
      setValidationErrors({});
    }
  }, []);

  // Global ESC key handler to close assistant
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingField) {
        e.preventDefault();
        handleClose(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, editingField, handleClose]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isTipJarAdmin, setIsTipJarAdmin] = useState(false);
  
  // QR Scan Count Modal State
  const [qrScanModalOpen, setQrScanModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [loadingScanCount, setLoadingScanCount] = useState(false);
  
  // Check admin status and TipJar context using centralized admin roles system
  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.email) {
        const adminStatus = await isAdminEmail(user.email);
        setIsAdmin(adminStatus);
        
        // Check if user is a TipJar admin
        const supabase = createClientComponentClient();
        const org = await getCurrentOrganization(supabase);
        const isTipJar = user.user_metadata?.product_context === 'tipjar' || org?.product_context === 'tipjar';
        setIsTipJarAdmin(isTipJar && adminStatus);
      } else {
        setIsAdmin(false);
        setIsTipJarAdmin(false);
      }
    };
    if (!loading) {
      checkAdmin();
    }
  }, [user?.email, user?.user_metadata, loading]);

  // Fetch QR scan count
  const fetchQRScanCount = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Date Range Required',
        description: 'Please select both start and end dates.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingScanCount(true);
    setScanCount(null);

    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const response = await fetch(
        `/api/qr-scan/count?startDate=${startDateStr}&endDate=${endDateStr}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch scan count');
      }

      const data = await response.json();
      setScanCount(data.count);
    } catch (error: any) {
      console.error('Error fetching QR scan count:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch QR scan count',
        variant: 'destructive',
      });
    } finally {
      setLoadingScanCount(false);
    }
  };

  // Handle opening QR scan modal
  const handleOpenQRScanModal = () => {
    setQrScanModalOpen(true);
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
    setScanCount(null);
  };

  if (loading) return null;
  if (!isAdmin) return null;

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <button
            onClick={() => setOpen(true)}
            className="group flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            aria-label="Open Admin Assistant"
          >
            <div className="rounded-full bg-white/10 p-2 transition group-hover:bg-white/20">
              <IconRobot className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="hidden sm:inline">Assistant</span>
          </button>
        </div>
      )}

      {/* Full-screen ChatGPT-style interface */}
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-zinc-900">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => handleClose(false)}
                className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close Admin Assistant"
                title="Close (ESC)"
              >
                <IconX className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex-shrink-0">
                  <IconRobot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Admin Assistant</h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('assistant')}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm",
                  activeTab === 'assistant' && "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                <IconRobot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('import')}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm",
                  activeTab === 'import' && "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                <IconMessageCirclePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Only show for assistant tab, hidden on mobile */}
            {activeTab === 'assistant' && (
              <div className="hidden lg:block w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 overflow-y-auto">
                <div className="space-y-4">
                <div>
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                      Quick Actions
                    </h3>
                    <div className="space-y-1">
                      {/* Daily Overview */}
                      <button
                        onClick={() => sendMessage("What's on my dashboard today?")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        📈 Today's Dashboard
                      </button>
                      
                      {/* Leads & Opportunities */}
                      <button
                        onClick={() => sendMessage("Show me all new leads from this week")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        📊 New Leads This Week
                      </button>
                      <button
                        onClick={() => sendMessage("Show me all booked events")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        ✅ Booked Events
                      </button>
                      
                      {/* Upcoming & Action Items */}
                      <button
                        onClick={() => sendMessage("What events are coming up this week?")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        📅 Upcoming Events
                      </button>
                      <button
                        onClick={() => sendMessage("Show me leads that need follow-up")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        🔔 Follow-ups Needed
                      </button>
                      
                      {/* Revenue & Analytics */}
                      <button
                        onClick={() => sendMessage("What's my revenue this month?")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        💰 Monthly Revenue
                      </button>
                      
                      {/* Song Requests */}
                      <button
                        onClick={() => sendMessage("Show me recent song requests")}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        🎵 Song Requests
                      </button>
                      
                      {/* TipJar QR Scan Count - Only visible for TipJar admins */}
                      {isTipJarAdmin && (
                        <button
                          onClick={handleOpenQRScanModal}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                        >
                          📱 QR Code Scans
                        </button>
                      )}
                      
                      {/* Tools */}
                      <button
                        onClick={() => setActiveTab('import')}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        📥 Import Conversation
                      </button>
                </div>
              </div>
            </div>
              </div>
            )}

            {/* Chat/Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeTab === 'assistant' ? (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6" ref={scrollRef}>
                    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3 items-end",
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.role === 'assistant' && (
                            <Avatar className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0 ring-2 ring-zinc-200 dark:ring-zinc-700">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                <IconRobot className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={cn(
                            "flex flex-col",
                            message.role === 'user' 
                              ? 'items-end max-w-[85%] sm:max-w-[80%] md:max-w-[75%]' 
                              : 'items-start max-w-[90%] sm:max-w-[85%] md:max-w-[90%] lg:max-w-[95%]'
                          )}>
                            <div className={cn(
                              "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm transition-shadow w-full",
                              message.role === 'user'
                                ? "bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white rounded-br-md shadow-md shadow-purple-500/20"
                                : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-md shadow-sm"
                            )}>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base">
                                <MessageContentRenderer
                                  content={message.content}
                                  timestamp={message.timestamp}
                                  functionsCalled={message.functions_called}
                                  onNavigate={() => handleClose(false)}
                                  onSendMessage={sendMessage}
                                />
                              </div>
                            </div>
                            {message.timestamp && (
                              <span className={cn(
                                "text-xs mt-1.5 px-2",
                                message.role === 'user' 
                                  ? "text-zinc-500 dark:text-zinc-400" 
                                  : "text-zinc-400 dark:text-zinc-500"
                              )}>
                                {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>

                          {message.role === 'user' && (
                            <Avatar className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0 ring-2 ring-purple-200 dark:ring-purple-900">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                                {user?.email ? (
                                  <span className="text-xs sm:text-sm">
                                    {user.email.charAt(0).toUpperCase()}
                                  </span>
                                ) : (
                                  <IconUser className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex gap-3 sm:gap-4 justify-start">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                              <IconRobot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
                            <div className="flex items-center gap-2">
                              <IconLoader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-zinc-500" />
                              <span className="text-xs sm:text-sm text-zinc-500">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Quick Actions - Only show on mobile, above input */}
                  {activeTab === 'assistant' && (
                    <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
                      <div className="max-w-3xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory">
                          <button
                            onClick={() => sendMessage("What's on my dashboard today?")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            📈 Dashboard
                          </button>
                          <button
                            onClick={() => sendMessage("Show me all new leads from this week")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            📊 New Leads
                          </button>
                          <button
                            onClick={() => sendMessage("Show me all booked events")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            ✅ Booked
                          </button>
                          <button
                            onClick={() => sendMessage("What events are coming up this week?")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            📅 Upcoming
                          </button>
                          <button
                            onClick={() => sendMessage("Show me leads that need follow-up")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            🔔 Follow-ups
                          </button>
                          <button
                            onClick={() => sendMessage("What's my revenue this month?")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            💰 Revenue
                          </button>
                          <button
                            onClick={() => sendMessage("Show me recent song requests")}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            🎵 Requests
                          </button>
                          {isTipJarAdmin && (
                            <button
                              onClick={handleOpenQRScanModal}
                              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                            >
                              📱 QR Scans
                            </button>
                          )}
                          <button
                            onClick={() => setActiveTab('import')}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors"
                          >
                            📥 Import
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 sm:px-4 py-3 sm:py-4">
                    <div className="max-w-3xl mx-auto">
                      {/* Voice Assistant Toggle */}
                      {user && (
                        <div className="mb-2 flex items-center justify-center gap-2">
                          <Button
                            onClick={() => setVoiceMode(!voiceMode)}
                            variant={voiceMode ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                          >
                            {voiceMode ? (
                              <>
                                <IconMicrophone className="h-3 w-3 mr-1" />
                                Voice Active
                              </>
                            ) : (
                              <>
                                <IconMicrophoneOff className="h-3 w-3 mr-1" />
                                Use Voice
                              </>
                            )}
                          </Button>
                          {voiceMode && (
                            <VoiceAssistant
                              userId={user.id}
                              userEmail={user.email}
                              onTranscription={handleVoiceTranscription}
                              onError={(error) => {
                                toast({
                                  title: "Voice Error",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              }}
                            />
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2 sm:gap-3 items-end">
                        <div className="flex-1 relative">
                          <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Message Admin Assistant..."
                            className="min-h-[48px] sm:min-h-[52px] max-h-[150px] sm:max-h-[200px] resize-none pr-11 sm:pr-12 rounded-xl border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                            disabled={isLoading}
                            rows={1}
                          />
                        </div>
                        <Button
                          onClick={handleSend}
                          disabled={!input.trim() || isLoading}
                          size="lg"
                          className="h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 p-0 flex-shrink-0"
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          ) : (
                            <IconSend className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 sm:mt-2 text-center hidden sm:block">
                        Press Enter to send, Shift+Enter for new line
                        {voiceMode && ' • Voice mode active - speak your commands'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Import Tab Content */}
                  <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
                    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                  {/* Progress Steps */}
                  {importStatus.state === 'processing' && (
                    <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Processing import...
                      </div>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <div className="flex items-center gap-2">
                          <IconCheck className="h-3 w-3" />
                          <span>Parsing thread...</span>
                        </div>
                        {importStatus.step && (
                          <div className="flex items-center gap-2">
                            <IconLoader2 className="h-3 w-3 animate-spin" />
                            <span>{importStatus.step}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {importStatus.state === 'error' && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100">
                      <IconAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <p className="whitespace-pre-wrap break-words">{importStatus.message}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {importStatus.state === 'success' && (
                    <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <IconClipboardCheck className="h-4 w-4" />
                        {importStatus.message}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
                          Action: {importStatus.action === 'created' ? 'New Lead Created' : 'Lead Updated'}
                        </p>
                        <Link
                          href={`/admin/contacts/${importStatus.contactId}`}
                          className="text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-200"
                          onClick={() => setOpen(false)}
                        >
                          View Contact →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Input Method Toggle */}
                  <div className="flex gap-2 mb-3 sm:mb-4">
                    <Button
                      type="button"
                      variant={inputMode === 'paste' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setInputMode('paste');
                        setTimeout(() => textareaRef.current?.focus(), 100);
                      }}
                      className="flex-1 min-h-[40px] text-xs sm:text-sm"
                    >
                      <IconClipboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Paste Text
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setInputMode('upload');
                        fileInputRef.current?.click();
                      }}
                      className="flex-1 min-h-[40px] text-xs sm:text-sm"
                    >
                      <IconFileUpload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Upload File
                    </Button>
                  </div>

                  {/* File Upload Area - Only show when upload mode */}
                  {inputMode === 'upload' && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors mb-3 sm:mb-4",
                      "hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.eml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <IconFileUpload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-zinc-400" />
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                      Drag and drop a file here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Supports .txt and .eml files
                    </p>
                  </div>
                  )}

                  {/* Thread Input */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Conversation Transcript
                      </label>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {inputMode === 'paste' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePaste}
                            className="h-8 sm:h-7 text-xs px-2 sm:px-3"
                          >
                            <IconClipboard className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Paste from Clipboard</span>
                            <span className="sm:hidden">Paste</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHelp(!showHelp)}
                          className="h-8 sm:h-7 text-xs px-2 sm:px-3"
                        >
                          <IconKeyboard className="h-3 w-3 mr-1" />
                          Help
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setThreadText('');
                            setEditableFields({});
                            setFieldUpdateChoices({});
                            setEmailExtractedData(null);
                          }}
                          className="h-8 sm:h-7 text-xs px-2 sm:px-3"
                          disabled={!threadText.trim()}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      ref={textareaRef}
                      value={threadText}
                      onChange={(event) => setThreadText(event.target.value)}
                      onPaste={handleTextareaPaste}
                      placeholder={inputMode === 'paste' 
                        ? `Paste SMS thread or email content here (Ctrl/Cmd+V)...\n\nSMS Example:\n+1 (901) 562-3974:\n  Hey, I got your number from Tay...\n\nEmail Example:\nHey, Ben! I have collected songs for the first dances...`
                        : `Paste SMS thread or email content here...\n\nSMS Example:\n+1 (901) 562-3974:\n  Hey, I got your number from Tay...\n\nEmail Example:\nHey, Ben! I have collected songs for the first dances...`
                      }
                      className="min-h-[200px] sm:min-h-[250px] resize-vertical font-mono text-xs sm:text-sm"
                    />
                    {showHelp && (
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <CardContent className="pt-4 text-xs space-y-2">
                          <p className="font-semibold">Keyboard Shortcuts:</p>
                          <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                            <li><kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 rounded text-xs">Cmd/Ctrl + Enter</kbd> - Import thread</li>
                            <li><kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 rounded text-xs">Esc</kbd> - Cancel editing</li>
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tip: For SMS, include the lead name, phone, email, event date, and venue. For emails, include playlists, event times, and special requests.
                    </p>
                  </div>

                  {/* Structured Data Comparison - Shows all detected fields with update/keep options - MOVED TO TOP FOR VISIBILITY */}
                  {(parsedPreview || emailExtractedData || Object.keys(editableFields).length > 0) && (
                    <Card className="border-blue-200 dark:border-blue-900 mb-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconSparkles className="h-4 w-4 text-blue-600" />
                            <CardTitle className="text-sm">Detected Structured Data</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {Object.keys(fieldUpdateChoices).filter(k => fieldUpdateChoices[k] === 'update' || fieldUpdateChoices[k] === 'new').length} fields to update
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowComparison(!showComparison)}
                          >
                            {showComparison ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          Review detected data and choose which fields to update or keep
                        </CardDescription>
                      </CardHeader>
                      {showComparison && (
                        <CardContent className="space-y-4">
                          {/* Field comparison list - will be populated below */}
                          {(() => {
                            const allFields = [
                              { key: 'firstName', label: 'First Name', icon: IconUser, existing: existingContact?.first_name },
                              { key: 'lastName', label: 'Last Name', icon: IconUser, existing: existingContact?.last_name },
                              { key: 'email', label: 'Email', icon: IconMail, existing: existingContact?.email_address },
                              { key: 'phone', label: 'Phone', icon: IconPhone, existing: existingContact?.phone },
                              { key: 'eventType', label: 'Event Type', icon: IconCalendar, existing: existingContact?.event_type },
                              { key: 'eventDate', label: 'Event Date', icon: IconCalendar, existing: existingContact?.event_date ? dayjs(existingContact.event_date).format('YYYY-MM-DD') : null },
                              { key: 'eventTime', label: 'Start Time', icon: IconClock, existing: existingContact?.event_time },
                              { key: 'endTime', label: 'End Time', icon: IconClock, existing: existingContact?.end_time },
                              { key: 'venueName', label: 'Venue Name', icon: IconMapPin, existing: existingContact?.venue_name },
                              { key: 'venueAddress', label: 'Venue Address', icon: IconMapPin, existing: existingContact?.venue_address },
                              { key: 'guestCount', label: 'Guest Count', icon: IconUsers, existing: existingContact?.guest_count?.toString() },
                              { key: 'budgetRange', label: 'Budget Range', icon: IconSettings, existing: existingContact?.budget_range },
                            ];

                            const detectedFields = allFields.map(field => {
                              // Priority: editableFields > parsedPreview > emailExtractedData
                              let detectedValue = editableFields[field.key];
                              if (!detectedValue && parsedPreview?.contact) {
                                detectedValue = (parsedPreview.contact as any)[field.key];
                              }
                              if (!detectedValue && emailExtractedData) {
                                // Map email-specific fields
                                if (field.key === 'eventTime' && emailExtractedData.grandEntrance) {
                                  detectedValue = emailExtractedData.grandEntrance;
                                } else if (field.key === 'endTime' && emailExtractedData.grandExit) {
                                  detectedValue = emailExtractedData.grandExit;
                                } else {
                                  detectedValue = (emailExtractedData as any)[field.key];
                                }
                              }
                              return { ...field, detected: detectedValue || null };
                            }).filter(f => {
                              // Show ALL fields that have either detected OR existing value (or both) for complete comparison
                              return f.detected || f.existing;
                            });

                            if (detectedFields.length === 0) {
                              return (
                                <div className="text-center py-8 text-sm text-zinc-500">
                                  No structured data detected yet. Continue typing or paste more content.
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-3">
                                {detectedFields.map((field) => {
                                  const Icon = field.icon;
                                  const detectedValue = field.detected;
                                  const existingValue = field.existing;
                                  const hasConflict = existingValue && detectedValue && existingValue !== detectedValue;
                                  const choice = fieldUpdateChoices[field.key] || (existingValue ? 'keep' : 'new');
                                  const isNew = !existingValue && detectedValue;

                                  const valuesMatch = existingValue && detectedValue && existingValue === detectedValue;
                                  
                                  return (
                                    <div
                                      key={field.key}
                                      className={cn(
                                        "rounded-lg border p-3 transition-colors",
                                        hasConflict && choice === 'update' && "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20",
                                        hasConflict && choice === 'keep' && "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
                                        isNew && choice === 'new' && "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
                                        valuesMatch && "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20",
                                        !hasConflict && !isNew && !valuesMatch && "border-zinc-200 dark:border-zinc-800"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-3">
                                            <Icon className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                                              {field.label}
                                            </label>
                                            {isNew && (
                                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                                New
                                              </Badge>
                                            )}
                                            {hasConflict && (
                                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                                                Different
                                              </Badge>
                                            )}
                                            {valuesMatch && (
                                              <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                                Match
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* Side-by-side comparison */}
                                          <div className="grid grid-cols-2 gap-3">
                                            {/* Existing/Current Value Column */}
                                            <div className="space-y-1">
                                              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                Current Value
                                              </div>
                                              <div className={cn(
                                                "text-sm rounded px-2 py-2 min-h-[2.5rem] flex items-center",
                                                existingValue 
                                                  ? (valuesMatch 
                                                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 font-medium border border-emerald-300 dark:border-emerald-700"
                                                      : choice === 'keep' 
                                                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 font-medium border border-blue-300 dark:border-blue-700"
                                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700")
                                                  : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 italic border border-zinc-200 dark:border-zinc-700"
                                              )}>
                                                {existingValue || 'Not set'}
                                              </div>
                                            </div>

                                            {/* Detected/Imported Value Column */}
                                            <div className="space-y-1">
                                              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Imported Value
                                              </div>
                                              <div className={cn(
                                                "text-sm rounded px-2 py-2 min-h-[2.5rem] flex items-center",
                                                detectedValue
                                                  ? (valuesMatch
                                                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 font-medium border border-emerald-300 dark:border-emerald-700"
                                                      : (choice === 'update' || choice === 'new')
                                                        ? "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200 font-medium border border-green-300 dark:border-green-700"
                                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700")
                                                  : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 italic border border-zinc-200 dark:border-zinc-700"
                                              )}>
                                                {detectedValue || 'Not detected'}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Update/Keep toggle */}
                                        {existingValue && detectedValue && hasConflict && (
                                          <div className="flex flex-col gap-1 flex-shrink-0">
                                            <Button
                                              size="sm"
                                              variant={choice === 'update' ? 'default' : 'outline'}
                                              onClick={() => setFieldUpdateChoices(prev => ({ ...prev, [field.key]: 'update' }))}
                                              className={cn(
                                                "h-7 px-2 text-xs",
                                                choice === 'update' && "bg-green-600 hover:bg-green-700 text-white"
                                              )}
                                            >
                                              <IconRefresh className="h-3 w-3 mr-1" />
                                              Update
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant={choice === 'keep' ? 'default' : 'outline'}
                                              onClick={() => setFieldUpdateChoices(prev => ({ ...prev, [field.key]: 'keep' }))}
                                              className={cn(
                                                "h-7 px-2 text-xs",
                                                choice === 'keep' && "bg-blue-600 hover:bg-blue-700 text-white"
                                              )}
                                            >
                                              <IconCheck className="h-3 w-3 mr-1" />
                                              Keep
                                            </Button>
                                          </div>
                                        )}
                                        {isNew && (
                                          <Badge className="bg-green-600 text-white text-xs">
                                            Will Add
                                          </Badge>
                                        )}
                                        {valuesMatch && (
                                          <Badge className="bg-emerald-600 text-white text-xs">
                                            Same
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Existing contact link */}
                          {existingContact && (
                            <div className="pt-3 border-t">
                              <Link
                                href={`/admin/contacts/${existingContact.id}`}
                                className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                              >
                                <IconUser className="h-3 w-3" />
                                View full contact details →
                              </Link>
                            </div>
                          )}

                          {/* Quick actions */}
                          {existingContact && Object.keys(fieldUpdateChoices).length > 0 && (
                            <div className="pt-3 border-t flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const allChoices: Record<string, 'update' | 'keep' | 'new'> = {};
                                  Object.keys(fieldUpdateChoices).forEach(key => {
                                    allChoices[key] = 'update';
                                  });
                                  setFieldUpdateChoices(allChoices);
                                }}
                                className="text-xs"
                              >
                                Update All
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const allChoices: Record<string, 'update' | 'keep' | 'new'> = {};
                                  Object.keys(fieldUpdateChoices).forEach(key => {
                                    if (fieldUpdateChoices[key] !== 'new') {
                                      allChoices[key] = 'keep';
                                    } else {
                                      allChoices[key] = 'new';
                                    }
                                  });
                                  setFieldUpdateChoices(allChoices);
                                }}
                                className="text-xs"
                              >
                                Keep All
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* SMS Preview - Enhanced with all fields */}
                  {parsedPreview && !isEmail && (
                    <Card className="border-blue-200 dark:border-blue-900">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                              <IconSparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">Detected Details</CardTitle>
                              <CardDescription className="text-xs">
                                Click any field to edit before importing
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (parsedPreview) {
                                setEditableFields({
                                  firstName: parsedPreview.contact.firstName || null,
                                  lastName: parsedPreview.contact.lastName || null,
                                  email: parsedPreview.contact.email || null,
                                  phone: parsedPreview.contact.phoneE164 || parsedPreview.contact.phoneDigits || null,
                                  eventType: parsedPreview.contact.eventType || null,
                                  eventDate: parsedPreview.contact.eventDate || null,
                                  venueName: parsedPreview.contact.venueName || null,
                                  venueAddress: parsedPreview.contact.venueAddress || null,
                                  eventTime: parsedPreview.contact.eventTime || null,
                                  endTime: parsedPreview.contact.endTime || null,
                                  guestCount: parsedPreview.contact.guestCount?.toString() || null,
                                  budgetRange: parsedPreview.contact.budgetRange || null,
                                });
                              }
                            }}
                            className="text-xs"
                          >
                            Reset
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Contact Info Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                            <IconUser className="h-3 w-3" />
                            Contact Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                                First Name
                              </label>
                              <FieldEditor
                                fieldKey="firstName"
                                label="First Name"
                                value={editableFields.firstName}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                                Last Name
                              </label>
                              <FieldEditor
                                fieldKey="lastName"
                                label="Last Name"
                                value={editableFields.lastName}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconMail className="h-3 w-3" />
                                Email
                              </label>
                              <FieldEditor
                                fieldKey="email"
                                label="Email"
                                value={editableFields.email}
                                type="email"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconPhone className="h-3 w-3" />
                                Phone
                              </label>
                              <FieldEditor
                                fieldKey="phone"
                                label="Phone"
                                value={editableFields.phone}
                                type="tel"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Event Details Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                            <IconCalendar className="h-3 w-3" />
                            Event Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                                Event Type
                              </label>
                              <FieldEditor
                                fieldKey="eventType"
                                label="Event Type"
                                value={editableFields.eventType}
                                type="select"
                                options={['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconCalendar className="h-3 w-3" />
                                Event Date
                              </label>
                              <FieldEditor
                                fieldKey="eventDate"
                                label="Event Date"
                                value={editableFields.eventDate}
                                type="date"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconClock className="h-3 w-3" />
                                Start Time
                              </label>
                              <FieldEditor
                                fieldKey="eventTime"
                                label="Start Time"
                                value={editableFields.eventTime}
                                type="time"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconClock className="h-3 w-3" />
                                End Time
                              </label>
                              <FieldEditor
                                fieldKey="endTime"
                                label="End Time"
                                value={editableFields.endTime}
                                type="time"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconMapPin className="h-3 w-3" />
                                Venue Name
                              </label>
                              <FieldEditor
                                fieldKey="venueName"
                                label="Venue Name"
                                value={editableFields.venueName}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                                Venue Address
                              </label>
                              <FieldEditor
                                fieldKey="venueAddress"
                                label="Venue Address"
                                value={editableFields.venueAddress}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block flex items-center gap-1">
                                <IconUsers className="h-3 w-3" />
                                Guest Count
                              </label>
                              <FieldEditor
                                fieldKey="guestCount"
                                label="Guest Count"
                                value={editableFields.guestCount}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                                Budget Range
                              </label>
                              <FieldEditor
                                fieldKey="budgetRange"
                                label="Budget Range"
                                value={editableFields.budgetRange}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Messages Preview */}
                        {parsedPreview.messages && parsedPreview.messages.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                              Messages ({parsedPreview.messages.length} detected)
                            </h4>
                            <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                              {parsedPreview.messages.slice(0, 5).map((msg, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium text-zinc-600 dark:text-zinc-400">{msg.speakerLabel}:</span>{' '}
                                  <span className="text-zinc-700 dark:text-zinc-300">{msg.message.substring(0, 100)}{msg.message.length > 100 ? '...' : ''}</span>
                                </div>
                              ))}
                              {parsedPreview.messages.length > 5 && (
                                <p className="text-xs text-zinc-500">+ {parsedPreview.messages.length - 5} more messages</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Email Content Preview */}
                  {isEmail && emailExtractedData && (
                    <Card className="border-purple-200 dark:border-purple-900">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200">
                            <IconSparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">Email Content Extracted</CardTitle>
                            <CardDescription className="text-xs">
                              Review extracted playlists, times, and special requests
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Playlists */}
                        {Object.keys(emailExtractedData.playlists).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                              <IconMusic className="h-3 w-3" />
                              Playlists Found ({Object.keys(emailExtractedData.playlists).length})
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(emailExtractedData.playlists).map(([type, url]) => (
                                <div key={type} className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                                  <span className="font-medium capitalize">{type.replace('_', ' ')}:</span>
                                  <a
                                    href={url as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline dark:text-blue-400 truncate max-w-xs"
                                  >
                                    {url as string}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Times */}
                        {(emailExtractedData.ceremonyTime || emailExtractedData.grandEntrance || emailExtractedData.grandExit) && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                              <IconClock className="h-3 w-3" />
                              Event Times
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {emailExtractedData.ceremonyTime && (
                                <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                                  <span className="font-medium">Ceremony:</span> {emailExtractedData.ceremonyTime}
                                  {emailExtractedData.ceremonyEndTime && ` - ${emailExtractedData.ceremonyEndTime}`}
                                </div>
                              )}
                              {emailExtractedData.grandEntrance && (
                                <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                                  <span className="font-medium">Grand Entrance:</span> {emailExtractedData.grandEntrance}
                                </div>
                              )}
                              {emailExtractedData.grandExit && (
                                <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                                  <span className="font-medium">Grand Exit:</span> {emailExtractedData.grandExit}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Special Requests */}
                        {emailExtractedData.specialRequests && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                              Special Requests
                            </h4>
                            <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900 whitespace-pre-wrap">
                              {emailExtractedData.specialRequests}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {emailExtractedData.notes && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                              Notes
                            </h4>
                            <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900 whitespace-pre-wrap">
                              {emailExtractedData.notes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Import Options */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconSettings className="h-4 w-4" />
                          <CardTitle className="text-sm">Import Options</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowImportOptions(!showImportOptions)}
                        >
                          {showImportOptions ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    {showImportOptions && (
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Lead Source</label>
                          <Select
                            value={importOptions.leadSource || 'Conversation Import'}
                            onValueChange={(val) => setImportOptions(prev => ({ ...prev, leadSource: val }))}
                          >
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Conversation Import">Conversation Import</SelectItem>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="Admin Assistant">Admin Assistant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Initial Status</label>
                          <Select
                            value={importOptions.leadStatus || 'New'}
                            onValueChange={(val) => setImportOptions(prev => ({ ...prev, leadStatus: val }))}
                          >
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Contacted">Contacted</SelectItem>
                              <SelectItem value="Qualified">Qualified</SelectItem>
                              <SelectItem value="Booked">Booked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                    </div>
                  </div>

                  {/* Import Footer */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 sm:px-6 py-3 sm:py-4 bg-white dark:bg-zinc-900">
                    <div className="max-w-4xl mx-auto">
                      <Button
                        onClick={handleImport}
                        disabled={!threadText.trim() || importStatus.state === 'processing'}
                        className="w-full sm:w-auto min-h-[44px]"
                        size="lg"
                      >
                        {importStatus.state === 'processing' ? (
                          <>
                            <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <IconClipboardCheck className="h-4 w-4 mr-2" />
                            Import Lead
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scan Count Modal - TipJar Only */}
      <Dialog open={qrScanModalOpen} onOpenChange={setQrScanModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconQrcode className="h-5 w-5" />
              QR Code Scan Count
            </DialogTitle>
            <DialogDescription>
              How many times was your QR code scanned in the selected time range?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Start Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                End Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick an end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Result Display */}
            {scanCount !== null && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Total Scans
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {startDate && endDate && (
                        <>
                          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {scanCount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQrScanModalOpen(false);
                setScanCount(null);
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={fetchQRScanCount}
              disabled={!startDate || !endDate || loadingScanCount}
            >
              {loadingScanCount ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Scan Count'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
