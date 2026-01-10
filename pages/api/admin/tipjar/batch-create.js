/**
 * Batch Create Tip Jar Pages (Super Admin Only)
 * 
 * Creates multiple fully configured Tip Jar Live pages for prospects.
 * Organizations are created as unclaimed (owner_id = NULL) and can be
 * claimed later by prospects when they create accounts.
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Generate secure claim token (JWT-like structure with 90-day expiry)
function generateClaimToken(organizationId, prospectEmail) {
  const tokenData = {
    org_id: organizationId,
    email: prospectEmail,
    created_at: new Date().toISOString(),
    exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
  };
  
  // Create a simple token using HMAC (we'll verify by checking database)
  const secret = process.env.TIPJAR_CLAIM_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const payload = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  
  return `${payload}.${signature}`;
}

// Generate unique slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

// Ensure slug is unique
async function ensureUniqueSlug(supabase, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Safety limit
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Batch create API called', { method: req.method, hasBody: !!req.body });

  try {
    // Authenticate using session (like other working API routes)
    const supabaseAuth = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Unauthorized', message: 'Please log in' });
    }

    const user = session.user;
    console.log('User authenticated:', user.email);

    // Check if user is super admin
    if (!isSuperAdminEmail(user.email)) {
      console.error('Non-super admin attempted batch create:', user.email);
      return res.status(403).json({ error: 'Super admin access required' });
    }

    console.log('Super admin authenticated:', user.email);
    
    // Verify we have service role key
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Service role key not configured'
      });
    }
    
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Supabase URL not configured'
      });
    }
    
    // Create admin client with service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Batch create request from super admin:', user.email);
    
    const { prospects, send_emails = false } = req.body;
    
    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({ error: 'prospects array is required and must not be empty' });
    }

    // For single page creation, don't send emails automatically (admin will review first)
    // For batch creation, send emails automatically
    const shouldSendEmails = send_emails || prospects.length > 1;

    // Validate each prospect
    const validationErrors = [];
    const validatedProspects = [];
    
    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      const errors = [];
      
      if (!prospect.email || !isValidEmail(prospect.email)) {
        errors.push('Valid email is required');
      }
      
      if (!prospect.business_name || typeof prospect.business_name !== 'string' || prospect.business_name.trim().length === 0) {
        errors.push('business_name is required');
      }
      
      if (prospect.slug && typeof prospect.slug !== 'string') {
        errors.push('slug must be a string if provided');
      }
      
      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          email: prospect.email || 'unknown',
          errors
        });
      } else {
        validatedProspects.push({
          ...prospect,
          email: prospect.email.toLowerCase().trim(),
          business_name: prospect.business_name.trim()
        });
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation errors',
        validationErrors
      });
    }

    // Check for duplicate emails
    const emails = validatedProspects.map(p => p.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      return res.status(400).json({
        error: 'Duplicate emails found',
        duplicateEmails: [...new Set(duplicateEmails)]
      });
    }

    // Check if any emails already have unclaimed organizations
    const { data: existingUnclaimed } = await supabaseAdmin
      .from('organizations')
      .select('prospect_email')
      .in('prospect_email', emails)
      .eq('is_claimed', false);
    
    if (existingUnclaimed && existingUnclaimed.length > 0) {
      const existingEmails = existingUnclaimed.map(org => org.prospect_email);
      return res.status(400).json({
        error: 'Unclaimed organizations already exist for these emails',
        existingEmails
      });
    }

    // Process prospects and create organizations
    const createdOrganizations = [];
    const failures = [];
    
    for (const prospect of validatedProspects) {
      try {
        // Generate slug
        let baseSlug = prospect.slug || generateSlug(prospect.business_name);
        if (!baseSlug || baseSlug.length === 0) {
          // Fallback to email-based slug
          baseSlug = generateSlug(prospect.email.split('@')[0]);
        }
        
        const uniqueSlug = await ensureUniqueSlug(supabaseAdmin, baseSlug);
        
        // Set claim token expiry (90 days from now)
        const claimTokenExpiresAt = new Date();
        claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 90);
        
        // Default configuration for unclaimed organizations
        const defaultConfig = {
          product_context: 'tipjar',
          subscription_tier: 'starter',
          subscription_status: 'trial',
          is_claimed: false, // Must be false for unclaimed orgs
          owner_id: null, // NULL for unclaimed orgs (migration must allow this)
          prospect_email: prospect.email.toLowerCase().trim(),
          prospect_phone: prospect.phone || null,
          created_by_admin_id: user.id,
          ...prospect.configuration || {}
        };
        
        // Ensure is_claimed is explicitly false (required by constraint)
        if (defaultConfig.is_claimed !== false) {
          defaultConfig.is_claimed = false;
        }
        
        // Set trial end date (14 days from now, or from config)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + (prospect.configuration?.trial_days || 14));
        defaultConfig.trial_ends_at = trialEndsAt.toISOString();
        
        // Create organization
        console.log(`Creating organization for ${prospect.email}:`, {
          name: prospect.business_name,
          slug: uniqueSlug,
          defaultConfig
        });
        
        const insertData = {
          name: prospect.business_name,
          slug: uniqueSlug,
          artist_name: prospect.artist_name || prospect.business_name,
          requests_header_artist_name: prospect.configuration?.requests_header_artist_name || prospect.artist_name || prospect.business_name,
          ...defaultConfig
        };
        
        console.log('Insert data:', JSON.stringify(insertData, null, 2));
        
        const { data: organization, error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert(insertData)
          .select()
          .single();
        
        if (orgError) {
          console.error(`Error creating organization for ${prospect.email}:`, {
            error: orgError,
            code: orgError.code,
            message: orgError.message,
            details: orgError.details,
            hint: orgError.hint,
            insertData: JSON.stringify(insertData)
          });
          failures.push({
            email: prospect.email,
            error: orgError.message || 'Failed to create organization',
            details: orgError.details,
            code: orgError.code,
            hint: orgError.hint
          });
          continue;
        }
        
        if (!organization) {
          console.error(`No organization returned for ${prospect.email}, but no error either`);
          failures.push({
            email: prospect.email,
            error: 'Organization creation returned no data'
          });
          continue;
        }
        
        console.log(`Successfully created organization ${organization.id} for ${prospect.email}`);
        
        // Generate claim token
        const claimToken = generateClaimToken(organization.id, prospect.email);
        
        // Update organization with claim token
        const { error: tokenError } = await supabaseAdmin
          .from('organizations')
          .update({
            claim_token: claimToken,
            claim_token_expires_at: claimTokenExpiresAt.toISOString()
          })
          .eq('id', organization.id);
        
        if (tokenError) {
          console.error('Error setting claim token:', tokenError);
          // Continue anyway, token can be regenerated
        }
        
        // Generate URLs
        const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
        const pageUrl = `${baseUrl}/${uniqueSlug}/requests`;
        const claimUrl = `${baseUrl}/tipjar/claim?token=${claimToken}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}`;
        
        createdOrganizations.push({
          id: organization.id,
          slug: uniqueSlug,
          name: prospect.business_name,
          email: prospect.email,
          url: pageUrl,
          qr_code_url: qrCodeUrl,
          claim_link: claimUrl,
          claim_token: claimToken,
          prospect_email: prospect.email
        });

        // Send welcome email only if send_emails is true (or batch creation)
        // Single page creation: admin reviews first, then sends email manually
        if (shouldSendEmails) {
          const { sendProspectWelcomeEmail } = await import('@/lib/email/tipjar-batch-emails');
          sendProspectWelcomeEmail({
            prospectEmail: prospect.email,
            prospectName: prospect.artist_name || prospect.business_name,
            businessName: prospect.business_name,
            pageUrl,
            claimLink: claimUrl,
            qrCodeUrl,
            productContext: 'tipjar'
          }).catch((emailError) => {
            console.error(`Error sending welcome email to ${prospect.email}:`, emailError);
            // Don't fail the batch creation if email fails
          });
        }
        
      } catch (error) {
        console.error(`Error creating organization for ${prospect.email}:`, error);
        console.error('Error stack:', error.stack);
        failures.push({
          email: prospect.email,
          error: error.message || 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
    
    // If all failed, return error with detailed failure info
    if (createdOrganizations.length === 0 && failures.length > 0) {
      console.error('All organizations failed to create. Failures:', JSON.stringify(failures, null, 2));
      const firstFailure = failures[0];
      return res.status(500).json({
        error: 'Failed to create any organizations',
        message: firstFailure?.error || 'Unknown error',
        failures: failures,
        details: firstFailure?.details,
        hint: firstFailure?.hint,
        code: firstFailure?.code
      });
    }
    
    // Log success/failure summary
    console.log(`Batch create completed: ${createdOrganizations.length} created, ${failures.length} failed`);
    if (failures.length > 0) {
      console.error('Failures:', failures);
    }
    
    return res.status(200).json({
      success: true,
      created: createdOrganizations.length,
      failed: failures.length,
      organizations: createdOrganizations,
      failures: failures.length > 0 ? failures : undefined
    });
    
  } catch (error) {
    console.error('Error in batch create:', error);
    return res.status(500).json({
      error: 'Failed to create organizations',
      message: error.message
    });
  }
}

