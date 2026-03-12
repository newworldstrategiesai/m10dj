import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

/**
 * POST /api/auth/set-email
 * Set or update email for the current user (e.g. phone-only signups before Stripe setup).
 * Body: { email: string }
 * Saves to auth.users and returns success so client can retry Stripe/create-account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address.', code: 'invalid_email' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email,
    });

    if (updateError) {
      const msg = updateError.message || 'Failed to save email.';
      return NextResponse.json(
        { error: msg, code: updateError.code || 'update_failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, email });
  } catch (e) {
    console.error('set-email error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
