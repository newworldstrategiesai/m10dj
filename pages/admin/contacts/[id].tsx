'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Phone, Mail, Calendar, MapPin, Music, DollarSign, User, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';

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
  special_requests: string | null;
  music_genres: string[] | null;
  equipment_needs: string[] | null;
  lead_status: string | null;
  lead_source: string | null;
  lead_stage: string | null;
  lead_temperature: string | null;
  communication_preference: string | null;
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    }
  }, [user, id]);

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

  const handleInputChange = (field: keyof Contact, value: any) => {
    if (!contact) return;
    setContact({ ...contact, [field]: value });
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href={from === 'lead' ? `/admin/leads/${id}` : "/admin/contacts"}>
              <Button variant="flat" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {from === 'lead' ? 'Back to Lead Details' : 'Back to Contacts'}
              </Button>
            </Link>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Contact
            </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="flat"
                    onClick={() => {
                      setIsEditing(false);
                      fetchContact(); // Reset changes
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
              )}
              </div>
            </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#fcba00] text-black text-xl font-bold">
                {getContactInitials()}
                      </AvatarFallback>
                    </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact'}
              </h1>
              <p className="text-gray-600">{contact.email_address}</p>
              <div className="flex gap-2 mt-2">
                {contact.lead_status && (
                  <Badge className={getLeadStatusColor(contact.lead_status)}>
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
            <div className="flex gap-2">
              {contact.phone && (
                <Button variant="flat" onClick={() => window.open(`tel:${contact.phone}`)}>
                  <Phone className="h-4 w-4" />
                        </Button>
              )}
              {contact.email_address && (
                <Button variant="flat" onClick={() => window.open(`mailto:${contact.email_address}`)}>
                  <Mail className="h-4 w-4" />
                        </Button>
              )}
              {contact.phone && (
                <Button variant="flat" onClick={() => window.open(`/chat?contact=${encodeURIComponent(contact.phone || '')}`)}>
                  <MessageSquare className="h-4 w-4" />
                        </Button>
              )}
                      </div>
                    </div>
                  </div>
                  
        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-white border rounded-lg p-1">
            <TabsTrigger value="details">Contact Details</TabsTrigger>
            <TabsTrigger value="event">Event Information</TabsTrigger>
            <TabsTrigger value="business">Business Details</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {isEditing ? (
                    <Input
                      value={contact.first_name || ''}
                      onChange={(value) => handleInputChange('first_name', value)}
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
                      onChange={(value) => handleInputChange('last_name', value)}
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
                      onChange={(value) => handleInputChange('email_address', value)}
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
                      onChange={(value) => handleInputChange('phone', value)}
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
                      onChange={(value) => handleInputChange('address', value)}
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
                      onChange={(value) => handleInputChange('city', value)}
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
                      onChange={(value) => handleInputChange('state', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.state || 'Not provided'}</p>
                  )}
                        </div>
                  </div>
                </div>
              </TabsContent>

          <TabsContent value="event">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
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
                      onChange={(value) => handleInputChange('event_date', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.event_date ? new Date(contact.event_date).toLocaleDateString() : 'Not set'}</p>
                    )}
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={contact.event_time || ''}
                      onChange={(value) => handleInputChange('event_time', value)}
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
                      onChange={(value) => handleInputChange('guest_count', value ? parseInt(value) : null)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.guest_count || 'Not specified'}</p>
                  )}
                    </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  {isEditing ? (
                    <Input
                      value={contact.venue_name || ''}
                      onChange={(value) => handleInputChange('venue_name', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{contact.venue_name || 'Not specified'}</p>
                  )}
                    </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                  {isEditing ? (
                    <Input
                      value={contact.venue_address || ''}
                      onChange={(value) => handleInputChange('venue_address', value)}
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
                      onChange={(value) => handleInputChange('budget_range', value)}
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
                      onChange={(value) => handleInputChange('lead_source', value)}
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
              </div>
          </TabsContent>
        </Tabs>
            </div>
          </div>
  );
} 