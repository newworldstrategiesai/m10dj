import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to accept the invitation.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, performerSlug } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      );
    }

    // Get invitation by token
    type VenueInvitation = {
      id: string;
      invitation_token: string;
      status: 'pending' | 'accepted' | 'expired' | 'cancelled';
      expires_at: string;
      invited_email: string;
      performer_slug: string;
      performer_name: string | null;
      venue_organization_id: string;
      invited_by: string;
      accepted_at?: string | null;
    };

    const { data: invitation, error: invitationError } = await supabase
      .from('venue_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single<VenueInvitation>();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or invalid' },
        { status: 404 }
      );
    }

    const typedInvitation = invitation as VenueInvitation;

    // Verify invitation is pending
    if (typedInvitation.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Invitation is no longer valid',
          status: typedInvitation.status,
        },
        { status: 400 }
      );
    }

    // Verify invitation hasn't expired
    if (new Date(typedInvitation.expires_at) < new Date()) {
      // Mark as expired
      await (supabase
        .from('venue_invitations') as any)
        .update({ status: 'expired' })
        .eq('id', typedInvitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Verify email matches (if user is signed in)
    if (typedInvitation.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Get venue organization
    type VenueOrganization = {
      id: string;
      name: string;
      slug: string;
      organization_type: 'individual' | 'venue' | 'performer';
      product_context: string | null;
      owner_id: string;
    };

    const { data: venueOrg, error: venueError } = await supabase
      .from('organizations')
      .select('id, name, slug, organization_type, product_context, owner_id')
      .eq('id', typedInvitation.venue_organization_id)
      .single<VenueOrganization>();

    if (venueError || !venueOrg) {
      return NextResponse.json(
        { error: 'Venue organization not found' },
        { status: 404 }
      );
    }

    if (venueOrg.organization_type !== 'venue') {
      return NextResponse.json(
        { error: 'Invalid venue organization' },
        { status: 400 }
      );
    }

    // Determine performer slug (use provided one or fall back to invitation's suggested slug)
    const finalPerformerSlug = (performerSlug || typedInvitation.performer_slug).toLowerCase();

    // Validate performer slug format
    const slugRegex = /^[a-z0-9_-]{3,30}$/;
    if (!slugRegex.test(finalPerformerSlug)) {
      return NextResponse.json(
        { error: 'Invalid performer slug format' },
        { status: 400 }
      );
    }

    // Check if performer slug is already taken within this venue
    const { data: existingPerformer } = await supabase
      .from('organizations')
      .select('id')
      .eq('parent_organization_id', venueOrg.id)
      .eq('performer_slug', finalPerformerSlug)
      .single();

    if (existingPerformer) {
      return NextResponse.json(
        { error: `Performer slug "${finalPerformerSlug}" is already taken in this venue` },
        { status: 400 }
      );
    }

    // Check if user already has an organization
    type ExistingOrganization = {
      id: string;
      organization_type: 'individual' | 'venue' | 'performer';
      parent_organization_id: string | null;
    };

    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, organization_type, parent_organization_id')
      .eq('owner_id', user.id)
      .maybeSingle<ExistingOrganization>();

    // If user has an existing organization, check if it's already a performer for this venue
    if (existingOrg) {
      if (existingOrg.parent_organization_id === venueOrg.id) {
        return NextResponse.json(
          { error: 'You are already a performer for this venue' },
          { status: 400 }
        );
      }

      // If user has an individual organization, we need to handle this
      // For now, we'll create a new performer organization
      // In the future, we might want to convert the existing org or allow multiple orgs
    }

    // Use service role client for organization creation (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate organization name
    const orgName = typedInvitation.performer_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Performer';

    // Generate full slug (venue-slug + performer-slug for uniqueness, but we'll use performer_slug for routing)
    const fullSlug = `${venueOrg.slug}-${finalPerformerSlug}`;

    // Create performer organization
    type PerformerOrganization = {
      id: string;
      name: string;
      slug: string;
      performer_slug: string | null;
      product_context: string | null;
    };

    const { data: performerOrg, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: fullSlug, // Full slug for uniqueness
        owner_id: user.id,
        organization_type: 'performer',
        parent_organization_id: venueOrg.id,
        performer_slug: finalPerformerSlug, // This is what we use in URLs
        is_active: true,
        billing_covered_by_parent: true, // Venue covers billing
        product_context: venueOrg.product_context || 'tipjar', // Inherit from venue
        subscription_tier: 'starter', // Will be covered by venue
        subscription_status: 'trial',
      })
      .select('id, name, slug, performer_slug, product_context')
      .single<PerformerOrganization>();

    if (orgError) {
      console.error('Error creating performer organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create performer organization', details: orgError.message },
        { status: 500 }
      );
    }

    // Add performer to venue's organization_members (as a member)
    try {
      await serviceSupabase
        .from('organization_members')
        .insert({
          organization_id: venueOrg.id,
          user_id: user.id,
          role: 'member',
          invited_by: typedInvitation.invited_by,
          joined_at: new Date().toISOString(),
          is_active: true,
        } as const);
    } catch (error: any) {
      // Ignore if already a member (unique constraint)
      console.log('Note: User may already be a member:', error);
    }

    // Mark invitation as accepted
    await (supabase
      .from('venue_invitations') as any)
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', typedInvitation.id);

    // Send confirmation email to venue
    try {
      const { data: venueOwner } = await serviceSupabase.auth.admin.getUserById(venueOrg.owner_id);
      if (venueOwner?.user?.email) {
        const { sendVenueInvitationAcceptedEmail } = await import('@/lib/email/venue-invitation-email');
        const { getProductBaseUrl } = await import('@/lib/email/product-email-config');
        const baseUrl = getProductBaseUrl(venueOrg.product_context as any);
        await sendVenueInvitationAcceptedEmail(
          venueOwner.user.email,
          venueOrg.name,
          orgName,
          finalPerformerSlug,
          `${baseUrl}/tipjar/${venueOrg.slug}/${finalPerformerSlug}`,
          venueOrg.product_context as any
        );
      }
    } catch (emailError) {
      // Log but don't fail the acceptance
      console.error('Error sending acceptance confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      performerOrganization: {
        id: performerOrg.id,
        name: performerOrg.name,
        slug: performerOrg.slug,
        performerSlug: performerOrg.performer_slug,
        venueSlug: venueOrg.slug,
        tipPageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live'}/tipjar/${venueOrg.slug}/${finalPerformerSlug}`,
      },
      message: 'Invitation accepted! Your performer account has been created.',
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

