/**
 * Admin Projects Dashboard
 * Comprehensive view of all events/projects with filtering, stats, and management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Filter,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Music,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Project {
  id: string;
  event_name: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_type: string;
  event_date: string;
  start_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  number_of_guests: number | null;
  status: string;
  created_at: string;
  special_requests: string | null;
}

interface DashboardStats {
  totalProjects: number;
  upcomingEvents: number;
  confirmedBookings: number;
  pendingProjects: number;
  monthlyBookings: number;
  totalRevenue: number;
}

export default function ProjectsDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    upcomingEvents: 0,
    confirmedBookings: 0,
    pendingProjects: 0,
    monthlyBookings: 0,
    totalRevenue: 0
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // upcoming, past, this-month, next-month

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, statusFilter, eventTypeFilter, dateFilter]);

  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/signin');
      return;
    }

    // Check subscription access for projects feature
    const { isPlatformAdmin } = await import('@/utils/auth-helpers/platform-admin');
    const { canAccessAdminPage } = await import('@/utils/subscription-access');
    
    const isAdmin = isPlatformAdmin(user.email);
    
    if (!isAdmin) {
      const access = await canAccessAdminPage(supabase, user.email, 'projects');
      
      if (!access.canAccess) {
        // Redirect to starter dashboard with upgrade prompt
        router.push('/admin/dashboard-starter');
        return;
      }
    }

    setUser(user);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      
      setProjects(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsData: Project[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const upcoming = projectsData.filter(p => new Date(p.event_date) >= now);
    const confirmed = projectsData.filter(p => p.status === 'confirmed');
    const pending = projectsData.filter(p => p.status === 'pending');
    const thisMonth = projectsData.filter(p => {
      const eventDate = new Date(p.event_date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
    
    setStats({
      totalProjects: projectsData.length,
      upcomingEvents: upcoming.length,
      confirmedBookings: confirmed.length,
      pendingProjects: pending.length,
      monthlyBookings: thisMonth.length,
      totalRevenue: 0 // Can be calculated from linked invoices/payments
    });
  };

  const applyFilters = () => {
    let filtered = [...projects];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.event_name?.toLowerCase().includes(query) ||
        p.client_name?.toLowerCase().includes(query) ||
        p.client_email?.toLowerCase().includes(query) ||
        p.venue_name?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.event_type === eventTypeFilter);
    }
    
    // Date filter
    const now = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(p => new Date(p.event_date) >= now);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(p => new Date(p.event_date) < now);
    } else if (dateFilter === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filtered = filtered.filter(p => {
        const eventDate = new Date(p.event_date);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      });
    } else if (dateFilter === 'next-month') {
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      filtered = filtered.filter(p => {
        const eventDate = new Date(p.event_date);
        return eventDate >= startOfNextMonth && eventDate <= endOfNextMonth;
      });
    }
    
    setFilteredProjects(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'TBD';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'wedding':
        return 'bg-pink-100 text-pink-800';
      case 'corporate':
        return 'bg-blue-100 text-blue-800';
      case 'private_party':
        return 'bg-purple-100 text-purple-800';
      case 'school_dance':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects Dashboard</h1>
            <p className="text-gray-600">Manage all your events and bookings</p>
          </div>
          <Button
            onClick={() => router.push('/admin/projects/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Projects</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Upcoming Events</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
            <p className="text-xs text-gray-500 mt-1">Future bookings</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Confirmed</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.confirmedBookings}</p>
            <p className="text-xs text-gray-500 mt-1">Locked in</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingProjects}</p>
            <p className="text-xs text-gray-500 mt-1">Need follow-up</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Event Type Filter */}
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Event Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="private_party">Private Party</SelectItem>
                <SelectItem value="school_dance">School Dance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past Events</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="next-month">Next Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredProjects.length}</span> of{' '}
              <span className="font-semibold">{projects.length}</span> projects
            </p>
            {(searchQuery || statusFilter !== 'all' || eventTypeFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setEventTypeFilter('all');
                  setDateFilter('all');
                }}
                variant="slim"
                className="text-sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || eventTypeFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first project'}
              </p>
              <Button onClick={() => router.push('/admin/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.event_name}
                        </h3>
                        <Badge className={`${getStatusColor(project.status)} border`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {project.status}
                          </span>
                        </Badge>
                        <Badge className={getEventTypeColor(project.event_type)}>
                          {project.event_type.replace('_', ' ')}
                        </Badge>
                        {isUpcoming(project.event_date) && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{project.client_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatDate(project.event_date)}</span>
                      {project.start_time && (
                        <span className="text-gray-500">at {formatTime(project.start_time)}</span>
                      )}
                    </div>
                    
                    {project.venue_name && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{project.venue_name}</span>
                      </div>
                    )}
                    
                    {project.number_of_guests && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{project.number_of_guests} guests</span>
                      </div>
                    )}
                  </div>

                  {project.special_requests && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Special Requests:</span> {project.special_requests}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

