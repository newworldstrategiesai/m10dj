/**
 * Calls – entry point for voice calling tools.
 * Links to Call History (recordings + transcripts) and Voice Agent Settings.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, History, Settings as SettingsIcon, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function CallsIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/signin?redirect=/admin/calls');
          return;
        }
        if (isMounted) setUser(user);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkUser();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (loading || !user) {
    return (
      <AdminLayout title="Calls" description="Voice calling tools">
        <PageLoadingWrapper isLoading={true} message="Loading calls...">
          <div className="min-h-[40vh]" />
        </PageLoadingWrapper>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Calls"
      description="Access call history and configure the M10 voice agent."
      showPageTitle
      pageTitle="Calls"
      pageDescription="Review past calls and tune how the voice agent handles inbound callers."
    >
      <div className="max-w-5xl mx-auto space-y-6 px-3 md:px-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Voice calls</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Listen to inbound and outbound calls, review transcripts, and configure the default M10 voice agent.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                Call history
              </CardTitle>
              <CardDescription>
                Browse past calls with duration, transcripts, and recordings when available.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-end">
              <div className="text-sm text-muted-foreground">
                Open the log of inbound and outbound calls handled by the M10 dialer and LiveKit SIP.
              </div>
              <Button asChild className="gap-2">
                <Link href="/admin/calls/history">
                  Open history
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-amber-500" />
                Voice agent settings
              </CardTitle>
              <CardDescription>
                Configure the default M10 LiveKit agent (Ben) for answering inbound calls.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-end">
              <div className="text-sm text-muted-foreground">
                Edit greeting, behavior, and auto-answer timing for the M10 voice assistant.
              </div>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/admin/calls/agent-settings">
                  Edit settings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

