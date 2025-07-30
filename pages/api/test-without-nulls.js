import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test without null values - only include fields that have data
    const testData = {
      name: 'No Nulls Test',
      email: 'nonulls@test.com',
      phone: '555-123-4567',
      event_type: 'Wedding',
      message: 'Testing without null values'
      // Excluding event_date and location entirely instead of setting to null
    };

    console.log('Testing without null values:', testData);

    const { data: insertData, error: insertError } = await supabase
      .from('contact_submissions')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('Insert error without nulls:', insertError);
      return res.status(500).json({ 
        step: 'NO_NULLS_TEST',
        error: insertError,
        testData
      });
    }

    console.log('No nulls test successful:', insertData);

    res.status(200).json({
      success: true,
      message: 'No nulls test passed!',
      insertedId: insertData[0]?.id,
      data: insertData[0]
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      step: 'CATCH_BLOCK',
      error: error.message
    });
  }
} 