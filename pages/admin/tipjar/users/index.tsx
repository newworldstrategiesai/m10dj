'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Search, ExternalLink, Users, Loader2, ChevronRight } from 'lucide-react';

interface TipJarUserRow {
  organizationId: string;
  slug: string;
  orgName: string;
  ownerId: string;
  email: string;
  username: string;
  emailConfirmed: boolean;
  profileUrl: string;
  createdAt: string;
  isClaimed: boolean;
  claimedAt: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
}

export default function TipJarUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<TipJarUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/signin');
          return;
        }
        const isSuper = isSuperAdminEmail(user.email);
        setIsSuperAdmin(isSuper);
        if (!isSuper) {
          toast({ title: 'Access Denied', description: 'This page is only available to super admins', variant: 'destructive' });
          router.push('/admin/crowd-requests');
        }
      } catch (e) {
        console.error(e);
        router.push('/signin');
      } finally {
        setAuthLoading(false);
      }
    };
    check();
  }, [router, supabase.auth, toast]);

  useEffect(() => {
    if (!isSuperAdmin || authLoading) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/tipjar/users');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load users');
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to fetch users', variant: 'destructive' });
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isSuperAdmin, authLoading, toast]);

  const filtered = users.filter(
    (u) =>
      !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (organizationId: string) => {
    router.push(`/admin/tipjar/users/${organizationId}`);
  };

  if (authLoading || !isSuperAdmin) {
    return (
      <AdminLayout title="TipJar Users" description="Registered TipJar users">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Registered Users"
      description="All TipJar registered users. Click a row to view details."
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or org name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>{searchQuery ? 'No users match your search.' : 'No TipJar users yet.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-foreground">Username</th>
                    <th className="text-left p-4 font-medium text-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-foreground hidden md:table-cell">Organization</th>
                    <th className="text-left p-4 font-medium text-foreground">Email status</th>
                    <th className="text-left p-4 font-medium text-foreground">Profile</th>
                    <th className="w-10 p-4" aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.organizationId}
                      onClick={() => handleRowClick(u.organizationId)}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-medium text-foreground">{u.username || '—'}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{u.orgName || u.slug}</td>
                      <td className="p-4">
                        {u.emailConfirmed ? (
                          <span className="text-xs text-muted-foreground">Confirmed</span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                            Unconfirmed
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <a
                          href={u.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View page
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="p-4">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
