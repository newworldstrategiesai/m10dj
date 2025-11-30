'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Phone, Mail, Calendar, MapPin, Music, DollarSign, User, MessageSquare, Edit3, Trash2, CheckCircle, Loader2, FileText, Copy, Clock } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import ServiceSelectionButton from '@/components/admin/ServiceSelectionButton';
import PaymentHistory from '@/components/admin/PaymentHistory';
import InvoiceList from '@/components/admin/InvoiceList';
import PipelineView from '@/components/admin/PipelineView';
import UnifiedCommunicationHub from '@/components/admin/UnifiedCommunicationHub';
import { syncVenueFromContactToProjects } from '@/utils/sync-venue-data';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  event_type: string | null;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  guest_count: number | null;
  budget_range: string | null;
  quoted_price: number | null;
  final_price: number | null;
  special_requests: string | null;
  music_genres: string[] | null;
  equipment_needs: string[] | null;
  lead_status: string | null;
  lead_source: string | null;
  lead_stage: string | null;
  lead_temperature: string | null;
  communication_preference: string | null;
  payment_status: string | null;
  notes: string | null;
  custom_fields?: any; // For storing service selections and other custom data
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  event_name: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  event_duration: number | null;
  venue_name: string | null;
  venue_address: string | null;
  number_of_guests: number | null;
  special_requests: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const EVENT_TYPES = [
  'wedding',
  'corporate',
  'school_dance', 
  'holiday_party',
  'private_party',
  'other'
];

const LEAD_STATUSES = [
  'New',
  'Contacted', 
  'Qualified',
  'Proposal Sent',
  'Negotiating',
  'Booked',
  'Lost',
  'Completed'
];

const LEAD_TEMPERATURES = ['Hot', 'Warm', 'Cold'];
const COMMUNICATION_PREFERENCES = ['email', 'phone', 'text', 'any'];

