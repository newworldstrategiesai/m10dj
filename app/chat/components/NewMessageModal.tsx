'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/Toasts/use-toast';
import { 
  IconPhone, 
  IconUser, 
  IconSearch, 
  IconPlus, 
  IconClock,
  IconCheck,
  IconX,
  IconMessage,
  IconUsers,
  IconTemplate
} from '@tabler/icons-react';
import { cn } from '@/utils/cn';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email_address?: string;
  company?: string;
  lead_status?: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phoneNumber: string, contactName: string, fromNumber: string, message?: string) => void;
  userId: string;
  contacts?: Contact[];
}

// Common message templates
const MESSAGE_TEMPLATES = [
  "Hi! Thanks for your interest in M10 DJ Company. How can we help with your event?",
  "Thank you for reaching out! We'd love to discuss your DJ needs. When is your event?",
  "Hello! We received your inquiry. What type of event are you planning?",
  "Hi there! We're excited to potentially work with you. What's your event date and location?"
];

// Phone number formatting utility
const formatPhoneNumber = (value: string): string => {
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

// Validate phone number
const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
};

export default function NewMessageModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userId,
  contacts = []
}: NewMessageModalProps) {
  const [step, setStep] = useState<'contact' | 'message'>('contact');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [fromNumbers, setFromNumbers] = useState<string[]>([]);
  const [selectedFromNumber, setSelectedFromNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const phone = contact.phone ? contact.phone.replace(/[^\d]/g, '') : '';
    const searchPhone = searchQuery.replace(/[^\d]/g, '');

    return fullName.includes(query) ||
           (contact.phone && phone.includes(searchPhone)) ||
           contact.company?.toLowerCase().includes(query);
  });

  // Get recent contacts (simulate - you might want to track this)
  useEffect(() => {
    const recent = contacts
      .filter(c => c.lead_status !== 'Cold')
      .slice(0, 6);
    setRecentContacts(recent);
  }, [contacts]);

  // Fetch available Twilio numbers
  useEffect(() => {
    if (isOpen) {
      // You might want to create an API to fetch available Twilio numbers
      const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+19014977001';
      setFromNumbers([twilioNumber]);
      setSelectedFromNumber(twilioNumber);
    }
  }, [isOpen]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    
    // Auto-search for matching contact
    const digits = value.replace(/[^\d]/g, '');
    const matchingContact = contacts.find(c =>
      c.phone && c.phone.replace(/[^\d]/g, '').includes(digits) && digits.length >= 4
    );
    
    if (matchingContact && digits.length >= 7) {
      setSelectedContact(matchingContact);
      setContactName(`${matchingContact.first_name || ''} ${matchingContact.last_name || ''}`.trim());
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setPhoneNumber(contact.phone || '');
    setContactName(`${contact.first_name || ''} ${contact.last_name || ''}`.trim());
    setSearchQuery('');
  };

  const handleTemplateSelect = (template: string) => {
    setMessage(template);
  };

  const handleSubmit = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    // Convert to E.164 format
    const digits = phoneNumber.replace(/[^\d]/g, '');
    const e164Phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;

    onSubmit(e164Phone, contactName, selectedFromNumber, message);
    handleClose();
  };

  const handleClose = () => {
    setStep('contact');
    setPhoneNumber('');
    setContactName('');
    setMessage('');
    setSearchQuery('');
    setSelectedContact(null);
    onClose();
  };

  const getContactInitials = (contact: Contact) => {
    return `${(contact.first_name || '')[0] || ''}${(contact.last_name || '')[0] || ''}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <IconMessage className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">New Message</DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {step === 'contact' ? 'Choose recipient' : 'Compose message'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900">
          {step === 'contact' ? (
            <div className="p-6 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search contacts or enter phone number..."
                  value={searchQuery || phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.replace(/[^\d]/g, '').length > 0) {
                      handlePhoneChange(value);
                    } else {
                      setSearchQuery(value);
                      setPhoneNumber('');
                    }
                  }}
                  className="pl-10 h-12 text-base border-2 focus:border-blue-500 dark:border-gray-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-blue-400"
                />
              </div>

              {/* Selected Contact Preview */}
              {selectedContact && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-500/50">
                  <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-blue-200 dark:ring-blue-500 dark:ring-offset-slate-900">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getContactInitials(selectedContact)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{contactName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{phoneNumber}</p>
                    {selectedContact.company && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedContact.company}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs border border-blue-200 dark:border-blue-500/70 dark:bg-blue-900/40">
                    {selectedContact.lead_status || 'Contact'}
                  </Badge>
                </div>
              )}

              {/* Manual Entry */}
              {!selectedContact && phoneNumber && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <IconPlus className="h-4 w-4" />
                    <span>New contact</span>
                  </div>
                  <Input
                    placeholder="Contact name (optional)"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-11 dark:border-gray-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                </div>
              )}

              {/* Recent Contacts */}
              {searchQuery === '' && recentContacts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <IconClock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Recent</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {recentContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleContactSelect(contact)}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-left border-gray-200 dark:border-gray-700"
                      >
                        <Avatar className="h-8 w-8 ring-1 ring-offset-2 ring-gray-200 dark:ring-offset-slate-900 dark:ring-gray-600">
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {getContactInitials(contact)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                            {contact.first_name || ''} {contact.last_name || ''}
                          </p>
                          <p className="text-xs text-gray-500 truncate dark:text-gray-400">{contact.phone || 'No phone'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchQuery && filteredContacts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <IconUsers className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Contacts ({filteredContacts.length})
                    </span>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {filteredContacts.map((contact) => {
                        const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown contact';
                        return (
                          <button
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-left w-full border border-transparent hover:border-blue-200 dark:hover:border-blue-500/40"
                          >
                            <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-gray-100 dark:ring-offset-slate-900 dark:ring-blue-500/30">
                              <AvatarFallback className="bg-gray-600 text-white">
                                {getContactInitials(contact)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {fullName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{contact.phone || 'No phone number'}</p>
                              {contact.company && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{contact.company}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs border border-blue-100 dark:border-blue-500/50 dark:bg-blue-900/30">
                              {contact.lead_status || 'Contact'}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Recipient Summary */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg">
                <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-blue-200 dark:ring-blue-500 dark:ring-offset-slate-900">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedContact ? getContactInitials(selectedContact) : <IconUser className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{contactName || phoneNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{phoneNumber}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStep('contact')}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>

              {/* Message Templates */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconTemplate className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Quick Templates</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {MESSAGE_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/60 dark:hover:bg-slate-700/70 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-slate-100"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Message Composer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Your Message
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none dark:bg-slate-800 dark:border-gray-700 dark:text-slate-100"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {message.length}/160 characters
                  </span>
                  {message.length > 160 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Long messages may be split
                    </span>
                  )}
                </div>
              </div>

              {/* From Number */}
              {fromNumbers.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Send From
                  </label>
                  <Select value={selectedFromNumber} onValueChange={setSelectedFromNumber}>
                    <SelectTrigger className="dark:bg-slate-800 dark:border-gray-700 dark:text-slate-100">
                      <SelectValue placeholder="Select phone number" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-gray-700">
                      {fromNumbers.map((number) => (
                        <SelectItem key={number} value={number}>
                          {number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          {step === 'contact' ? (
            <Button
              onClick={() => setStep('message')}
              disabled={!phoneNumber.trim() || !isValidPhoneNumber(phoneNumber)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Next
              <IconCheck className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? 'Sending...' : 'Send Message'}
              <IconMessage className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}