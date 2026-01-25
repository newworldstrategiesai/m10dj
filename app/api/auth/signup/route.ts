import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';
import { getProductBaseUrl } from '@/lib/email/product-email-config';

function isValidEmail(email: string) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

/**
 * Detect product context from request (domain, path, or referer)
 */
function detectProductContext(request: NextRequest): 'tipjar' | 'djdash' | 'm10dj' {
  // Check multiple sources to ensure accurate detection
  const hostname = request.headers.get('host') || '';
  const hostnameLower = hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;
  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';
  
  // Combine all URL sources for detection
  const allUrls = `${hostname} ${pathname} ${referer} ${origin}`.toLowerCase();

  // Priority 1: Check for TipJar domains/paths (most specific first)
  if (hostnameLower.includes('tipjar.live') || 
      allUrls.includes('tipjar.live') ||
      pathname.startsWith('/tipjar/') ||
      allUrls.includes('/tipjar/')) {
    return 'tipjar';
  }

  // Priority 2: Check for DJ Dash domains/paths
  if (hostnameLower.includes('djdash.net') || 
      allUrls.includes('djdash.net') ||
      allUrls.includes('djdash.com') ||
      pathname.startsWith('/djdash/') ||
      allUrls.includes('/djdash/')) {
    return 'djdash';
  }

  // Priority 3: Check for M10 DJ Company domains/paths
  // Only match exact domains, not just 'm10dj' substring (to avoid false matches)
  if ((hostnameLower.includes('m10djcompany.com') && !hostnameLower.includes('tipjar')) ||
      (allUrls.includes('m10djcompany.com') && !allUrls.includes('tipjar')) ||
      pathname.startsWith('/m10dj/') ||
      allUrls.includes('/m10dj/')) {
    return 'm10dj';
  }

  // Check for 'tipjar' substring only if not m10dj company domain
  if (hostnameLower.includes('tipjar') && !hostnameLower.includes('m10djcompany')) {
    return 'tipjar';
  }

  // Check for 'djdash' substring only if not m10dj company domain
  if ((hostnameLower.includes('djdash') || allUrls.includes('djdash')) && 
      !hostnameLower.includes('m10djcompany')) {
    return 'djdash';
  }

  // Default to tipjar for shared signup endpoint (TipJar is the primary product)
  // This ensures new signups default to TipJar if detection fails
  return 'tipjar';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();
    const businessName = String(formData.get('businessName') || '').trim();
    const referralCode = String(formData.get('ref') || '').trim();

    // Detect product context from request
    const productContext = detectProductContext(request);

    // Handle affiliate referral tracking
    let affiliateReferralId: string | null = null;
    if (referralCode && productContext === 'tipjar') {
      try {
        // Import affiliate service dynamically to avoid circular imports
        const { AffiliateService } = await import('@/utils/affiliate/affiliate-service');
        const supabase = createClient();
        const affiliateService = new AffiliateService(supabase);

        // Convert the referral (this will create or update the referral record)
        affiliateReferralId = await affiliateService.trackReferralClick(referralCode, {
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          referrer: request.headers.get('referer') || undefined
        });
      } catch (affiliateError) {
        console.error('Error tracking affiliate referral:', affiliateError);
        // Continue with signup even if affiliate tracking fails
      }
    }
    
    // Get product-specific base URL for callback
    const productBaseUrl = getProductBaseUrl(productContext);
    const callbackURL = `${productBaseUrl}/auth/callback`;

    // Determine signup page path based on product
    const signupPath = productContext === 'tipjar' ? '/tipjar/signup' :
                      productContext === 'djdash' ? '/djdash/signup' :
                      '/signup';
    
    const signinPath = productContext === 'tipjar' ? '/tipjar/signin/password_signin' :
                      productContext === 'djdash' ? '/djdash/signin/password_signin' :
                      '/signin/password_signin';

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.redirect(
        new URL(`${signupPath}?error=${encodeURIComponent('Invalid email address. Please try again.')}`, request.url),
        { status: 303 }
      );
    }

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.redirect(
        new URL(`${signupPath}?error=${encodeURIComponent('Password must be at least 8 characters.')}`, request.url),
        { status: 303 }
      );
    }

    const supabase = createClient();
    
    // Sign up the user with product-specific context
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackURL,
        data: {
          organization_name: businessName || undefined,
          product_context: productContext, // Set product context based on signup source
        }
      }
    });

    if (error) {
      // Check if user already exists
      const isExistingUser = 
        error.message?.toLowerCase().includes('user already registered') ||
        error.message?.toLowerCase().includes('email already registered') ||
        error.message?.toLowerCase().includes('already been registered') ||
        error.code === 'signup_disabled' ||
        error.message?.toLowerCase().includes('user already exists');
      
      if (isExistingUser) {
        // Redirect to sign in with helpful message and pre-filled email
        return NextResponse.redirect(
          new URL(`${signinPath}?email=${encodeURIComponent(email)}&message=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`, request.url),
          { status: 303 }
        );
      }
      
      return NextResponse.redirect(
        new URL(`${signupPath}?error=${encodeURIComponent(error.message)}`, request.url),
        { status: 303 }
      );
    }

    if (data.user) {
      // Check for unclaimed organization matching this email (only for TipJar)
      if (productContext === 'tipjar' && data.user.id) {
        try {
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          );

          // Find unclaimed organization with matching prospect_email
          const { data: unclaimedOrg, error: unclaimedError } = await supabaseAdmin
            .from('organizations')
            .select('*')
            .eq('prospect_email', email.toLowerCase().trim())
            .eq('is_claimed', false)
            .eq('product_context', 'tipjar')
            .maybeSingle();

          let organizationId: string | undefined;

          if (!unclaimedError && unclaimedOrg) {
            // Found unclaimed organization - claim it
            const { error: claimError } = await supabaseAdmin
              .from('organizations')
              .update({
                owner_id: data.user.id,
                is_claimed: true,
                claimed_at: new Date().toISOString(),
                claim_token: null,
                claim_token_expires_at: null,
                ...(affiliateReferralId && {
                  referred_by_affiliate_id: affiliateReferralId,
                  affiliate_attribution: {
                    referral_id: affiliateReferralId,
                    converted_at: new Date().toISOString()
                  }
                })
              })
              .eq('id', unclaimedOrg.id);

            if (!claimError) {
              // Successfully claimed - delete any auto-created organization
              // (The trigger may have created one, but we want to use the claimed one)
              await supabaseAdmin
                .from('organizations')
                .delete()
                .eq('owner_id', data.user.id)
                .neq('id', unclaimedOrg.id);

              organizationId = unclaimedOrg.id;
            } else {
              throw claimError;
            }
          } else {
            // No unclaimed organization found - create new one
            // The trigger will create an organization, but we need to link it to affiliate
            // Wait a moment for the trigger to run, then update it
            await new Promise(resolve => setTimeout(resolve, 100));

            const { data: newOrg } = await supabaseAdmin
              .from('organizations')
              .select('id')
              .eq('owner_id', data.user.id)
              .eq('product_context', 'tipjar')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (newOrg && 'id' in newOrg) {
              const newOrgId = (newOrg as { id: string }).id;
              if (affiliateReferralId) {
                await supabaseAdmin
                  .from('organizations')
                  .update({
                    referred_by_affiliate_id: affiliateReferralId,
                    affiliate_attribution: {
                      referral_id: affiliateReferralId,
                      converted_at: new Date().toISOString()
                    }
                  })
                  .eq('id', newOrgId);
              }
              organizationId = newOrgId;
            }
          }

          // If we have a referral, convert it to a signup
          if (affiliateReferralId && organizationId) {
            try {
              const { AffiliateService } = await import('@/utils/affiliate/affiliate-service');
              const affiliateService = new AffiliateService(supabaseAdmin);
              await affiliateService.convertReferral(affiliateReferralId, data.user.id, organizationId);
            } catch (conversionError) {
              console.error('Error converting affiliate referral:', conversionError);
              // Don't fail signup if conversion fails
            }
          }

          // Automatically create affiliate account for new TipJar users
          if (organizationId) {
            try {
              const { AffiliateService } = await import('@/utils/affiliate/affiliate-service');
              const affiliateService = new AffiliateService(supabaseAdmin);
              
              // Check if affiliate already exists by checking for user_id
              const { data: existingAffiliate } = await supabaseAdmin
                .from('affiliates')
                .select('id')
                .eq('user_id', data.user.id)
                .maybeSingle();
              
              if (!existingAffiliate) {
                // Create affiliate account automatically
                const affiliate = await affiliateService.getOrCreateAffiliate(data.user.id);
                
                // Update with organization_id and display name
                const orgName = (unclaimedOrg as any)?.name || businessName || 'User';
                await supabaseAdmin
                  .from('affiliates')
                  .update({
                    organization_id: organizationId,
                    display_name: orgName,
                    status: 'active'
                  })
                  .eq('id', affiliate.id);
                
                console.log(`Auto-created affiliate account for user ${data.user.id}`);
              }
            } catch (affiliateError) {
              console.error('Error creating affiliate account:', affiliateError);
              // Don't fail signup if affiliate creation fails
            }
          }
        } catch (claimError) {
          // Log error but don't fail signup - user can still sign up normally
          console.error('Error during organization setup:', claimError);
        }
      }

      if (data.session) {
        // User is signed in immediately - redirect to onboarding for TipJar, dashboard for others
        const redirectPath = productContext === 'tipjar' ? '/tipjar/onboarding' :
                             productContext === 'djdash' ? '/djdash/dashboard' :
                             '/onboarding/welcome';
        return NextResponse.redirect(new URL(redirectPath, request.url), { status: 303 });
      } else {
        // Email confirmation required
        return NextResponse.redirect(
          new URL(`${signupPath}?success=true`, request.url),
          { status: 303 }
        );
      }
    }

    return NextResponse.redirect(
      new URL(`${signupPath}?error=${encodeURIComponent('Something went wrong. Please try again.')}`, request.url),
      { status: 303 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    const productContext = detectProductContext(request);
    const signupPath = productContext === 'tipjar' ? '/tipjar/signup' :
                      productContext === 'djdash' ? '/djdash/signup' :
                      '/signup';
    return NextResponse.redirect(
      new URL(`${signupPath}?error=${encodeURIComponent(error.message || 'An error occurred. Please try again.')}`, request.url),
      { status: 303 }
    );
  }
}

