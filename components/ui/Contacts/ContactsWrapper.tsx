'use client';

import React, { useState, useEffect } from 'react';
import { IconSearch, IconPlus, IconPhone, IconMail, IconCalendar, IconMapPin, IconFilter, IconArrowUp, IconUser, IconMusic, IconCurrencyDollar, IconTarget, IconClock, IconEdit, IconTrash, IconEye, IconMessage } from '@tabler/icons-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Card from '@/components/ui/Card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_address: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  venue_name: string | null;
  lead_status: string | null;
  lead_source: string | null;
  lead_temperature: string | null;
  budget_range: string | null;
  special_requests: string | null;
  notes: string | null;
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
  venue_name: string | null;
  venue_address: string | null;
  number_of_guests: number | null;
  special_requests: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactsWrapperProps {
  userId: string;
  apiKeys?: {
    twilioSid?: string;
    twilioAuthToken?: string;
  };
}

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'school_dance', label: 'School Dance' },
  { value: 'holiday_party', label: 'Holiday Party' },
  { value: 'private_party', label: 'Private Party' },
  { value: 'other', label: 'Other' }
];

const LEAD_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'New Lead' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Proposal Sent', label: 'Proposal Sent' },
  { value: 'Negotiating', label: 'Negotiating' },
  { value: 'Booked', label: 'Booked' },
  { value: 'Lost', label: 'Lost' },
  { value: 'Completed', label: 'Completed' }
];

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

