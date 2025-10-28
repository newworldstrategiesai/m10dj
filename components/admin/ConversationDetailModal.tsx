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
  ExternalLink
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  timestamp: string;
  is_lead_inquiry: boolean;
  processed: boolean;
  contact_id: string | null;
  platform: 'instagram' | 'messenger';
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
      // Fetch all messages from this sender
      const table = message.platform === 'instagram' ? 'instagram_messages' : 'messenger_messages';
      const { data: messages } = await supabase
        .from(table)
        .select('*')
        .eq('sender_id', message.sender_id)
        .order('timestamp', { ascending: true });

      if (messages) {
        const messagesWithPlatform = messages.map(m => ({ ...m, platform: message.platform }));
        setAllMessages(messagesWithPlatform);
        
        // Detect event data from conversation
        const detected = detectEventData(messagesWithPlatform);
        setDetectedData(detected);
      }

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
    const fullConversation = messages.map(m => m.message_text).join(' ').toLowerCase();
    
    // Detect event type
    let eventType = null;
    if (fullConversation.match(/\bwedding\b/i)) eventType = 'wedding';
    else if (fullConversation.match(/\bcorporate\b|\bcompany\b|\bbusiness\b/i)) eventType = 'corporate';
    else if (fullConversation.match(/\bbirthday\b|\bsweet 16\b/i)) eventType = 'private_party';
    else if (fullConversation.match(/\bgraduation\b/i)) eventType = 'school_dance';
    else if (fullConversation.match(/\bholiday\b|\bchristmas\b/i)) eventType = 'holiday_party';
    
    // Detect date (various formats)
    let eventDate = null;
    const datePatterns = [
      /(?:on|for)\s+([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = fullConversation.match(pattern);
      if (match) {
        eventDate = match[1];
        break;
      }
    }
    
    // Detect guest count
    let guestCount = null;
    const guestMatch = fullConversation.match(/(\d+)\s+(?:people|guests|attendees)/i);
    if (guestMatch) {
      guestCount = parseInt(guestMatch[1]);
    }
    
    // Detect venue
    let venueName = null;
    const venueMatch = fullConversation.match(/(?:at|venue|location):\s*([^.,\n]+)/i);
    if (venueMatch) {
      venueName = venueMatch[1].trim();
    }
    
    // Detect budget/price range
    let priceRange = null;
    const priceMatch = fullConversation.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/);
    if (priceMatch) {
      priceRange = priceMatch[0];
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
      // Create contact from message data
      const newContact = {
        first_name: null,
        last_name: null,
        phone: null,
        email_address: null,
        event_type: detectedData?.eventType || 'other',
        event_date: detectedData?.eventDate ? parseDetectedDate(detectedData.eventDate) : null,
        guest_count: detectedData?.guestCount || null,
        venue_name: detectedData?.venueName || null,
        budget_range: detectedData?.priceRange || null,
        lead_status: 'New',
        lead_source: message.platform === 'instagram' ? 'Instagram' : 'Facebook Messenger',
        lead_temperature: 'Warm',
        instagram_id: message.platform === 'instagram' ? message.sender_id : null,
        facebook_id: message.platform === 'messenger' ? message.sender_id : null,
        communication_preference: 'text',
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'social'
      };

      const { data: createdContact, error: contactError } = await supabase
        .from('contacts')
        .insert(newContact)
        .select()
        .single();

      if (contactError) throw contactError;

      // Update message with contact_id
      const table = message.platform === 'instagram' ? 'instagram_messages' : 'messenger_messages';
      await supabase
        .from(table)
        .update({ 
          contact_id: createdContact.id,
          processed: true
        })
        .eq('sender_id', message.sender_id);

      setContact(createdContact);
      
      // Show success notification
      alert('Contact created successfully! You can now edit details in the full contact view.');
      
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
      // Try to parse various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            {message.platform === 'instagram' ? (
              <Instagram className="h-6 w-6 text-pink-600" />
            ) : (
              <Facebook className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Conversation Details</h2>
              <p className="text-sm text-gray-600">
                {message.platform === 'instagram' ? 'Instagram' : 'Facebook Messenger'} • 
                Sender ID: {message.sender_id.substring(0, 12)}...
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
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                          {msg.is_lead_inquiry && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Lead Inquiry
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{msg.message_text}</p>
                        {msg.processed && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
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

