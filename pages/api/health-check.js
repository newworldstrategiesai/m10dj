/**
 * Health Check Endpoint
 * 
 * This endpoint verifies that all critical systems are operational:
 * - Database connection
 * - Supabase credentials
 * - Contact form submission capability
 * 
 * Use this for monitoring and alerting
 */

import { db } from '../../utils/company_lib/supabase';

export default async function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // Check 1: Environment variables
    checks.checks.environment = {
      name: 'Environment Variables',
      status: 'checking'
    };

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      checks.checks.environment = {
        name: 'Environment Variables',
        status: 'warning',
        message: `Missing: ${missingVars.join(', ')}`,
        critical: missingVars.includes('NEXT_PUBLIC_SUPABASE_URL') || 
                  missingVars.includes('SUPABASE_SERVICE_ROLE_KEY')
      };
      
      if (checks.checks.environment.critical) {
        checks.status = 'unhealthy';
      }
    } else {
      checks.checks.environment = {
        name: 'Environment Variables',
        status: 'healthy'
      };
    }

    // Check 2: Database connection
    checks.checks.database = {
      name: 'Database Connection',
      status: 'checking'
    };

    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Try a simple query
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      checks.checks.database = {
        name: 'Database Connection',
        status: 'healthy'
      };
    } catch (dbError) {
      checks.checks.database = {
        name: 'Database Connection',
        status: 'unhealthy',
        error: dbError.message
      };
      checks.status = 'unhealthy';
    }

    // Check 3: Admin user configuration
    checks.checks.adminUser = {
      name: 'Admin User Configuration',
      status: 'checking'
    };

    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      let adminUserId = process.env.DEFAULT_ADMIN_USER_ID;

      if (!adminUserId) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        
        const adminEmails = [
          'djbenmurray@gmail.com',
          'admin@m10djcompany.com',
          'manager@m10djcompany.com'
        ];

        const adminUser = authUsers?.users?.find(user => 
          adminEmails.includes(user.email || '')
        );

        adminUserId = adminUser?.id;
      }

      if (adminUserId) {
        checks.checks.adminUser = {
          name: 'Admin User Configuration',
          status: 'healthy'
        };
      } else {
        checks.checks.adminUser = {
          name: 'Admin User Configuration',
          status: 'warning',
          message: 'No admin user found - contacts will be unassigned'
        };
      }
    } catch (adminError) {
      checks.checks.adminUser = {
        name: 'Admin User Configuration',
        status: 'warning',
        error: adminError.message
      };
    }

    // Check 4: Contact submissions table
    checks.checks.contactSubmissions = {
      name: 'Contact Submissions Table',
      status: 'checking'
    };

    try {
      // Test if we can query contact_submissions directly
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from('contact_submissions')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }
      
      checks.checks.contactSubmissions = {
        name: 'Contact Submissions Table',
        status: 'healthy'
      };
    } catch (submissionError) {
      checks.checks.contactSubmissions = {
        name: 'Contact Submissions Table',
        status: 'unhealthy',
        error: submissionError.message
      };
      checks.status = 'unhealthy';
    }

    // Overall health determination
    const unhealthyChecks = Object.values(checks.checks).filter(
      check => check.status === 'unhealthy'
    );

    if (unhealthyChecks.length > 0) {
      checks.status = 'unhealthy';
      checks.message = `${unhealthyChecks.length} critical check(s) failed`;
    }

    const warningChecks = Object.values(checks.checks).filter(
      check => check.status === 'warning'
    );

    if (warningChecks.length > 0 && checks.status === 'healthy') {
      checks.status = 'degraded';
      checks.message = `${warningChecks.length} check(s) have warnings`;
    }

    // Return appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : 
                       checks.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(checks);

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
      checks: checks.checks
    });
  }
}

