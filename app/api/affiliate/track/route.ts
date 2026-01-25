import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AffiliateService } from '@/utils/affiliate/affiliate-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateCode = searchParams.get('ref');

    if (!affiliateCode) {
      return NextResponse.json({ error: 'Missing affiliate code' }, { status: 400 });
    }

    const supabase = createClient();

    // Validate affiliate code
    const affiliateService = new AffiliateService(supabase);
    const affiliate = await affiliateService.getAffiliateByCode(affiliateCode);

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 400 });
    }

    // Extract tracking metadata
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const userAgent = request.headers.get('user-agent') || '';

    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Track the referral click
    const referralId = await affiliateService.trackReferralClick(affiliateCode, {
      ip,
      userAgent,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      referrer: request.headers.get('referer') || undefined
    });

    // Set tracking cookie for future attribution
    const response = NextResponse.redirect(new URL('/', request.url));

    // Set cookie to track this referral for 30 days
    response.cookies.set('tipjar_affiliate_ref', referralId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    response.cookies.set('tipjar_affiliate_code', affiliateCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Error tracking affiliate referral:', error);
    // Still redirect even on error to not break user experience
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateCode, metadata } = body;

    if (!affiliateCode) {
      return NextResponse.json({ error: 'Missing affiliate code' }, { status: 400 });
    }

    const supabase = createClient();
    const affiliateService = new AffiliateService(supabase);

    // Validate affiliate code
    const affiliate = await affiliateService.getAffiliateByCode(affiliateCode);
    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 400 });
    }

    // Track the referral click
    const referralId = await affiliateService.trackReferralClick(affiliateCode, metadata || {});

    return NextResponse.json({
      success: true,
      referralId,
      affiliate: {
        id: affiliate.id,
        code: affiliate.affiliate_code,
        displayName: affiliate.display_name
      }
    });

  } catch (error) {
    console.error('Error tracking affiliate referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}