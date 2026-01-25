'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { 
  Search, 
  Eye, 
  User, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  ExternalLink,
  Copy,
  Filter,
  Download
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Affiliate {
  id: string;
  user_id: string;
  organization_id?: string;
  affiliate_code: string;
  display_name?: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  commission_rate: number;
  platform_fee_rate: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earned: number;
  total_paid: number;
  pending_balance: number;
  lifetime_value: number;
  created_at: string;
  user?: {
    email: string;
    raw_user_meta_data?: any;
  };
  organization?: {
    name: string;
    slug: string;
  };
}

interface Commission {
  id: string;
  affiliate_id: string;
  amount: number;
  commission_type: string;
  status: string;
  created_at: string;
  affiliate?: {
    affiliate_code: string;
  };
}

export default function AffiliatesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalEarned: 0,
    pendingPayouts: 0
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAffiliates();
      fetchCommissions();
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

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('affiliates')
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data
          ),
          organization:organization_id (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (searchTerm) {
        query = query.or(`affiliate_code.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const affiliatesData = (data || []).map((aff: any) => ({
        ...aff,
        user: Array.isArray(aff.user) ? aff.user[0] : aff.user,
        organization: Array.isArray(aff.organization) ? aff.organization[0] : aff.organization
      }));

      setAffiliates(affiliatesData);

      // Calculate stats
      const total = affiliatesData.length;
      const active = affiliatesData.filter((a: Affiliate) => a.status === 'active').length;
      const pending = affiliatesData.filter((a: Affiliate) => a.status === 'pending').length;
      const totalEarned = affiliatesData.reduce((sum: number, a: Affiliate) => sum + (a.total_earned || 0), 0);
      const pendingPayouts = affiliatesData.reduce((sum: number, a: Affiliate) => sum + (a.pending_balance || 0), 0);

      setStats({ total, active, pending, totalEarned, pendingPayouts });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliate:affiliate_id (
            affiliate_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const commissionsData = (data || []).map((comm: any) => ({
        ...comm,
        affiliate: Array.isArray(comm.affiliate) ? comm.affiliate[0] : comm.affiliate
      }));

      setCommissions(commissionsData);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          status: newStatus,
          ...(newStatus === 'active' && { approved_at: new Date().toISOString(), approved_by: user.id })
        })
        .eq('id', affiliateId);

      if (error) throw error;

      await fetchAffiliates();
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      alert('Failed to update affiliate status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default', icon: <CheckCircle className="w-3 h-3" />, label: 'Active' },
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
      suspended: { variant: 'destructive', icon: <AlertCircle className="w-3 h-3" />, label: 'Suspended' },
      terminated: { variant: 'outline', icon: <XCircle className="w-3 h-3" />, label: 'Terminated' }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Program Management</h1>
            <p className="text-muted-foreground mt-1">Manage affiliates, commissions, and payouts</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Affiliates</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.active}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Earned</div>
            <div className="text-2xl font-bold mt-1">${stats.totalEarned.toFixed(2)}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Pending Payouts</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">${stats.pendingPayouts.toFixed(2)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Affiliates Table */}
        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Affiliate Code</th>
                  <th className="text-left p-4">Display Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Clicks</th>
                  <th className="text-left p-4">Signups</th>
                  <th className="text-left p-4">Conversions</th>
                  <th className="text-left p-4">Earned</th>
                  <th className="text-left p-4">Pending</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-muted-foreground">
                      No affiliates found
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{affiliate.affiliate_code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(affiliate.affiliate_code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">{affiliate.display_name || '-'}</td>
                      <td className="p-4">{affiliate.user?.email || '-'}</td>
                      <td className="p-4">{getStatusBadge(affiliate.status)}</td>
                      <td className="p-4">{affiliate.total_clicks || 0}</td>
                      <td className="p-4">{affiliate.total_signups || 0}</td>
                      <td className="p-4">{affiliate.total_conversions || 0}</td>
                      <td className="p-4">${(affiliate.total_earned || 0).toFixed(2)}</td>
                      <td className="p-4">${(affiliate.pending_balance || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAffiliate(affiliate);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {affiliate.status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                            >
                              Approve
                            </Button>
                          )}
                          {affiliate.status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateAffiliateStatus(affiliate.id, 'suspended')}
                            >
                              Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Commissions</h2>
          <div className="space-y-2">
            {commissions.slice(0, 10).map((commission) => (
              <div key={commission.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">
                    {commission.affiliate?.affiliate_code || 'Unknown'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {commission.commission_type} • {new Date(commission.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${commission.amount.toFixed(2)}</div>
                  <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                    {commission.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
