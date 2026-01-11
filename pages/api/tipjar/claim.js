/**
 * Claim Unclaimed Tip Jar Organization
 * 
 * Allows prospects to claim their pre-created Tip Jar page by creating
 * an account with matching email. Transfers ownership and pending tips.
 */

import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify claim token
async function verifyClaimToken(supabase, token, email) {
  try {
    // Find organization by claim token
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('claim_token', token)
      .eq('is_claimed', false)
      .single();
    
    if (error || !organization) {
      return { valid: false, error: 'Invalid or expired claim token' };
    }
    
    // Check if token is expired
    if (organization.claim_token_expires_at) {
      const expiresAt = new Date(organization.claim_token_expires_at);
      if (expiresAt < new Date()) {
        return { valid: false, error: 'Claim token has expired' };
      }
    }
    
    // Verify email matches
    if (organization.prospect_email && organization.prospect_email.toLowerCase() !== email.toLowerCase()) {
      return { valid: false, error: 'Email does not match prospect email' };
    }
    
    return { valid: true, organization };
  } catch (error) {
    console.error('Error verifying claim token:', error);
    return { valid: false, error: 'Failed to verify claim token' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { claim_token, email, password, business_name } = req.body;
    
    if (!claim_token || !email || !password) {
      return res.status(400).json({ 
        error: 'claim_token, email, and password are required' 
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify claim token
    const tokenVerification = await verifyClaimToken(supabaseAdmin, claim_token, email);
    
    if (!tokenVerification.valid) {
      return res.status(400).json({ 
        error: tokenVerification.error || 'Invalid claim token' 
      });
    }
    
    const unclaimedOrg = tokenVerification.organization;
    
    // Check if email already has an account
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email.toLowerCase());
    
    let userId;
    let isNewUser = false;
    
    if (existingUser?.user) {
      // User already exists - link organization to existing account
      userId = existingUser.user.id;
      
      // Check if user already owns an organization
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id, name')
        .eq('owner_id', userId)
        .eq('is_claimed', true)
        .single();
      
      if (existingOrg) {
        // User already has an organization - merge or handle accordingly
        // For now, we'll link the unclaimed org to this user too
        // (Note: This means a user could potentially have multiple orgs)
        console.log(`User ${userId} already owns organization ${existingOrg.id}, linking unclaimed org ${unclaimedOrg.id}`);
      }
    } else {
      // Create new user account
      const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          product_context: 'tipjar',
          organization_name: business_name || unclaimedOrg.name,
          claimed_from_token: true
        }
      });
      
      if (signUpError || !newUser?.user) {
        console.error('Error creating user:', signUpError);
        return res.status(500).json({
          error: 'Failed to create user account',
          details: signUpError?.message
        });
      }
      
      userId = newUser.user.id;
      isNewUser = true;
    }
    
    // Get unclaimed tip balance
    const { data: tipBalance } = await supabaseAdmin
      .from('unclaimed_tip_balance')
      .select('*')
      .eq('organization_id', unclaimedOrg.id)
      .eq('is_transferred', false)
      .single();
    
    const pendingTipsCents = tipBalance?.net_amount_cents || 0;
    
    // Update organization: claim it
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({
        owner_id: userId,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        // Update name if provided
        ...(business_name && business_name.trim() !== unclaimedOrg.name ? { name: business_name.trim() } : {})
      })
      .eq('id', unclaimedOrg.id)
      .select()
      .single();
    
    if (updateError || !updatedOrg) {
      console.error('Error claiming organization:', updateError);
      console.error('Update error details:', {
        message: updateError?.message,
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint
      });
      return res.status(500).json({
        error: 'Failed to claim organization',
        details: updateError?.message || updateError?.details,
        code: updateError?.code,
        hint: updateError?.hint
      });
    }
    
    // Create organization_members record for the new owner
    // (The trigger only fires on INSERT, not UPDATE, so we need to do this manually)
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: updatedOrg.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (memberError && memberError.code !== '23505') { // 23505 = unique_violation (already exists)
      console.error('Error creating organization_members record:', memberError);
      // Don't fail the claim if membership creation fails - it's not critical
      // The organization is already claimed, the user can still use it
    }
    
    // Clear claim token (organization is now claimed)
    await supabaseAdmin
      .from('organizations')
      .update({
        claim_token: null,
        claim_token_expires_at: null
      })
      .eq('id', unclaimedOrg.id);
    
    // Determine redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
    const redirectUrl = pendingTipsCents > 0
      ? `/tipjar/onboarding?claimed=true&pending_tips=${pendingTipsCents}`
      : `/tipjar/onboarding?claimed=true`;
    
    // Send account claimed email (non-blocking)
    (async () => {
      try {
        const { sendAccountClaimedEmail } = await import('@/lib/email/tipjar-batch-emails');
        await sendAccountClaimedEmail({
          prospectEmail: email.toLowerCase(),
          prospectName: business_name || unclaimedOrg.name,
          businessName: updatedOrg.name,
          dashboardUrl: `${baseUrl}/tipjar/dashboard`,
          pendingTipsCents,
          productContext: 'tipjar'
        });
      } catch (emailError) {
        console.error('Error sending account claimed email:', emailError);
        // Don't fail the claim if email fails
      }
    })();
    
    return res.status(200).json({
      success: true,
      organization_id: updatedOrg.id,
      user_id: userId,
      is_new_user: isNewUser,
      pending_tips_cents: pendingTipsCents,
      pending_tips_dollars: (pendingTipsCents / 100).toFixed(2),
      redirect_url: redirectUrl,
      organization: {
        id: updatedOrg.id,
        slug: updatedOrg.slug,
        name: updatedOrg.name
      }
    });
    
  } catch (error) {
    console.error('Error in claim endpoint:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return res.status(500).json({
      error: 'Failed to claim organization',
      message: error.message,
      details: error.details || error.code || 'Unknown error',
      hint: error.hint
    });
  }
}

