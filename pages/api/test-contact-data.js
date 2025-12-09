import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test with the exact same data structure as the contact API
    const testData = {
      name: 'Contact API Test',
      email: 'contactapi@test.com',
      phone: '555-123-4567',
      event_type: 'Wedding', // Note: exact field name from database
      event_date: null, // Often null in contact forms
      location: null,   // Often null in contact forms
      message: 'Testing contact API data structure'
    };

    console.log('Testing contact API data structure:', testData);

    const { data: insertData, error: insertError } = await supabase
      .from('contact_submissions')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('Insert error with contact API structure:', insertError);
      return res.status(500).json({ 
        step: 'CONTACT_API_STRUCTURE_TEST',
        error: insertError,
        testData
      });
    }

    console.log('Contact API structure test successful:', insertData);

    res.status(200).json({
      success: true,
      message: 'Contact API data structure test passed!',
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