/**
 * Test script to verify questionnaire submission logging is working
 * Run with: node scripts/test-questionnaire-submission.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubmissionLogging() {
  console.log('🧪 Testing Questionnaire Submission Logging...\n');

  // 1. Check if table exists
  console.log('1. Checking if questionnaire_submission_log table exists...');
  try {
    const { data, error } = await supabase
      .from('questionnaire_submission_log')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.error('❌ Table does not exist! Migration may not have run successfully.');
      return;
    } else if (error) {
      console.error('❌ Error checking table:', error.message);
      return;
    }

    console.log('✅ Table exists!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    return;
  }

  // 2. Check table structure
  console.log('2. Checking table structure...');
  try {
    const { data, error } = await supabase
      .from('questionnaire_submission_log')
      .select('*')
      .limit(0); // Just check structure, no data

    if (error) {
      console.error('❌ Error checking structure:', error.message);
    } else {
      console.log('✅ Table structure is valid\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // 3. Count existing logs
  console.log('3. Counting existing submission logs...');
  try {
    const { count, error } = await supabase
      .from('questionnaire_submission_log')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error counting logs:', error.message);
    } else {
      console.log(`✅ Found ${count || 0} submission logs in database\n`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // 4. Check for failed submissions
  console.log('4. Checking for failed submissions...');
  try {
    const { data, error } = await supabase
      .from('questionnaire_submission_log')
      .select('id, lead_id, submission_status, error_message, created_at')
      .eq('submission_status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error checking failed submissions:', error.message);
    } else if (data && data.length > 0) {
      console.log(`⚠️  Found ${data.length} failed submission(s):`);
      data.forEach((log, i) => {
        console.log(`   ${i + 1}. Lead ID: ${log.lead_id}`);
        console.log(`      Error: ${log.error_message || 'Unknown'}`);
        console.log(`      Time: ${new Date(log.created_at).toLocaleString()}\n`);
      });
    } else {
      console.log('✅ No failed submissions found\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // 5. Check for unverified submissions
  console.log('5. Checking for unverified submissions...');
  try {
    const { data, error } = await supabase
      .from('questionnaire_submission_log')
      .select('id, lead_id, submission_status, verification_status, created_at')
      .eq('submission_status', 'success')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error checking unverified submissions:', error.message);
    } else if (data && data.length > 0) {
      console.log(`⚠️  Found ${data.length} unverified submission(s):`);
      data.forEach((log, i) => {
        console.log(`   ${i + 1}. Lead ID: ${log.lead_id}`);
        console.log(`      Time: ${new Date(log.created_at).toLocaleString()}\n`);
      });
    } else {
      console.log('✅ No unverified submissions found\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('✅ Test complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Submit a test questionnaire to verify logging works');
  console.log('   2. Check the audit log after submission');
  console.log('   3. Test failure scenarios (network offline, etc.)');
  console.log('   4. Verify admin alerts are sent on failure');
}

testSubmissionLogging().catch(console.error);

