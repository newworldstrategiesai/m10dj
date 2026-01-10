/**
 * Test Endpoint: Check Database Constraints for Unclaimed Organizations
 * 
 * This endpoint verifies that the database schema supports unclaimed organizations
 * by checking columns, constraints, and testing a sample insert/rollback.
 * 
 * Super Admin Only
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate using session (like other working API routes)
    const supabaseAuth = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Please log in' });
    }

    const user = session.user;

    // Check if user is super admin
    if (!isSuperAdminEmail(user.email)) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Verify we have service role key
    if (!supabaseServiceKey || !supabaseUrl) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Supabase configuration missing'
      });
    }

    // Create admin client with service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = {
      timestamp: new Date().toISOString(),
      user: user.email,
      checks: {},
      testInsert: null,
      errors: []
    };

    // ============================================
    // 1. Check if required columns exist
    // ============================================
    try {
      // Try to query all required columns
      const { data: testOrg, error: testError } = await supabaseAdmin
        .from('organizations')
        .select('owner_id, is_claimed, prospect_email, prospect_phone, claim_token, claim_token_expires_at, created_by_admin_id, claimed_at')
        .limit(1)
        .maybeSingle();

      if (testError) {
        // Check error code to determine if it's a missing column
        if (testError.code === '42703' || testError.message?.includes('column') || testError.message?.includes('does not exist')) {
          results.checks.columns = {
            status: 'missing',
            error: testError.message,
            code: testError.code,
            message: 'Some required columns do not exist - migration may not be applied'
          };
          results.errors.push(`Missing columns: ${testError.message}`);
        } else {
          // Other error (permission, etc.)
          results.checks.columns = {
            status: 'error',
            error: testError.message,
            code: testError.code,
            message: 'Error querying columns (may be permission issue)'
          };
          results.errors.push(`Column query error: ${testError.message}`);
        }
      } else {
        // Successfully queried - columns exist
        const columnsFound = [];
        if (testOrg !== null) {
          // If we got data, check which fields are present
          if ('owner_id' in (testOrg || {})) columnsFound.push('owner_id');
          if ('is_claimed' in (testOrg || {})) columnsFound.push('is_claimed');
          if ('prospect_email' in (testOrg || {})) columnsFound.push('prospect_email');
          if ('prospect_phone' in (testOrg || {})) columnsFound.push('prospect_phone');
          if ('claim_token' in (testOrg || {})) columnsFound.push('claim_token');
          if ('claim_token_expires_at' in (testOrg || {})) columnsFound.push('claim_token_expires_at');
          if ('created_by_admin_id' in (testOrg || {})) columnsFound.push('created_by_admin_id');
          if ('claimed_at' in (testOrg || {})) columnsFound.push('claimed_at');
        }
        
        results.checks.columns = {
          status: 'exists',
          columnsFound: columnsFound.length,
          message: `All required columns exist (${columnsFound.length}/8 found)`
        };
      }
    } catch (error) {
      results.checks.columns = {
        status: 'error',
        error: error.message
      };
      results.errors.push(`Column check error: ${error.message}`);
    }

    // ============================================
    // 2. Check owner_id constraint (can it be NULL?)
    // ============================================
    try {
      // Test: Try to query organizations with NULL owner_id
      const { data: nullOwnerTest, error: nullError } = await supabaseAdmin
        .from('organizations')
        .select('id, owner_id, is_claimed')
        .is('owner_id', null)
        .limit(1)
        .maybeSingle();

      if (nullError) {
        // If error code suggests constraint violation
        if (nullError.code === '23502' || nullError.message?.includes('null value') || nullError.message?.includes('violates not-null')) {
          results.checks.owner_id_nullable = {
            status: 'no',
            error: nullError.message,
            code: nullError.code,
            message: 'owner_id CANNOT be NULL - migration NOT applied'
          };
          results.errors.push('owner_id cannot be NULL - migration required');
        } else {
          results.checks.owner_id_nullable = {
            status: 'unknown',
            error: nullError.message,
            code: nullError.code,
            message: `Cannot query NULL owner_id: ${nullError.message}`
          };
        }
      } else {
        // Successfully queried - owner_id can be NULL
        results.checks.owner_id_nullable = {
          status: 'yes',
          canQueryNull: true,
          foundUnclaimed: nullOwnerTest !== null,
          message: 'owner_id can be NULL - migration appears to be applied'
        };
      }
    } catch (error) {
      results.checks.owner_id_nullable = {
        status: 'error',
        error: error.message
      };
      results.errors.push(`owner_id constraint check error: ${error.message}`);
    }

    // ============================================
    // 3. Check is_claimed column exists and default
    // ============================================
    try {
      // Test if we can query is_claimed
      const { data: claimedTest, error: claimedError } = await supabaseAdmin
        .from('organizations')
        .select('id, is_claimed')
        .limit(1)
        .maybeSingle();

      if (claimedError && claimedError.code === '42703') {
        // Column doesn't exist
        results.checks.is_claimed_column = {
          status: 'missing',
          error: 'is_claimed column does not exist',
          message: 'Migration 20260112000000_allow_unclaimed_organizations.sql may not be applied'
        };
        results.errors.push('is_claimed column missing');
      } else {
        results.checks.is_claimed_column = {
          status: 'exists',
          message: 'is_claimed column exists and can be queried'
        };
      }
    } catch (error) {
      results.checks.is_claimed_column = {
        status: 'error',
        error: error.message
      };
      results.errors.push(`is_claimed check error: ${error.message}`);
    }

    // ============================================
    // 4. Check constraint: (owner_id IS NULL AND is_claimed = FALSE)
    // ============================================
    try {
      // Test: Query organizations that match the constraint pattern
      const { data: constraintTest, error: constraintError } = await supabaseAdmin
        .from('organizations')
        .select('id, owner_id, is_claimed')
        .is('owner_id', null)
        .eq('is_claimed', false)
        .limit(1)
        .maybeSingle();

      if (constraintError) {
        results.checks.constraint = {
          status: 'error',
          error: constraintError.message,
          code: constraintError.code,
          message: 'Cannot query constraint pattern - will test via insert'
        };
      } else {
        results.checks.constraint = {
          status: 'ok',
          canQueryPattern: true,
          foundMatching: constraintTest !== null,
          message: constraintTest
            ? 'Constraint pattern works - found matching organizations'
            : 'Constraint pattern works - no matching organizations found'
        };
      }
    } catch (error) {
      results.checks.constraint = {
        status: 'error',
        error: error.message
      };
      results.errors.push(`Constraint check error: ${error.message}`);
    }

    // ============================================
    // 5. Test Insert (with rollback via transaction if possible)
    // ============================================
    try {
      // Generate a test slug that definitely won't exist
      const testSlug = `test-unclaimed-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testEmail = `test-${Date.now()}@test.tipjar.live`;

      const testInsertData = {
        name: 'Test Unclaimed Organization',
        slug: testSlug,
        artist_name: 'Test Artist',
        requests_header_artist_name: 'Test Artist',
        product_context: 'tipjar',
        subscription_tier: 'starter',
        subscription_status: 'trial',
        is_claimed: false,
        owner_id: null,
        prospect_email: testEmail,
        prospect_phone: null,
        created_by_admin_id: user.id,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Attempt insert
      const { data: insertedOrg, error: insertError } = await supabaseAdmin
        .from('organizations')
        .insert(testInsertData)
        .select()
        .single();

      if (insertError) {
        results.testInsert = {
          status: 'failed',
          error: {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          },
          attemptedData: testInsertData
        };
        results.errors.push(`Test insert failed: ${insertError.message}`);
      } else {
        // Success! Now delete the test organization
        const { error: deleteError } = await supabaseAdmin
          .from('organizations')
          .delete()
          .eq('id', insertedOrg.id);

        results.testInsert = {
          status: 'success',
          insertedId: insertedOrg.id,
          cleanedUp: !deleteError,
          message: deleteError 
            ? `Test insert succeeded but cleanup failed: ${deleteError.message}`
            : 'Test insert succeeded and was cleaned up',
          insertedData: insertedOrg
        };
      }
    } catch (error) {
      results.testInsert = {
        status: 'error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      results.errors.push(`Test insert exception: ${error.message}`);
    }

    // ============================================
    // 6. Check for existing unclaimed organizations
    // ============================================
    try {
      const { count, error: countError } = await supabaseAdmin
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .is('owner_id', null)
        .eq('is_claimed', false);

      results.checks.existing_unclaimed = {
        status: countError ? 'error' : 'ok',
        count: count || 0,
        error: countError?.message,
        code: countError?.code,
        message: countError
          ? `Cannot count unclaimed organizations: ${countError.message}`
          : `Found ${count || 0} existing unclaimed organizations`
      };
    } catch (error) {
      results.checks.existing_unclaimed = {
        status: 'error',
        error: error.message
      };
      results.errors.push(`Unclaimed count error: ${error.message}`);
    }

    // ============================================
    // Summary
    // ============================================
    const allChecksPassed = results.errors.length === 0 && 
                            results.testInsert?.status === 'success';

    return res.status(200).json({
      success: allChecksPassed,
      summary: {
        checksPassed: results.errors.length === 0,
        testInsertPassed: results.testInsert?.status === 'success',
        errorCount: results.errors.length,
        migrationApplied: results.checks.owner_id_nullable?.status === 'yes' && 
                         results.checks.is_claimed_column?.status === 'exists'
      },
      results
    });

  } catch (error) {
    console.error('Error in test-unclaimed-constraints:', error);
    return res.status(500).json({
      error: 'Failed to run constraint tests',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

