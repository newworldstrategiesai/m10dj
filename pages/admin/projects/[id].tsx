'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Phone, Mail, Calendar, MapPin, Music, DollarSign, User, MessageSquare, Edit3, Trash2, Mic, MicOff, FileText, ExternalLink, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import { syncVenueFromProjectToContact } from '@/utils/sync-venue-data';
import SongRecognition from '@/components/audio/SongRecognition';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getCurrentOrganization } from '@/utils/organization-context';
import CustomerTimeline from '@/components/admin/CustomerTimeline';

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
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  number_of_guests: number | null;
  event_duration: number | null;
  special_requests: string | null;
  playlist_notes: string | null;
  timeline_notes: string | null;
  status: string;
  audio_tracking_enabled: boolean | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

const PROJECT_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
];

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_status: string;
  invoice_title: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  contact_id: string;
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const { id, from } = router.query as { id: string; from?: string };

  const fetchInvoices = async () => {
    if (!id) return;
    
    setInvoicesLoading(true);
    try {
      // Fetch invoices linked to this project by project_id
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoice_summary')
        .select('*')
        .eq('project_id', id)
        .order('invoice_date', { ascending: false });
      
      if (invoiceError) {
        console.error('Error fetching invoices:', invoiceError);
        // Fallback: try querying invoices table directly
        const { data: directInvoices, error: directError } = await supabase
          .from('invoices')
          .select('*')
          .eq('project_id', id)
          .order('invoice_date', { ascending: false });
        
        if (!directError && directInvoices) {
          // Transform to match Invoice interface
          const transformed = (directInvoices as any[]).map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_status: inv.invoice_status,
            invoice_title: inv.invoice_title || '',
            invoice_date: inv.invoice_date,
            due_date: inv.due_date,
            total_amount: parseFloat(inv.total_amount) || 0,
            amount_paid: parseFloat(inv.amount_paid) || 0,
            balance_due: parseFloat(inv.balance_due) || 0,
            contact_id: inv.contact_id
          }));
          setInvoices(transformed);
        } else {
          setInvoices([]);
        }
      } else {
        // Transform invoice_summary data to Invoice interface
        const transformed = ((invoiceData || []) as any[]).map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_status: inv.invoice_status,
          invoice_title: inv.invoice_title || '',
          invoice_date: inv.invoice_date,
          due_date: inv.due_date,
          total_amount: parseFloat(inv.total_amount) || 0,
          amount_paid: parseFloat(inv.amount_paid) || 0,
          balance_due: parseFloat(inv.balance_due) || 0,
          contact_id: inv.contact_id
        }));
        setInvoices(transformed);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && id) {
      if (id === 'new') {
        // Initialize new project form
        setProject({
          id: '',
          event_name: '',
          client_name: '',
          client_email: '',
          client_phone: null,
          event_type: '',
          event_date: new Date().toISOString().split('T')[0],
          start_time: null,
          end_time: null,
          event_time: null,
          venue_name: null,
          venue_address: null,
          number_of_guests: null,
          event_duration: null,
          special_requests: null,
          playlist_notes: null,
          timeline_notes: null,
          status: 'pending',
          audio_tracking_enabled: false,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setIsEditing(true);
        setLoading(false);
      } else {
        fetchProject();
        fetchInvoices();
      }
    }
  }, [user, id, organizationId]);

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/signin');
        return;
      }

      // Check if user is admin using email-based authentication
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
      
      // Get organization ID for audio tracking
      const org = await getCurrentOrganization(supabase);
      if (org) {
        setOrganizationId(org.id);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/signin');
    }
  };

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive"
        });
        return;
      }
        
      setProject(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error", 
        description: "Failed to load project details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    const isNewProject = id === 'new' || !project.id;
    try {
      
      if (isNewProject) {
        // Create new project
        const projectData: any = {
          event_name: project.event_name,
          client_name: project.client_name,
          client_email: project.client_email,
          client_phone: project.client_phone,
          event_type: project.event_type,
          event_date: project.event_date,
          start_time: project.start_time,
          end_time: project.end_time,
          venue_name: project.venue_name,
          venue_address: project.venue_address,
          number_of_guests: project.number_of_guests,
          event_duration: project.event_duration,
          special_requests: project.special_requests,
          playlist_notes: project.playlist_notes,
          timeline_notes: project.timeline_notes,
          status: project.status,
          audio_tracking_enabled: project.audio_tracking_enabled ?? false,
          organization_id: organizationId || project.organization_id
        };

        const { data: newProject, error } = await (supabase
          .from('events') as any)
          .insert([projectData])
          .select()
          .single();

        if (error) {
          console.error('Error creating project:', error);
          toast({
            title: "Error",
            description: "Failed to create project",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Success",
          description: "Project created successfully",
        });
        
        // Redirect to the new project's detail page
        router.push(`/admin/projects/${newProject.id}`);
      } else {
        // Update existing project
        const { error } = await (supabase
          .from('events') as any)
          .update({
            event_name: project.event_name,
            client_name: project.client_name,
            client_email: project.client_email,
            client_phone: project.client_phone,
            event_type: project.event_type,
            event_date: project.event_date,
            start_time: project.start_time,
            end_time: project.end_time,
            venue_name: project.venue_name,
            venue_address: project.venue_address,
            number_of_guests: project.number_of_guests,
            event_duration: project.event_duration,
            special_requests: project.special_requests,
            playlist_notes: project.playlist_notes,
            timeline_notes: project.timeline_notes,
            status: project.status,
            audio_tracking_enabled: project.audio_tracking_enabled ?? false,
            updated_at: new Date().toISOString()
          })
          .eq('id', project.id);

        if (error) {
          console.error('Error updating project:', error);
          toast({
            title: "Error",
            description: "Failed to update project",
            variant: "destructive"
          });
          return;
        }

        // Sync venue data to linked contact
        await syncVenueFromProjectToContact(project.id, {
          venue_name: project.venue_name,
          venue_address: project.venue_address,
        });

        toast({
          title: "Success",
          description: "Project updated successfully",
        });
        setIsEditing(false);
        await fetchProject(); // Refresh the project data
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: isNewProject ? "Failed to create project" : "Failed to update project",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    if (!project) return;
    setProject({ ...project, [field]: value });
  };

  const handleToggleAudioTracking = async (enabled: boolean) => {
    if (!project) return;
    
    setSaving(true);
    try {
      const { error } = await (supabase
        .from('events') as any)
        .update({
          audio_tracking_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) {
        console.error('Error updating audio tracking:', error);
        toast({
          title: "Error",
          description: "Failed to update audio tracking setting",
          variant: "destructive"
        });
        return;
      }

      setProject({ ...project, audio_tracking_enabled: enabled });
      toast({
        title: "Success",
        description: enabled ? "Audio tracking enabled" : "Audio tracking disabled",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update audio tracking setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 lg:pt-0 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project && id !== 'new') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 lg:pt-0 px-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/admin/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-16 lg:pt-8 pb-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link href={from === 'contacts' ? '/admin/contacts' : '/admin/dashboard'} className="flex-shrink-0">
                <Button variant="slim" className="h-9 px-3 sm:px-4">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {id === 'new' ? 'New Project' : (project?.event_name || 'Project')}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>Project Details</span>
                  {invoices.length > 0 && (
                    <Link
                      href={`/admin/invoices/${invoices[0].id}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      Invoice {invoices[0].invoice_number}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              {isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(false)} variant="slim" className="flex-1 sm:flex-none text-sm">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none text-sm">
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto text-sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="bg-white border rounded-lg p-1 inline-flex min-w-max sm:w-auto">
              <TabsTrigger value="details" className="text-xs sm:text-sm px-2 sm:px-4">Details</TabsTrigger>
              <TabsTrigger value="client" className="text-xs sm:text-sm px-2 sm:px-4">Client</TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs sm:text-sm px-2 sm:px-4">Invoices</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm px-2 sm:px-4">Notes</TabsTrigger>
              <TabsTrigger value="audio" className="text-xs sm:text-sm px-2 sm:px-4">Audio</TabsTrigger>
              <TabsTrigger value="journey" className="text-xs sm:text-sm px-2 sm:px-4">Journey</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Event Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  {isEditing ? (
                    <Input
                      value={project?.event_name || ''}
                      onChange={(e) => handleInputChange('event_name', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.event_name || ''}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {isEditing ? (
                    <Select value={project?.status || 'pending'} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={
                          project?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          project?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          project?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          project?.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {project?.status || 'pending'}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <p className="text-gray-900">{project?.event_type || ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={project?.event_date ? formatDate(project.event_date) : ''}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.event_date || ''}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={project?.event_time || ''}
                      onChange={(e) => handleInputChange('event_time', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.event_time || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={project?.event_duration || ''}
                      onChange={(e) => handleInputChange('event_duration', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.event_duration ? `${project.event_duration} hours` : 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={project?.number_of_guests || ''}
                      onChange={(e) => handleInputChange('number_of_guests', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.number_of_guests || 'Not specified'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  {isEditing ? (
                    <Input
                      value={project?.venue_name || ''}
                      onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.venue_name || 'Not specified'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                  {isEditing ? (
                    <Input
                      value={project?.venue_address || ''}
                      onChange={(e) => handleInputChange('venue_address', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.venue_address || 'Not specified'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                  {isEditing ? (
                    <Textarea
                      value={project?.special_requests || ''}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{project?.special_requests || 'None'}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="client">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  {isEditing ? (
                    <Input
                      value={project?.client_name || ''}
                      onChange={(e) => handleInputChange('client_name', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project?.client_name || ''}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={project?.client_email || ''}
                      onChange={(e) => handleInputChange('client_email', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {project?.client_email ? (
                        <a href={`mailto:${project.client_email}`} className="text-blue-600 hover:text-blue-800">
                          {project.client_email}
                        </a>
                      ) : (
                        <span className="text-gray-500">Not provided</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={project?.client_phone || ''}
                      onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {project?.client_phone ? (
                        <a href={`tel:${project.client_phone}`} className="text-blue-600 hover:text-blue-800">
                          {project.client_phone}
                        </a>
                      ) : (
                        <span className="text-gray-500">Not provided</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Invoices</h3>
                {project?.client_email && (
                  <Button
                    onClick={() => {
                      // Find contact by email to create invoice
                      router.push(`/admin/invoices/new?projectId=${id}&contactEmail=${encodeURIComponent(project.client_email)}`);
                    }}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Invoice
                  </Button>
                )}
              </div>
              
              {invoicesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading invoices...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No invoices found for this project</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Create an invoice for this project to track billing and payments.
                  </p>
                  {project?.client_email && (
                    <Button
                      onClick={() => {
                        router.push(`/admin/invoices/new?projectId=${id}&contactEmail=${encodeURIComponent(project.client_email)}`);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Invoice
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => {
                    const getStatusColor = (status: string) => {
                      switch (status?.toLowerCase()) {
                        case 'paid':
                          return 'bg-green-100 text-green-800 border-green-200';
                        case 'overdue':
                          return 'bg-red-100 text-red-800 border-red-200';
                        case 'partial':
                          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        case 'sent':
                        case 'viewed':
                          return 'bg-blue-100 text-blue-800 border-blue-200';
                        default:
                          return 'bg-gray-100 text-gray-600 border-gray-200';
                      }
                    };

                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/admin/invoices/${invoice.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {invoice.invoice_number}
                            </Link>
                            <Badge className={`${getStatusColor(invoice.invoice_status)} text-xs px-2 py-1`}>
                              {invoice.invoice_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{invoice.invoice_title || 'Invoice'}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                            <span>Total: ${invoice.total_amount.toFixed(2)}</span>
                            {invoice.balance_due > 0 && (
                              <span className="text-red-600 font-semibold">
                                Balance: ${invoice.balance_due.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/invoices/${invoice.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View Invoice"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Notes & Communication</h3>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Notes</label>
                  {isEditing ? (
                    <Textarea
                      value={project?.timeline_notes || ''}
                      onChange={(e) => handleInputChange('timeline_notes', e.target.value)}
                      rows={6}
                      placeholder="Add notes about this project..."
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{project?.timeline_notes || 'No notes added yet.'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Playlist Notes</label>
                  {isEditing ? (
                    <Textarea
                      value={project?.playlist_notes || ''}
                      onChange={(e) => handleInputChange('playlist_notes', e.target.value)}
                      rows={4}
                      placeholder="Add notes about music preferences, playlist, do-not-play list..."
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{project?.playlist_notes || 'No playlist notes added yet.'}</p>
                    </div>
                  )}
                </div>
                {project && (
                  <div className="text-sm text-gray-500">
                    <p><strong>Created:</strong> {new Date(project.created_at).toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(project.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Automatic Song Recognition</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Enable automatic song detection using your phone's microphone. Detected songs will automatically match to song requests and mark them as played.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {project?.audio_tracking_enabled ? (
                    <Mic className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <MicOff className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div>
                    <Label htmlFor="audio-tracking" className="text-sm sm:text-base font-medium cursor-pointer">
                      Enable Audio Tracking
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {project?.audio_tracking_enabled 
                        ? 'Audio recognition is active'
                        : 'Turn on to detect and track songs'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="audio-tracking"
                  checked={project?.audio_tracking_enabled ?? false}
                  onCheckedChange={handleToggleAudioTracking}
                  disabled={saving}
                  className="self-end sm:self-auto"
                />
              </div>

              {/* Song Recognition Component */}
              {project?.audio_tracking_enabled && project?.id && (
                <div className="mt-6">
                  <SongRecognition
                    eventId={project.id}
                    organizationId={organizationId || project.organization_id || undefined}
                    onSongDetected={(song) => {
                      toast({
                        title: "Song Detected!",
                        description: `${song.title} by ${song.artist} - Request marked as played`,
                      });
                    }}
                    chunkDuration={5}
                  />
                </div>
              )}

              {!project?.audio_tracking_enabled && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>How it works:</strong> When enabled, place your phone near the speakers and the system will automatically detect songs being played. Matching song requests will be marked as "played" automatically.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="journey">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <CustomerTimeline 
                email={project?.client_email || undefined}
                phone={project?.client_phone || undefined}
                showHeader={true}
                limit={100}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