export default function ContactDetailPage() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalTemplate, setEmailModalTemplate] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [socialMessages, setSocialMessages] = useState<any[]>([]);
  const [socialMessagesLoading, setSocialMessagesLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [quoteSelections, setQuoteSelections] = useState<any[]>([]);
  const [quoteSelectionsLoading, setQuoteSelectionsLoading] = useState(false);
  const [communications, setCommunications] = useState<any[]>([]);
  const [communicationsLoading, setCommunicationsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lookingUpVenue, setLookingUpVenue] = useState(false);
  const venueLookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmailParser, setShowEmailParser] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [parsingEmail, setParsingEmail] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const { id, from } = router.query as { id: string; from?: string };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && id) {
      fetchContact();
      fetchProjects();
      fetchPayments();
      fetchInvoices();
      fetchSocialMessages();
      fetchContracts();
      fetchQuoteSelections();
      // Communications are now handled by UnifiedCommunicationHub component
    }
  }, [user, id]);

  // Auto-update lead_status based on payment status
  useEffect(() => {
    if (!contact || !payments.length || !id) return;

    // Check if contact is fully paid
    const totalPaid = payments
      .filter((p: any) => p.status === 'succeeded' || p.status === 'paid' || p.payment_status === 'Paid')
      .reduce((sum: number, p: any) => sum + (Number(p.total_amount) || Number(p.amount) || 0), 0);
    
    const quoteValue = contact.quoted_price || contact.final_price || 0;
    const isFullyPaid = quoteValue > 0 && totalPaid >= quoteValue;

    // If fully paid and status is "Lost", update to "Booked"
    if (isFullyPaid && contact.lead_status === 'Lost') {
      const updateStatus = async () => {
        try {
          const { error } = await supabase
            .from('contacts')
            .update({ 
              lead_status: 'Booked',
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (!error) {
            setContact({ ...contact, lead_status: 'Booked', payment_status: 'paid' });
            toast({
              title: "Status Updated",
              description: "Contact status updated to 'Booked' based on payment status",
            });
          }
        } catch (error) {
          console.error('Error updating lead status:', error);
        }
      };
      updateStatus();
    }
  }, [contact, payments, id, supabase, toast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (venueLookupTimeoutRef.current) {
        clearTimeout(venueLookupTimeoutRef.current);
      }
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/signin');
        return;
      }

      // Check if user is admin using email-based authentication (same as other admin helpers)
      const adminEmails = [
        'admin@m10djcompany.com',
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'  // Ben Murray - Owner
      ];

      if (!adminEmails.includes(user.email || '')) {
        router.push('/signin');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/signin');
    }
  };

  const fetchContact = async () => {
    try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
        .eq('id', id)
        .single();
        
        if (error) {
        console.error('Error fetching contact:', error);
        toast({
          title: "Error",
          description: "Failed to load contact details",
          variant: "destructive"
        });
          return;
        }
        
      setContact(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error", 
        description: "Failed to load contact details",
        variant: "destructive"
      });
      } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!id) return;
    
    setProjectsLoading(true);
    try {
      const response = await fetch(`/api/get-contact-projects?contactId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects');
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!id) return;
    
    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('contact_id', id)
        .order('transaction_date', { ascending: false, nullsFirst: false })
        .order('due_date', { ascending: false, nullsFirst: false });
      
      if (error) {
        console.error('Error fetching payments:', error);
      } else {
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (!id) return;
    
    setInvoicesLoading(true);
    try {
      // First, try to fetch from invoice_summary view
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoice_summary')
        .select('*')
        .eq('contact_id', id)
        .order('invoice_date', { ascending: false });
      
      // Also check if there's a quote_selection (which means an invoice exists)
      // The invoice page uses quote data, so if a quote exists, an invoice exists
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_selections')
        .select('id, lead_id, total_price, created_at, package_name')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // If we have invoice_summary data, use it (this is the preferred source)
      if (invoiceData && invoiceData.length > 0) {
        setInvoices(invoiceData);
      } else if (quoteData && quoteData.length > 0) {
        // If no invoice_summary but we have a quote, create a synthetic invoice entry
        // This allows the UI to show that an invoice exists (since invoice page uses quote data)
        const quote = quoteData[0];
        const syntheticInvoice = {
          id: quote.id,
          contact_id: id,
          invoice_number: `INV-${id.substring(0, 8).toUpperCase()}`,
          total_amount: quote.total_price || 0,
          invoice_date: quote.created_at || new Date().toISOString(),
          invoice_status: 'pending',
          invoice_title: quote.package_name || 'Service Invoice',
          // Add lead_id so PipelineView can use it for links
          lead_id: quote.lead_id || id
        };
        setInvoices([syntheticInvoice]);
      } else {
        // No invoices found
        setInvoices([]);
      }
      
      // Log errors but don't block invoice creation if quote exists
      if (invoiceError && !quoteData) {
        console.warn('Error fetching from invoice_summary (but quote may exist):', invoiceError);
      }
      if (quoteError) {
        console.warn('Error fetching quote_selections:', quoteError);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchSocialMessages = async () => {
    if (!id) return;
    
    setSocialMessagesLoading(true);
    try {
      // Fetch Instagram messages
      const { data: instagramMessages } = await supabase
        .from('instagram_messages')
        .select('*')
        .eq('contact_id', id)
        .order('timestamp', { ascending: true });

      // Fetch Messenger messages
      const { data: messengerMessages } = await supabase
        .from('messenger_messages')
        .select('*')
        .eq('contact_id', id)
        .order('timestamp', { ascending: true });

      // Combine and sort by timestamp
      const allMessages = [
        ...(instagramMessages || []).map(m => ({ ...m, platform: 'instagram' })),
        ...(messengerMessages || []).map(m => ({ ...m, platform: 'messenger' }))
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setSocialMessages(allMessages);
    } catch (error) {
      console.error('Error fetching social messages:', error);
    } finally {
      setSocialMessagesLoading(false);
    }
  };

  const fetchContracts = async () => {
    if (!id) return;
    
    setContractsLoading(true);
    try {
      // First, try to fetch from contracts table
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false });
      
      // Also check if there's a quote_selection (which means contract page exists)
      // The contract page uses quote data, so if a quote exists, a contract page exists
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_selections')
        .select('id, lead_id, created_at, package_name')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // If we have contract data, use it (this is the preferred source)
      if (contractData && contractData.length > 0) {
        setContracts(contractData);
      } else if (quoteData && quoteData.length > 0) {
        // If no contract table entry but we have a quote, create a synthetic contract entry
        // This allows the UI to show that a contract page exists (since contract page uses quote data)
        const quote = quoteData[0];
        const syntheticContract = {
          id: quote.id,
          contact_id: id,
          lead_id: quote.lead_id || id, // Include lead_id for PipelineView links
          status: 'pending', // Default status
          created_at: quote.created_at || new Date().toISOString(),
          contract_type: 'service_agreement',
          title: quote.package_name || 'Service Contract'
        };
        setContracts([syntheticContract]);
      } else {
        // No contracts found
        setContracts([]);
      }
      
      // Log errors but don't block contract creation if quote exists
      if (contractError && !quoteData) {
        console.warn('Error fetching from contracts table (but quote may exist):', contractError);
      }
      if (quoteError) {
        console.warn('Error fetching quote_selections for contract:', quoteError);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setContractsLoading(false);
    }
  };

  const fetchQuoteSelections = async () => {
    if (!id) return;
    
    setQuoteSelectionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quote_selections')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching quote selections:', error);
      } else {
        setQuoteSelections(data || []);
      }
    } catch (error) {
      console.error('Error fetching quote selections:', error);
    } finally {
      setQuoteSelectionsLoading(false);
    }
  };

  const fetchCommunications = async () => {
    if (!id) return;
    
    setCommunicationsLoading(true);
    try {
      const allCommunications: any[] = [];
      
      // Get contact data if not already loaded
      let contactData: { first_name?: string | null; last_name?: string | null; email_address?: string | null } | null = contact;
      if (!contactData) {
        const { data } = await supabase
          .from('contacts')
          .select('first_name, last_name, email_address')
          .eq('id', id)
          .single();
        contactData = data;
      }

      // Fetch SMS conversations
      const { data: smsMessages } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (smsMessages) {
        smsMessages.forEach(msg => {
          allCommunications.push({
            id: msg.id,
            type: 'sms',
            direction: msg.direction,
            content: msg.message_content,
            subject: null,
            status: msg.message_status,
            sent_by: msg.direction === 'outbound' ? 'Admin' : contactData?.first_name || 'Customer',
            sent_to: msg.direction === 'outbound' ? contactData?.first_name || 'Customer' : 'Admin',
            created_at: msg.created_at,
            metadata: {
              message_type: msg.message_type,
              twilio_message_sid: msg.twilio_message_sid
            }
          });
        });
      }

      // Fetch email tracking (emails sent)
      const { data: emailTracking } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false });

      if (emailTracking) {
        emailTracking.forEach(email => {
          if (email.event_type === 'sent') {
            allCommunications.push({
              id: email.id,
              type: 'email',
              direction: 'outbound',
              content: email.subject || 'Email sent',
              subject: email.subject,
              status: email.opened_at ? 'read' : 'sent',
              sent_by: 'Admin',
              sent_to: email.recipient_email,
              created_at: email.created_at,
              metadata: {
                email_id: email.email_id,
                opened_at: email.opened_at
              }
            });
          }
        });
      }

      // Fetch communication_log (if contact_submission_id exists)
      // First, try to find contact_submission_id for this contact
      if (contactData?.email_address) {
        const { data: submissions } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('email', contactData.email_address)
          .limit(1);

        if (submissions && submissions.length > 0) {
          const submissionId = submissions[0].id;
          const { data: commLogs } = await supabase
            .from('communication_log')
            .select('*')
            .eq('contact_submission_id', submissionId)
            .order('created_at', { ascending: false });

          if (commLogs) {
            commLogs.forEach(comm => {
              allCommunications.push({
                id: comm.id,
                type: comm.communication_type,
                direction: comm.direction,
                content: comm.content,
                subject: comm.subject,
                status: comm.status,
                sent_by: comm.sent_by || 'Admin',
                sent_to: comm.sent_to || contactData?.email_address || '',
                created_at: comm.created_at,
                metadata: comm.metadata || {}
              });
            });
          }
        }
      }

      // Sort all communications by date (newest first)
      allCommunications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCommunications(allCommunications);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setCommunicationsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contact) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: contact.first_name,
          last_name: contact.last_name,
          email_address: contact.email_address,
          phone: contact.phone,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          event_type: contact.event_type,
          event_date: contact.event_date,
          event_time: contact.event_time,
          venue_name: contact.venue_name,
          venue_address: contact.venue_address,
          guest_count: contact.guest_count,
          budget_range: contact.budget_range,
          special_requests: contact.special_requests,
          music_genres: contact.music_genres,
          equipment_needs: contact.equipment_needs,
          lead_status: contact.lead_status,
          lead_source: contact.lead_source,
          lead_stage: contact.lead_stage,
          lead_temperature: contact.lead_temperature,
          communication_preference: contact.communication_preference,
          notes: contact.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Sync venue data to linked projects
      await syncVenueFromContactToProjects(id, {
        venue_name: contact.venue_name,
        venue_address: contact.venue_address,
      });

      toast({
        title: "Success",
        description: "Contact updated successfully"
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleParseEmail = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste email content",
        variant: "destructive"
      });
      return;
    }

    setParsingEmail(true);
    try {
      const response = await fetch(`/api/contacts/${id}/parse-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Email parsed and contact updated successfully"
        });
        
        // Refresh contact data
        await fetchContact();
        
        // Clear email content and close modal
        setEmailContent('');
        setShowEmailParser(false);
      } else {
        throw new Error(data.error || 'Failed to parse email');
      }
    } catch (error: any) {
      console.error('Error parsing email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to parse email",
        variant: "destructive"
      });
    } finally {
      setParsingEmail(false);
    }
  };

  const lookupVenueAddress = async (venueName: string) => {
    if (!venueName || venueName.trim().length < 2) return;
    
    setLookingUpVenue(true);
    try {
      // First, try to find in our database
      const venueSearchTerm = venueName
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical content like "(formerly Pin Oak)"
        .trim();
      
      const { data: venueMatches, error: venueError } = await supabase
        .from('preferred_venues')
        .select('venue_name, address, city, state, zip_code')
        .ilike('venue_name', `%${venueSearchTerm}%`)
        .eq('is_active', true)
        .limit(1);

      if (!venueError && venueMatches && venueMatches.length > 0) {
        const matchedVenue = venueMatches[0];
        if (matchedVenue.address) {
          // Format address: "123 Main St, Memphis, TN 38103" or just "123 Main St" if city/state not available
          const formattedAddress = matchedVenue.address.includes(',')
            ? matchedVenue.address
            : `${matchedVenue.address}${matchedVenue.city ? `, ${matchedVenue.city}` : ''}${matchedVenue.state ? `, ${matchedVenue.state}` : ''}${matchedVenue.zip_code ? ` ${matchedVenue.zip_code}` : ''}`.trim();
          
          // Only update if address is currently empty
          if (contact && (!contact.venue_address || contact.venue_address.trim() === '')) {
            setContact({ ...contact, venue_address: formattedAddress });
            toast({
              title: "Venue Address Found",
              description: `Auto-filled address for ${venueName} from database`,
            });
            return;
          }
        }
      }

      // If not found in database, try Google Places API
      if (contact && (!contact.venue_address || contact.venue_address.trim() === '')) {
        try {
          const response = await fetch(`/api/google/venue-lookup?query=${encodeURIComponent(venueName)}`);
          const data = await response.json();

          if (data.success && data.results && data.results.length > 0) {
            // Use the first result (most relevant)
            const googleVenue = data.results[0];
            if (googleVenue.address && contact) {
              setContact({ ...contact, venue_address: googleVenue.address });
              toast({
                title: "Venue Address Found",
                description: `Auto-filled address for ${venueName} from Google`,
              });
            }
          }
        } catch (googleError) {
          console.error('Error looking up venue in Google:', googleError);
          // Silently fail - user can enter address manually
        }
      }
    } catch (lookupError) {
      console.error('Error looking up venue address:', lookupError);
      // Don't show error toast - just silently fail
    } finally {
      setLookingUpVenue(false);
    }
  };

  const handleInputChange = (field: keyof Contact, value: any) => {
    if (!contact) return;
    setContact({ ...contact, [field]: value });
    
    // Auto-lookup venue address when venue name changes and address is empty
    if (field === 'venue_name' && value && (!contact.venue_address || contact.venue_address.trim() === '')) {
      // Clear any existing timeout
      if (venueLookupTimeoutRef.current) {
        clearTimeout(venueLookupTimeoutRef.current);
      }
      
      // Debounce the lookup - wait 500ms after user stops typing
      venueLookupTimeoutRef.current = setTimeout(() => {
        lookupVenueAddress(value);
      }, 500);
    }
  };

  const getContactInitials = () => {
    if (!contact) return 'C';
    return `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() || 'C';
  };

  const getLeadStatusColor = (status: string | null) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Qualified': return 'bg-green-100 text-green-800';
      case 'Proposal Sent': return 'bg-purple-100 text-purple-800';
      case 'Negotiating': return 'bg-orange-100 text-orange-800';
      case 'Booked': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00]"></div>
        </div>
    );
  }

  if (!user) {
    return null; // Will redirect via checkUser
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact not found</h2>
          <Link href={from === 'lead' ? `/admin/leads/${id}` : "/admin/contacts"}>
            <Button>← {from === 'lead' ? 'Back to Lead Details' : 'Back to Contacts'}</Button>
          </Link>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <Link href={from === 'lead' ? `/admin/leads/${id}` : "/admin/contacts"}>
              <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{from === 'lead' ? 'Back to Lead Details' : 'Back to Contacts'}</span>
              </Button>
            </Link>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Edit3 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Edit Contact</span>
            </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      fetchContact(); // Reset changes
                    }}
                    className="flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
              )}
              </div>
            </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
              <AvatarFallback className="bg-[#fcba00] text-black text-lg sm:text-xl font-bold">
                {getContactInitials()}
                      </AvatarFallback>
                    </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">{contact.email_address}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {contact.lead_status && (
                  <Badge className={`${getLeadStatusColor(contact.lead_status)} text-xs`}>
                    {contact.lead_status}
                  </Badge>
                )}
                {contact.lead_temperature && (
                  <Badge className={`text-xs ${contact.lead_temperature === 'Hot' ? 'bg-red-100 text-red-800' : 
                    contact.lead_temperature === 'Warm' ? 'bg-orange-100 text-orange-800' : 
                    'bg-blue-100 text-blue-800'}`}>
                    {contact.lead_temperature}
                  </Badge>
                )}
                  </div>
                    </div>
            <div className="flex gap-2 flex-shrink-0">
              {contact.phone && (
                <Button variant="outline" onClick={() => window.open(`tel:${contact.phone}`)} size="sm" className="p-2">
                  <Phone className="h-4 w-4" />
                        </Button>
              )}
              {contact.email_address && (
                <Button variant="outline" onClick={() => setShowEmailModal(true)} size="sm" className="p-2">
                  <Mail className="h-4 w-4" />
                        </Button>
              )}
              {contact.phone && (
                <Button variant="outline" onClick={() => window.open(`/chat/sms?contact=${encodeURIComponent(contact.phone || '')}`)} size="sm" className="p-2">
                  <MessageSquare className="h-4 w-4" />
                        </Button>
              )}
              <Link href={`/quote/${contact.id}/questionnaire`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" size="sm">
                  <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Questionnaire</span>
                </Button>
              </Link>
                      </div>
                    </div>
                  </div>
                  
        {/* Service Selection Link Generator */}
        {contact.event_type === 'wedding' && 
         contact.lead_status !== 'Lost' && 
         contact.lead_status !== 'Completed' && 
         contact.email_address && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Service Selection</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send {contact.first_name || 'this lead'} a personalized link to select their wedding DJ package and add-ons.
            </p>
            <ServiceSelectionButton 
              contactId={contact.id}
              contactName={`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
              contactEmail={contact.email_address}
            />
          </div>
        )}

        {/* Quick Actions */}
        {contact.email_address && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-900">Quick Actions</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Send important documents and communications to {contact.first_name || 'this contact'}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Send Contract */}
              {((contracts && contracts.length > 0) || (quoteSelections && quoteSelections.length > 0)) && (
                  <Button
                    onClick={() => {
                    setEmailModalTemplate('send_contract');
                      setShowEmailModal(true);
                    }}
                  className="w-full h-auto py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Send Contract</span>
                  </Button>
              )}
              
              {/* Send Invoice */}
              {((invoices && invoices.length > 0) || (quoteSelections && quoteSelections.length > 0)) && (
                <Button
                  onClick={() => {
                    setEmailModalTemplate('send_invoice');
                    setShowEmailModal(true);
                  }}
                  className="w-full h-auto py-3 px-4 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Send Invoice</span>
                </Button>
              )}
              
              {/* Send Questionnaire */}
              {payments.length > 0 && payments.some((p: any) => p.status === 'succeeded' || p.status === 'paid' || p.payment_status === 'Paid') && (
                  <Button
                    onClick={() => {
                      setEmailModalTemplate('questionnaire');
                      setShowEmailModal(true);
                    }}
                  className="w-full h-auto py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                  <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Send Questionnaire</span>
                  </Button>
              )}
              
              {/* Request Review */}
              {(contact.lead_status === 'Completed' || (contact.event_date && new Date(contact.event_date) < new Date())) && (
                  <Button
                  onClick={() => {
                    setEmailModalTemplate('request_review');
                    setShowEmailModal(true);
                  }}
                  className="w-full h-auto py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Request Review</span>
                  </Button>
              )}
              
              {/* Send Payment Reminder */}
              {invoices && invoices.length > 0 && !invoices.every((inv: any) => {
                const invoicePayments = payments?.filter((p: any) => 
                  p.invoice_number === inv.invoice_number || 
                  p.contact_id === contact.id
                ) || [];
                const totalPaid = invoicePayments
                  .filter((p: any) => p.payment_status === 'Paid' || p.status === 'paid' || p.status === 'succeeded')
                  .reduce((sum: number, p: any) => sum + (parseFloat(p.total_amount) || parseFloat(p.amount) || 0), 0);
                const invoiceTotal = parseFloat(inv.total_amount) || 0;
                return totalPaid >= invoiceTotal;
              }) && (
                <Button
                  onClick={() => {
                    setEmailModalTemplate('payment_reminder');
                    setShowEmailModal(true);
                  }}
                  className="w-full h-auto py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Payment Reminder</span>
                </Button>
              )}
              
              {/* Send Walkthrough (if no quote yet) */}
              {quoteSelections.length === 0 && contact.lead_status !== 'Lost' && contact.lead_status !== 'Completed' && (
                <Button
                  onClick={() => {
                    setEmailModalTemplate('walkthrough');
                    setShowEmailModal(true);
                  }}
                  className="w-full h-auto py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Send Walkthrough</span>
                </Button>
              )}
              
              {/* Schedule Meeting */}
              {contact.lead_status !== 'Lost' && contact.lead_status !== 'Completed' && (
                <Button
                  onClick={() => {
                    setEmailModalTemplate('schedule_meeting');
                    setShowEmailModal(true);
                  }}
                  className="w-full h-auto py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Schedule Meeting</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="pipeline" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-white border rounded-lg p-1 inline-flex min-w-full sm:min-w-0">
              <TabsTrigger value="pipeline" className="text-xs sm:text-sm whitespace-nowrap">Pipeline</TabsTrigger>
              <TabsTrigger value="communications" className="text-xs sm:text-sm whitespace-nowrap">
                Comm {communications.length > 0 && `(${communications.length})`}
            </TabsTrigger>
              <TabsTrigger value="details" className="text-xs sm:text-sm whitespace-nowrap">Details</TabsTrigger>
              <TabsTrigger value="event" className="text-xs sm:text-sm whitespace-nowrap">Event</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm whitespace-nowrap">Business</TabsTrigger>
            {socialMessages.length > 0 && (
                <TabsTrigger value="social" className="text-xs sm:text-sm whitespace-nowrap">
                  Social ({socialMessages.length})
              </TabsTrigger>
            )}
          </TabsList>
          </div>

          <TabsContent value="pipeline">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {contact && (
                <PipelineView
                  contact={contact as any}
                  contracts={contracts}
                  invoices={invoices}
                  payments={payments}
                  quoteSelections={quoteSelections}
                  onStatusUpdate={(newStatus) => {
                    setContact({ ...contact, lead_status: newStatus });
                    fetchContact();
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {isEditing ? (
                    <Input
                      value={contact.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.first_name || 'Not provided'}</p>
                              )}
                            </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {isEditing ? (
                    <Input
                      value={contact.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.last_name || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={contact.email_address || ''}
                      onChange={(e) => handleInputChange('email_address', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.email_address || 'Not provided'}</p>
                  )}
                </div>
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={contact.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.phone || 'Not provided'}</p>
                  )}
                        </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditing ? (
                    <Input
                      value={contact.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.address || 'Not provided'}</p>
                  )}
                        </div>
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {isEditing ? (
                    <Input
                      value={contact.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.city || 'Not provided'}</p>
                  )}
                        </div>
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  {isEditing ? (
                    <Input
                      value={contact.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.state || 'Not provided'}</p>
                  )}
                        </div>
                  </div>
                </div>
              </TabsContent>

          <TabsContent value="event">
            <div className="space-y-6">
              {/* Contact Event Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Contact Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    {isEditing ? (
                      <Select value={contact.event_type || ''} onValueChange={(value) => handleInputChange('event_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-900">{contact.event_type?.replace('_', ' ').toUpperCase() || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formatDate(contact.event_date)}
                        onChange={(e) => handleInputChange('event_date', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{contact.event_date || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={contact.event_time || ''}
                        onChange={(e) => handleInputChange('event_time', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{contact.event_time || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={contact.guest_count || ''}
                        onChange={(e) => handleInputChange('guest_count', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{contact.guest_count || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                    {isEditing ? (
                      <div className="relative">
                        <Input
                          value={contact.venue_name || ''}
                          onChange={(e) => handleInputChange('venue_name', e.target.value)}
                          placeholder="Enter venue name"
                        />
                        {lookingUpVenue && (
                          <div className="absolute right-2 top-2">
                            <Loader2 className="w-4 h-4 animate-spin text-brand" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">{contact.venue_name || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Address
                      {isEditing && (!contact.venue_address || contact.venue_address.trim() === '') && contact.venue_name && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          (Auto-lookup when venue name is entered)
                        </span>
                      )}
                    </label>
                    {isEditing ? (
                      <Input
                        value={contact.venue_address || ''}
                        onChange={(e) => handleInputChange('venue_address', e.target.value)}
                        placeholder="Address will auto-fill if venue is in database"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.venue_address || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                    {isEditing ? (
                      <Input
                        value={contact.budget_range || ''}
                        onChange={(e) => handleInputChange('budget_range', e.target.value)}
                        placeholder="e.g., $2,000-$3,500"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.budget_range || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                    {isEditing ? (
                      <Textarea
                        value={contact.special_requests || ''}
                        onChange={(e) => handleInputChange('special_requests', e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">{contact.special_requests || 'None'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Projects Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Projects</h3>
                  <Button 
                    onClick={fetchProjects}
                    disabled={projectsLoading}
                    className="text-sm"
                  >
                    {projectsLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
                
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading projects...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No projects found for this contact.</p>
                    <p className="text-sm text-gray-400 mt-1">Projects are automatically created when contact forms are submitted.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{project.event_name}</h4>
                              <Badge 
                                className={
                                  project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  project.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {project.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Event Type:</span> {project.event_type}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span> {project.event_date}
                              </div>
                              <div>
                                <span className="font-medium">Venue:</span> {project.venue_name || 'Not specified'}
                              </div>
                              {project.number_of_guests && (
                                <div>
                                  <span className="font-medium">Guests:</span> {project.number_of_guests}
                                </div>
                              )}
                              {project.event_duration && (
                                <div>
                                  <span className="font-medium">Duration:</span> {project.event_duration} hours
                                </div>
                              )}
                            </div>
                            {project.special_requests && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Special Requests:</span> {project.special_requests}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Link href={`/admin/projects/${project.id}`}>
                              <Button className="text-sm">
                                View Project
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoice List Section */}
              <InvoiceList
                contactId={id}
                invoices={invoices}
                onViewInvoice={(invoiceId) => router.push(`/admin/invoices/${invoiceId}`)}
                onCreateInvoice={() => router.push(`/admin/invoices/new?contactId=${id}`)}
              />

              {/* Payment History Section */}
              <PaymentHistory 
                contactId={id}
                payments={payments}
                projectValue={contact?.quoted_price || contact?.final_price || 0}
              />
            </div>
          </TabsContent>

          <TabsContent value="business">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Business & Lead Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Status</label>
                  {isEditing ? (
                    <Select value={contact.lead_status || ''} onValueChange={(value) => handleInputChange('lead_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{contact.lead_status || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Temperature</label>
                  {isEditing ? (
                    <Select value={contact.lead_temperature || ''} onValueChange={(value) => handleInputChange('lead_temperature', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select temperature" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_TEMPERATURES.map(temp => (
                          <SelectItem key={temp} value={temp}>
                            {temp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{contact.lead_temperature || 'Not set'}</p>
                  )}
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                  {isEditing ? (
                    <Input
                      value={contact.lead_source || ''}
                      onChange={(e) => handleInputChange('lead_source', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.lead_source || 'Not specified'}</p>
                  )}
            </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Communication Preference</label>
                  {isEditing ? (
                    <Select value={contact.communication_preference || ''} onValueChange={(value) => handleInputChange('communication_preference', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_PREFERENCES.map(pref => (
                          <SelectItem key={pref} value={pref}>
                            {pref.charAt(0).toUpperCase() + pref.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{contact.communication_preference ? contact.communication_preference.charAt(0).toUpperCase() + contact.communication_preference.slice(1) : 'Not set'}</p>
                  )}
                  </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  {isEditing ? (
                    <Textarea
                      value={contact.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{contact.notes || 'No notes'}</p>
                  )}
                  </div>
                </div>

              {/* Service Selection Display */}
              {(contact as any).custom_fields?.service_selection && (
                <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Selected Services
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Package</p>
                      <p className="text-gray-900 font-semibold">
                        {(contact as any).custom_fields.service_selection.package.name}
                        <span className="ml-2 text-brand">
                          ${(contact as any).custom_fields.service_selection.package.basePrice.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    
                    {(contact as any).custom_fields.service_selection.addOns?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Add-Ons</p>
                        <ul className="space-y-1">
                          {(contact as any).custom_fields.service_selection.addOns.map((addon: any, idx: number) => (
                            <li key={idx} className="text-gray-900 flex items-center justify-between">
                              <span>
                                {addon.name} {addon.quantity > 1 && `x${addon.quantity}`}
                              </span>
                              <span className="font-medium text-brand">
                                ${(addon.price * addon.quantity).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-blue-300">
                      <p className="text-xl font-bold text-blue-900 flex items-center justify-between">
                        <span>Total Investment:</span>
                        <span className="text-2xl">
                          ${(contact as any).custom_fields.service_selection.total.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    
                    {(contact as any).custom_fields.service_selection.additionalNotes && (
                      <div className="pt-4 border-t border-blue-300">
                        <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes</p>
                        <p className="text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-blue-200">
                          {(contact as any).custom_fields.service_selection.additionalNotes}
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-blue-300">
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date((contact as any).custom_fields.service_selection.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
          </TabsContent>

          {/* Communications Tab - Unified Hub */}
          <TabsContent value="communications">
            {/* Email Parser Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Import from Email</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Paste email content to automatically extract playlists, event times, and special requests
                  </p>
                </div>
                <Dialog open={showEmailParser} onOpenChange={setShowEmailParser}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Parse Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Import Information from Email</DialogTitle>
                      <DialogDescription>
                        Paste the email content below. We'll automatically extract:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>Spotify playlist links (first dance, wedding, cocktail hour)</li>
                          <li>Event times (ceremony, grand entrance, grand exit)</li>
                          <li>Special requests and notes</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Content
                        </label>
                        <Textarea
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                          placeholder="Paste the email content here..."
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEmailContent('');
                            setShowEmailParser(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleParseEmail}
                          disabled={parsingEmail || !emailContent.trim()}
                          className="flex items-center gap-2"
                        >
                          {parsingEmail ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Parsing...
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Parse & Update
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <UnifiedCommunicationHub
              contactId={id || ''}
              contactEmail={contact?.email_address || null}
              contactPhone={contact?.phone || null}
              contactName={`${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || undefined}
            />
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Social Media Conversation History</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Messages from Instagram and Facebook Messenger
                  </p>
                </div>
                {socialMessages.length > 0 && socialMessages[0].platform && (
                  <Badge className={socialMessages[0].platform === 'instagram' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                    {socialMessages[0].platform === 'instagram' ? 'Instagram' : 'Facebook Messenger'}
                  </Badge>
                )}
              </div>

              {socialMessagesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading messages...</p>
                </div>
              ) : socialMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No social media messages found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Messages from Instagram or Facebook Messenger will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {socialMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${
                        message.is_lead_inquiry
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {message.platform === 'instagram' ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">IG</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">FB</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-600">
                            {new Date(message.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                              First message
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {message.is_lead_inquiry && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                              Lead Inquiry
                            </Badge>
                          )}
                          {message.processed && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                              Processed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{message.message_text}</p>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      💡 Tip: Conversation captured automatically
                    </p>
                    <p className="text-xs text-blue-700">
                      This conversation was automatically captured from {socialMessages[0]?.platform === 'instagram' ? 'Instagram' : 'Facebook Messenger'} and linked to this contact. 
                      All messages are preserved for reference and follow-up.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
            </div>

      {/* Email Compose Modal */}
      {showEmailModal && contact && (
        <EmailComposeModal
          contact={contact}
          initialTemplate={emailModalTemplate}
          onClose={() => {
            setShowEmailModal(false);
            setEmailModalTemplate(null);
          }}
          onSuccess={() => {
            setShowEmailModal(false);
            setEmailModalTemplate(null);
            fetchContact(); // Refresh contact data
            fetchCommunications(); // Refresh communications
          }}
        />
      )}
          </div>
  );
}

// Email Compose Modal Component
function EmailComposeModal({ 
  contact, 
  initialTemplate,
  onClose, 
  onSuccess 
}: { 
  contact: Contact; 
  initialTemplate?: string | null;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialTemplate || 'custom');
  const [formData, setFormData] = useState({
    subject: `Re: ${contact.event_type || 'Event'} Inquiry - ${contact.first_name || 'Contact'}`,
    body: ''
  });

  const emailTemplates = {
    custom: {
      name: 'Custom Email',
      subject: `Re: ${contact.event_type || 'Event'} Inquiry - ${contact.first_name || 'Contact'}`,
      body: ''
    },
    initial_response: {
      name: 'Initial Response',
      subject: `Thank you for contacting M10 DJ - ${contact.event_type || 'Event'}`,
      body: `Hi ${contact.first_name || 'there'},

Thank you for reaching out to M10 DJ Company! I'm excited to learn more about your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

I'd love to discuss how we can make your event unforgettable with professional DJ services, lighting, and entertainment.

I've created a personalized service selection page where you can view our packages, add-ons, and pricing. This will help me prepare a custom quote tailored to your needs.

Are you available for a quick call this week to discuss your vision and answer any questions you might have?

Looking forward to connecting!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    select_services: {
      name: 'Select Your Services',
      subject: `Select Your Services - M10 DJ Company`,
      body: `Hi ${contact.first_name || 'there'},

I've prepared a personalized service selection page for your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

On this page, you'll be able to:
• Browse our DJ service packages
• Select add-ons and enhancements
• See transparent pricing
• Get an instant quote

This will help me understand exactly what you need for your special day, and I can prepare a custom quote tailored to your event.

If you have any questions while reviewing the options, feel free to reach out!

Here's the link:

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    quote_ready: {
      name: 'Quote Ready',
      subject: `Your Custom Quote - M10 DJ Services`,
      body: `Hi ${contact.first_name || 'there'},

Great news! I've prepared a custom quote for your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

I've tailored our services to match your specific needs and budget. The quote includes:

• Professional DJ Services
• Premium Sound System
• Uplighting & Ambiance
• Wireless Microphone
• Music Consultation

Please review the attached quote and let me know if you have any questions. I'm happy to adjust the package to better fit your vision!

Ready to move forward? Let's get you booked!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    follow_up: {
      name: 'Follow Up',
      subject: `Following up - ${contact.event_type || 'event'} on ${contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'your event date'}`,
      body: `Hi ${contact.first_name || 'there'},

I wanted to follow up on our previous conversation about your ${contact.event_type?.toLowerCase() || 'event'}.

I know planning an event can be overwhelming with so many vendors to coordinate, so I wanted to make sure I answered all your questions about our DJ services.

Do you have any additional questions? I'm here to help make this process as smooth as possible!

Looking forward to hearing from you!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    booking_confirmation: {
      name: 'Booking Confirmation',
      subject: `You're Booked! - ${contact.event_type || 'Event'} Details`,
      body: `Hi ${contact.first_name || 'there'},

Congratulations! 🎉 Your ${contact.event_type?.toLowerCase() || 'event'} is officially on my calendar${contact.event_date ? ` for ${new Date(contact.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : ''}!

I'm thrilled to be part of your special day and can't wait to help create an amazing experience for you and your guests.

Next Steps:
1. Contract signing (attached or link below)
2. Deposit payment to secure your date
3. Schedule a planning meeting closer to the date

Please review and sign the contract at your earliest convenience. Once I receive the signed contract and deposit, your date will be 100% secured.

Thank you for choosing M10 DJ Company!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    walkthrough: {
      name: 'Pricing Walkthrough',
      subject: `Let's Find Your Perfect ${contact.event_type?.toLowerCase() === 'wedding' ? 'Wedding' : ''} DJ Package - ${contact.first_name || 'there'}!`,
      body: `Hi ${contact.first_name || 'there'},

I wanted to help you find the perfect DJ package for your ${contact.event_type?.toLowerCase() === 'wedding' ? 'wedding' : 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}!

I've created a personalized interactive walkthrough that will ask you a few quick questions about your ${contact.event_type?.toLowerCase() === 'wedding' ? 'wedding' : 'event'} to recommend the best package for your needs.

${contact.event_type?.toLowerCase().includes('wedding') ? `This walkthrough is specifically designed for weddings and will help us understand:
• Your guest count and venue size
• Your coverage needs (ceremony, cocktail hour, reception)
• Special moments you want to highlight
• Your preferred atmosphere and music style
• Your budget range

` : `This walkthrough will help us understand:
• Your event size and needs
• Your priorities and preferences
• Your budget range
• Your timeline

`}Click the link below to get started - it only takes a few minutes:

Here's the link:

The walkthrough will provide personalized recommendations based on your answers, and you can view the full package details directly from there.

If you have any questions, feel free to reply to this email or call me at (901) 410-2020.

Looking forward to helping make your ${contact.event_type?.toLowerCase() === 'wedding' ? 'wedding' : 'event'} amazing!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    questionnaire: {
      name: 'Music Planning Questionnaire',
      subject: `Music Planning Questionnaire - ${contact.first_name || 'there'}!`,
      body: `Hi ${contact.first_name || 'there'},

Thank you for your deposit payment! 🎉 I'm excited to be part of your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}!

To help me create the perfect music experience for you and your guests, I'd love to learn more about your music preferences. I've created a quick questionnaire that will help me understand:

• Songs you absolutely don't want to hear
• Special dances and their songs (first dance, father-daughter, etc.)
• Playlist links or favorite artists
• Ceremony music preferences
• Any other special requests

This will only take a few minutes, and it will help me tailor the music perfectly to your vision!

Click the link below to get started:

Here's the link:

The questionnaire is step-by-step and easy to complete. You can save your progress and come back to it anytime.

If you have any questions or want to discuss your music preferences over the phone, feel free to call me at (901) 410-2020.

Looking forward to creating an amazing musical experience for your special day!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    send_contract: {
      name: 'Send Contract',
      subject: `Contract for Your ${contact.event_type?.replace('_', ' ') || 'Event'} - M10 DJ Company`,
      body: `Hi ${contact.first_name || 'there'},

Great news! I've prepared the contract for your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

Please review and sign the contract at your earliest convenience to secure your date. Once I receive the signed contract and deposit, your date will be 100% secured!

Here's the link to view and sign:

You can review all the details, sign electronically, and download a copy for your records. The process is quick and secure.

If you have any questions about the contract terms or anything else, please don't hesitate to reach out. I'm here to make this process as smooth as possible!

Looking forward to working with you!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    send_invoice: {
      name: 'Send Invoice',
      subject: `Invoice for Your ${contact.event_type?.replace('_', ' ') || 'Event'} - M10 DJ Company`,
      body: `Hi ${contact.first_name || 'there'},

I've prepared the invoice for your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

You can view your invoice and make a secure payment online:

Here's the link:

The invoice includes all the services we've discussed. You can pay online securely, and you'll receive a receipt automatically.

If you have any questions about the invoice or payment options, please let me know. I'm happy to help!

Thank you for choosing M10 DJ Company!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    request_review: {
      name: 'Request Review',
      subject: `How was your ${contact.event_type?.replace('_', ' ') || 'event'}? - We'd love your feedback!`,
      body: `Hi ${contact.first_name || 'there'},

I hope you had an amazing ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}! 

It was such a pleasure working with you and your guests. I hope the music and entertainment helped make your special day unforgettable!

If you have a moment, I would be incredibly grateful if you could share your experience. Your feedback helps me continue to improve and also helps other couples and event planners who are looking for a great DJ experience.

You can leave a review here:
• Google: https://g.page/r/[your-google-review-link]
• Facebook: [your-facebook-page-link]

If you have any specific feedback or suggestions, please feel free to reply to this email. I always appreciate hearing from my clients!

Thank you again for choosing M10 DJ Company. I hope we can work together again in the future!

Warm regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    payment_reminder: {
      name: 'Payment Reminder',
      subject: `Payment Reminder - ${contact.event_type?.replace('_', ' ') || 'Event'} Invoice`,
      body: `Hi ${contact.first_name || 'there'},

I wanted to send a friendly reminder about the outstanding invoice for your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

To keep everything on track and ensure your event date is fully secured, please submit your payment at your earliest convenience.

You can view and pay your invoice online:

Here's the link:

If you've already sent payment or have any questions about the invoice, please let me know. I'm happy to help resolve any issues or discuss payment arrangements if needed.

Thank you for your prompt attention to this!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    schedule_meeting: {
      name: 'Schedule Meeting',
      subject: `Let's Schedule a Meeting - ${contact.event_type?.replace('_', ' ') || 'Event'} Planning`,
      body: `Hi ${contact.first_name || 'there'},

As we prepare for your ${contact.event_type?.toLowerCase() || 'event'}${contact.event_date ? ` on ${new Date(contact.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}, I'd love to schedule a time to discuss the details and ensure everything is aligned with your vision.

Whether it's a quick phone call, video chat, or in-person meeting, I'm flexible with what works best for you. We can discuss:

• Music preferences and playlist planning
• Timeline and special moments
• Equipment setup and logistics
• Any special requests or considerations
• Final details and confirmation

Please let me know your availability in the coming days, and I'll work with your schedule. You can also call me directly at (901) 410-2020.

Looking forward to our conversation!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    }
  };

  useEffect(() => {
    if (initialTemplate && initialTemplate !== 'custom') {
      setSelectedTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  useEffect(() => {
    if (selectedTemplate !== 'custom') {
      const template = emailTemplates[selectedTemplate as keyof typeof emailTemplates];
      if (template) {
        let body = template.body;
        
        // Insert links for templates that need them
        if (contact) {
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com');
          
          if (selectedTemplate === 'walkthrough') {
            const walkthroughLink = `${baseUrl}/quote/${contact.id}/walkthrough`;
            body = body.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${walkthroughLink}\n\n`);
          } else if (selectedTemplate === 'questionnaire') {
            const questionnaireLink = `${baseUrl}/quote/${contact.id}/questionnaire`;
            body = body.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${questionnaireLink}\n\n`);
          } else if (selectedTemplate === 'send_contract') {
            const contractLink = `${baseUrl}/quote/${contact.id}/contract`;
            body = body.replace(/Here's the link to view and sign:\s*\n?/i, `Here's the link to view and sign:\n\n${contractLink}\n\n`);
          } else if (selectedTemplate === 'send_invoice') {
            const invoiceLink = `${baseUrl}/quote/${contact.id}/invoice`;
            body = body.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${invoiceLink}\n\n`);
          } else if (selectedTemplate === 'payment_reminder') {
            const invoiceLink = `${baseUrl}/quote/${contact.id}/invoice`;
            body = body.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${invoiceLink}\n\n`);
          }
        }
        
        setFormData({
          subject: template.subject,
          body: body
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, contact]);

  const handleSendTestEmail = async () => {
    if (!formData.body.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Generate quote link for the contact
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com');
      const quoteLink = `${baseUrl}/quote/${contact.id}`;
      
      // Add appropriate link to email body based on template
      let emailContent = formData.body;
      const walkthroughLink = `${baseUrl}/quote/${contact.id}/walkthrough`;
      const questionnaireLink = `${baseUrl}/quote/${contact.id}/questionnaire`;
      
      if (selectedTemplate === 'initial_response' || selectedTemplate === 'select_services') {
        // For Select Your Services, replace "Here's the link:" placeholder with the actual link
        if (selectedTemplate === 'select_services') {
          emailContent = emailContent.replace(/Here's the link:\s*/i, `Here's the link:\n\n${quoteLink}\n\n`);
        } else {
          // For Initial Response, add quote link section to the email
          emailContent += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 VIEW YOUR PERSONALIZED QUOTE\n\nI've created a personalized service selection page for you. Click the link below to view our packages, add-ons, and pricing:\n\n${quoteLink}\n\nThis will help me provide you with an accurate quote tailored to your event!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        }
      } else if (selectedTemplate === 'walkthrough') {
        // Replace "Here's the link:" placeholder with walkthrough link (handle newlines properly)
        emailContent = emailContent.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${walkthroughLink}\n\n`);
      } else if (selectedTemplate === 'questionnaire') {
        // Replace "Here's the link:" placeholder with questionnaire link (handle newlines properly)
        emailContent = emailContent.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${questionnaireLink}\n\n`);
      }

      // Send test email to admin
      const response = await fetch('/api/admin/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          to: 'djbenmurray@gmail.com', // Admin email for testing
          subject: `[TEST] ${formData.subject}`,
          content: emailContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast({
        title: "Test Email Sent",
        description: "Test email sent to admin email (djbenmurray@gmail.com)"
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.body.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Generate quote link for the contact
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com');
      const quoteLink = `${baseUrl}/quote/${contact.id}`;
      
      // Add appropriate link to email body based on template
      let emailContent = formData.body;
      const walkthroughLink = `${baseUrl}/quote/${contact.id}/walkthrough`;
      const questionnaireLink = `${baseUrl}/quote/${contact.id}/questionnaire`;
      
      if (selectedTemplate === 'initial_response' || selectedTemplate === 'select_services') {
        // Add quote link section to the email
        emailContent += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 VIEW YOUR PERSONALIZED QUOTE\n\nI've created a personalized service selection page for you. Click the link below to view our packages, add-ons, and pricing:\n\n${quoteLink}\n\nThis will help me provide you with an accurate quote tailored to your event!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      } else if (selectedTemplate === 'walkthrough') {
        // Replace "Here's the link:" placeholder with walkthrough link (handle newlines properly)
        if (!emailContent.includes(walkthroughLink)) {
          emailContent = emailContent.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${walkthroughLink}\n\n`);
        }
      } else if (selectedTemplate === 'questionnaire') {
        // Replace "Here's the link:" placeholder with questionnaire link (handle newlines properly)
        if (!emailContent.includes(questionnaireLink)) {
          emailContent = emailContent.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${questionnaireLink}\n\n`);
        }
      } else if (selectedTemplate === 'send_contract') {
        const contractLink = `${baseUrl}/quote/${contact.id}/contract`;
        if (!emailContent.includes(contractLink)) {
          emailContent = emailContent.replace(/Here's the link to view and sign:\s*\n?/i, `Here's the link to view and sign:\n\n${contractLink}\n\n`);
        }
      } else if (selectedTemplate === 'send_invoice' || selectedTemplate === 'payment_reminder') {
        const invoiceLink = `${baseUrl}/quote/${contact.id}/invoice`;
        if (!emailContent.includes(invoiceLink)) {
          emailContent = emailContent.replace(/Here's the link:\s*\n?/i, `Here's the link:\n\n${invoiceLink}\n\n`);
        }
      }

      const response = await fetch('/api/admin/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          to: contact.email_address,
          subject: formData.subject,
          content: emailContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: "Success",
        description: "Email sent successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Send Email to {contact.first_name || contact.email_address}</h2>
            <Button variant="outline" onClick={onClose} className="h-8 w-8 p-0">
              <span className="sr-only">Close</span>
              ×
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <Input value={contact.email_address || ''} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handleSendTestEmail} 
            disabled={sending || !formData.body.trim()}
            className="text-sm"
          >
            {sending ? 'Sending...' : 'Send Test Email'}
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sending || !formData.body.trim()}>
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 