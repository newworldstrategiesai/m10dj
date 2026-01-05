import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const venueOrganizationId = searchParams.get('venueOrganizationId');

    if (!venueOrganizationId) {
      return NextResponse.json(
        { error: 'Missing venueOrganizationId parameter' },
        { status: 400 }
      );
    }

    // Verify venue organization exists and user has permission
    type VenueOrg = {
      id: string;
      name: string;
      organization_type: 'individual' | 'venue' | 'performer';
      owner_id: string;
    };

    const { data: venueOrg, error: venueError } = await supabase
      .from('organizations')
      .select('id, name, organization_type, owner_id')
      .eq('id', venueOrganizationId)
      .single<VenueOrg>();

    if (venueError || !venueOrg) {
      return NextResponse.json(
        { error: 'Venue organization not found' },
        { status: 404 }
      );
    }

    if (venueOrg.organization_type !== 'venue') {
      return NextResponse.json(
        { error: 'Organization is not a venue' },
        { status: 400 }
      );
    }

    // Verify user is venue owner or admin
    const isOwner = venueOrg.owner_id === user.id;
    
    let isAdmin = false;
    if (!isOwner) {
      type Membership = {
        role: string;
      };

      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', venueOrganizationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle<Membership>();
      
      isAdmin = membership?.role === 'owner' || membership?.role === 'admin';
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all invitations for this venue
    type VenueInvitation = {
      id: string;
      venue_organization_id: string;
      invited_email: string;
      performer_slug: string;
      performer_name: string | null;
      invited_by: string;
      status: 'pending' | 'accepted' | 'expired' | 'cancelled';
      expires_at: string;
      created_at: string;
      accepted_at?: string | null;
      invitation_token?: string;
    };

    const { data: invitations, error: invitationsError } = await supabase
      .from('venue_invitations')
      .select('*')
      .eq('venue_organization_id', venueOrganizationId)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    const typedInvitations = (invitations as VenueInvitation[] | null) || [];

    // Auto-expire old invitations
    const now = new Date().toISOString();
    const expiredInvitations = typedInvitations.filter(
      inv => inv.status === 'pending' && inv.expires_at < now
    );

    if (expiredInvitations.length > 0) {
      // Update expired invitations in background (don't wait)
      (supabase
        .from('venue_invitations') as any)
        .update({ status: 'expired' })
        .in('id', expiredInvitations.map(inv => inv.id))
        .then(() => {
          console.log(`Expired ${expiredInvitations.length} invitations`);
        });
    }

    // Return invitations with status updated
    const updatedInvitations = typedInvitations.map(inv => ({
      ...inv,
      status: inv.status === 'pending' && inv.expires_at < now ? 'expired' : inv.status,
    }));

    return NextResponse.json({
      success: true,
      invitations: updatedInvitations,
    });
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

