import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { invitationId } = params;

    // Get invitation to verify permissions
    type Invitation = {
      id: string;
      venue_organization_id: string;
      status: string;
    };

    const { data: invitation, error: invitationError } = await supabase
      .from('venue_invitations')
      .select('id, venue_organization_id, status')
      .eq('id', invitationId)
      .single<Invitation>();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
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
      .eq('id', invitation.venue_organization_id)
      .single<VenueOrg>();

    if (venueError || !venueOrg) {
      return NextResponse.json(
        { error: 'Venue organization not found' },
        { status: 404 }
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
        .eq('organization_id', invitation.venue_organization_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle<Membership>();
      
      isAdmin = membership?.role === 'owner' || membership?.role === 'admin';
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel invitation' },
        { status: 403 }
      );
    }

    // Cancel the invitation
    const { error: updateError } = await (supabase
      .from('venue_invitations') as any)
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error cancelling invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

