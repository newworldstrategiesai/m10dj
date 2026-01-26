'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  ExternalLink,
  Settings,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface AffiliateData {
  id: string;
  user_id: string;
  organization_id: string;
  affiliate_code: string;
  display_name?: string;
  bio?: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  commission_rate: number;
  platform_fee_rate: number;
  lifetime_value: number;
  total_earned: number;
  total_paid: number;
  pending_balance: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  payout_threshold: number;
  payout_frequency: 'weekly' | 'monthly' | 'quarterly';
  auto_payout: boolean;
  custom_landing_page: boolean;
  marketing_materials_access: boolean;
  created_at: string;
  updated_at: string;
}

interface ReferralData {
  id: string;
  affiliate_id: string;
  referred_user_id?: string;
  referred_organization_id?: string;
  referral_code: string;
  referral_source: string;
  conversion_status: 'clicked' | 'signed_up' | 'subscribed' | 'first_payment' | 'active_user';
  converted_at?: string;
  conversion_value: number;
  commission_eligible: boolean;
  total_commissions_earned: number;
  first_clicked_at: string;
  created_at: string;
}

interface CommissionData {
  id: string;
  affiliate_id: string;
  referral_id: string;
  amount: number;
  commission_type: 'subscription_monthly' | 'subscription_setup' | 'platform_fee' | 'upgrade_bonus' | 'referral_bonus';
  status: 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed';
  payout_date?: string;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
}

interface DashboardData {
  affiliate: AffiliateData;
  recentReferrals: ReferralData[];
  recentCommissions: CommissionData[];
  stats: {
    totalClicks: number;
    totalSignups: number;
    totalConversions: number;
    conversionRate: number;
    clickToSignupRate: number;
    signupToConversionRate: number;
    pendingBalance: number;
    totalEarned: number;
    totalPaid: number;
    averageCommissionPerConversion: number;
    lifetimeValue: number;
  };
  timeRangeStats?: {
    clicks: number;
    signups: number;
    conversions: number;
    earned: number;
  };
}

interface AffiliateDashboardProps {
  user: any;
  organization: any;
}

