import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  // Set the session with the token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token or user not found' });
  }

  if (req.method === 'GET') {
    // Get admin settings for the user
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching admin settings:', error);
        return res.status(500).json({ error: 'Failed to fetch admin settings' });
      }

      // Convert array of settings to object
      const settings = {};
      data.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });

      return res.status(200).json({ settings });
    } catch (error) {
      console.error('Error in GET admin settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Update or insert admin setting
    const { settingKey, settingValue } = req.body;

    if (!settingKey) {
      return res.status(400).json({ error: 'Setting key is required' });
    }

    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert(
          {
            user_id: user.id,
            setting_key: settingKey,
            setting_value: settingValue
          },
          {
            onConflict: 'user_id,setting_key'
          }
        )
        .select();

      if (error) {
        console.error('Error updating admin setting:', error);
        return res.status(500).json({ error: 'Failed to update admin setting' });
      }

      return res.status(200).json({ 
        message: 'Admin setting updated successfully',
        setting: data[0]
      });
    } catch (error) {
      console.error('Error in POST admin settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}