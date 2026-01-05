'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  Mail, 
  ExternalLink, 
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Music
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Performer {
  id: string;
  name: string;
  performer_slug: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  performer_slug: string;
  performer_name: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

interface VenueRosterManagementProps {
  venueOrganizationId: string;
  venueSlug: string;
}

export default function VenueRosterManagement({ 
  venueOrganizationId, 
  venueSlug 
}: VenueRosterManagementProps) {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSlug, setInviteSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadRoster();
  }, [venueOrganizationId]);

  const loadRoster = async () => {
    try {
      setLoading(true);
      
      // Load performers
      const { data: performersData, error: performersError } = await supabase
        .from('organizations')
        .select('id, name, performer_slug, slug, is_active, created_at')
        .eq('parent_organization_id', venueOrganizationId)
        .eq('organization_type', 'performer')
        .order('created_at', { ascending: false });

      if (performersError) {
        console.error('Error loading performers:', performersError);
      } else {
        setPerformers(performersData || []);
      }

      // Load invitations
      const response = await fetch(`/api/tipjar/venue/invitations?venueOrganizationId=${venueOrganizationId}`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error loading roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    // Check if slug is already taken by existing performers
    const existing = performers.find(p => p.performer_slug === slug.toLowerCase());
    if (existing) {
      setSlugAvailable(false);
      return;
    }

    // Check if slug is already in pending invitations
    const pendingInvite = invitations.find(
      inv => inv.performer_slug === slug.toLowerCase() && inv.status === 'pending'
    );
    if (pendingInvite) {
      setSlugAvailable(false);
      return;
    }

    setSlugAvailable(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteSlug) {
      return;
    }

    try {
      setInviteLoading(true);

      const response = await fetch('/api/tipjar/venue/invite-performer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueOrganizationId,
          email: inviteEmail,
          performerName: inviteName || undefined,
          performerSlug: inviteSlug,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reset form
        setInviteEmail('');
        setInviteName('');
        setInviteSlug('');
        setSlugAvailable(null);
        setInviteDialogOpen(false);
        
        // Reload roster
        await loadRoster();
      } else {
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tipjar/venue/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadRoster();
      } else {
        alert('Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Failed to cancel invitation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading roster...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Performer Roster
              </CardTitle>
              <CardDescription>
                Manage performers and send invitations
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Performer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Performer</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a performer to join your venue roster
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="performer@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Performer Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="DJ Name or Band Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Performer Slug *</Label>
                    <Input
                      id="slug"
                      type="text"
                      value={inviteSlug}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        setInviteSlug(slug);
                        checkSlugAvailability(slug);
                      }}
                      placeholder="dj1"
                      required
                      pattern="[a-z0-9_-]{3,30}"
                      minLength={3}
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      URL: tipjar.live/{venueSlug}/{inviteSlug || 'slug'}
                    </p>
                    {slugAvailable !== null && (
                      <p className={`text-xs mt-1 ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {slugAvailable ? '✓ Available' : '✗ Already taken'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={inviteLoading || !slugAvailable}
                      className="flex-1"
                    >
                      {inviteLoading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Active Performers */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Active Performers</h3>
            {performers.filter(p => p.is_active).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performers
                  .filter(p => p.is_active)
                  .map((performer) => (
                    <div
                      key={performer.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {performer.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            /{venueSlug}/{performer.performer_slug}
                          </p>
                          <Link
                            href={`/${venueSlug}/${performer.performer_slug}`}
                            target="_blank"
                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            View Page
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${venueSlug}/${performer.performer_slug}`} target="_blank">
                                View Page
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active performers yet</p>
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.filter(inv => inv.status === 'pending').length > 0 && (
            <div className="space-y-4 mt-8 pt-8 border-t">
              <h3 className="font-semibold text-gray-900 dark:text-white">Pending Invitations</h3>
              <div className="space-y-2">
                {invitations
                  .filter(inv => inv.status === 'pending')
                  .map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(invitation.status)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {invitation.invited_email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {invitation.performer_name || invitation.performer_slug} • {getStatusLabel(invitation.status)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

