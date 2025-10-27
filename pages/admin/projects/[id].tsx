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

interface Project {
  id: string;
  event_name: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_type: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  number_of_guests: number | null;
  event_duration: number | null;
  special_requests: string | null;
  status: string;
  notes: string | null;
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

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null);
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
      fetchProject();
    }
  }, [user, id]);

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
    try {
      const { error } = await supabase
        .from('events')
        .update({
          event_name: project.event_name,
          client_name: project.client_name,
          client_email: project.client_email,
          client_phone: project.client_phone,
          event_type: project.event_type,
          event_date: project.event_date,
          event_time: project.event_time,
          venue_name: project.venue_name,
          venue_address: project.venue_address,
          number_of_guests: project.number_of_guests,
          event_duration: project.event_duration,
          special_requests: project.special_requests,
          status: project.status,
          notes: project.notes,
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

      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/admin/contacts">
            <Button>Back to Contacts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={from === 'contacts' ? '/admin/contacts' : '/admin/dashboard'}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.event_name}</h1>
                <p className="text-gray-600">Project Details</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-white border rounded-lg p-1">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="client">Client Information</TabsTrigger>
            <TabsTrigger value="notes">Notes & Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Event Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  {isEditing ? (
                    <Input
                      value={project.event_name}
                      onChange={(value) => handleInputChange('event_name', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.event_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {isEditing ? (
                    <Select value={project.status} onValueChange={(value) => handleInputChange('status', value)}>
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
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <p className="text-gray-900">{project.event_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formatDate(project.event_date)}
                      onChange={(value) => handleInputChange('event_date', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.event_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={project.event_time || ''}
                      onChange={(value) => handleInputChange('event_time', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.event_time || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={project.event_duration || ''}
                      onChange={(value) => handleInputChange('event_duration', value ? parseInt(value) : null)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.event_duration ? `${project.event_duration} hours` : 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={project.number_of_guests || ''}
                      onChange={(value) => handleInputChange('number_of_guests', value ? parseInt(value) : null)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.number_of_guests || 'Not specified'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  {isEditing ? (
                    <Input
                      value={project.venue_name || ''}
                      onChange={(value) => handleInputChange('venue_name', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.venue_name || 'Not specified'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                  {isEditing ? (
                    <Input
                      value={project.venue_address || ''}
                      onChange={(value) => handleInputChange('venue_address', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.venue_address || 'Not specified'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                  {isEditing ? (
                    <Textarea
                      value={project.special_requests || ''}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{project.special_requests || 'None'}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="client">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  {isEditing ? (
                    <Input
                      value={project.client_name}
                      onChange={(value) => handleInputChange('client_name', value)}
                    />
                  ) : (
                    <p className="text-gray-900">{project.client_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={project.client_email}
                      onChange={(value) => handleInputChange('client_email', value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${project.client_email}`} className="text-blue-600 hover:text-blue-800">
                        {project.client_email}
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={project.client_phone || ''}
                      onChange={(value) => handleInputChange('client_phone', value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {project.client_phone ? (
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

          <TabsContent value="notes">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Notes & Communication</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Notes</label>
                  {isEditing ? (
                    <Textarea
                      value={project.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={6}
                      placeholder="Add notes about this project..."
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{project.notes || 'No notes added yet.'}</p>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  <p><strong>Created:</strong> {new Date(project.created_at).toLocaleString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(project.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
