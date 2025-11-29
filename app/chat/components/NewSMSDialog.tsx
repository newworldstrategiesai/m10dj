'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconPlus, IconX, IconPhone, IconUserPlus, IconUser, IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toasts/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_id: string;
  notes?: string;
  opt_in_status?: boolean;
}

interface TwilioNumber {
  id: string;
  phoneNumber: string;
  friendlyName?: string;
}

export interface NewSMSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phoneNumber: string, contactName: string, fromNumber: string) => void;
  userId: string;
}

export const NewSMSDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  userId
}: NewSMSDialogProps) => {
  // State for the phone number input
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValidNumber, setIsValidNumber] = useState(false);
  
  // State for contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Twilio numbers
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [selectedTwilioNumber, setSelectedTwilioNumber] = useState<string>('');
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  
  // State for UI view
  const [showContacts, setShowContacts] = useState(false);

  // Format phone number for display
  const formatPhoneNumber = (input: string) => {
    if (!input) return '';
    
    // Remove all non-digit characters
    const cleaned = input.replace(/\D/g, '');
    
    // Format the number (iOS style)
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
      const [, area, prefix, line] = match;
      
      if (!area) return '';
      if (!prefix) return `(${area})`;
      if (!line) return `(${area}) ${prefix}`;
      
      return `(${area}) ${prefix}-${line}`;
    }
    return cleaned;
  };

  // Format phone number for E.164 format (required for Twilio)
  const formatE164 = (phone: string): string => {
    if (!phone) return '';
    
    // Remove non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If US number and no country code, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it has 11 digits and starts with 1, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it already has a + sign, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Otherwise just add a + (assume it already has country code)
    return `+${cleaned}`;
  };

  // Fetch contacts from Supabase
  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error fetching contacts',
        description: 'Could not load your contacts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch Twilio numbers from Supabase and/or environment
  const fetchTwilioNumbers = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingNumbers(true);
    try {
      // First try to get numbers from API endpoint that returns both user's numbers and env numbers
      const response = await fetch('/api/get-twilio-numbers-env', {
        headers: {
          'userId': userId
        }
      });
      
      if (response.ok) {
        const { numbers } = await response.json();
        
        if (numbers && numbers.length > 0) {
          const formattedNumbers = numbers.map((number: string, index: number) => ({
            id: `twilio-${index}`,
            phoneNumber: number,
            friendlyName: `Twilio Number ${index + 1}`
          }));
          
          setTwilioNumbers(formattedNumbers);
          // Select the first number by default
          setSelectedTwilioNumber(formattedNumbers[0]?.phoneNumber || '');
          return;
        }
      }
      
      // Fallback to checking environment variables directly
      const envResponse = await fetch('/api/get-env-phone-number');
      if (envResponse.ok) {
        const { phoneNumber } = await envResponse.json();
        if (phoneNumber) {
          setTwilioNumbers([{
            id: 'env-twilio',
            phoneNumber,
            friendlyName: 'Default Twilio Number'
          }]);
          setSelectedTwilioNumber(phoneNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      toast({
        title: 'Error fetching Twilio numbers',
        description: 'Could not load your Twilio numbers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingNumbers(false);
    }
  }, [userId]);

  // Load contacts and Twilio numbers when the dialog opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchContacts();
      fetchTwilioNumbers();
    }
  }, [isOpen, userId, fetchContacts, fetchTwilioNumbers]);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => 
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
      contact.phone.includes(query)
    );
    
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  // Validate phone number
  useEffect(() => {
    if (!phoneNumber) {
      setIsValidNumber(false);
      return;
    }
    
    try {
      const phoneObj = parsePhoneNumberFromString(phoneNumber);
      setIsValidNumber(!!phoneObj && phoneObj.isValid());
    } catch (error) {
      setIsValidNumber(false);
    }
  }, [phoneNumber]);

  // Handle phone number change with iOS-style formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '');
    
    // Format as we type to match iOS behavior
    const formattedNumber = formatPhoneNumber(digits);
    setPhoneNumber(formattedNumber);
  };

  // Handle search query change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowContacts(true);
  };

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setPhoneNumber(contact.phone);
    setShowContacts(false);
  };

  // Handle start conversation
  const handleSubmit = () => {
    if (!isValidNumber || !selectedTwilioNumber) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a valid phone number and select a Twilio number.',
        variant: 'destructive'
      });
      return;
    }
    
    // Find if this is an existing contact
    const existingContact = contacts.find(c => 
      c.phone === phoneNumber || formatE164(c.phone) === formatE164(phoneNumber)
    );
    
    const contactName = existingContact 
      ? `${existingContact.first_name} ${existingContact.last_name}`.trim() 
      : phoneNumber;
    
    onSubmit(
      formatE164(phoneNumber), 
      contactName,
      selectedTwilioNumber
    );
    
    // Reset form
    setPhoneNumber('');
    setSearchQuery('');
    onClose();
  };

  // Handle dialer key press
  const handleDialerKeyPress = (key: string) => {
    const newDigits = phoneNumber.replace(/\D/g, '') + key;
    setPhoneNumber(formatPhoneNumber(newDigits));
  };

  // Handle backspace
  const handleBackspace = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length > 0) {
      const newDigits = digits.slice(0, -1);
      setPhoneNumber(formatPhoneNumber(newDigits));
    }
  };

  // Toggle contacts view
  const toggleContactsView = () => {
    setShowContacts(!showContacts);
  };

  // Format the dialer keys with iOS style
  const dialerKeys = [
    { key: '1', letters: '' },
    { key: '2', letters: 'ABC' },
    { key: '3', letters: 'DEF' },
    { key: '4', letters: 'GHI' },
    { key: '5', letters: 'JKL' },
    { key: '6', letters: 'MNO' },
    { key: '7', letters: 'PQRS' },
    { key: '8', letters: 'TUV' },
    { key: '9', letters: 'WXYZ' },
    { key: '*', letters: '' },
    { key: '0', letters: '+' },
    { key: '#', letters: '' }
  ];

  const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );

  const DialerView = () => (
    <div className="flex flex-col items-center px-4 py-4">
      {/* Phone number input with country code */}
      <div className="w-full mb-8 px-4">
        <div className="flex items-center justify-center">
          <div className="relative flex items-center rounded-lg bg-[#333336] px-3 py-2">
            <div className="flex items-center text-white">
              <img 
                src="/assets/us-flag.png" 
                alt="US Flag" 
                className="w-6 h-4 mr-1"
                onError={(e) => {
                  // Fallback if image doesn't load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className="mr-1">+1</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </div>
          </div>
          <div className="text-xl text-center text-white ml-4">
            {phoneNumber || '+1 Phone number'}
          </div>
        </div>
      </div>

      {/* Dialer keypad */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-5 w-full max-w-md">
        {[0, 3, 6, 9].map(rowStart => (
          <React.Fragment key={`row-${rowStart}`}>
            {dialerKeys.slice(rowStart, rowStart + 3).map((keyObj) => (
              <button
                key={keyObj.key}
                className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full border border-[#494949] text-white hover:bg-[#333336] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 mx-auto"
                onClick={() => handleDialerKeyPress(keyObj.key)}
                aria-label={`Dial ${keyObj.key}${keyObj.letters ? ` (${keyObj.letters})` : ''}`}
                type="button"
              >
                <span className="text-[32px] font-light" aria-hidden="true">{keyObj.key}</span>
                {keyObj.letters && <span className="text-[10px] text-[#8E8E93] mt-1" aria-hidden="true">{keyObj.letters}</span>}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center justify-center mt-6 space-x-6">
        <button
          className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full border border-[#494949] text-white hover:bg-[#333336] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2"
          onClick={handleBackspace}
          aria-label="Delete last digit"
          type="button"
        >
          <IconX className="h-8 w-8" aria-hidden="true" />
        </button>
        <button
          className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-[#30D158] text-white hover:bg-[#27b44b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#30D158] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={!isValidNumber || !selectedTwilioNumber}
          aria-label={!isValidNumber || !selectedTwilioNumber ? 'Call number (disabled - enter valid number)' : 'Call number'}
          type="button"
        >
          <IconPhone className="h-8 w-8" aria-hidden="true" />
        </button>
        <button
          className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full border border-[#494949] text-[#007AFF] hover:bg-[#333336] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2"
          onClick={toggleContactsView}
          aria-label="Add from contacts"
          aria-expanded={showContacts}
          type="button"
        >
          <IconPlus className="h-8 w-8" aria-hidden="true" />
        </button>
      </div>

      {/* Twilio Number Selection */}
      <div className="mt-8 w-full">
        <div className="text-center text-[#8E8E93] mb-2">Select Twilio Number:</div>
        <div className="relative w-full">
          <select 
            value={selectedTwilioNumber} 
            onChange={(e) => setSelectedTwilioNumber(e.target.value)}
            className="w-full bg-[#333336] text-white border border-[#494949] rounded-lg py-2 px-4 appearance-none"
          >
            {twilioNumbers.map((number) => (
              <option key={number.id} value={number.phoneNumber}>
                {formatE164(number.phoneNumber)}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-white opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );

  const ContactsView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[#38383A]">
        <h2 className="text-xl text-white font-medium">Contacts</h2>
        <div className="flex space-x-4">
          <button className="text-[#007AFF]">
            <IconUserPlus className="h-6 w-6" />
          </button>
          <button className="text-[#007AFF]" onClick={toggleContactsView}>
            Done
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <IconSearch className="h-4 w-4 text-[#8E8E93]" />
          </div>
          <Input
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-10 text-[15px] bg-[#333336] border-0 rounded-lg placeholder:text-[#8E8E93] text-white"
          />
        </div>
        
        <div className="space-y-px max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-[#8E8E93]">Loading contacts...</div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-center px-4 py-3 hover:bg-[#333336] rounded-lg cursor-pointer"
                onClick={() => handleContactSelect(contact)}
              >
                <Avatar className="h-12 w-12 mr-4 bg-[#007AFF] text-white">
                  <AvatarFallback className="text-lg">
                    {`${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-[17px] font-medium text-white">
                    {`${contact.first_name} ${contact.last_name}`}
                  </div>
                  <div className="text-sm text-[#8E8E93]">
                    {formatPhoneNumber(contact.phone)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-[#8E8E93]">
              {searchQuery ? "No contacts found" : "No contacts available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-0 bg-black shadow-xl overflow-hidden max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New SMS Message</DialogTitle>
          <DialogDescription>
            Start a new SMS conversation by entering the recipient's details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label htmlFor="contactName" className="text-sm font-medium">
              Contact Name (optional)
            </label>
            <Input
              id="contactName"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="fromNumber" className="text-sm font-medium">
              From Number
            </label>
            <Input
              id="fromNumber"
              value={selectedTwilioNumber}
              onChange={(e) => setSelectedTwilioNumber(e.target.value)}
              placeholder="Your Twilio number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValidNumber || !selectedTwilioNumber}>
            Start Conversation
          </Button>
        </DialogFooter>
        {showContacts ? <ContactsView /> : <DialerView />}
      </DialogContent>
    </Dialog>
  );
};

export default NewSMSDialog; 