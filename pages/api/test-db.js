import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test database connection by trying to select from contact_submissions
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: error.message 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Database connection successful!',
      hasData: data.length > 0,
      environmentOk: true
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message 
    });
  }
} 