const getTemperatureColor = (temperature: string | null) => {
  switch (temperature) {
    case 'Hot': return 'bg-red-100 text-red-800';
    case 'Warm': return 'bg-orange-100 text-orange-800';
    case 'Cold': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ContactsWrapper({ userId, apiKeys }: ContactsWrapperProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [summary, setSummary] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Fetch contacts from API
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        eventType: eventTypeFilter,
        leadStatus: leadStatusFilter,
        limit: '200'
      });

      const response = await fetch(`/api/get-contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setSummary(data.summary || null);
      } else {
        console.error('Failed to fetch contacts');
        toast({
          title: "Error",
          description: "Failed to fetch contacts",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Error fetching contacts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects for selected contact
  const fetchProjects = async (contactId: string) => {
    setProjectsLoading(true);
    try {
      const response = await fetch(`/api/get-contact-projects?contactId=${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Create project for existing contact (for testing)
  const createProjectForContact = async (contactId: string) => {
    setProjectsLoading(true);
    try {
      const response = await fetch('/api/create-project-for-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        // Refresh projects
        await fetchProjects(contactId);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create project",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  // Filter and sort contacts
  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase().includes(query) ||
        contact.email_address?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.venue_name?.toLowerCase().includes(query) ||
        contact.notes?.toLowerCase().includes(query)
      );
    }

    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.event_type === eventTypeFilter);
    }

    // Apply lead status filter
    if (leadStatusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.lead_status === leadStatusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Contact];
      let bValue: any = b[sortBy as keyof Contact];

      if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'event_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredContacts(filtered);
  }, [contacts, searchQuery, eventTypeFilter, leadStatusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getContactInitials = (contact: Contact) => {
    return `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() || 'C';
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactModal(true);
    fetchProjects(contact.id);
  };

  const handleSendSMS = (contact: Contact) => {
    // Navigate to chat with this contact pre-filled
    window.open(`/chat?contact=${encodeURIComponent(contact.phone || '')}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Summary Cards - Mobile Optimized: 2 cols mobile, 4 cols desktop */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 lg:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <IconUser className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div className="ml-2 lg:ml-3 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-blue-600 truncate">Total Contacts</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">{summary.total_contacts || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 lg:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <IconTarget className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div className="ml-2 lg:ml-3 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-green-600 truncate">New Leads</p>
                <p className="text-xl lg:text-2xl font-bold text-green-900">{summary.new_leads || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 lg:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <IconCalendar className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
              <div className="ml-2 lg:ml-3 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-purple-600 truncate">Booked</p>
                <p className="text-xl lg:text-2xl font-bold text-purple-900">{summary.booked_events || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3 lg:p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <IconClock className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
              </div>
              <div className="ml-2 lg:ml-3 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-orange-600 truncate">Follow-ups</p>
                <p className="text-xl lg:text-2xl font-bold text-orange-900">{summary.follow_ups_due || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search - Mobile Optimized */}
      <div className="flex flex-col gap-3 lg:gap-4">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative w-full">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            className="pl-10 h-12 lg:h-10"
          />
        </div>
        
        {/* Filters - 2 cols on mobile, row on desktop */}
        <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-3">
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-full lg:w-48 h-12 lg:h-10">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
            <SelectTrigger className="w-full lg:w-48 h-12 lg:h-10">
              <SelectValue placeholder="Lead Status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-40 h-12 lg:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="updated_at">Updated Date</SelectItem>
              <SelectItem value="event_date">Event Date</SelectItem>
              <SelectItem value="first_name">Name</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="flat"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-12 lg:h-10 lg:w-auto lg:px-3"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <IconArrowUp className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            <span className="ml-2 lg:hidden">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </Button>
        </div>
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00]"></div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <IconUser className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
              onClick={() => handleContactClick(contact)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[#fcba00] text-black font-semibold">
                      {getContactInitials(contact)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.email_address}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {contact.lead_status && (
                    <Badge className={`text-xs ${getLeadStatusColor(contact.lead_status)}`}>
                      {contact.lead_status}
                    </Badge>
                  )}
                  {contact.lead_temperature && (
                    <Badge className={`text-xs ${getTemperatureColor(contact.lead_temperature)}`}>
                      {contact.lead_temperature}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {contact.phone && (
                  <div className="flex items-center">
                    <IconPhone className="h-4 w-4 mr-2" />
                    {contact.phone}
                  </div>
                )}
                {contact.event_type && (
                  <div className="flex items-center">
                    <IconMusic className="h-4 w-4 mr-2" />
                    {contact.event_type.replace('_', ' ').toUpperCase()}
                  </div>
                )}
                {contact.event_date && (
                  <div className="flex items-center">
                    <IconCalendar className="h-4 w-4 mr-2" />
                    {formatDate(contact.event_date)}
                  </div>
                )}
                {contact.venue_name && (
                  <div className="flex items-center">
                    <IconMapPin className="h-4 w-4 mr-2" />
                    {contact.venue_name}
                  </div>
                )}
                {contact.budget_range && (
                  <div className="flex items-center">
                    <IconCurrencyDollar className="h-4 w-4 mr-2" />
                    {contact.budget_range}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="flat"
                  className="flex-1 text-xs lg:text-sm h-10 lg:h-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactClick(contact);
                  }}
                >
                  <IconEye className="h-4 w-4 lg:h-3 lg:w-3 lg:mr-1" />
                  <span className="hidden lg:inline">View</span>
                </Button>
                {contact.phone && (
                  <Button
                    variant="flat"
                    className="flex-1 text-xs lg:text-sm h-10 lg:h-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendSMS(contact);
                    }}
                  >
                    <IconMessage className="h-4 w-4 lg:h-3 lg:w-3 lg:mr-1" />
                    <span className="hidden lg:inline">SMS</span>
                  </Button>
                )}
                {contact.email_address && (
                  <Button
                    variant="flat"
                    className="flex-1 text-xs lg:text-sm h-10 lg:h-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`mailto:${contact.email_address}`, '_blank');
                    }}
                  >
                    <IconMail className="h-4 w-4 lg:h-3 lg:w-3 lg:mr-1" />
                    <span className="hidden lg:inline">Email</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Details Modal - Mobile Optimized */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] lg:max-h-[80vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#fcba00] text-black font-semibold">
                  {selectedContact ? getContactInitials(selectedContact) : 'C'}
                </AvatarFallback>
              </Avatar>
              {selectedContact && (
                <div>
                  <h2 className="text-xl font-semibold">
                    {`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim() || 'Unknown Contact'}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedContact.email_address}</p>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {selectedContact.lead_status && (
                  <Badge className={getLeadStatusColor(selectedContact.lead_status)}>
                    {selectedContact.lead_status}
                  </Badge>
                )}
                {selectedContact.lead_temperature && (
                  <Badge className={getTemperatureColor(selectedContact.lead_temperature)}>
                    {selectedContact.lead_temperature}
                  </Badge>
                )}
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="event">Event Info</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedContact.email_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedContact.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Lead Source</label>
                      <p className="text-sm text-gray-900">{selectedContact.lead_source || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedContact.created_at)}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="event" className="space-y-4">
                  {/* Contact Event Details */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Event Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Event Type</label>
                        <p className="text-sm text-gray-900">
                          {selectedContact.event_type?.replace('_', ' ').toUpperCase() || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Event Date</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedContact.event_date)}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700">Venue</label>
                        <p className="text-sm text-gray-900">{selectedContact.venue_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Budget Range</label>
                        <p className="text-sm text-gray-900">{selectedContact.budget_range || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Projects</h4>
                      <Button 
                        onClick={() => selectedContact && fetchProjects(selectedContact.id)}
                        disabled={projectsLoading}
                        variant="flat"
                      >
                        {projectsLoading ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                    
                    {projectsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-2">Loading projects...</p>
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No projects found for this contact.</p>
                        <p className="text-xs text-gray-400 mt-1">Projects are automatically created when contact forms are submitted.</p>
                        <Button 
                          onClick={() => createProjectForContact(selectedContact.id)}
                          disabled={projectsLoading}
                          variant="flat"
                          className="mt-2"
                        >
                          Create Project (Test)
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projects.map((project) => (
                          <div key={project.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="text-sm font-medium text-gray-900">{project.event_name}</h5>
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
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div>
                                    <span className="font-medium">Type:</span> {project.event_type}
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
                                </div>
                              </div>
                              <div className="ml-3">
                                <Link href={`/admin/projects/${project.id}`}>
                                  <Button variant="flat">
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Special Requests</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedContact.special_requests || 'None'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedContact.notes || 'No notes'}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Link href={`/admin/contacts/${selectedContact.id}`} className="flex-1">
                  <Button className="w-full">
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit Contact
                  </Button>
                </Link>
                {selectedContact.phone && (
                  <Button
                    variant="flat"
                    className="flex-1"
                    onClick={() => handleSendSMS(selectedContact)}
                  >
                    <IconMessage className="h-4 w-4 mr-2" />
                    Send SMS
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}