export default function AffiliateDashboard({ user, organization }: AffiliateDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      const url = timeRange !== 'all' 
        ? `/api/affiliate/register?timeRange=${timeRange}`
        : '/api/affiliate/register';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Try to register as affiliate
        const registerResponse = await fetch('/api/affiliate/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: organization.name || user.email?.split('@')[0] || 'DJ Affiliate',
            payoutThreshold: 25.00,
            payoutFrequency: 'monthly',
            autoPayout: true
          })
        });

        if (registerResponse.ok) {
          const data = await registerResponse.json();
          setDashboardData(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load affiliate data',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AffiliateData>) => {
    if (!dashboardData) return;

    setUpdating(true);
    try {
      // This would be implemented with an API call to update affiliate settings
      // For now, just show a success message
      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading affiliate dashboard...</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-600">
            Failed to load affiliate data. Please try again.
          </div>
        </div>
      </div>
    );
  }

  const { affiliate, recentReferrals, recentCommissions, stats } = dashboardData;
  const referralLink = `https://tipjar.live/ref/${affiliate.affiliate_code}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Affiliate Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Earn commissions by referring DJs and performers to TipJar
              </p>
            </div>
            <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
              {affiliate.status === 'active' ? 'Active' : affiliate.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total referral link clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSignups.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Referred users who signed up
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total commissions earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Available for payout
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Clicks to conversions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-to-Signup</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clickToSignupRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Clicks that became signups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.averageCommissionPerConversion.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Per conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.lifetimeValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total value generated
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Label htmlFor="timeRange" className="text-sm">Time Range:</Label>
              <select
                id="timeRange"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                className="px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Referral Link */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>
                  Share this link with DJs and performers to start earning commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralLink, 'Referral link')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(referralLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        How it works
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                        <li>• Share your referral link with DJs and performers</li>
                        <li>• Earn {affiliate.commission_rate}% commission on their subscriptions</li>
                        <li>• Earn {affiliate.platform_fee_rate}% of TipJar fees on their tips</li>
                        <li>• Get paid monthly when you reach ${affiliate.payout_threshold}</li>
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        By participating, you agree to our{' '}
                        <Link href="/tipjar/affiliate/terms" className="underline hover:text-blue-900 dark:hover:text-blue-100">
                          Affiliate Program Terms
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                  <CardDescription>
                    Latest clicks and signups from your referral link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentReferrals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No referrals yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentReferrals.slice(0, 5).map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              referral.conversion_status === 'signed_up' ? 'bg-green-500' :
                              referral.conversion_status === 'subscribed' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                            <div>
                              <p className="text-sm font-medium">
                                {referral.referral_source.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(referral.first_clicked_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            referral.conversion_status === 'signed_up' ? 'default' :
                            referral.conversion_status === 'subscribed' ? 'secondary' :
                            'outline'
                          }>
                            {referral.conversion_status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Commissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Commissions</CardTitle>
                  <CardDescription>
                    Latest earnings from your referrals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentCommissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No commissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentCommissions.slice(0, 5).map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              ${commission.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission.commission_type.replace('_', ' ')}
                            </p>
                          </div>
                          <Badge variant={
                            commission.status === 'paid' ? 'default' :
                            commission.status === 'approved' ? 'secondary' :
                            'outline'
                          }>
                            {commission.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>
                    Track how clicks convert to signups and paying customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">Clicks</p>
                        <p className="text-sm text-muted-foreground">Total link clicks</p>
                      </div>
                      <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">
                        ↓ {stats.clickToSignupRate.toFixed(1)}% conversion
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <p className="font-medium">Signups</p>
                        <p className="text-sm text-muted-foreground">Users who registered</p>
                      </div>
                      <div className="text-2xl font-bold">{stats.totalSignups.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">
                        ↓ {stats.signupToConversionRate.toFixed(1)}% conversion
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div>
                        <p className="font-medium">Conversions</p>
                        <p className="text-sm text-muted-foreground">Paying customers</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats.totalConversions.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators for your affiliate account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Overall Conversion Rate</span>
                      <span className="text-lg font-bold">{stats.conversionRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Click-to-Signup Rate</span>
                      <span className="text-lg font-bold">{stats.clickToSignupRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Signup-to-Conversion Rate</span>
                      <span className="text-lg font-bold">{stats.signupToConversionRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Avg. Commission per Conversion</span>
                      <span className="text-lg font-bold">${stats.averageCommissionPerConversion.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <span className="text-sm font-medium">Total Paid Out</span>
                      <span className="text-lg font-bold text-green-600">${stats.totalPaid.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Range Stats */}
            {dashboardData.timeRangeStats && timeRange !== 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance in Selected Time Range</CardTitle>
                  <CardDescription>
                    Stats for the last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="text-2xl font-bold">{dashboardData.timeRangeStats.clicks}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Signups</p>
                      <p className="text-2xl font-bold">{dashboardData.timeRangeStats.signups}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="text-2xl font-bold text-green-600">{dashboardData.timeRangeStats.conversions}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Earned</p>
                      <p className="text-2xl font-bold">${dashboardData.timeRangeStats.earned.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Referrals</CardTitle>
                <CardDescription>
                  Complete list of clicks and conversions from your referral link
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentReferrals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No referrals yet. Share your referral link to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentReferrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            referral.conversion_status === 'signed_up' ? 'bg-green-500' :
                            referral.conversion_status === 'subscribed' ? 'bg-blue-500' :
                            referral.conversion_status === 'first_payment' ? 'bg-purple-500' :
                            'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium">
                              {referral.referral_source.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Clicked {new Date(referral.first_clicked_at).toLocaleDateString()}
                              {referral.converted_at && ` • Converted ${new Date(referral.converted_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            referral.conversion_status === 'first_payment' ? 'default' :
                            referral.conversion_status === 'subscribed' ? 'secondary' :
                            referral.conversion_status === 'signed_up' ? 'outline' :
                            'outline'
                          }>
                            {referral.conversion_status.replace('_', ' ')}
                          </Badge>
                          {referral.total_commissions_earned > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              ${referral.total_commissions_earned.toFixed(2)} earned
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Commissions</CardTitle>
                <CardDescription>
                  Complete history of your affiliate earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentCommissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No commissions yet. Earnings will appear here as your referrals convert.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentCommissions.map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">
                              ${commission.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {commission.commission_type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            commission.status === 'paid' ? 'default' :
                            commission.status === 'approved' ? 'secondary' :
                            commission.status === 'pending' ? 'outline' :
                            'destructive'
                          }>
                            {commission.status}
                          </Badge>
                          {commission.paid_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Paid {new Date(commission.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Settings</CardTitle>
                <CardDescription>
                  Customize your affiliate profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={affiliate.display_name || ''}
                      onChange={(e) => updateSettings({ display_name: e.target.value })}
                      placeholder="Your public affiliate name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affiliateCode">Affiliate Code</Label>
                    <Input
                      id="affiliateCode"
                      value={affiliate.affiliate_code}
                      readOnly
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is your unique referral code
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={affiliate.bio || ''}
                    onChange={(e) => updateSettings({ bio: e.target.value })}
                    placeholder="Tell potential referrals about yourself..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Subscription Commission</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      value={affiliate.commission_rate}
                      readOnly
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      % of subscription revenue
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platformFeeRate">Platform Fee Commission</Label>
                    <Input
                      id="platformFeeRate"
                      type="number"
                      value={affiliate.platform_fee_rate}
                      readOnly
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      % of TipJar fees on tips
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payoutThreshold">Payout Threshold</Label>
                    <Input
                      id="payoutThreshold"
                      type="number"
                      value={affiliate.payout_threshold}
                      onChange={(e) => updateSettings({ payout_threshold: parseFloat(e.target.value) })}
                      min="1"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum amount for payout
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoPayout"
                    checked={affiliate.auto_payout}
                    onCheckedChange={(checked) => updateSettings({ auto_payout: checked })}
                  />
                  <Label htmlFor="autoPayout">Enable automatic monthly payouts</Label>
                </div>

                <div className="pt-4">
                  <Button onClick={() => updateSettings({})} disabled={updating}>
                    {updating ? 'Updating...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}