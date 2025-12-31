/**
 * Email Inbox Management API
 * 
 * Create and manage email inboxes for contacts/organizations
 * Links email addresses to voice agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/email/inbox
 * Create a new email inbox for an organization or contact
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId, contactId, emailAddress, productId, displayName } = body;

    // Validate required fields
    if (!organizationId || !emailAddress) {
      return NextResponse.json(
        { error: 'organizationId and emailAddress are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: orgMember } = await supabaseService
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    const { data: orgOwner } = await supabaseService
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .single();

    if (!orgMember && !orgOwner) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Check if inbox already exists
    const { data: existing } = await supabaseService
      .from('email_inboxes')
      .select('id')
      .eq('email_address', emailAddress)
      .eq('organization_id', organizationId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Inbox already exists',
        inbox: existing,
      });
    }

    // Create inbox
    const { data: inbox, error: inboxError } = await supabaseService
      .from('email_inboxes')
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        email_address: emailAddress,
        product_id: productId || 'm10dj', // Default to m10dj
        display_name: displayName || `Inbox for ${emailAddress}`,
        is_active: true,
      })
      .select()
      .single();

    if (inboxError) {
      console.error('Error creating inbox:', inboxError);
      return NextResponse.json(
        { error: 'Failed to create inbox', details: inboxError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inbox,
      message: 'Inbox created successfully',
    });
  } catch (error) {
    console.error('Error in inbox creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/inbox
 * List inboxes for an organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const contactId = searchParams.get('contactId');
    const productId = searchParams.get('productId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: orgMember } = await supabaseService
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    const { data: orgOwner } = await supabaseService
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .single();

    if (!orgMember && !orgOwner) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabaseService
      .from('email_inboxes')
      .select('*')
      .eq('organization_id', organizationId);

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: inboxes, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inboxes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inboxes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inboxes: inboxes || [],
      count: inboxes?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching inboxes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

