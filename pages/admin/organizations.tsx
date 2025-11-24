'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { 
  Search, 
  Eye, 
  Building2, 
  User, 
  Calendar,
  CreditCard,
  ExternalLink,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_tier: string;
  subscription_status: string;
  stripe_connect_account_id?: string;
  stripe_connect_charges_enabled?: boolean;
  stripe_connect_payouts_enabled?: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    email: string;
    full_name?: string;
  };
}

export default function OrganizationsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewAsOrgId, setViewAsOrgId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    checkViewAsMode();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user, filterStatus]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/signin');
        return;
      }

      if (!isPlatformAdmin(user.email || '')) {
        router.push('/admin/dashboard');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/signin');
    }
  };

  const checkViewAsMode = () => {
    // Check if we're in view-as mode
    const viewAs = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_view_as_org_id='))
      ?.split('=')[1];
    
    if (viewAs) {
      setViewAsOrgId(viewAs);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch all organizations with owner info
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select(`
          *,
          owner:auth.users!organizations_owner_id_fkey(email, raw_user_meta_data)
        `)
        .order('created_at', { ascending: false });

      if (orgError) {
        console.error('Error fetching organizations:', orgError);
        return;
      }

      // Transform the data to include owner email
      const transformedOrgs = (orgs || []).map((org: any) => ({
        ...org,
        owner: {
          email: org.owner?.email || 'Unknown',
          full_name: org.owner?.raw_user_meta_data?.full_name || null,
        },
      }));

      setOrganizations(transformedOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAs = async (orgId: string) => {
    try {
      // Set cookie to view as this organization
      const response = await fetch('/api/admin/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (response.ok) {
        setViewAsOrgId(orgId);
        // Redirect to the organization's dashboard/onboarding
        router.push('/onboarding/welcome');
      } else {
        alert('Failed to switch view. Please try again.');
      }
    } catch (error) {
      console.error('Error switching view:', error);
      alert('Failed to switch view. Please try again.');
    }
  };

  const handleExitViewAs = async () => {
    try {
      const response = await fetch('/api/admin/view-as', {
        method: 'DELETE',
      });

      if (response.ok) {
        setViewAsOrgId(null);
        router.push('/admin/organizations');
      }
    } catch (error) {
      console.error('Error exiting view-as mode:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.owner?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || org.subscription_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Active' },
      trial: { icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Trial' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Cancelled' },
      past_due: { icon: XCircle, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', label: 'Past Due' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      white_label: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[tier as keyof typeof colors] || colors.starter}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* View As Banner */}
      {viewAsOrgId && (
        <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-medium">
              Viewing as: {organizations.find(o => o.id === viewAsOrgId)?.name || 'Unknown Organization'}
            </span>
          </div>
          <button
            onClick={handleExitViewAs}
            className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            Exit View
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                SaaS Organizations
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage and view all SaaS accounts
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, slug, or owner email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stripe Connect
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'No organizations match your filters.'
                        : 'No organizations found.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {org.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              /{org.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {org.owner?.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {org.owner?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(org.subscription_tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.subscription_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {org.stripe_connect_account_id ? (
                          <div className="flex flex-col gap-1">
                            {org.stripe_connect_charges_enabled && org.stripe_connect_payouts_enabled ? (
                              <span className="text-xs text-green-600 dark:text-green-400">✓ Active</span>
                            ) : (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">⚠ Incomplete</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not set up</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(org.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewAs(org.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            title="View as this organization"
                          >
                            <Eye className="w-4 h-4" />
                            View As
                          </button>
                          <Link
                            href={`/organizations/${org.slug}/requests`}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                            title="Open request page in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


