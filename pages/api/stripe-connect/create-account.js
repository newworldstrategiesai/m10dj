import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createConnectAccount } from '@/utils/stripe/connect';
import { stripe } from '@/utils/stripe/config';

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

        // Get user's organization
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: organization, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('id, name, slug, stripe_connect_account_id')
          .eq('owner_id', user.id)
          .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      console.error('User ID:', user.id);
      console.error('User Email:', user.email);
      return res.status(404).json({ 
        error: 'Organization not found',
        details: orgError.message,
        userId: user.id 
      });
    }

    if (!organization) {
      console.error('No organization found for user:', user.id);
      return res.status(404).json({ 
        error: 'Organization not found. Please complete onboarding first.',
        userId: user.id 
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
    
    console.log('Creating Stripe Connect account for:', user.email, organization.name);
    
    // Build business profile URL if organization has a slug
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   req.headers.origin || 
                   'http://localhost:3000';
    const businessProfileUrl = organization.slug 
      ? `${baseUrl}/${organization.slug}/requests`
      : undefined;
    
    const account = await createConnectAccount(
      user.email || '', 
      organization.name,
      organization.slug, // Pass slug for business profile URL
      branding
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
    
    if (isPlatformProfileError) {
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
      isPlatformProfileError: isPlatformProfileError,
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

