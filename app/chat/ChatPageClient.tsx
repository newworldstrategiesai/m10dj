'use client';

import { useState, useCallback, useEffect, useRef, useMemo, Fragment } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import {
  IconArrowLeft,
  IconDotsVertical,
  IconEdit,
  IconMessages,
  IconPaperclip,
  IconPhotoPlus,
  IconPlus,
  IconSearch,
  IconSend,
  IconVideo,
  IconRobot,
  IconUser,
  IconTrash,
  IconRefresh,
  IconEraser,
  IconDatabase,
  IconPhone,
  IconMenu2,
  IconX,
  IconMessagePlus,
  IconCheck,
  IconChecks,
  IconMicrophone,
  IconLoader2
} from '@tabler/icons-react';
import { cn } from '@/utils/cn';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageDetailsModal } from './components/MessageDetailsModal';
import { TypingIndicator } from './components/TypingIndicator';
import { conversations } from '@/data/conversations.json';
import { SMSThreadItem } from './components/SMSThreadItem';
import { ChatHeader } from './components/ChatHeader';
import TwilioSetupGuide from '@/components/TwilioSetupGuide';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useUser } from '@/hooks/useUser';
import { RealtimeChannel } from '@supabase/supabase-js';
import axios from 'axios';
import NewMessageModal from './components/NewMessageModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { ThreadListItem } from './components/ThreadListItem';
import { ChatMessage } from './components/ChatMessage';
import { X } from "lucide-react";
// Contact interface defined locally
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_id: string;
  notes?: string;
  opt_in_status?: boolean;
  email_address?: string;
  company?: string;
  position?: string;
  lead_status?: string;
  lead_source?: string;
  vertical?: string;
  sub_category?: string;
  preferred_language?: string;
}
import { IOSToast } from './components/IOSToast';
import SMSAssistantSettings from '@/components/SMSAssistantSettings';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Define Message interface first
interface Message {
  id: string;
  user_id: string;
  contact_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: string;
  created_at: string;
  updated_at: string;
  twilio_message_sid?: string;
  timestamp: string;
  timestampMs: number;
  message: string;
  sender: string;
  to: string;
  from: string;
  source: 'twilio_api' | 'supabase' | 'pending' | 'error';
  isAI?: boolean;
}

// Define ChatUser interface
interface ChatUser {
  id: string;
  user_id: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  messages: Message[];
  unreadCount: number;
  created_at: string;
  updated_at: string;
  isSMS?: boolean;
  profile?: {
    company?: string;
    title?: string;
  };
  username?: string;
  fullName?: string;
  title?: string;
  email_address?: string;
  company?: string;
  lead_status?: string;
  lead_source?: string;
  vertical?: string;
  sub_category?: string;
  preferred_language?: string;
  notes?: string;
  opt_in_status?: boolean;
  position?: string;
}

interface SMSContact extends Contact {
  messages: Message[];
}

interface SelectedMessage {
  from: string;
  to: string;
  body: string;
  dateSent: string;
  direction: 'inbound' | 'outbound';
}

type SettingsTabType = 'credentials' | 'general' | 'phone_number';

const supabase = createClientComponentClient();

function normalizePhoneNumber(phoneNumber?: string): string {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/\D/g, '');
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; maxWait?: number } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  
  return function(...args: Parameters<T>) {
    const time = Date.now();
    lastCallTime = time;
    
    if (timeout) clearTimeout(timeout);
    
    if (options.leading && !timeout) {
      lastInvokeTime = time;
      func(...args);
      return;
    }
    
    timeout = setTimeout(() => {
      const shouldInvoke = !options.maxWait || (time - lastInvokeTime) >= options.maxWait;
      
      if (shouldInvoke) {
        lastInvokeTime = time;
        func(...args);
      }
      timeout = null;
    }, wait);
  };
}

function formatTimestamp(timestamp: string | number): string {
  if (!isNaN(Number(timestamp))) {
    const timestampMs = String(timestamp).length > 10 ? 
      Number(timestamp) : 
      Number(timestamp) * 1000;
    return new Date(timestampMs).toISOString();
  }
  
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return String(timestamp);
  }
  
  console.warn('Invalid timestamp:', timestamp);
  return new Date().toISOString();
}

