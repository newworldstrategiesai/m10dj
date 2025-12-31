'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, User, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_id: string;
  email?: string;
  notes?: string;
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
  
  // State
  const [input, setInput] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [callReason, setCallReason] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  
  // Agent settings
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    agentName: 'AI Assistant',
    role: 'Customer Service Representative',
    companyName: 'M10 DJ Company',
    prompt: 'You are a friendly and professional customer service representative.',
  });

  // Format phone number to E.164
  const formatPhoneNumber = (phoneNumber: string | undefined): string => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return '';
    }
    
    const phoneNumberObject = parsePhoneNumberFromString(phoneNumber);
    if (phoneNumberObject) {
      return phoneNumberObject.format('E.164');
    }
    
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (!digitsOnly) {
      return '';
    }
    
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    } else if (digitsOnly.length > 8) {
      if (phoneNumber.startsWith('+')) {
        return phoneNumber;
      } else if (phoneNumber.startsWith('00')) {
        return '+' + phoneNumber.substring(2);
      } else {
        return `+${digitsOnly}`;
      }
    }
    
    return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  };

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('first_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching contacts:', error);
      } else {
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contacts',
        variant: 'destructive',
      });
    }
  }, [userId, supabase, toast]);

  // Fetch agent settings from database if available
  const fetchAgentSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        setAgentSettings({
          agentName: data.agent_name || 'AI Assistant',
          role: data.role || 'Customer Service Representative',
          companyName: data.company_name || 'M10 DJ Company',
          prompt: data.prompt || 'You are a friendly and professional customer service representative.',
        });
      }
    } catch (error) {
      console.error('Error fetching agent settings:', error);
      // Use defaults if fetch fails
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchContacts();
    fetchAgentSettings();
  }, [fetchContacts, fetchAgentSettings]);

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(query) ||
      contact.last_name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query)
    );
  });

  // Handle dial pad button clicks
  const handleButtonClick = (value: string) => {
    setInput((prev) => (prev ? prev + value : value));
  };

  // Handle backspace
  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  // Handle call button click
  const handleCall = async () => {
    const formattedNumber = formatPhoneNumber(input);
    
    if (!formattedNumber || formattedNumber.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    // Check if contact exists
    const contact = contacts.find(
      (c) => formatPhoneNumber(c.phone) === formattedNumber
    );

    if (contact) {
      setSelectedContact(contact);
    } else {
      setSelectedContact(null);
    }

    setIsCallModalOpen(true);
  };

  // Handle contact click
  const handleContactClick = (contact: Contact) => {
    setInput(contact.phone);
    setSelectedContact(contact);
    setIsCallModalOpen(true);
  };

  // Handle modal submit (initiate call)
  const handleModalSubmit = async () => {
    try {
      setLoading(true);
      
      const formattedNumber = formatPhoneNumber(input);
      if (!formattedNumber) {
        toast({
          title: 'Invalid Phone Number',
          description: 'Please enter a valid phone number',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        contactId: selectedContact?.id || null,
        phoneNumber: formattedNumber,
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate call');
      }

      toast({
        title: 'Success',
        description: 'Call initiated successfully!',
      });
      setIsCallModalOpen(false);
      setInput('');
      setCallReason('');
      setFirstMessage('');
      setSelectedContact(null);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initiate call',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Contacts</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Add new contact functionality
                    toast({
                      title: 'Coming Soon',
                      description: 'Add contact functionality coming soon',
                    });
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Contacts List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactClick(contact)}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium mr-3">
                        {contact.first_name.charAt(0).toUpperCase()}
                        {contact.last_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No contacts found' : 'No contacts yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dialer */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-6">Dialer</h1>
              
              {/* Phone Number Input */}
              <div className="mb-8">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="mt-2 text-lg"
                />
                {input && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatPhoneNumber(input) || 'Invalid phone number format'}
                  </p>
                )}
              </div>

              {/* Dial Pad */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
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
                ].map((button) => (
                  <button
                    key={button.value}
                    onClick={() => handleButtonClick(button.value)}
                    className="flex flex-col items-center justify-center h-20 bg-gray-100 dark:bg-gray-800 rounded-lg text-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {button.value}
                    {button.letters && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {button.letters}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleBackspace}
                  className="flex items-center justify-center h-20 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Call Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleCall}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                  disabled={!input || loading}
                >
                  <Phone className="h-6 w-6 mr-2" />
                  {loading ? 'Calling...' : 'Call'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Confirmation Modal */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Call</DialogTitle>
            <DialogDescription>
              {selectedContact
                ? `Calling ${selectedContact.first_name} ${selectedContact.last_name}`
                : `Calling ${formatPhoneNumber(input)}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Call Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={callReason}
                onChange={(e) => setCallReason(e.target.value)}
                placeholder="Why are you calling?"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="message">First Message (Optional)</Label>
              <Textarea
                id="message"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Optional message to start the conversation"
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCallModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModalSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Initiating...' : 'Start Call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

