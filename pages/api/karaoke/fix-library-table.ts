import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use service role client for schema changes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Create admin client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_video_library')
      .single();

    if (checkError && !checkError.message.includes('No rows')) {
      throw checkError;
    }

    if (!tableExists) {
      console.log('Creating user_video_library table...');

      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE user_video_library (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          artist TEXT NULL,
          youtube_video_id TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL,
          duration TEXT NOT NULL,
          channel_title TEXT NOT NULL,
          quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
          is_favorite BOOLEAN DEFAULT false,
          tags TEXT[] DEFAULT '{}',
          play_count INTEGER DEFAULT 0,
          last_played_at TIMESTAMP WITH TIME ZONE NULL,
          added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE(organization_id, user_id, youtube_video_id)
        );

        ALTER TABLE user_video_library ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own video library" ON user_video_library
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
          ) AND user_id = auth.uid()
        );

        CREATE POLICY "Users can insert videos to their library" ON user_video_library
        FOR INSERT WITH CHECK (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
          ) AND user_id = auth.uid()
        );

        CREATE POLICY "Users can update their own videos" ON user_video_library
        FOR UPDATE USING (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
          ) AND user_id = auth.uid()
        );

        CREATE POLICY "Users can delete their own videos" ON user_video_library
        FOR DELETE USING (
          organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
          ) AND user_id = auth.uid()
        );
      `;

      // Execute the SQL
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (createError) {
        // Try alternative approach
        console.log('Trying alternative SQL execution...');

        // Split and execute individual statements
        const statements = createTableSQL.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await supabase.from('_temp').select('*').limit(0); // dummy query to establish connection
              // This won't work, but let's try the REST API approach
            } catch (e) {
              // Ignore connection errors
            }
          }
        }

        throw new Error('Could not create table via RPC, manual intervention required');
      }

      console.log('Table created successfully');
    } else {
      console.log('Table already exists');
    }

    return res.status(200).json({
      success: true,
      message: 'Video library table check/completion completed'
    });

  } catch (error) {
    console.error('Fix library table error:', error);
    return res.status(500).json({
      error: 'Failed to fix library table',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}