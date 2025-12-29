/**
 * API Route: /api/serato/connection-status
 * 
 * Handles heartbeat/connection status updates from the companion app.
 * Also provides connection status for the frontend dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { platform, app_version, detection_method, disconnecting } = body;

    // 3. Create service client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 4. Get user's organization
    const { data: organization } = await serviceSupabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    // 5. Update connection status
    if (disconnecting) {
      // Mark as disconnected
      await serviceSupabase
        .from('serato_connections')
        .update({
          is_connected: false,
          disconnected_at: new Date().toISOString()
        })
        .eq('dj_id', user.id);

      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Disconnected'
      });
    }

    // Upsert connection (create or update)
    const { data: connection, error: upsertError } = await serviceSupabase
      .from('serato_connections')
      .upsert({
        dj_id: user.id,
        organization_id: organization?.id || null,
        last_heartbeat: new Date().toISOString(),
        is_connected: true,
        platform: platform || null,
        app_version: app_version || null,
        detection_method: detection_method || 'text_file'
      }, {
        onConflict: 'dj_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[Serato Connection] Upsert error:', upsertError);
      // Continue anyway - heartbeat should be lenient
    }

    return NextResponse.json({
      success: true,
      connected: true,
      last_heartbeat: new Date().toISOString(),
      connection_id: connection?.id
    });

  } catch (error: any) {
    console.error('[Serato Connection] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Check connection status for a DJ
 * Used by frontend dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. Get connection status
    const { data: connection, error } = await supabase
      .from('serato_connections')
      .select('*')
      .eq('dj_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Serato Connection] Query error:', error);
    }

    // Check if connection is stale (no heartbeat in last 2 minutes)
    const isStale = connection?.last_heartbeat
      ? (Date.now() - new Date(connection.last_heartbeat).getTime()) > 120000
      : true;

    const isConnected = connection?.is_connected && !isStale;

    return NextResponse.json({
      connected: isConnected,
      last_heartbeat: connection?.last_heartbeat || null,
      platform: connection?.platform || null,
      app_version: connection?.app_version || null,
      detection_method: connection?.detection_method || null
    });

  } catch (error: any) {
    console.error('[Serato Connection] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

