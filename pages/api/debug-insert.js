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

    console.log('Debug - Environment check:');
    console.log('URL exists:', !!supabaseUrl);
    console.log('Key exists:', !!supabaseKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Try to select from contact_submissions
    console.log('Debug - Testing SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('contact_submissions')
      .select('id')
      .limit(1);

    if (selectError) {
      console.log('Select error:', selectError);
      return res.status(500).json({ 
        step: 'SELECT_TEST',
        error: selectError,
        selectData
      });
    }

    console.log('Select successful, count:', selectData?.length || 0);

    // Test 2: Try to insert a simple record
    console.log('Debug - Testing INSERT...');
    const testData = {
      name: 'Debug Test',
      email: 'debug@test.com',
      event_type: 'Wedding',
      message: 'Debug test message'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('contact_submissions')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('Insert error:', insertError);
      return res.status(500).json({ 
        step: 'INSERT_TEST',
        error: insertError,
        testData,
        policies: 'cs_public_insert_v2 should allow this'
      });
    }

    console.log('Insert successful:', insertData);

    res.status(200).json({
      success: true,
      message: 'Direct insert test passed!',
      insertedId: insertData[0]?.id,
      selectCount: selectData?.length || 0
    });

  } catch (error) {
    console.error('Debug test error:', error);
    res.status(500).json({
      step: 'CATCH_BLOCK',
      error: error.message,
      stack: error.stack
    });
  }
} 