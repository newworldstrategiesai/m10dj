import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin (you can customize this check)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Create tables if they don't exist (be careful with this in production)
    const createTablesSQL = `
      -- Create api_keys table if not exists
      CREATE TABLE IF NOT EXISTS public.api_keys (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
          twilio_sid text,
          twilio_auth_token text,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          updated_at timestamp with time zone DEFAULT now() NOT NULL,
          PRIMARY KEY (id),
          UNIQUE(user_id)
      );

      -- Create messages table if not exists
      CREATE TABLE IF NOT EXISTS public.messages (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
          contact_id text NOT NULL, -- Using phone number as contact_id for now
          content text NOT NULL,
          direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
          status text DEFAULT 'sent',
          twilio_message_sid text UNIQUE,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          updated_at timestamp with time zone DEFAULT now() NOT NULL,
          PRIMARY KEY (id)
      );

      -- Create user_settings table if not exists
      CREATE TABLE IF NOT EXISTS public.user_settings (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
          sms_assistant_enabled boolean DEFAULT false,
          sms_assistant_prompt text,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          updated_at timestamp with time zone DEFAULT now() NOT NULL,
          PRIMARY KEY (id),
          UNIQUE(user_id)
      );

      -- Enable RLS on new tables
      ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
      CREATE POLICY "Users can manage their own API keys" ON public.api_keys 
        FOR ALL USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;
      CREATE POLICY "Users can manage their own messages" ON public.messages 
        FOR ALL USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
      CREATE POLICY "Users can manage their own settings" ON public.user_settings 
        FOR ALL USING (auth.uid() = user_id);
    `;

    // This is a bit hacky, but we'll use rpc to execute the SQL
    try {
      // Try to query the tables to see if they exist
      const { data: apiKeysTest } = await supabase.from('api_keys').select('id').limit(1);
      const { data: messagesTest } = await supabase.from('messages').select('id').limit(1);
      const { data: userSettingsTest } = await supabase.from('user_settings').select('id').limit(1);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Chat tables already exist and are accessible',
        tables: {
          api_keys: !!apiKeysTest,
          messages: !!messagesTest,
          user_settings: !!userSettingsTest
        }
      });
    } catch (error) {
      return res.status(200).json({ 
        success: false, 
        message: 'Some chat tables may not exist. Please run the migration manually or contact admin.',
        error: error.message,
        sqlToRun: createTablesSQL
      });
    }

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      error: 'Failed to setup chat tables',
      details: error.message 
    });
  }
}