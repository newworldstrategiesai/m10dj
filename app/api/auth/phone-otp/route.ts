import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimiter } from '@/utils/rate-limiter';

/**
 * Normalize phone to E.164. Accepts +1..., 1..., or 10-digit US.
 * Supabase Auth expects E.164 (e.g. +15551234567).
 */
function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.trim().startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

function getClientIp(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  if (cf) return cf;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;
  return 'unknown';
}

/**
 * POST /api/auth/phone-otp
 * Request an SMS OTP for phone-only sign up / sign in.
 * Body: { phone: string, productContext?: 'tipjar'|'djdash'|'m10dj', organizationName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';
    const productContext = ['tipjar', 'djdash', 'm10dj'].includes(body.productContext)
      ? body.productContext
      : 'tipjar';
    const organizationName =
      typeof body.organizationName === 'string' ? body.organizationName.trim() || undefined : undefined;

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use 10-digit US (e.g. 5551234567) or E.164 (e.g. +15551234567).' },
        { status: 400 }
      );
    }

    // Rate limit: 5 OTP requests per 15 min per IP; 3 per 5 min per phone
    const clientIp = getClientIp(request);
    const ipLimit = rateLimiter.checkLimit(clientIp, 5, 15 * 60 * 1000) as {
      allowed: boolean;
      retryAfter: number;
      remaining: number;
    };
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          retryAfter: ipLimit.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    const phoneLimit = rateLimiter.checkLimit(`phone:${phone}`, 3, 5 * 60 * 1000) as {
      allowed: boolean;
      retryAfter: number;
    };
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many codes sent to this number. Please wait a few minutes.',
          retryAfter: phoneLimit.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(phoneLimit.retryAfter) } }
      );
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          product_context: productContext,
          ...(organizationName && { organization_name: organizationName }),
        },
      },
    });

    if (error) {
      const msg = error.message || 'Failed to send code.';
      const isRateLimit = msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('frequency');
      return NextResponse.json(
        { error: isRateLimit ? 'Please wait before requesting another code.' : msg },
        { status: isRateLimit ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check your phone for a 6-digit code.',
    });
  } catch (err) {
    console.error('[phone-otp]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
