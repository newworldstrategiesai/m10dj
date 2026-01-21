import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/test-db-functions
 * Test if database functions exist and create them if needed
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test if function exists by trying to call it
    const testResult = await supabase.rpc('check_user_admin_status', {
      user_id_param: '00000000-0000-0000-0000-000000000000' // dummy UUID
    });

    if (testResult.error) {
      console.log('Function does not exist, creating it...', testResult.error);

      // Create the functions
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.check_user_admin_status(user_id_param UUID)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          is_admin BOOLEAN := false;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM organization_members
            WHERE user_id = user_id_param
            AND role = 'admin'
            AND is_active = true
          ) INTO is_admin;
          RETURN is_admin;
        END;
        $$;

        CREATE OR REPLACE FUNCTION public.get_all_admin_user_ids()
        RETURNS UUID[]
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          admin_user_ids UUID[];
        BEGIN
          SELECT array_agg(user_id)
          INTO admin_user_ids
          FROM organization_members
          WHERE role = 'admin'
          AND is_active = true;
          RETURN COALESCE(admin_user_ids, ARRAY[]::UUID[]);
        END;
        $$;

        GRANT EXECUTE ON FUNCTION public.check_user_admin_status(UUID) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.check_user_admin_status(UUID) TO anon;
        GRANT EXECUTE ON FUNCTION public.get_all_admin_user_ids() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.get_all_admin_user_ids() TO anon;
      `;

      // Execute the SQL
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });

      if (createError) {
        console.error('Failed to create functions:', createError);
        return res.status(500).json({
          error: 'Failed to create database functions',
          details: createError
        });
      }

      return res.status(200).json({
        message: 'Database functions created successfully',
        created: true
      });
    }

    res.status(200).json({
      message: 'Database functions exist',
      exists: true,
      testResult
    });

  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}