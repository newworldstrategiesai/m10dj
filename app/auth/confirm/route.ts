import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const TIPJAR_CALLBACK_ORIGIN = 'https://www.tipjar.live';

/**
 * Auth Confirmation Route
 *
 * This route receives email confirmation links with token_hash from custom email hooks.
 * It redirects to /auth/callback with the token_hash so the callback route can handle verification.
 *
 * For signup/invite on non-TipJar domains (e.g. m10djcompany.com from Supabase dashboard invite),
 * redirect to tipjar.live so the rest of the flow and "Go to Sign In" land on the working TipJar page.
 *
 * Supports:
 * - signup: Email confirmation
 * - recovery: Password reset
 * - magiclink: Magic link sign-in
 * - email_change: Email change confirmation
 * - invite: User invitation
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') || 'signup';
  const redirectTo = requestUrl.searchParams.get('redirect_to');

  if (!tokenHash) {
    // No token provided - redirect to callback which will handle the error
    const callbackUrl = new URL('/auth/callback', requestUrl.origin);
    callbackUrl.searchParams.set('error', 'invalid_token');
    callbackUrl.searchParams.set('error_description', 'Invalid confirmation link. Please request a new one.');
    return NextResponse.redirect(callbackUrl);
  }

  const isSignupOrInvite = type === 'signup' || type === 'invite';
  const onM10NotTipJar = requestUrl.hostname.includes('m10djcompany.com');

  const origin =
    isSignupOrInvite && onM10NotTipJar ? TIPJAR_CALLBACK_ORIGIN : requestUrl.origin;

  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('token_hash', tokenHash);
  callbackUrl.searchParams.set('type', type);
  if (redirectTo) {
    callbackUrl.searchParams.set('redirect_to', redirectTo);
  }

  return NextResponse.redirect(callbackUrl);
}
