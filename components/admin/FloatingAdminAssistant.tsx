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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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

const ADMIN_EMAILS = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | any; // Can be string or structured content
  timestamp: string;
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
  
  // Import state
  const [threadText, setThreadText] = useState('');
  const [importStatus, setImportStatus] = useState<ImportStatus>({ state: 'idle' });
  const [contactId, setContactId] = useState<string | null>(null);
  const [existingContact, setExistingContact] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [editableFields, setEditableFields] = useState<Record<string, string | null>>({});
  const [showFieldComparison, setShowFieldComparison] = useState(false);
  
  // Enhanced import state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
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

  // File upload handlers
  const handleFileUpload = useCallback(async (file: File) => {
    const text = await file.text();
    setThreadText(text);
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

    const timeoutId = setTimeout(checkExisting, 500);
    return () => clearTimeout(timeoutId);
  }, [parsedPreview, user, isEmail]);

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Assistant handlers
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: messageContent }
    ];

    try {
      const response = await fetch('/api/admin-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: updatedHistory.slice(-10)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
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
      
      const fieldsToUse = Object.keys(editableFields).length > 0 
        ? editableFields 
        : parsedPreview?.contact || {};
      
      setImportStatus({ state: 'processing', step: 'Importing contact data...' });
      
      const response = await fetch('/api/leads/import-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          thread: threadText,
          overrides: existingContact ? fieldsToUse : undefined,
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
    } catch (error: any) {
      setImportStatus({
        state: 'error',
        message: error?.message || 'Something went wrong while importing the lead.',
      });
    }
  }, [threadText, validateFields, toast, contactId, isEmail, parsedPreview, existingContact, editableFields, importOptions]);

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

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setThreadText('');
      setImportStatus({ state: 'idle' });
      setEditableFields({});
      setEmailExtractedData(null);
      setEditingField(null);
      setShowComparison(false);
      setShowImportOptions(false);
      setShowHelp(false);
      setValidationErrors({});
    }
  };

  if (loading) return null;

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <button
            className="group flex items-center gap-3 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            aria-label="Open Admin Assistant"
          >
            <div className="rounded-full bg-white/10 p-2 transition group-hover:bg-white/20">
              <IconRobot className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Assistant</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <IconRobot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Admin Assistant</DialogTitle>
                  <DialogDescription>Execute operations and import conversations</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assistant' | 'import')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="assistant" className="flex items-center gap-2">
                <IconRobot className="h-4 w-4" />
                Assistant
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <IconMessageCirclePlus className="h-4 w-4" />
                Import Conversation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="flex-1 flex flex-col overflow-hidden mt-0">
              <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                            <IconRobot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <MessageContentRenderer
                        content={message.content}
                        timestamp={message.timestamp}
                        functionsCalled={message.functions_called}
                      />

                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-500 text-white">
                            You
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                          <IconRobot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <IconLoader2 className="h-4 w-4 animate-spin text-gray-500" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="px-6 py-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything... (e.g., 'Show me all new leads')"
                    className="min-h-[60px] resize-none"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {isLoading ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSend className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </TabsContent>

            <TabsContent value="import" className="flex-1 flex flex-col overflow-hidden mt-0">
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
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

                  {/* File Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
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
                    <IconFileUpload className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                      Drag and drop a file here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Supports .txt and .eml files
                    </p>
                  </div>

                  {/* Thread Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Conversation Transcript
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHelp(!showHelp)}
                          className="h-7 text-xs"
                        >
                          <IconKeyboard className="h-3 w-3 mr-1" />
                          Help
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setThreadText('')}
                          className="h-7 text-xs"
                          disabled={!threadText.trim()}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={threadText}
                      onChange={(event) => setThreadText(event.target.value)}
                      placeholder={`Paste SMS thread or email content here...\n\nSMS Example:\n+1 (901) 562-3974:\n  Hey, I got your number from Tay...\n\nEmail Example:\nHey, Ben! I have collected songs for the first dances...`}
                      className="min-h-[200px] resize-vertical font-mono text-sm"
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

                  {/* Existing Contact Comparison */}
                  {existingContact && (
                    <Card className="border-orange-200 dark:border-orange-900">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconUser className="h-4 w-4 text-orange-600" />
                            <CardTitle className="text-sm">Existing Contact Found</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowComparison(!showComparison)}
                          >
                            {showComparison ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                      {showComparison && (
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Existing</h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="font-medium">Name:</span> {existingContact.first_name} {existingContact.last_name}
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span> {existingContact.email_address || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Phone:</span> {existingContact.phone || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Event Date:</span> {existingContact.event_date ? dayjs(existingContact.event_date).format('MMM D, YYYY') : 'N/A'}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Imported</h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="font-medium">Name:</span> {editableFields.firstName || parsedPreview?.contact.firstName || ''} {editableFields.lastName || parsedPreview?.contact.lastName || ''}
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span> {editableFields.email || parsedPreview?.contact.email || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Phone:</span> {editableFields.phone || parsedPreview?.contact.phoneE164 || parsedPreview?.contact.phoneDigits || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Event Date:</span> {editableFields.eventDate || parsedPreview?.contact.eventDate || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <Link
                              href={`/admin/contacts/${existingContact.id}`}
                              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                              View existing contact →
                            </Link>
                          </div>
                        </CardContent>
                      )}
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
              </ScrollArea>

              <DialogFooter className="px-6 py-4 border-t">
                <Button
                  onClick={handleImport}
                  disabled={!threadText.trim() || importStatus.state === 'processing'}
                  className="w-full sm:w-auto"
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
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
