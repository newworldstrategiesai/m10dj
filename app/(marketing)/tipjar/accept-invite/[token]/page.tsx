import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AcceptInvitePageProps {
  params: {
    token: string;
  };
}

export async function generateMetadata({ params }: AcceptInvitePageProps): Promise<Metadata> {
  return {
    title: 'Accept Invitation | TipJar.Live',
    description: 'Accept your invitation to join a venue on TipJar.Live',
  };
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const serverSupabase = createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  // Get invitation by token
  const { data: invitation, error: invitationError } = await supabase
    .from('venue_invitations')
    .select('*, venue_organization:organizations!venue_invitations_venue_organization_id_fkey(id, name, slug)')
    .eq('invitation_token', params.token)
    .single();

  if (invitationError || !invitation) {
    notFound();
  }

  // Check invitation status
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = invitation.status === 'accepted';
  const isCancelled = invitation.status === 'cancelled';
  const isExpiredStatus = invitation.status === 'expired';

  // If already accepted, redirect to performer dashboard
  if (isAccepted && user) {
    // Check if user has a performer organization for this venue
    const { data: performerOrg } = await supabase
      .from('organizations')
      .select('id, slug, performer_slug, parent_organization_id')
      .eq('owner_id', user.id)
      .eq('parent_organization_id', invitation.venue_organization_id)
      .eq('organization_type', 'performer')
      .single();

    if (performerOrg) {
      redirect('/tipjar/dashboard');
    }
  }

  const venueOrg = invitation.venue_organization as any;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TipJarHeader />
      
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-2xl">Venue Invitation</CardTitle>
            <CardDescription className="text-lg mt-2">
              You've been invited to join <strong>{venueOrg?.name || 'a venue'}</strong> on TipJar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Invitation Status */}
            {isExpired || isExpiredStatus ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100">Invitation Expired</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This invitation has expired. Please contact the venue to request a new invitation.
                  </p>
                </div>
              </div>
            ) : isCancelled ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Invitation Cancelled</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    This invitation has been cancelled by the venue.
                  </p>
                </div>
              </div>
            ) : isAccepted ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Invitation Accepted</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    You've already accepted this invitation. Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Invitation Pending</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    This invitation is valid. Sign in or create an account to accept it.
                  </p>
                </div>
              </div>
            )}

            {/* Invitation Details */}
            {!isExpired && !isCancelled && !isExpiredStatus && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Invitation Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Venue:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">{venueOrg?.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Your Email:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">{invitation.invited_email}</dd>
                    </div>
                    {invitation.performer_name && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Suggested Name:</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white">{invitation.performer_name}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Your Tip Page URL:</dt>
                      <dd className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        tipjar.live/{venueOrg?.slug}/{invitation.performer_slug}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Action Buttons */}
                {!user ? (
                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      Sign in or create an account to accept this invitation
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={`/tipjar/signin?redirect=/tipjar/accept-invite/${params.token}`} className="flex-1">
                        <Button className="w-full" variant="default">
                          Sign In
                        </Button>
                      </Link>
                      <Link href={`/tipjar/signup?redirect=/tipjar/accept-invite/${params.token}`} className="flex-1">
                        <Button className="w-full" variant="outline">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    {invitation.invited_email.toLowerCase() !== user.email?.toLowerCase() ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Email Mismatch:</strong> This invitation was sent to{' '}
                          <strong>{invitation.invited_email}</strong>, but you're signed in as{' '}
                          <strong>{user.email}</strong>. Please sign in with the invited email address.
                        </p>
                      </div>
                    ) : (
                      <form action={acceptInvitationAction} className="space-y-3">
                        <input type="hidden" name="token" value={params.token} />
                        <Button type="submit" className="w-full" size="lg">
                          <Music className="w-5 h-5 mr-2" />
                          Accept Invitation & Create Tip Page
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          This will create your performer account and tip page
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <TipJarFooter />
    </div>
  );
}

async function acceptInvitationAction(formData: FormData) {
  'use server';
  
  const token = formData.get('token') as string;
  
  if (!token) {
    return;
  }

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/tipjar/signin?redirect=/tipjar/accept-invite/${token}`);
    return;
  }

  // Call the accept invitation API
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tipjar/venue/accept-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Redirect to dashboard
      redirect('/tipjar/dashboard');
    } else {
      // Handle error - could redirect to error page or show message
      redirect(`/tipjar/accept-invite/${token}?error=${encodeURIComponent(data.error || 'Failed to accept invitation')}`);
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    redirect(`/tipjar/accept-invite/${token}?error=Something went wrong`);
  }
}

