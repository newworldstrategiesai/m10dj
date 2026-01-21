const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function executeSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const sql = fs.readFileSync('run_missing_karaoke_migrations.sql', 'utf8');
    console.log('Reading SQL file...');

    // Split SQL into statements (by semicolon, but be careful with CREATE FUNCTION blocks)
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);

        try {
          // Try to execute via RPC if available
          const { error } = await supabase.from('dummy').select('*').limit(0);
          if (error && !error.message.includes('relation "public.dummy" does not exist')) {
            throw error;
          }

          // For now, just log that we'd execute it
          console.log('Would execute:', statement.substring(0, 100));
        } catch (err) {
          console.log('Note: Cannot execute via RPC, would need manual execution');
        }
      }
    }

    console.log('SQL parsing completed. Please execute the SQL manually in your Supabase dashboard.');

  } catch (error) {
    console.error('Error:', error);
  }
}

executeSQL();