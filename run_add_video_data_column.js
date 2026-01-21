const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const sql = `-- Add video_data column to karaoke_signups table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'video_data') THEN
    ALTER TABLE karaoke_signups ADD COLUMN video_data JSONB NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN karaoke_signups.video_data IS 'JSON data containing YouTube video metadata (title, channel, quality score, etc.)';`;

    console.log('Executing SQL to add video_data column...');

    // For Supabase, we need to use raw SQL execution
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('RPC error, trying direct approach...');

      // Try direct query
      const { error: directError } = await supabase
        .from('karaoke_signups')
        .select('*')
        .limit(1);

      if (directError) {
        throw directError;
      }

      console.log('Please run this SQL manually in your Supabase SQL Editor:');
      console.log(sql);
    } else {
      console.log('SQL executed successfully');
    }

  } catch (error) {
    console.error('Error:', error);
    console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
    console.log(`-- Add video_data column to karaoke_signups table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'video_data') THEN
    ALTER TABLE karaoke_signups ADD COLUMN video_data JSONB NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN karaoke_signups.video_data IS 'JSON data containing YouTube video metadata (title, channel, quality score, etc.)';`);
  }
}

runSQL();