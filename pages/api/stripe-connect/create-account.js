import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createConnectAccount } from '@/utils/stripe/connect';
import { stripe } from '@/utils/stripe/config';
import { getCurrentOrganization } from '@/utils/organization-context';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user from cookies (like other API routes)
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = session.user;

    // Get user's organization using the helper function
    // This handles both owner and team member cases (venue hierarchy support)
    let organization = await getCurrentOrganization(supabase);
    
    // If not found via helper (which uses RLS), try with admin client as fallback
    // This handles edge cases where RLS might block but user should have access
    if (!organization) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, stripe_connect_account_id, product_context')
      .eq('owner_id', user.id)
      .single();
      
      if (!orgError && orgData) {
        organization = orgData;
      }
    }

    // If organization doesn't exist, create one automatically
    if (!organization) {
      console.log('No organization found for user, creating one automatically:', user.id);
      
      // Generate a default organization name from user email or use a generic name
      const defaultName = user.email 
        ? user.email.split('@')[0].replace(/[^a-z0-9]/gi, ' ').trim() || 'My DJ Business'
        : 'My DJ Business';
      
      // Generate slug from name
      const slug = defaultName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `dj-${Math.random().toString(36).substring(2, 8)}`;
      
      // Check if slug exists and make it unique if needed
      let finalSlug = slug;
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (existingOrg) {
        finalSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
      }
      
      // Create organization with trial
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial
      
      // Determine product_context from user metadata or request origin
      let productContext = user.user_metadata?.product_context || null;
      if (!productContext) {
        // Fallback: detect from request origin
        const origin = req.headers.origin || '';
        if (origin.includes('tipjar.live')) {
          productContext = 'tipjar';
        } else if (origin.includes('djdash.net')) {
          productContext = 'djdash';
        } else {
          productContext = 'm10dj';
        }
      }
      
      const { data: newOrg, error: createError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: defaultName,
          slug: finalSlug,
          owner_id: user.id,
          subscription_tier: 'starter',
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          requests_header_artist_name: defaultName,
          product_context: productContext,
        })
        .select('id, name, slug, stripe_connect_account_id, product_context')
        .single();
      
      if (createError || !newOrg) {
        console.error('Error creating organization:', createError);
        return res.status(500).json({ 
          error: 'Failed to create organization',
          details: createError?.message || 'Unknown error',
          userId: user.id 
        });
      }
      
      organization = newOrg;
      console.log('✅ Organization created automatically:', {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      });
    }

    // Check if account already exists
    if (organization.stripe_connect_account_id) {
      return res.status(200).json({
        accountId: organization.stripe_connect_account_id,
        message: 'Stripe Connect account already exists',
        existing: true,
      });
    }

    // Create Stripe Connect Express account with custom branding
    let branding = undefined;
    try {
      // Import branding config (use dynamic import for ES modules)
      const brandingModule = await import('@/utils/stripe/branding');
      const brandingResult = brandingModule.getConnectAccountBranding({
        // You can customize per organization if needed
        // For now, use default platform branding
      });
      
      // Only use branding if logo URL is absolute (Stripe requires absolute URLs)
      if (brandingResult.logo && (brandingResult.logo.startsWith('http://') || brandingResult.logo.startsWith('https://'))) {
        branding = brandingResult;
      } else {
        // If logo is relative, skip logo but keep colors (Stripe requires absolute URLs for logos)
        console.warn('Skipping logo branding: logo URL must be absolute for Stripe Connect');
        branding = {
          primaryColor: brandingResult.primaryColor,
          secondaryColor: brandingResult.secondaryColor,
        };
      }
    } catch (brandingError) {
      console.warn('Error loading branding config, proceeding without branding:', brandingError);
      // Continue without branding if there's an error
    }
    
    // Validate Stripe is configured
    if (!stripe) {
      console.error('Stripe not initialized - check STRIPE_SECRET_KEY environment variable');
      return res.status(500).json({ 
        error: 'Stripe not configured',
        details: 'Stripe secret key is missing or invalid. Please check your environment variables.'
      });
    }
    
    // Optional: Pre-check if platform can create connected accounts
    // This provides better error messages but adds an extra API call
    // We'll let the actual creation attempt handle errors for now to avoid extra latency
    
    console.log('Creating Stripe Connect account for:', user.email, organization.name);
    
    // Determine correct domain based on product context
    // For TipJar users, use tipjar.live; for others, use m10djcompany.com
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin || 'http://localhost:3000';
    
    // Override based on product context
    if (organization.product_context === 'tipjar') {
      baseUrl = 'https://tipjar.live';
    } else if (organization.product_context === 'djdash') {
      baseUrl = 'https://djdash.net';
    } else if (!baseUrl.includes('tipjar.live') && !baseUrl.includes('djdash.net')) {
      // Default to m10djcompany.com if not already set and not a product-specific domain
      baseUrl = 'https://m10djcompany.com';
    }
    
    // Build business profile URL if organization has a slug
    const businessProfileUrl = organization.slug 
      ? `${baseUrl}/${organization.slug}/requests`
      : undefined;
    
    const account = await createConnectAccount(
      user.email || '', 
      organization.name,
      organization.slug, // Pass slug for business profile URL
      branding,
      baseUrl, // Pass the correct baseUrl
      organization.product_context // Pass product context for metadata
    );
    console.log('Stripe Connect account created successfully:', account.id);

    // Update organization with account ID
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({
        stripe_connect_account_id: account.id,
        stripe_connect_onboarding_complete: false,
      })
      .eq('id', organization.id);

    if (updateError) {
      console.error('Error updating organization with Stripe account:', updateError);
      return res.status(500).json({ error: 'Failed to save Stripe account' });
    }

    return res.status(200).json({
      accountId: account.id,
      message: 'Stripe Connect account created successfully',
      existing: false,
    });
  } catch (error) {
    console.error('Error in create-account API:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Get the original error message (may be nested)
    const originalMessage = error.originalMessage || error.message || '';
    const errorMsg = error.message || '';
    
    // Check if this is the "cannot create connected accounts" error
    const cannotCreateAccountsError = (
      originalMessage.toLowerCase().includes('cannot currently create connected accounts') ||
      originalMessage.toLowerCase().includes('cannot create connected accounts') ||
      originalMessage.toLowerCase().includes('account cannot currently create') ||
      originalMessage.toLowerCase().includes('contact us via') ||
      errorMsg.toLowerCase().includes('cannot currently create connected accounts') ||
      errorMsg.toLowerCase().includes('cannot create connected accounts') ||
      errorMsg.toLowerCase().includes('account cannot currently create') ||
      (error.stripeError && (
        error.stripeError.message?.toLowerCase().includes('cannot currently create connected accounts') ||
        error.stripeError.message?.toLowerCase().includes('cannot create connected accounts') ||
        error.stripeError.message?.toLowerCase().includes('account cannot currently create')
      ))
    );
    
    // Check if this is the platform profile/verification error
    // Check both the error message and any nested stripe error
    const isPlatformProfileError = (
      originalMessage.includes('complete your platform profile') ||
      originalMessage.includes('platform profile') ||
      originalMessage.includes('questionnaire') ||
      originalMessage.includes('verify your identity') ||
      originalMessage.includes('verify identity') ||
      originalMessage.includes('complete verification') ||
      errorMsg.includes('complete your platform profile') ||
      errorMsg.includes('platform profile') ||
      errorMsg.includes('questionnaire') ||
      errorMsg.includes('verify your identity') ||
      errorMsg.includes('verify identity') ||
      errorMsg.includes('complete verification') ||
      (error.stripeError && (
        error.stripeError.message?.includes('verify your identity') ||
        error.stripeError.message?.includes('platform profile') ||
        error.stripeError.message?.includes('complete verification')
      ))
    );
    
    // Check if we're using test or live mode
    const stripeKey = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';
    const isTestMode = stripeKey.startsWith('sk_test_');
    
    // Provide more specific error messages
    let finalErrorMessage = 'Internal server error';
    let errorDetails = originalMessage || errorMsg || 'Unknown error';
    let helpUrl = null;
    
    if (cannotCreateAccountsError) {
      // This is a critical error - Stripe account needs to be enabled for Connect
      finalErrorMessage = 'Stripe Connect Not Enabled';
      if (isTestMode) {
        errorDetails = 'Your Stripe test account cannot currently create connected accounts. This usually means you need to complete Stripe\'s platform verification or contact Stripe support to enable Connect for your account.';
        helpUrl = 'https://support.stripe.com/contact';
      } else {
        errorDetails = 'Your Stripe account cannot currently create connected accounts. You need to contact Stripe support to enable Connect for your account. This is a one-time setup required by Stripe.';
        helpUrl = 'https://support.stripe.com/contact';
      }
    } else if (isPlatformProfileError) {
      if (isTestMode) {
        finalErrorMessage = 'Stripe Test Mode Setup Required';
        errorDetails = originalMessage || 'You need to complete the Stripe Connect platform profile questionnaire in your test mode dashboard.';
        helpUrl = 'https://dashboard.stripe.com/test/connect/accounts/overview';
      } else {
        finalErrorMessage = 'Stripe Live Mode Setup Required';
        errorDetails = originalMessage || 'You must complete your platform profile to use Connect and create live connected accounts. This is a one-time setup required by Stripe.';
        helpUrl = 'https://dashboard.stripe.com/connect/accounts/overview';
      }
    } else if (error.stripeType || error.type) {
      finalErrorMessage = `Stripe error: ${error.stripeType || error.type}`;
      errorDetails = originalMessage || errorMsg || errorDetails;
    } else if (errorMsg) {
      finalErrorMessage = errorMsg;
      errorDetails = originalMessage || errorDetails;
    }
    
    return res.status(500).json({ 
      error: finalErrorMessage,
      details: errorDetails,
      helpUrl: helpUrl,
      isPlatformProfileError: isPlatformProfileError || cannotCreateAccountsError,
      cannotCreateAccounts: cannotCreateAccountsError,
      isTestMode: isTestMode,
      // Only include stack in development
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        errorType: error.stripeType || error.type,
        errorCode: error.stripeCode || error.code,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })
    });
  }
}