const fetchContactDetails = async (phoneNumber: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session found when fetching contact details');
      return null;
    }

    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!normalizedPhone) {
      console.log('Normalized phone number is empty');
      return null;
    }
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (error) {
      console.error('Error fetching contact:', error.message || error);
      return null;
    }
    
    if (!contacts) {
      console.log(`No contact found for phone: ${normalizedPhone}`);
      return null;
    }

    return contacts;
  } catch (err) {
    console.error('Exception in fetchContactDetails:', err);
    return null;
  }
};

const ContactDetailsPanel = ({ contact, onClose }: { contact: Contact | ChatUser | null; onClose: () => void }) => {
  const { toast } = useToast();
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [automationMode, setAutomationMode] = useState<'semi' | 'full'>('semi');
  const [responseStyle, setResponseStyle] = useState<'formal' | 'casual' | 'very-casual'>('casual');
  const [messageLength, setMessageLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [responseDelay, setResponseDelay] = useState<'none' | 'short' | 'medium' | 'long'>('short');

  if (!contact) return null;

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
  
  const handleSaveDefaultSettings = () => {
    toast({
      title: "Default settings saved",
      description: "Your automation settings have been saved as default.",
    });
  };
  
  return (
    <div className="w-full h-full overflow-auto bg-white dark:bg-gray-50 text-gray-900">
      <div className="space-y-6 p-4">
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">Contact Details</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-medium text-gray-900">{fullName}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="font-medium text-gray-900">{contact.phone}</p>
            </div>
            {contact.email_address && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{contact.email_address}</p>
              </div>
            )}
            {contact.company && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Company</p>
                <p className="font-medium text-gray-900">{contact.company}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatPageClient() {
  const { toast } = useToast();
  const [threads, setThreads] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [isLoadingSMSHistory, setIsLoadingSMSHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smsContacts, setSMSContacts] = useState<SMSContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(true);
  const [showTwilioSetupGuide, setShowTwilioSetupGuide] = useState(false);
  const [twilioErrorType, setTwilioErrorType] = useState<'credentials' | 'general' | 'phone_number' | undefined>(undefined);
  const [twilioCredentials, setTwilioCredentials] = useState<{
    twilioSid: string;
    twilioAuthToken: string;
    twilioNumbers: string[];
  } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<SelectedMessage | null>(null);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [automationMode, setAutomationMode] = useState<'semi' | 'full'>('semi');
  const [responseStyle, setResponseStyle] = useState<'formal' | 'casual' | 'very-casual'>('casual');
  const [messageLength, setMessageLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [responseDelay, setResponseDelay] = useState<'none' | 'short' | 'medium' | 'long'>('short');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [showSuggestedReplies, setShowSuggestedReplies] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; sender: string } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      if (isMobileView) {
        setShowDetailsPanel(false);
        setMobileOpen(true);
      } else {
        setShowDetailsPanel(false);
        setMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (!chatContainerRef.current) return;
    try {
      const scrollContainer = chatContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }, []);

  // Fetch contacts from database
  const fetchContacts = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching contacts');
      return [];
    }

    setIsLoadingContacts(true);
    try {
      console.log('Fetching contacts for user:', user.id);
      const response = await fetch(`/api/get-contacts?limit=200`);
      if (response.ok) {
        const data = await response.json();
        const contacts = data.contacts || data; // Handle both old and new response format
        console.log('Loaded contacts:', contacts.length, contacts);
        setSMSContacts(contacts);
        return contacts;
      } else {
        console.error('Failed to fetch contacts:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Ensure contact details panel is open on desktop when selecting a thread
  useEffect(() => {
    if (selectedUser && !isMobile) {
      setShowDetailsPanel(true);
    }
  }, [selectedUser, isMobile]);

  // Fetch SMS history and build conversation threads
  const fetchSMSHistory = async () => {
    if (!user?.id) {
      console.log('No user available for fetching SMS history');
      return;
    }

    setIsLoadingSMSHistory(true);
    setError('');

    try {
      const response = await fetch(`/api/get-sms-logs?pageSize=100&_t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch SMS history: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn('No messages found or invalid data format');
        setThreads([]);
        setSelectedUser(null);
        return;
      }

      // Group messages by phone number to create threads
      const messagesByPhone: { [key: string]: Message[] } = {};
      data.messages.forEach((msg: any) => {
        const phone = msg.direction === 'inbound' ? msg.from : msg.to;
        if (!messagesByPhone[phone]) {
          messagesByPhone[phone] = [];
        }
        messagesByPhone[phone].push({
          id: msg.id,
          user_id: user.id,
          contact_id: phone,
          content: msg.body,
          direction: msg.direction,
          status: msg.status,
          created_at: msg.dateSent,
          updated_at: msg.dateSent,
          timestamp: msg.dateSent,
          timestampMs: new Date(msg.dateSent).getTime(),
          message: msg.body,
          sender: msg.direction === 'inbound' ? msg.from : 'You',
          to: msg.to,
          from: msg.from,
          source: 'twilio_api'
        });
      });

      // Create threads from grouped messages
      const newThreads = Object.entries(messagesByPhone).map(([phone, messages]) => {
        // Find matching contact
        const normalizedPhone = phone.replace(/\D/g, '');
        const contact = smsContacts.find((c: SMSContact) => {
          const normalizedContactPhone = c.phone.replace(/\D/g, '');
          return normalizedContactPhone === normalizedPhone;
        });
        
        const unreadMessages = messages.filter(
          (msg) => msg.direction === 'inbound' && 
            (selectedUser?.updated_at ? new Date(msg.timestamp) > new Date(selectedUser.updated_at) : true)
        );

        return {
          id: phone, // Use phone as ID for now
          user_id: user.id,
          phone,
          first_name: contact?.first_name || '',
          last_name: contact?.last_name || '',
          messages: messages.sort((a, b) => a.timestampMs - b.timestampMs),
          unreadCount: unreadMessages.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          lead_status: contact?.lead_status,
          lead_source: contact?.lead_source,
          email_address: contact?.email_address,
          company: contact?.company,
          username: contact?.first_name || phone,
          fullName: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || phone,
          vertical: contact?.vertical,
          sub_category: contact?.sub_category,
          preferred_language: contact?.preferred_language,
          notes: contact?.notes,
          opt_in_status: contact?.opt_in_status,
          isSMS: true
        };
      });

      console.log('Setting threads:', newThreads.length);
      setThreads(newThreads);
      
    } catch (error) {
      console.error('Error fetching SMS history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
      
      toast({
        title: "Error",
        description: "Failed to fetch messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSMSHistory(false);
    }
  };

  // Load data when user is available
  useEffect(() => {
    if (user) {
      const loadDataInOrder = async () => {
        await fetchContacts(); // Load contacts first
        fetchSMSHistory(); // Then fetch SMS history
      };
      loadDataInOrder();
    }
  }, [user]);

  // Refresh SMS history when contacts are loaded
  useEffect(() => {
    if (user && smsContacts.length > 0 && !isLoadingContacts) {
      console.log('Refreshing SMS history with updated contacts:', smsContacts.length);
      fetchSMSHistory();
    }
  }, [smsContacts, isLoadingContacts, user]);

  // Generate reply suggestions when user is selected
  useEffect(() => {
    if (selectedUser && selectedUser.messages.length > 0) {
      const lastMessage = selectedUser.messages[selectedUser.messages.length - 1];
      
      // Only generate suggestions for inbound messages
      if (lastMessage.direction === 'inbound') {
        generateReplySuggestions(selectedUser.messages);
      } else {
        setSuggestions([]);
      }
    }
  }, [selectedUser?.id, selectedUser?.messages.length]);

  // Extract lead information from conversation history
  const extractLeadDataFromConversation = (messages: Message[]) => {
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Event type detection
    const eventTypes = ['wedding', 'birthday', 'corporate', 'party', 'anniversary', 'graduation', 'reunion', 'gala', 'fundraiser'];
    const detectedEventType = eventTypes.find(type => conversationText.includes(type));
    
    // Date detection (look for date patterns)
    const datePatterns = [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4}\b/i,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
      /\b(next|this)\s+(week|month|year|weekend|friday|saturday|sunday|monday|tuesday|wednesday|thursday)\b/i
    ];
    const hasDate = datePatterns.some(pattern => pattern.test(conversationText));
    
    // Venue detection (look for address patterns or "venue" keyword with context)
    const venuePatterns = [
      /\bvenue:?\s+([^\n,.]+)/i,
      /\b\d+\s+[a-z\s]+\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|place|pl|court|ct)\b/i,
      /\bat\s+([A-Z][a-z\s]+(?:Hall|Center|Hotel|Resort|Venue|Estate|Manor|House|Club|Garden))/
    ];
    const hasVenue = venuePatterns.some(pattern => pattern.test(conversationText));
    
    // Budget detection
    const hasBudget = /\$\d+|budget|price range/i.test(conversationText);
    
    // Guest count detection
    const hasGuestCount = /\b\d+\s*(guests?|people|attendees)/i.test(conversationText);
    
    return {
      hasEventType: !!detectedEventType,
      eventType: detectedEventType,
      hasDate,
      hasVenue,
      hasBudget,
      hasGuestCount,
      conversationText
    };
  };

  // Function to generate AI reply suggestions
  const generateReplySuggestions = async (messages: Message[]) => {
    const lastMessage = messages[messages.length - 1].content;
    const leadData = extractLeadDataFromConversation(messages);
    
    // Check if all required data is captured
    const requiredDataComplete = leadData.hasEventType && leadData.hasDate && leadData.hasVenue;
    
    let suggestions: string[] = [];
    
    if (!requiredDataComplete) {
      // Use simple templated responses for missing required data
      const msg = lastMessage.toLowerCase();
      
      // Priority 1: Event Type
      if (!leadData.hasEventType) {
        if (msg.includes('hi') || msg.includes('hello') || msg.includes('interested') || msg.includes('dj') || msg.includes('need')) {
          suggestions.push("Thanks for reaching out! What type of event are you planning?");
          suggestions.push("I'd love to help! Is this for a wedding, birthday, or another celebration?");
        } else {
          suggestions.push("That sounds great! What type of event is this for?");
          suggestions.push("I can help with that! What kind of event are you planning?");
        }
      }
      // Priority 2: Date
      else if (!leadData.hasDate) {
        suggestions.push(`Perfect! When is your ${leadData.eventType || 'event'}?`);
        suggestions.push("What date are you looking at for your event?");
        suggestions.push("Great! What's the date of your event?");
      }
      // Priority 3: Venue
      else if (!leadData.hasVenue) {
        suggestions.push("Sounds good! What venue are you considering?");
        suggestions.push("Awesome! Where will the event be held?");
        suggestions.push("Great! Do you have a venue in mind, or do you need recommendations?");
      }
      
      // If we have some suggestions from basic matching, return them
      if (suggestions.length > 0) {
        setSuggestions(suggestions.slice(0, 3));
        return;
      }
    }
    
    // All required data captured - use OpenAI for intelligent suggestions
    if (requiredDataComplete) {
      setIsLoadingSuggestions(true);
      try {
        const conversationHistory = messages.slice(-10).map(m => ({
          role: m.direction === 'inbound' ? 'customer' : 'business',
          content: m.content
        }));
        
        const response = await fetch('/api/generate-reply-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastMessage,
            conversationHistory,
            leadData: {
              eventType: leadData.eventType,
              hasDate: leadData.hasDate,
              hasVenue: leadData.hasVenue,
              hasBudget: leadData.hasBudget,
              hasGuestCount: leadData.hasGuestCount
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } else {
          // Fallback to basic suggestions if API fails
          suggestions = [
            "That sounds perfect! I'd love to discuss the details further.",
            "Great! Let me put together a custom package for your event.",
            "I'm excited to work with you on this! When would be a good time to chat about specifics?"
          ];
          setSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Error generating AI suggestions:', error);
        // Fallback suggestions
        suggestions = [
          "That sounds perfect! I'd love to discuss the details further.",
          "Great! Let me put together a custom package for your event.",
          "I'm excited to work with you on this! When would be a good time to chat?"
        ];
        setSuggestions(suggestions);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      // Fallback to basic contextual suggestions
      const msg = lastMessage.toLowerCase();
      
      if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
        suggestions.push("I'd be happy to provide pricing! Can you tell me more about your event?");
        suggestions.push("Pricing depends on the details. What type of event and date are you considering?");
      } else if (msg.includes('?')) {
        suggestions.push('Great question! Let me get you that information.');
        suggestions.push('Absolutely! I can help with that.');
      } else {
        suggestions.push('Thanks for your message! How can I help with your event?');
        suggestions.push("I'd be happy to discuss this further.");
      }
      
      setSuggestions(suggestions.slice(0, 3));
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchSMSHistory();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const currentMessage = useMemo(() => {
    if (!selectedUser?.messages?.length) {
      return {};
    }

    const normalizedMessages = selectedUser.messages.map((msg: Message) => ({
      ...msg,
      content: msg.message || msg.content,
      timestamp: msg.source === 'supabase' ? msg.timestamp : formatTimestamp(msg.timestamp)
    }));

    const sortedMessages = [...normalizedMessages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sortedMessages.reduce((acc: Record<string, Message[]>, message: Message) => {
      const key = dayjs(message.timestamp).format('D MMM, YYYY');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(message);
      return acc;
    }, {});
  }, [selectedUser?.messages]);

  const handleSendMessage = async (message: string) => {
    if (!selectedUser || !message.trim()) return;

    setIsLoading(true);

    // Create a pending message for immediate UI feedback
    const pendingMessage: Message = {
      id: uuidv4(),
      user_id: user?.id || 'temp',
      contact_id: selectedUser.phone,
      content: message,
      direction: 'outbound' as const,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      message: message,
      sender: 'You',
      to: selectedUser.phone,
      from: 'You',
      source: 'pending'
    };

    // Add pending message to UI immediately
    const pendingUser = {
      ...selectedUser,
      messages: [...selectedUser.messages, pendingMessage],
      updated_at: new Date().toISOString()
    };
    
    setSelectedUser(pendingUser);
    setThreads(threads.map(thread => 
      thread.id === selectedUser.id ? pendingUser : thread
    ));
    setInputMessage('');
    setTimeout(scrollToBottom, 100);

    try {
      // Send SMS via API
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedUser.phone,
          body: message,
          from: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Update message status to sent
      const sentMessage: Message = {
        ...pendingMessage,
        status: 'sent',
        source: 'twilio_api',
        twilio_message_sid: data.messageSid,
        id: data.message?.id || pendingMessage.id
      };

      const sentUser = {
        ...selectedUser,
        messages: selectedUser.messages.map(msg => 
          msg.id === pendingMessage.id ? sentMessage : msg
        ),
        updated_at: new Date().toISOString()
      };
      
      setSelectedUser(sentUser);
      setThreads(threads.map(thread => 
        thread.id === selectedUser.id ? sentUser : thread
      ));

      // Show success toast
      toast({
        title: "Message sent",
        description: `Message sent to ${selectedUser.fullName || selectedUser.phone}`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to error
      const errorMessage: Message = {
        ...pendingMessage,
        status: 'failed',
        source: 'error'
      };

      const errorUser = {
        ...selectedUser,
        messages: selectedUser.messages.map(msg => 
          msg.id === pendingMessage.id ? errorMessage : msg
        ),
        updated_at: new Date().toISOString()
      };
      
      setSelectedUser(errorUser);
      setThreads(threads.map(thread => 
        thread.id === selectedUser.id ? errorUser : thread
      ));

      // Show error toast
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = debounce(() => {
    // Typing indicator logic
  }, 500);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Thread List */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-300 bg-white",
        "md:sticky md:top-0",
        "fixed inset-0 z-40 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconMessages className="h-5 w-5 text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              </div>
              <Button
                variant="outline"
                onClick={() => setNewMessageModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full border-0 shadow-md hover:shadow-lg transition-all"
              >
                <IconMessagePlus className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">New</span>
              </Button>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {isLoadingSMSHistory || isLoadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <IconLoader2 className="h-5 w-5 animate-spin" />
                    <span>Loading conversations...</span>
                  </div>
                </div>
              ) : threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <IconMessages className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Start a new conversation or wait for incoming messages
                  </p>
                  <Button
                    onClick={() => setNewMessageModalOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Start New Conversation
                  </Button>
                </div>
              ) : (
                threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setSelectedUser(thread);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                    setTimeout(scrollToBottom, 50);
                  }}
                  className={cn(
                    "flex items-center p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200",
                    selectedUser?.id === thread.id 
                      ? "bg-blue-50 border-2 border-blue-300 shadow-sm" 
                      : "hover:bg-gray-100 hover:shadow-sm border border-transparent"
                  )}
                >
                  <Avatar className="h-12 w-12 mr-3 ring-2 ring-offset-1 ring-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {thread.first_name?.[0]?.toUpperCase() || thread.phone[1]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {thread.first_name || thread.last_name
                          ? `${thread.first_name || ''} ${thread.last_name || ''}`.trim()
                          : thread.phone}
                      </p>
                      {thread.messages.length > 0 && (
                        <span className="text-xs text-gray-500 font-medium ml-2">
                          {dayjs(thread.messages[thread.messages.length - 1].timestamp).format('h:mm A')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {thread.messages.length > 0 
                          ? thread.messages[thread.messages.length - 1].content
                          : 'No messages'}
                      </p>
                      {thread.unreadCount > 0 && (
                        <div className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {thread.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col h-full",
        "fixed lg:relative inset-0 z-30 transition-transform duration-300",
        mobileOpen && isMobile ? "translate-x-full" : "translate-x-0"
      )}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isMobile) {
                      setMobileOpen(true);
                      setSelectedUser(null);
                    }
                  }}
                  className="mr-3 lg:hidden p-2 hover:bg-gray-100 rounded-full border-none"
                >
                  <IconArrowLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <Avatar className="h-11 w-11 mr-3 ring-2 ring-offset-2 ring-blue-100">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                    {selectedUser.first_name?.[0]?.toUpperCase() || selectedUser.phone[1]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-gray-900 text-base">
                    {selectedUser.first_name || selectedUser.last_name
                      ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()
                      : selectedUser.phone}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <IconPhone className="h-3 w-3" />
                    {selectedUser.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                  className="p-2 hover:bg-gray-100 rounded-full hidden lg:flex border-gray-300"
                >
                  <IconUser className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {Object.entries(currentMessage).map(([date, messages]) => (
                  <div key={date}>
                    <div className="flex justify-center mb-4">
                      <span className="bg-white shadow-sm px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                        {date}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {messages.map((message, index) => (
                        <div
                          key={`${message.id || message.timestamp}-${index}`}
                          className={cn(
                            "flex",
                            message.direction === 'outbound' ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm",
                              message.direction === 'outbound'
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                : "bg-white text-gray-900 border border-gray-200"
                            )}
                          >
                            <p className="text-sm leading-relaxed">{message.content || message.message}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <p className={cn(
                                "text-xs",
                                message.direction === 'outbound' 
                                  ? "text-blue-100" 
                                  : "text-gray-500"
                              )}>
                                {dayjs(message.timestamp).format('h:mm A')}
                              </p>
                              {message.direction === 'outbound' && (
                                <span className="ml-1">
                                  {message.status === 'delivered' || message.status === 'sent' ? (
                                    <IconChecks className="h-3 w-3 text-blue-100" />
                                  ) : message.status === 'pending' ? (
                                    <IconCheck className="h-3 w-3 text-blue-200" />
                                  ) : null}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="max-w-4xl mx-auto space-y-3">
                {/* Reply Suggestions */}
                {(suggestions.length > 0 || isLoadingSuggestions) && (
                  <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mr-2">
                      {isLoadingSuggestions ? (
                        <>
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                          <span className="font-medium">Generating smart replies...</span>
                        </>
                      ) : (
                        <>
                          <IconRobot className="h-4 w-4" />
                          <span className="font-medium">Quick replies:</span>
                        </>
                      )}
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(suggestion)}
                        disabled={isLoadingSuggestions}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full text-sm transition-colors border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                    {!isLoadingSuggestions && (
                      <button
                        onClick={() => setSuggestions([])}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div className="flex items-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedUser && selectedUser.messages.length > 0) {
                        const lastMessage = selectedUser.messages[selectedUser.messages.length - 1];
                        if (lastMessage.direction === 'inbound') {
                          generateReplySuggestions(selectedUser.messages);
                        }
                      }
                    }}
                    disabled={isLoadingSuggestions}
                    className="p-3 rounded-full flex-shrink-0 hover:bg-gray-100 border-gray-300 disabled:opacity-50"
                    title="Generate AI suggestions"
                  >
                    {isLoadingSuggestions ? (
                      <IconLoader2 className="h-5 w-5 text-gray-600 animate-spin" />
                    ) : (
                      <IconRobot className="h-5 w-5 text-gray-600" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(inputMessage);
                        }
                      }}
                      className="min-h-[44px] resize-none border-gray-300 rounded-2xl bg-gray-50 text-gray-900 placeholder:text-gray-500 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={1}
                    />
                  </div>
                  <Button
                    disabled={!inputMessage.trim() || isLoading}
                    onClick={() => handleSendMessage(inputMessage)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 flex-shrink-0"
                  >
                    {isLoading ? (
                      <IconLoader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <IconSend className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <IconMessages className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 mb-4">
                Choose a conversation from the sidebar to start messaging
              </p>
              <Button
                onClick={() => setNewMessageModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
              >
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Details Panel */}
      {showDetailsPanel && selectedUser && (
        <div className="w-80 border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Contact Details</h3>
            <Button
              variant="outline"
              onClick={() => setShowDetailsPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <IconX className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
          <ContactDetailsPanel
            contact={selectedUser}
            onClose={() => setShowDetailsPanel(false)}
          />
        </div>
      )}

      {/* Modals */}
      <NewMessageModal
        isOpen={newMessageModalOpen}
        onClose={() => setNewMessageModalOpen(false)}
        onSubmit={async (phoneNumber: string, contactName: string, fromNumber: string, message?: string) => {
          try {
            const names = contactName.trim().split(' ');
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ');

            // Create new thread locally first
            const newThread: ChatUser = {
              id: phoneNumber, // Use phone as ID
              user_id: user?.id || 'temp',
              phone: phoneNumber,
              first_name: firstName,
              last_name: lastName,
              messages: [],
              unreadCount: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isSMS: true,
              username: firstName || phoneNumber,
              fullName: `${firstName} ${lastName}`.trim() || phoneNumber,
              email_address: '',
              company: '',
              lead_status: 'New',
              lead_source: 'SMS',
              vertical: '',
              sub_category: '',
              preferred_language: '',
              notes: '',
              opt_in_status: true
            };

            // Add to threads and select it
            setThreads(prevThreads => {
              const exists = prevThreads.find(t => t.phone === phoneNumber);
              if (exists) {
                setSelectedUser(exists);
                // If there's a message, send it immediately
                if (message?.trim()) {
                  setTimeout(() => handleSendMessage(message), 100);
                }
                return prevThreads; // Don't add duplicates
              }
              return [...prevThreads, newThread];
            });
            
            if (!threads.find(t => t.phone === phoneNumber)) {
              setSelectedUser(newThread);
            }
            
            setNewMessageModalOpen(false);
            
            if (isMobile) {
              setMobileOpen(false);
            }

            // Send initial message if provided
            if (message?.trim()) {
              setTimeout(() => handleSendMessage(message), 200);
            }

            toast({
              title: "New conversation started",
              description: `Ready to message ${contactName || phoneNumber}`,
            });

          } catch (error) {
            console.error('Failed to create new thread:', error);
            toast({
              title: "Error",
              description: "Failed to create new conversation. Please try again.",
              variant: "destructive",
            });
          }
        }}
        userId={user?.id || ''}
        contacts={smsContacts}
      />

      {showToast && toastMessage && (
        <IOSToast
          message={toastMessage.message}
          sender={toastMessage.sender}
          onClose={() => {
            setShowToast(false);
            setToastMessage(null);
          }}
        />
      )}
    </div>
  );
}