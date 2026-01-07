import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * Auth Confirmation Route
 * 
 * This route receives email confirmation links with token_hash from custom email hooks.
 * It redirects to /auth/callback with the token_hash so the callback route can handle verification.
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

  // Redirect to /auth/callback with token_hash parameter
  // The callback route will handle the verification
  const callbackUrl = new URL('/auth/callback', requestUrl.origin);
  callbackUrl.searchParams.set('token_hash', tokenHash);
  callbackUrl.searchParams.set('type', type);
  if (redirectTo) {
    callbackUrl.searchParams.set('redirect_to', redirectTo);
  }

  return NextResponse.redirect(callbackUrl);
}
