'use client';

/**
 * Dialer UI – matches ClickSetGo layout and styling.
 * Call engine remains LiveKit (POST /api/livekit/outbound-call).
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LiveKitRoom } from '@livekit/components-react';
import { VoiceCallControls } from '@/components/livekit/VoiceCallControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone,
  User,
  Search,
  X,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  LayoutGrid,
  PhoneCall,
  Check,
  Mail,
  Zap,
  Loader2,
  Settings,
} from 'lucide-react';
import { VoiceAgentSettingsForm, type VoiceAgentSettingsFormData } from '@/components/admin/VoiceAgentSettingsForm';
import { useToast } from '@/hooks/use-toast';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_id: string;
  email?: string;
  email_address?: string;
  notes?: string;
}

interface RecentCall {
  id: string;
  client_phone: string | null;
  direction: string;
  status: string;
  started_at: string | null;
  created_at: string;
  contact_id: string | null;
  contacts?: { first_name?: string | null; last_name?: string | null } | null;
}

interface AgentSettings {
  agentName: string;
  role: string;
  companyName: string;
  prompt: string;
  firstMessage?: string;
}

interface DialerClientProps {
  userId: string;
  userEmail: string;
}

export default function DialerClient({ userId, userEmail }: DialerClientProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isRedialModalOpen, setIsRedialModalOpen] = useState(false);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingRecentCalls, setLoadingRecentCalls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [callReason, setCallReason] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addContactFirstName, setAddContactFirstName] = useState('');
  const [addContactLastName, setAddContactLastName] = useState('');
  const [addContactPhone, setAddContactPhone] = useState('');
  const [addContactEmail, setAddContactEmail] = useState('');
  const [addContactSubmitting, setAddContactSubmitting] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [detailsContact, setDetailsContact] = useState<Contact | null>(null);

  const [activeCall, setActiveCall] = useState<{
    roomName: string;
    token: string;
    serverUrl: string;
    displayName: string;
  } | null>(null);

  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    agentName: 'Ben',
    role: 'Voice Assistant',
    companyName: 'M10 DJ Company',
    prompt: 'You are a friendly and professional voice assistant for M10 DJ Company.',
  });

  const [isAgentSettingsSheetOpen, setIsAgentSettingsSheetOpen] = useState(false);
  const [agentSettingsFormLoading, setAgentSettingsFormLoading] = useState(false);
  const [agentSettingsFormSaving, setAgentSettingsFormSaving] = useState(false);
  const [agentSettingsFormData, setAgentSettingsFormData] = useState<VoiceAgentSettingsFormData>({
    agent_name: 'Ben',
    instructions: null,
    greeting_text: 'Greet the caller and say you\'re with M10 DJ Company. Ask how you can help.',
    stt_model: 'assemblyai/universal-streaming',
    stt_language: 'en',
    llm_model: 'openai/gpt-4.1-mini',
    tts_model: 'elevenlabs/eleven_turbo_v2',
    tts_voice_id: 'iP95p4xoKVk53GoZ742B',
    tts_language: 'en',
    background_audio_clip: 'crowded_room',
    background_audio_volume: 0.3,
    role: 'Voice Assistant',
    company_name: 'M10 DJ Company',
    prompt: null,
    first_message_template: null,
  });

  const formatPhoneNumber = (phoneNumber: string | undefined): string => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return '';
    const parsed = parsePhoneNumberFromString(phoneNumber);
    if (parsed) return parsed.format('E.164');
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`;
  };

  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('first_name', { ascending: true });
      if (!error) setContacts(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to fetch contacts', variant: 'destructive' });
    }
  }, [userId, supabase, toast]);

  const fetchRecentCalls = useCallback(async () => {
    setLoadingRecentCalls(true);
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('id, client_phone, direction, status, started_at, created_at, contact_id, contacts ( first_name, last_name )')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setRecentCalls((data as unknown as RecentCall[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecentCalls(false);
    }
  }, [supabase]);

  const fetchAgentSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/livekit/agent-settings');
      if (!res.ok) return;
      const data = await res.json();
      setAgentSettings({
        agentName: data.agent_name ?? 'Ben',
        role: data.role ?? 'Voice Assistant',
        companyName: data.company_name ?? 'M10 DJ Company',
        prompt: data.prompt ?? 'You are a friendly and professional voice assistant.',
        firstMessage: data.first_message_template ?? undefined,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchAgentSettings();
  }, [fetchContacts, fetchAgentSettings]);

  useEffect(() => {
    if (isRedialModalOpen) fetchRecentCalls();
  }, [isRedialModalOpen, fetchRecentCalls]);

  const fetchAgentSettingsForm = useCallback(async () => {
    setAgentSettingsFormLoading(true);
    try {
      const res = await fetch('/api/livekit/agent-settings');
      if (!res.ok) return;
      const data = await res.json();
      setAgentSettingsFormData({
        agent_name: data.agent_name ?? 'Ben',
        instructions: data.instructions ?? null,
        greeting_text: data.greeting_text ?? null,
        stt_model: data.stt_model ?? 'assemblyai/universal-streaming',
        stt_language: data.stt_language ?? 'en',
        llm_model: data.llm_model ?? 'openai/gpt-4.1-mini',
        tts_model: data.tts_model ?? 'elevenlabs/eleven_turbo_v2',
        tts_voice_id: data.tts_voice_id ?? null,
        tts_language: data.tts_language ?? 'en',
        background_audio_clip: data.background_audio_clip ?? 'crowded_room',
        background_audio_volume: typeof data.background_audio_volume === 'number' ? data.background_audio_volume : 0.3,
        role: data.role ?? 'Voice Assistant',
        company_name: data.company_name ?? 'M10 DJ Company',
        prompt: data.prompt ?? null,
        first_message_template: data.first_message_template ?? null,
        extra: data.extra,
        id: data.id,
        updated_at: data.updated_at,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAgentSettingsFormLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAgentSettingsSheetOpen) fetchAgentSettingsForm();
  }, [isAgentSettingsSheetOpen, fetchAgentSettingsForm]);

  const handleAgentSettingsSave = async () => {
    setAgentSettingsFormSaving(true);
    try {
      const res = await fetch('/api/livekit/agent-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: agentSettingsFormData.agent_name,
          instructions: agentSettingsFormData.instructions || null,
          greeting_text: agentSettingsFormData.greeting_text || null,
          stt_model: agentSettingsFormData.stt_model,
          stt_language: agentSettingsFormData.stt_language,
          llm_model: agentSettingsFormData.llm_model,
          tts_model: agentSettingsFormData.tts_model,
          tts_voice_id: agentSettingsFormData.tts_voice_id || null,
          tts_language: agentSettingsFormData.tts_language,
          background_audio_clip: agentSettingsFormData.background_audio_clip,
          background_audio_volume: agentSettingsFormData.background_audio_volume,
          role: agentSettingsFormData.role,
          company_name: agentSettingsFormData.company_name,
          prompt: agentSettingsFormData.prompt || null,
          first_message_template: agentSettingsFormData.first_message_template || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to save');
      }
      const data = await res.json();
      if (data.updated_at) setAgentSettingsFormData((s) => ({ ...s, updated_at: data.updated_at }));
      setAgentSettings({
        agentName: agentSettingsFormData.agent_name,
        role: agentSettingsFormData.role,
        companyName: agentSettingsFormData.company_name,
        prompt: agentSettingsFormData.prompt ?? '',
        firstMessage: agentSettingsFormData.first_message_template ?? undefined,
      });
      toast({ title: 'Saved', description: 'Agent settings updated. They apply to the next call.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' });
    } finally {
      setAgentSettingsFormSaving(false);
    }
  };

  const handleAddContactSubmit = async () => {
    const first = addContactFirstName.trim();
    const last = addContactLastName.trim();
    if (!first || !last) {
      toast({ title: 'Required fields', description: 'First name and last name are required', variant: 'destructive' });
      return;
    }
    setAddContactSubmitting(true);
    try {
      const res = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: first,
          last_name: last,
          phone: addContactPhone.trim() || null,
          email_address: addContactEmail.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Could not add contact',
          description: data?.error || data?.details || res.statusText,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Contact added', description: `${first} ${last} has been added.` });
      setIsAddContactOpen(false);
      await fetchContacts();
      const newContact = data?.contact;
      if (newContact?.phone) {
        const c: Contact = {
          id: newContact.id,
          first_name: newContact.first_name,
          last_name: newContact.last_name,
          phone: newContact.phone,
          user_id: newContact.user_id,
          email: newContact.email_address,
          notes: newContact.notes,
        };
        setInput(formatPhoneNumber(newContact.phone));
        setSelectedContact(c);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to add contact', variant: 'destructive' });
    } finally {
      setAddContactSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.first_name || '').toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
    );
  });

  const handleButtonClick = (value: string) => {
    setInput((prev) => (prev ? prev + value : value));
  };

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (selectedContacts.length > 0) {
      setInput(formatPhoneNumber(selectedContacts[0].phone));
      setSelectedContact(selectedContacts[0]);
      setIsCallModalOpen(true);
      return;
    }
    const formatted = formatPhoneNumber(input);
    if (!formatted || formatted.length < 10) {
      toast({ title: 'Invalid Phone Number', description: 'Please enter a valid phone number', variant: 'destructive' });
      return;
    }
    const contact = contacts.find((c) => formatPhoneNumber(c.phone) === formatted);
    setSelectedContact(contact || null);
    setIsCallModalOpen(true);
  };

  const handleContactClick = (contact: Contact) => {
    if (!contact?.phone) return;
    if (isMultiSelectMode) {
      setSelectedContacts((prev) =>
        prev.some((c) => c.id === contact.id) ? prev.filter((c) => c.id !== contact.id) : [...prev, contact]
      );
      return;
    }
    const formattedNumber = formatPhoneNumber(contact.phone);
    setInput(formattedNumber || contact.phone);
    setSelectedContact(contact);
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowContactDetails(true);
      setTimeout(() => setDetailsContact(contact), 50);
    } else {
      setShowContactDetails(false);
      setDetailsContact(null);
    }
  };

  const handleModalSubmit = async () => {
    const formatted = formatPhoneNumber(input);
    if (!formatted) {
      toast({ title: 'Invalid Phone Number', variant: 'destructive' });
      return;
    }
    if (!callReason.trim()) {
      toast({ title: 'Call Reason Required', description: 'Please provide a reason for this call.', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const contact = selectedContact || contacts.find((c) => formatPhoneNumber(c.phone) === formatted);
      const payload = {
        contactId: contact?.id || null,
        phoneNumber: formatted,
        callType: 'outbound',
        callReason: callReason || 'General inquiry',
        agentSettings: {
          agentName: agentSettings.agentName,
          role: agentSettings.role,
          companyName: agentSettings.companyName,
          prompt: agentSettings.prompt,
          firstMessage: firstMessage || undefined,
        },
        userId,
      };
      const response = await fetch('/api/livekit/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate call');
      const displayName = contact ? `${contact.first_name} ${contact.last_name}` : formatted || 'Unknown';
      if (data.token && data.serverUrl) {
        setActiveCall({
          roomName: data.roomName,
          token: data.token,
          serverUrl: data.serverUrl,
          displayName,
        });
        toast({ title: data.sipConfigured ? 'Calling...' : 'Room ready', description: data.sipConfigured ? 'Join to talk.' : data.message });
      } else {
        toast({ title: 'Room created', description: data.message });
      }
      setIsCallModalOpen(false);
      setInput('');
      setCallReason('');
      setFirstMessage('');
      setSelectedContact(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to initiate call', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const contactNameForModal = selectedContact
    ? `${selectedContact.first_name} ${selectedContact.last_name}`
    : selectedContacts.length > 0
      ? `${selectedContacts[0].first_name} ${selectedContacts[0].last_name}`
      : formatPhoneNumber(input) || '';

  const getRecentCallDisplayName = (call: RecentCall) => {
    const c = call.contacts;
    if (c && typeof c === 'object' && !Array.isArray(c) && (c.first_name || c.last_name))
      return [c.first_name, c.last_name].filter(Boolean).join(' ');
    return call.client_phone || 'Unknown';
  };

  return (
    <section className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Active call overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80">
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <LiveKitRoom
              video={false}
              audio={true}
              token={activeCall.token}
              serverUrl={activeCall.serverUrl}
              connect={true}
              onDisconnected={() => setActiveCall(null)}
              onError={(err) => {
                toast({ title: 'Call error', description: err.message, variant: 'destructive' });
                setActiveCall(null);
              }}
              className="rounded-lg"
            >
              <VoiceCallControls displayName={activeCall.displayName} onHangUp={() => setActiveCall(null)} />
            </LiveKitRoom>
          </div>
        </div>
      )}

      <div className="relative z-20 w-full flex">
        {/* Left sidebar – Contacts (desktop) */}
        <div
          className={cn(
            'hidden md:flex flex-col p-4 bg-white dark:bg-black h-[calc(100vh-4rem)] overflow-y-auto transition-[width] duration-300 fixed top-16 pb-24',
            sidebarCollapsed ? 'w-16' : 'w-1/3 max-w-sm'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contacts</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiSelectMode(!isMultiSelectMode);
                      if (!isMultiSelectMode) setSelectedContacts([]);
                    }}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Multi-select"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddContactFirstName('');
                      setAddContactLastName('');
                      setAddContactPhone('');
                      setAddContactEmail('');
                      setIsAddContactOpen(true);
                    }}
                    className="p-2 rounded-lg text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                    aria-label="Add contact"
                  >
                    <span className="text-xl leading-none">+</span>
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search contacts"
                />
              </div>

              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const isSelected = isMultiSelectMode && selectedContacts.some((c) => c.id === contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleContactClick(contact)}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                          isSelected ? 'bg-blue-500/20 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        {isMultiSelectMode && (
                          <div
                            className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                              isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400 dark:border-gray-500'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium flex-shrink-0">
                          {(contact.first_name || '?').charAt(0).toUpperCase()}
                          {(contact.last_name || '').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{contact.first_name} {contact.last_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{contact.phone}</p>
                        </div>
                        <Link
                          href={`/admin/contacts/${contact.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-blue-500 dark:text-blue-400 hover:underline flex-shrink-0"
                        >
                          View
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No contacts found' : 'No contacts yet'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right panel – Keypad (ClickSetGo style) */}
        <div
          className={cn(
            'flex-grow flex flex-col items-center justify-center w-full pt-16 pb-32 bg-white dark:bg-black',
            sidebarCollapsed ? 'md:pl-16' : 'md:pl-72'
          )}
        >
          {/* Selected contact pills */}
          {selectedContacts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md px-4">
              {selectedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm"
                >
                  <span>{contact.first_name} {contact.last_name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id))}
                    className="ml-2 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agent settings – open modal from Dialer */}
          <div className="mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAgentSettingsSheetOpen(true)}
              className="gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Agent settings
            </Button>
          </div>

          {/* Phone number display / input */}
          <div className="w-64 mb-4">
            {selectedContacts.length > 0 ? (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPhoneNumber(selectedContacts[0].phone)}
                </div>
                {selectedContacts.length > 1 && (
                  <div className="text-sm text-gray-400">&amp; {selectedContacts.length - 1} other{selectedContacts.length > 2 ? 's' : ''}</div>
                )}
              </div>
            ) : (
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="text-center text-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
              />
            )}
          </div>

          {/* Circular dial pad – ClickSetGo style */}
          <div className="grid grid-cols-3 gap-4 w-64 mb-6">
            {[
              { value: '1', letters: '' },
              { value: '2', letters: 'ABC' },
              { value: '3', letters: 'DEF' },
              { value: '4', letters: 'GHI' },
              { value: '5', letters: 'JKL' },
              { value: '6', letters: 'MNO' },
              { value: '7', letters: 'PQRS' },
              { value: '8', letters: 'TUV' },
              { value: '9', letters: 'WXYZ' },
              { value: '*', letters: '' },
              { value: '0', letters: '+' },
              { value: '#', letters: '' },
            ].map(({ value, letters }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleButtonClick(value)}
                className="flex flex-col items-center justify-center h-20 w-20 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 text-3xl font-normal transition-colors"
                aria-label={`Dial ${value}`}
              >
                {value}
                {letters && <span className="text-xs text-gray-500 dark:text-gray-400">{letters}</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="flex flex-col items-center justify-center h-20 w-20 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 text-xl transition-colors"
              aria-label="Backspace"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => setIsRedialModalOpen(true)}
              className="flex items-center justify-center h-20 w-20 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Recent calls"
            >
              <Clock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={handleCall}
              disabled={loading || (!input && selectedContacts.length === 0)}
              className="flex items-center justify-center h-20 w-20 rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:pointer-events-none text-white text-3xl transition-colors"
              aria-label="Call"
            >
              <Phone className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom nav – ClickSetGo style */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-black border-t border-gray-300 dark:border-gray-800 flex justify-around py-4 text-gray-900 dark:text-white z-40 px-4">
        <Link href="/admin/calls" className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <Star className="h-6 w-6" />
          <span className="text-xs">Favorites</span>
        </Link>
        <Link href="/admin/calls" className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <Clock className="h-6 w-6" />
          <span className="text-xs">Scheduled</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            setIsMultiSelectMode(!isMultiSelectMode);
            if (!isMultiSelectMode) setSelectedContacts([]);
          }}
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <User className="h-6 w-6" />
          <span className="text-xs">Contacts</span>
        </button>
        <span className="flex flex-col items-center gap-1 text-blue-500 dark:text-blue-400">
          <LayoutGrid className="h-6 w-6" />
          <span className="text-xs">Keypad</span>
        </span>
        <Link href="/admin/calls/history" className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <PhoneCall className="h-6 w-6" />
          <span className="text-xs">Calls</span>
        </Link>
      </div>

      {/* Call confirmation modal – ClickSetGo style */}
      <Dialog open={isCallModalOpen} onOpenChange={(open) => !loading && !open && setIsCallModalOpen(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6 data-[state=open]:duration-300 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-100/50 to-transparent dark:from-gray-900/30 dark:to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-t-2xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center space-x-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div className="text-xs text-green-600 dark:text-green-500 font-mono tracking-wider">SYSTEM READY</div>
            </div>
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              ESTABLISHING CONNECTION :: {contactNameForModal || formatPhoneNumber(input) || 'Unknown'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              <span className="font-mono text-xs tracking-wide">CONFIGURING AGENT PARAMETERS FOR COMMUNICATION</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6 relative z-10">
            <div className="space-y-1">
              <Label htmlFor="reason" className="text-xs font-mono text-blue-600 dark:text-indigo-400 uppercase tracking-wider mb-1 block">
                Reason for Call
              </Label>
              <div className="relative">
                <Textarea
                  id="reason"
                  rows={2}
                  value={callReason}
                  onChange={(e) => setCallReason(e.target.value)}
                  className="resize-none bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-blue-500/20 dark:focus:ring-indigo-500/20 pl-3 rounded-md"
                  placeholder="Enter reason for call"
                />
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500 dark:bg-indigo-500/50 rounded-l" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="message" className="text-xs font-mono text-blue-600 dark:text-indigo-400 uppercase tracking-wider block">
                  First Message
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-mono text-blue-600 dark:text-indigo-400 border border-blue-200 dark:border-indigo-500/20 hover:bg-blue-50 dark:hover:bg-indigo-500/10 transition-colors"
                  onClick={() => {
                    const firstName = contactNameForModal ? contactNameForModal.trim().split(' ')[0] || '' : '';
                    setFirstMessage(`Hey this is ${agentSettings.agentName} with ${agentSettings.companyName}. Am I speaking with ${firstName || 'there'}?`);
                  }}
                >
                  <span className="mr-1 text-green-600 dark:text-green-500">{'>'}</span> SET DEFAULT
                </Button>
              </div>
              <div className="relative overflow-hidden rounded-md">
                <Textarea
                  id="message"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Hey this is [Agent Name] with [Company Name]. Am I speaking with [Customer Name]?"
                  rows={4}
                  className="bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-blue-500/20 dark:focus:ring-indigo-500/20 resize-none rounded-md"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-purple-500/50" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                USE <span className="text-blue-600 dark:text-blue-400">{`{firstName}`}</span> TO DYNAMICALLY INSERT CONTACT NAME
              </p>
            </div>
          </div>
          <DialogFooter className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 relative z-10">
            <Button variant="outline" onClick={() => setIsCallModalOpen(false)} disabled={loading} className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              CANCEL
            </Button>
            <Button
              onClick={handleModalSubmit}
              disabled={loading || !callReason.trim()}
              className="relative overflow-hidden group border-0 text-white"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>INITIATE CALL</span>
                  </>
                )}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add contact modal */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add contact</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Add a new contact to your list. First and last name are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-first-name">First name</Label>
                <Input
                  id="add-first-name"
                  value={addContactFirstName}
                  onChange={(e) => setAddContactFirstName(e.target.value)}
                  placeholder="First name"
                  className="mt-1.5 border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
                />
              </div>
              <div>
                <Label htmlFor="add-last-name">Last name</Label>
                <Input
                  id="add-last-name"
                  value={addContactLastName}
                  onChange={(e) => setAddContactLastName(e.target.value)}
                  placeholder="Last name"
                  className="mt-1.5 border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add-phone">Phone (optional)</Label>
              <Input
                id="add-phone"
                type="tel"
                value={addContactPhone}
                onChange={(e) => setAddContactPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="mt-1.5 border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
              />
            </div>
            <div>
              <Label htmlFor="add-email">Email (optional)</Label>
              <Input
                id="add-email"
                type="email"
                value={addContactEmail}
                onChange={(e) => setAddContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="mt-1.5 border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContactOpen(false)} disabled={addContactSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddContactSubmit} disabled={addContactSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {addContactSubmitting ? 'Adding...' : 'Add contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent settings Sheet – full form from Dialer */}
      <Sheet open={isAgentSettingsSheetOpen} onOpenChange={setIsAgentSettingsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-gray-900 dark:text-white">Voice agent settings</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Configure the default M10 agent (Ben). All fields are saved to the DB and used on the next call.
            </p>
          </SheetHeader>
          <div className="mt-4">
            {agentSettingsFormLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <VoiceAgentSettingsForm
                settings={agentSettingsFormData}
                setSettings={setAgentSettingsFormData}
                onSave={handleAgentSettingsSave}
                saving={agentSettingsFormSaving}
                showLinkToFullPage
                compact
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Contact details Sheet (right-side, mirrors ClickSetGo ContactDetailsPanel) */}
      <Sheet
        open={showContactDetails && !!detailsContact}
        onOpenChange={(open) => {
          if (!open) {
            setShowContactDetails(false);
            setDetailsContact(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-gray-900 dark:text-white">Contact Details</SheetTitle>
          </SheetHeader>
          {detailsContact && (
            <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {(detailsContact.first_name || '?').charAt(0).toUpperCase()}
                    {(detailsContact.last_name || '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <Link
                    href={`/admin/contacts/${detailsContact.id}`}
                    className="text-2xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {detailsContact.first_name} {detailsContact.last_name}
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Contact Information</h3>
                {detailsContact.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white">{detailsContact.phone}</span>
                  </div>
                )}
                {(detailsContact.email ?? detailsContact.email_address) && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white">
                      {detailsContact.email ?? detailsContact.email_address}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link href={`/admin/contacts/${detailsContact.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    View full profile
                  </Button>
                </Link>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setSelectedContact(detailsContact);
                    setShowContactDetails(false);
                    setDetailsContact(null);
                    setIsCallModalOpen(true);
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Recent calls (redial) modal */}
      <Dialog open={isRedialModalOpen} onOpenChange={(open) => !open && setIsRedialModalOpen(false)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <DialogHeader className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-full p-2">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Recent Calls</DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 mt-1">Select a contact to redial</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {loadingRecentCalls ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 mt-4">Loading recent calls...</p>
              </div>
            ) : recentCalls.length > 0 ? (
              recentCalls.map((call) => {
                const phone = call.client_phone || '';
                const name = getRecentCallDisplayName(call);
                const callDate = new Date(call.started_at || call.created_at);
                const isOutgoing = call.direction === 'outbound';
                return (
                  <button
                    key={call.id}
                    type="button"
                    onClick={() => {
                      if (phone) {
                        setInput(phone);
                        const contact = contacts.find((c) => formatPhoneNumber(c.phone) === formatPhoneNumber(phone));
                        setSelectedContact(contact || null);
                        setIsRedialModalOpen(false);
                      }
                    }}
                    className="w-full flex items-start justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md text-left transition-all bg-white dark:bg-gray-900"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white">{name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{phone}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">{call.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {isOutgoing ? 'Outgoing' : 'Incoming'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {callDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="rounded-full p-4 bg-gray-100 dark:bg-gray-800 mb-4">
                  <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 text-center">No recent calls found</p>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2 max-w-xs">
                  Your recent outgoing calls will appear here after you make your first call.
                </p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <Button onClick={() => setIsRedialModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
