/**
 * Conversation Detail Modal
 * Shows full conversation thread with lead/opportunity details
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  DollarSign,
  MessageSquare,
  Instagram,
  Facebook,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Inbox
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  sender_id?: string;
  message_text?: string;
  timestamp: string;
  is_lead_inquiry: boolean;
  processed: boolean;
  contact_id: string | null;
  platform: 'instagram' | 'messenger' | 'email';
  // Email-specific fields
  from_email?: string;
  from_name?: string;
  to_email?: string;
  subject?: string;
  body_text?: string;
  message_type?: string;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  venue_name: string | null;
  quoted_price: number | null;
  lead_status: string | null;
  lead_source: string | null;
  lead_temperature: string | null;
  created_at: string;
}

interface ConversationDetailModalProps {
  message: Message;
  onClose: () => void;
}

interface DetectedEventData {
  eventType: string | null;
  eventDate: string | null;
  guestCount: number | null;
  venueName: string | null;
  priceRange: string | null;
}

export default function ConversationDetailModal({ message, onClose }: ConversationDetailModalProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [detectedData, setDetectedData] = useState<DetectedEventData | null>(null);

  useEffect(() => {
    fetchConversationData();
  }, [message]);

  const fetchConversationData = async () => {
    setLoading(true);
    try {
      // Fetch all messages from this sender based on platform
      let messages: any[] = [];
      
      if (message.platform === 'email') {
        // For email, fetch all messages from/to this email address
        const email = message.from_email || message.to_email;
        if (email) {
          const { data: emailMessages } = await supabase
            .from('email_messages')
            .select('*')
            .or(`from_email.eq.${email},to_email.eq.${email}`)
            .order('timestamp', { ascending: true });
          
          if (emailMessages) {
            messages = emailMessages.map(m => ({ ...m, platform: 'email' }));
          }
        }
      } else {
        // For Instagram/Messenger, use sender_id
        const table = message.platform === 'instagram' ? 'instagram_messages' : 'messenger_messages';
        const { data: socialMessages } = await supabase
          .from(table)
          .select('*')
          .eq('sender_id', message.sender_id)
          .order('timestamp', { ascending: true });

        if (socialMessages) {
          messages = socialMessages.map(m => ({ ...m, platform: message.platform }));
        }
      }

      setAllMessages(messages);
      
      // Detect event data from conversation
      const detected = detectEventData(messages);
      setDetectedData(detected);

      // Fetch contact if exists
      if (message.contact_id) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', message.contact_id)
          .single();

        if (contactData) {
          setContact(contactData);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectEventData = (messages: Message[]): DetectedEventData => {
    const fullConversation = messages.map(m => {
      if (m.platform === 'email') {
        return `${m.subject || ''} ${m.body_text || ''}`;
      }
      return m.message_text || '';
    }).join(' ');
    
    // Detect event type
    let eventType = null;
    if (fullConversation.match(/\bwedding\b/i)) eventType = 'wedding';
    else if (fullConversation.match(/\bcorporate\b|\bcompany\b|\bbusiness\b/i)) eventType = 'corporate';
    else if (fullConversation.match(/\bbirthday\b|\bsweet 16\b/i)) eventType = 'private_party';
    else if (fullConversation.match(/\bgraduation\b/i)) eventType = 'school_dance';
    else if (fullConversation.match(/\bholiday\b|\bchristmas\b/i)) eventType = 'holiday_party';
    
    // Detect date (improved patterns - more specific)
    let eventDate = null;
    const datePatterns = [
      // Full dates: "June 15th, 2025" or "June 15, 2025"
      /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/i,
      // Month and day with "on" or "for": "on June 15th" or "for March 20"
      /(?:on|for)\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      // Numeric dates: "6/15/2024" or "06/15/24"
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
      // Month and day only: "June 15th" or "March 20"
      /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = fullConversation.match(pattern);
      if (match && match[1]) {
        // Validate it's actually a date (not part of "about 200")
        const dateStr = match[1];
        if (!dateStr.match(/about/i) && !dateStr.match(/\d+\s+(?:people|guests)/i)) {
          eventDate = dateStr;
          break;
        }
      }
    }
    
    // Detect guest count (more precise)
    let guestCount = null;
    const guestPatterns = [
      /(?:for|about|around|approximately)\s+(\d+)\s+(?:people|guests|attendees)/i,
      /(\d+)\s+(?:people|guests|attendees)/i,
      /(?:party|event)\s+(?:for|of)\s+(\d+)/i
    ];
    
    for (const pattern of guestPatterns) {
      const match = fullConversation.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1]);
        // Reasonable guest count (10-10000)
        if (count >= 10 && count <= 10000) {
          guestCount = count;
          break;
        }
      }
    }
    
    // Detect venue (improved)
    let venueName = null;
    const venuePatterns = [
      /(?:at|venue|location):\s*([^.,\n]+)/i,
      /\bat\s+(?:the\s+)?([A-Z][a-zA-Z\s&'-]+(?:Hotel|Garden|Center|Hall|Club|Manor|Estate|Ballroom))/,
      /\bin\s+(downtown|midtown|east|west|north|south)\s+(\w+)/i
    ];
    
    for (const pattern of venuePatterns) {
      const match = fullConversation.match(pattern);
      if (match && match[1]) {
        venueName = match[1].trim();
        // Clean up common trailing words
        venueName = venueName.replace(/\s+(for|about|with|and)\s*$/i, '');
        if (venueName.length > 3) {
          break;
        }
      }
    }
    
    // Detect budget/price range
    let priceRange = null;
    const pricePatterns = [
      /\$[\d,]+\s*-\s*\$[\d,]+/, // Range: "$1,000 - $2,000"
      /\$[\d,]+(?:\+)?/, // Single amount: "$2,500" or "$2,500+"
      /budget\s+(?:of|is|around)\s+\$[\d,]+/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = fullConversation.match(pattern);
      if (match) {
        priceRange = match[0].replace(/budget\s+(?:of|is|around)\s+/i, '');
        break;
      }
    }
    
    return {
      eventType,
      eventDate,
      guestCount,
      venueName,
      priceRange
    };
  };

  const handleCreateContact = async () => {
    setCreating(true);
    try {
      // Parse the date first for both contact and project
      const parsedDate = detectedData?.eventDate ? parseDetectedDate(detectedData.eventDate) : null;
      
      console.log('Detected event data:', detectedData);
      console.log('Parsed date:', parsedDate);

      // Create contact from message data
      const newContact = {
        first_name: message.platform === 'email' && message.from_name 
          ? message.from_name.split(' ')[0] || 'Email'
          : null,
        last_name: message.platform === 'email' && message.from_name 
          ? message.from_name.split(' ').slice(1).join(' ') || 'Lead'
          : null,
        phone: null,
        email_address: message.platform === 'email' ? message.from_email : null,
        primary_email: message.platform === 'email' ? message.from_email : null,
        event_type: detectedData?.eventType || 'other',
        event_date: parsedDate,
        guest_count: detectedData?.guestCount || null,
        venue_name: detectedData?.venueName || null,
        budget_range: detectedData?.priceRange || null,
        lead_status: 'New',
        lead_source: message.platform === 'instagram' 
          ? 'Instagram' 
          : message.platform === 'messenger' 
            ? 'Facebook Messenger'
            : 'Email',
        lead_temperature: 'Warm',
        instagram_id: message.platform === 'instagram' ? message.sender_id : null,
        facebook_id: message.platform === 'messenger' ? message.sender_id : null,
        communication_preference: message.platform === 'email' ? 'email' : 'text',
        last_contacted_date: new Date().toISOString(),
        last_contact_type: message.platform === 'email' ? 'email' : 'social'
      };

      const { data: createdContact, error: contactError } = await supabase
        .from('contacts')
        .insert(newContact)
        .select()
        .single();

      if (contactError) throw contactError;

      // Update all messages from this sender with contact_id
      if (message.platform === 'email') {
        const email = message.from_email || message.to_email;
        if (email) {
          await supabase
            .from('email_messages')
            .update({ 
              contact_id: createdContact.id,
              processed: true
            })
            .or(`from_email.eq.${email},to_email.eq.${email}`);
        }
      } else {
        const table = message.platform === 'instagram' ? 'instagram_messages' : 'messenger_messages';
        await supabase
          .from(table)
          .update({ 
            contact_id: createdContact.id,
            processed: true
          })
          .eq('sender_id', message.sender_id);
      }

      // Create a project/event for this contact
      const platformName = message.platform === 'instagram' 
        ? 'Instagram' 
        : message.platform === 'messenger' 
          ? 'Facebook'
          : 'Email';
      const eventName = `${detectedData?.eventType ? detectedData.eventType.replace('_', ' ').charAt(0).toUpperCase() + detectedData.eventType.replace('_', ' ').slice(1) : 'Event'} - ${platformName} Lead`;
      
      const conversationNotes = allMessages.map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        if (msg.platform === 'email') {
          return `[${timestamp}] ${msg.subject || '(No subject)'}\n${msg.body_text || ''}`;
        }
        return `[${timestamp}] ${msg.message_text || ''}`;
      }).join('\n\n');

      const projectData = {
        submission_id: null,
        event_name: eventName,
        client_name: 'Social Media Lead',
        client_email: null,
        client_phone: null,
        event_type: detectedData?.eventType || 'other',
        event_date: parsedDate,
        start_time: null,
        end_time: null,
        venue_name: detectedData?.venueName || null,
        venue_address: null,
        number_of_guests: detectedData?.guestCount || null,
        event_duration: null,
        special_requests: null,
        timeline_notes: `${message.platform === 'email' ? 'Email' : 'Social Media'} Inquiry (${platformName})\n\nConversation History:\n${conversationNotes}\n\nLead Source: ${message.platform}\n${message.platform === 'email' ? `Email: ${message.from_email}` : `Sender ID: ${message.sender_id}`}\nCreated: ${new Date().toLocaleString()}`,
        playlist_notes: null,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProject, error: projectError } = await supabase
        .from('events')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        alert(`Contact created but project creation failed: ${projectError.message}\n\nYou may need to create the project manually.`);
      } else {
        console.log('Project created successfully:', createdProject);
      }

      setContact(createdContact);
      
      // Show success notification
      const successMessage = projectError 
        ? `Contact created successfully!\n\nContact ID: ${createdContact.id}\n\nNote: Project creation failed - please create manually.`
        : `Contact and project created successfully!\n\nContact ID: ${createdContact.id}\nProject: ${eventName}\nEvent Date: ${parsedDate || 'Not detected'}\n\nView the contact page to see the conversation history and project details.`;
      
      alert(successMessage);
      
      // Refresh the data
      await fetchConversationData();
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const parseDetectedDate = (dateStr: string): string | null => {
    try {
      // Clean up the date string
      let cleanedDate = dateStr.trim();
      
      // Remove ordinal suffixes (st, nd, rd, th)
      cleanedDate = cleanedDate.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
      
      // Try to parse the date
      const date = new Date(cleanedDate);
      
      // If valid, return ISO format (YYYY-MM-DD)
      if (!isNaN(date.getTime())) {
        // If no year was specified, the date might be in the past, so add current or next year
        const now = new Date();
        if (date.getFullYear() === 1970 || date.getFullYear() < now.getFullYear()) {
          // No year specified, or date is in past - use current year or next year
          date.setFullYear(now.getFullYear());
          
          // If the date has already passed this year, use next year
          if (date < now) {
            date.setFullYear(now.getFullYear() + 1);
          }
        }
        
        return date.toISOString().split('T')[0];
      }
      
      // If standard parsing failed, try manual parsing for common formats
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      
      const monthMatch = cleanedDate.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d+)/i);
      if (monthMatch) {
        const month = monthNames.indexOf(monthMatch[1].toLowerCase());
        const day = parseInt(monthMatch[2]);
        const now = new Date();
        let year = now.getFullYear();
        
        // Create date with current year
        const testDate = new Date(year, month, day);
        
        // If date has passed, use next year
        if (testDate < now) {
          year++;
        }
        
        const finalDate = new Date(year, month, day);
        return finalDate.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    return null;
  };

  const getLeadTemperatureBadge = (temp: string | null) => {
    if (!temp) return null;
    const colors = {
      Hot: 'bg-red-100 text-red-800 border-red-300',
      Warm: 'bg-orange-100 text-orange-800 border-orange-300',
      Cold: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return (
      <Badge variant="outline" className={colors[temp as keyof typeof colors] || ''}>
        {temp}
      </Badge>
    );
  };

  const getLeadStatusBadge = (status: string | null) => {
    if (!status) return null;
    const colors = {
      New: 'bg-blue-100 text-blue-800',
      Contacted: 'bg-purple-100 text-purple-800',
      Qualified: 'bg-green-100 text-green-800',
      'Proposal Sent': 'bg-yellow-100 text-yellow-800',
      Negotiating: 'bg-orange-100 text-orange-800',
      Booked: 'bg-green-100 text-green-800',
      Lost: 'bg-gray-100 text-gray-800',
      Completed: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not quoted';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {message.platform === 'instagram' ? (
              <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            ) : message.platform === 'email' ? (
              <Inbox className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversation Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message.platform === 'instagram' 
                  ? 'Instagram' 
                  : message.platform === 'email' 
                    ? 'Email'
                    : 'Facebook Messenger'} • 
                {message.platform === 'email' 
                  ? `${message.from_email}` 
                  : `Sender ID: ${message.sender_id?.substring(0, 12)}...`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Left Column - Conversation Thread */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Conversation Thread ({allMessages.length} messages)
                  </h3>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {allMessages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.is_lead_inquiry
                            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                          {msg.is_lead_inquiry && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                              Lead Inquiry
                            </Badge>
                          )}
                        </div>
                        {msg.platform === 'email' ? (
                          <>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {msg.subject || '(No subject)'}
                            </p>
                            <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">
                              {msg.body_text}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              From: {msg.from_name || msg.from_email}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">
                            {msg.message_text}
                          </p>
                        )}
                        {msg.processed && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Processed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Lead/Contact Details */}
              <div className="space-y-4">
                {contact ? (
                  <>
                    {/* Contact Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Contact Information
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Name</p>
                          <p className="text-base font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                        </div>

                        {contact.email_address && (
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="text-sm text-gray-900">{contact.email_address}</p>
                            </div>
                          </div>
                        )}

                        {contact.phone && (
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="text-sm text-gray-900">{contact.phone}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Lead Source</p>
                          <Badge variant="outline">
                            {contact.lead_source || message.platform}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Opportunity Details
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Status</p>
                          {getLeadStatusBadge(contact.lead_status)}
                        </div>

                        {contact.lead_temperature && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Temperature</p>
                            {getLeadTemperatureBadge(contact.lead_temperature)}
                          </div>
                        )}

                        {contact.event_type && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Event Type</p>
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {contact.event_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {contact.event_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Event Date</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(contact.event_date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {contact.venue_name && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Venue</p>
                              <p className="text-sm font-medium text-gray-900">{contact.venue_name}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Quoted Price</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(contact.quoted_price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button
                          variant="slim"
                          className="w-full justify-start"
                          onClick={() => window.open(`/admin/contacts/${contact.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Full Contact
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Detected Event Data */}
                    {detectedData && (detectedData.eventType || detectedData.eventDate || detectedData.guestCount) && (
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          Detected Event Details
                        </h3>
                        <div className="space-y-3 text-sm">
                          {detectedData.eventType && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Event Type:</span>
                              <span className="font-medium text-blue-900 capitalize">
                                {detectedData.eventType.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                          {detectedData.eventDate && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Date:</span>
                              <span className="font-medium text-blue-900">{detectedData.eventDate}</span>
                            </div>
                          )}
                          {detectedData.guestCount && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Guest Count:</span>
                              <span className="font-medium text-blue-900">{detectedData.guestCount}</span>
                            </div>
                          )}
                          {detectedData.venueName && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Venue:</span>
                              <span className="font-medium text-blue-900">{detectedData.venueName}</span>
                            </div>
                          )}
                          {detectedData.priceRange && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Budget:</span>
                              <span className="font-medium text-blue-900">{detectedData.priceRange}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Create Contact Action */}
                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-yellow-900 mb-1">No Contact Created</h3>
                          <p className="text-sm text-yellow-800 mb-4">
                            This message hasn't been converted to a contact yet. 
                            {detectedData && (detectedData.eventType || detectedData.eventDate) 
                              ? ' Event details will be automatically added.'
                              : ' Would you like to create one?'}
                          </p>
                          <Button 
                            variant="slim" 
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            onClick={handleCreateContact}
                            disabled={creating}
                          >
                            {creating ? 'Creating...' : 'Create Contact'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

