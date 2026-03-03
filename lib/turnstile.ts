/**
 * Cloudflare Turnstile server-side verification.
 * Used to verify CAPTCHA tokens from signup and contact forms.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  /** Error code if verification failed */
  'error-codes'?: string[];
  /** Optional hostname from Cloudflare */
  hostname?: string;
}

/**
 * Verify a Turnstile response token from the client.
 * Returns true only if the token is valid and the challenge passed.
 * If TURNSTILE_SECRET_KEY is not set, returns true (skip verification in dev).
 */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true; // Skip verification when not configured
  }
  if (!token || typeof token !== 'string' || !token.trim()) {
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token.trim());

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.warn('[Turnstile] Siteverify request failed:', res.status);
      return false;
    }

    const data = (await res.json()) as TurnstileVerifyResult;
    if (!data.success) {
      console.warn('[Turnstile] Verification failed:', data['error-codes']);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Turnstile] Verify error:', err);
    return false;
  }
}
