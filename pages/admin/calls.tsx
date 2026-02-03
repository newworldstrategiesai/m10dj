/**
 * Calls hub – single entry for all phone/voice call UIs.
 * Sidebar shows one "Calls" icon; this page links to Dialer and Call history.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import { Phone, PhoneCall, History, ArrowRight, Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminCallsHubPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return;
        if (error || !user) {
          router.push('/signin');
          return;
        }
        const { isPlatformAdmin } = await import('@/utils/auth-helpers/platform-admin');
        const { canAccessAdminPage } = await import('@/utils/subscription-access');
        const isAdmin = isPlatformAdmin(user.email);
        if (!isAdmin) {
          const access = await canAccessAdminPage(supabase as any, user.email, 'contacts');
          if (!access.canAccess) {
            router.push('/admin/dashboard-starter');
            return;
          }
        }
        if (isMounted) setUser(user);
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return;
        console.error(e);
        router.push('/signin');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [router, supabase]);

  if (loading || !user) {
    return (
      <AdminLayout title="Calls" description="Phone and voice call tools">
        <PageLoadingWrapper isLoading={true} message="Loading...">
          <div className="min-h-[40vh]" />
        </PageLoadingWrapper>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Calls"
      description="Make and manage phone calls from your browser"
      showPageTitle
      pageTitle="Calls"
      pageDescription="Dial contacts and view call history (LiveKit + Twilio)."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/dialer" className="block transition-opacity hover:opacity-90">
            <Card className="h-full border-border bg-card text-card-foreground dark:border-border dark:bg-card">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PhoneCall className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Dialer</CardTitle>
                  <CardDescription>Call a contact or number from your browser</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start an outbound call to any contact or phone number. Incoming calls can be answered from anywhere in the admin site.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/calls/history" className="block transition-opacity hover:opacity-90">
            <Card className="h-full border-border bg-card text-card-foreground dark:border-border dark:bg-card">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <History className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Call history</CardTitle>
                  <CardDescription>View past calls, duration, and recordings</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse inbound and outbound calls, transcripts, and recording links when Egress is enabled.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/calls/agent-settings" className="block transition-opacity hover:opacity-90">
            <Card className="h-full border-border bg-card text-card-foreground dark:border-border dark:bg-card">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Voice agent settings</CardTitle>
                  <CardDescription>Configure the default M10 agent (Ben)</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Edit instructions, greeting, STT/LLM/TTS, and display. Used by the Dialer and deployed agent.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="border-border bg-muted/30 dark:border-border dark:bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Incoming calls
            </CardTitle>
            <CardDescription>
              When someone calls your Twilio number, a notification appears on any admin page. Use &quot;Answer&quot; to join the call in your browser.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AdminLayout>
  );
}
