const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function executeAffiliateSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const sql = fs.readFileSync('run_affiliate_migration.sql', 'utf8');
    console.log('Reading affiliate SQL file...');

    // Split SQL into statements (by semicolon, but be careful with CREATE FUNCTION blocks)
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error);
            // Continue with next statement instead of failing completely
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`Note: Cannot execute via RPC, would need manual execution: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('Affiliate SQL execution completed.');

  } catch (error) {
    console.error('Error:', error);
  }
}

executeAffiliateSQL();