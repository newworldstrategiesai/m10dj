'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  QrCode,
  ExternalLink,
  Mail,
  Copy,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Loader2,
  Eye,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Link from 'next/link';

interface BatchOrganization {
  id: string;
  slug: string;
  name: string;
  prospect_email: string;
  prospect_phone?: string;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  created_by_admin_id: string;
  product_context: string;
  subscription_status: string;
  claim_token_expires_at: string | null;
  url: string;
  pending_tips_cents: number;
  pending_tips_dollars: string;
  tip_count: number;
  last_tip_at: string | null;
  has_pending_tips: boolean;
  claim_token_expired: boolean;
}

interface BatchSummary {
  total: number;
  unclaimed: number;
  claimed: number;
}

export default function BatchDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<BatchOrganization[]>([]);
  const [summary, setSummary] = useState<BatchSummary>({ total: 0, unclaimed: 0, claimed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all');
  const [selectedOrg, setSelectedOrg] = useState<BatchOrganization | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  
  // Quick create form state
  const [quickCreateData, setQuickCreateData] = useState({
    email: '',
    phone: '',
    business_name: '',
    artist_name: '',
    slug: ''
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Check super admin access
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/signin');
          return;
        }

        const isSuper = isSuperAdminEmail(user.email);
        setIsSuperAdmin(isSuper);

        if (!isSuper) {
          toast({
            title: 'Access Denied',
            description: 'This feature is only available to super admins',
            variant: 'destructive'
          });
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking super admin:', error);
        router.push('/signin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkSuperAdmin();
  }, [router, supabase, toast]);

  // Fetch organizations
  const fetchOrganizations = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: '100',
        offset: '0',
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/admin/tipjar/batch-created?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organizations');
      }

      setOrganizations(data.organizations || []);
      setSummary(data.summary || { total: 0, unclaimed: 0, claimed: 0 });
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch organizations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && !authLoading) {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isSuperAdmin, authLoading]);

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    });
  };

  // Quick create single organization
  const handleQuickCreate = async () => {
    if (!quickCreateData.email || !quickCreateData.business_name) {
      toast({
        title: 'Validation error',
        description: 'Email and business name are required',
        variant: 'destructive'
      });
      return;
    }

    setQuickCreateLoading(true);
    try {
      const response = await fetch('/api/admin/tipjar/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospects: [{
            email: quickCreateData.email,
            phone: quickCreateData.phone || undefined,
            business_name: quickCreateData.business_name,
            artist_name: quickCreateData.artist_name || undefined,
            slug: quickCreateData.slug || undefined
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      if (data.organizations && data.organizations.length > 0) {
        const org = data.organizations[0];
        
        toast({
          title: 'Success!',
          description: `Tip Jar page created for ${org.name}. Email sent to ${org.email}`,
        });

        // Reset form
        setQuickCreateData({
          email: '',
          phone: '',
          business_name: '',
          artist_name: '',
          slug: ''
        });

        // Close quick create dialog
        setShowQuickCreate(false);
        
        // Show success message with links
        setTimeout(() => {
          toast({
            title: 'Page Created!',
            description: (
              <div className="space-y-2">
                <p>Page URL: <a href={org.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{org.url}</a></p>
                <p>Claim Link: <a href={org.claim_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
              </div>
            ),
            duration: 10000
          });
        }, 500);

        // Refresh list to show new organization
        fetchOrganizations();
      }
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setQuickCreateLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Email',
      'Business Name',
      'Slug',
      'Status',
      'Created At',
      'Claimed At',
      'URL',
      'Claim Link',
      'Pending Tips',
      'Tip Count',
      'Last Tip At'
    ];

    const rows = organizations.map(org => [
      org.prospect_email,
      org.name,
      org.slug,
      org.is_claimed ? 'Claimed' : 'Unclaimed',
      new Date(org.created_at).toLocaleString(),
      org.claimed_at ? new Date(org.claimed_at).toLocaleString() : '',
      org.url,
      `${window.location.origin}/tipjar/claim?token=${org.id}`, // Would need actual token
      org.pending_tips_dollars,
      org.tip_count.toString(),
      org.last_tip_at ? new Date(org.last_tip_at).toLocaleString() : ''
    ]);

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipjar-batch-organizations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported!',
      description: 'Organizations exported to CSV'
    });
  };

  // Filter organizations
  const filteredOrgs = organizations.filter(org => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        org.prospect_email.toLowerCase().includes(query) ||
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Show loading or access denied
  if (authLoading) {
    return (
      <AdminLayout title="Loading..." showPageTitle={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Access Denied" showPageTitle={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              This feature is only available to super admins.
            </p>
            <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Batch Created Tip Jar Pages"
      description="Manage batch-created Tip Jar Live pages"
      showPageTitle
      pageTitle="Batch Created Tip Jar Pages"
      newButton={{
        href: '/admin/tipjar/batch-create',
        label: 'Batch Create',
        icon: <Plus className="w-4 h-4" />
      }}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Created</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unclaimed</p>
                <p className="text-2xl font-bold text-orange-600">{summary.unclaimed}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Claimed</p>
                <p className="text-2xl font-bold text-green-600">{summary.claimed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Tips</p>
                <p className="text-2xl font-bold">
                  ${organizations.reduce((sum, org) => sum + parseFloat(org.pending_tips_dollars || '0'), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowQuickCreate(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Quick Create
              </Button>
              <Button
                variant="outline"
                onClick={fetchOrganizations}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No organizations found</p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Prospect
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Business Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Pending Tips
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{org.prospect_email}</p>
                          {org.prospect_phone && (
                            <p className="text-sm text-muted-foreground">{org.prospect_phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">{org.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {org.is_claimed ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Unclaimed
                          </Badge>
                        )}
                        {org.claim_token_expired && !org.is_claimed && (
                          <Badge variant="destructive" className="ml-2">
                            Token Expired
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {org.has_pending_tips ? (
                          <div>
                            <p className="font-semibold text-green-600">${org.pending_tips_dollars}</p>
                            <p className="text-xs text-muted-foreground">
                              {org.tip_count} tip{org.tip_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">$0.00</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{new Date(org.created_at).toLocaleDateString()}</p>
                          {org.claimed_at && (
                            <p className="text-xs text-muted-foreground">
                              Claimed: {new Date(org.claimed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(org.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Create Dialog */}
        <Dialog open={showQuickCreate} onOpenChange={setShowQuickCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Create Tip Jar Page</DialogTitle>
              <DialogDescription>
                Create a single Tip Jar page quickly. Email will be sent automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="quick-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quick-email"
                  type="email"
                  placeholder="dj@example.com"
                  value={quickCreateData.email}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-business">Business Name <span className="text-destructive">*</span></Label>
                <Input
                  id="quick-business"
                  placeholder="DJ John's Events"
                  value={quickCreateData.business_name}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, business_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-artist">Artist Name (Optional)</Label>
                <Input
                  id="quick-artist"
                  placeholder="DJ John"
                  value={quickCreateData.artist_name}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, artist_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-phone">Phone (Optional)</Label>
                <Input
                  id="quick-phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={quickCreateData.phone}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-slug">Custom Slug (Optional)</Label>
                <Input
                  id="quick-slug"
                  placeholder="dj-john"
                  value={quickCreateData.slug}
                  onChange={(e) => setQuickCreateData({ ...quickCreateData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, will be auto-generated from business name
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowQuickCreate(false)}
                  className="flex-1"
                  disabled={quickCreateLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickCreate}
                  disabled={quickCreateLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {quickCreateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Page
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedOrg && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedOrg.name}</DialogTitle>
                  <DialogDescription>
                    {selectedOrg.is_claimed ? 'Claimed organization' : 'Unclaimed organization'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{selectedOrg.prospect_email}</p>
                      </div>
                      {selectedOrg.prospect_phone && (
                        <div>
                          <Label className="text-muted-foreground">Phone</Label>
                          <p className="font-medium">{selectedOrg.prospect_phone}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground">Slug</Label>
                        <p className="font-medium">{selectedOrg.slug}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        {selectedOrg.is_claimed ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            Unclaimed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Links</h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Page URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input value={selectedOrg.url} readOnly className="text-sm" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(selectedOrg.url, 'URL')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(selectedOrg.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tips Info */}
                  {selectedOrg.has_pending_tips && (
                    <div className="space-y-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Pending Tips
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Total Amount</Label>
                          <p className="font-semibold text-green-600 text-lg">${selectedOrg.pending_tips_dollars}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Tip Count</Label>
                          <p className="font-medium">{selectedOrg.tip_count} tip{selectedOrg.tip_count !== 1 ? 's' : ''}</p>
                        </div>
                        {selectedOrg.last_tip_at && (
                          <div>
                            <Label className="text-muted-foreground">Last Tip</Label>
                            <p className="font-medium">
                              {new Date(selectedOrg.last_tip_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Timeline</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Created At</Label>
                        <p className="font-medium">{new Date(selectedOrg.created_at).toLocaleString()}</p>
                      </div>
                      {selectedOrg.claimed_at && (
                        <div>
                          <Label className="text-muted-foreground">Claimed At</Label>
                          <p className="font-medium">{new Date(selectedOrg.claimed_at).toLocaleString()}</p>
                        </div>
                      )}
                      {selectedOrg.claim_token_expires_at && !selectedOrg.is_claimed && (
                        <div>
                          <Label className="text-muted-foreground">Token Expires</Label>
                          <p className="font-medium">
                            {new Date(selectedOrg.claim_token_expires_at).toLocaleDateString()}
                            {selectedOrg.claim_token_expired && (
                              <Badge variant="destructive" className="ml-2">Expired</Badge>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

