'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Phone, Mail, Calendar, MapPin, Music, DollarSign, User, MessageSquare, Edit3, Trash2, CheckCircle } from 'lucide-react';
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
import ServiceSelectionButton from '@/components/admin/ServiceSelectionButton';
import PaymentHistory from '@/components/admin/PaymentHistory';

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
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
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
      fetchProjects();
      fetchPayments();
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
                        onChange={(value) => handleInputChange('event_date', value)}
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
        </Tabs>
            </div>
          </div>
  );
} 