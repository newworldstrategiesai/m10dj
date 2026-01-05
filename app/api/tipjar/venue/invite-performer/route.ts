import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { venueOrganizationId, email, performerName, performerSlug } = body;

    // Validate required fields
    if (!venueOrganizationId || !email || !performerSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: venueOrganizationId, email, performerSlug' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate performer slug format (alphanumeric, hyphens, underscores, 3-30 chars)
    const slugRegex = /^[a-z0-9_-]{3,30}$/;
    if (!slugRegex.test(performerSlug.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid performer slug. Must be 3-30 characters, alphanumeric with hyphens/underscores' },
        { status: 400 }
      );
    }

    // Verify venue organization exists and user has permission
    type VenueOrg = {
      id: string;
      name: string;
      slug: string;
      organization_type: 'individual' | 'venue' | 'performer';
      owner_id: string;
      product_context: string | null;
    };

    const { data: venueOrg, error: venueError } = await supabase
      .from('organizations')
      .select('id, name, slug, organization_type, owner_id, product_context')
      .eq('id', venueOrganizationId)
      .single<VenueOrg>();

    if (venueError || !venueOrg) {
      return NextResponse.json(
        { error: 'Venue organization not found' },
        { status: 404 }
      );
    }

    // Verify it's a venue organization
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
        { error: 'Insufficient permissions to invite performers' },
        { status: 403 }
      );
    }

    // Check if performer slug is already taken within this venue
    const { data: existingPerformer } = await supabase
      .from('organizations')
      .select('id')
      .eq('parent_organization_id', venueOrganizationId)
      .eq('performer_slug', performerSlug.toLowerCase())
      .single();

    if (existingPerformer) {
      return NextResponse.json(
        { error: `Performer slug "${performerSlug}" is already taken in this venue` },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from('venue_invitations')
      .select('id, status')
      .eq('venue_organization_id', venueOrganizationId)
      .eq('invited_email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 400 }
      );
    }

    // Create invitation
    type Invitation = {
      id: string;
      invitation_token: string;
      invited_email: string;
      performer_slug: string;
      performer_name: string | null;
      status: string;
      expires_at: string;
    };

    const { data: invitationData, error: invitationError } = await (supabase
      .from('venue_invitations') as any)
      .insert({
        venue_organization_id: venueOrganizationId,
        invited_email: email.toLowerCase(),
        performer_slug: performerSlug.toLowerCase(),
        performer_name: performerName || null,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select('id, invitation_token, invited_email, performer_slug, performer_name, status, expires_at')
      .single();

    if (invitationError || !invitationData) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'Failed to create invitation', details: invitationError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    const invitation = invitationData as Invitation;

    // Send invitation email
    const { sendVenueInvitationEmail } = await import('@/lib/email/venue-invitation-email');
    const { getProductBaseUrl } = await import('@/lib/email/product-email-config');
    const baseUrl = getProductBaseUrl(venueOrg.product_context as any);
    const invitationUrl = `${baseUrl}/tipjar/accept-invite/${invitation.invitation_token}`;
    
    await sendVenueInvitationEmail({
      to: email,
      venueName: venueOrg.name,
      performerName: performerName || undefined,
      performerSlug: performerSlug,
      invitationToken: invitation.invitation_token,
      invitationUrl,
      productContext: venueOrg.product_context as any,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invited_email,
        performerSlug: invitation.performer_slug,
        performerName: invitation.performer_name,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        invitationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live'}/tipjar/accept-invite/${invitation.invitation_token}`,
      },
    });
  } catch (error: any) {
    console.error('Error inviting performer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

