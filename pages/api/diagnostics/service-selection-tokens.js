/**
 * Service Selection Token Diagnostics
 * 
 * This endpoint helps diagnose issues with service selection tokens
 * 
 * Usage: GET /api/diagnostics/service-selection-tokens?token=YOUR_TOKEN
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV === 'production' && !req.headers.authorization?.includes('Bearer admin')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'token query parameter required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    console.log(`\n📊 DIAGNOSTICS FOR TOKEN: ${token.substring(0, 10)}...`);
    console.log('='.repeat(70));

    // Check in service_selection_tokens table
    console.log('\n1️⃣  Checking service_selection_tokens table...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('service_selection_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError) {
      console.log(`   ❌ Error: ${tokenError.message}`);
    } else if (tokenData) {
      console.log(`   ✅ Token found!`);
      console.log(`      ID: ${tokenData.id}`);
      console.log(`      Contact ID: ${tokenData.contact_id}`);
      console.log(`      Created: ${tokenData.created_at}`);
      console.log(`      Expires: ${tokenData.expires_at}`);
      console.log(`      Expired now? ${new Date(tokenData.expires_at) < now ? '❌ YES' : '✅ NO'}`);
      console.log(`      Is Used: ${tokenData.is_used ? '⚠️  YES (Already Submitted)' : '✅ NO (Fresh)'}`);
      console.log(`      Used At: ${tokenData.used_at || 'N/A'}`);
      
      if (tokenData.is_used) {
        console.log(`      ℹ️  This contact has already submitted with this token`);
        console.log(`          Admin should issue a FRESH token for re-submission`);
      }
    } else {
      console.log(`   ⚠️  Token not found in service_selection_tokens`);
    }

    // Check in contacts table
    console.log('\n2️⃣  Checking contacts table for this token...');
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, email_address, first_name, last_name, service_selection_token, service_selection_sent, service_selection_sent_at')
      .eq('service_selection_token', token)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      console.log(`   ❌ Error: ${contactError.message}`);
    } else if (contactData) {
      console.log(`   ✅ Token found in contacts table!`);
      console.log(`      Contact ID: ${contactData.id}`);
      console.log(`      Email: ${contactData.email_address}`);
      console.log(`      Name: ${contactData.first_name} ${contactData.last_name}`);
      console.log(`      Service Selection Sent: ${contactData.service_selection_sent}`);
      console.log(`      Sent At: ${contactData.service_selection_sent_at || 'N/A'}`);
    } else {
      console.log(`   ⚠️  Token not found in contacts table`);
    }

    // Check for any related service selections
    if (tokenData) {
      console.log('\n3️⃣  Checking service_selections table...');
      const { data: selections, error: selectionsError } = await supabase
        .from('service_selections')
        .select('*')
        .eq('token_id', tokenData.id);

      if (selectionsError) {
        console.log(`   ❌ Error: ${selectionsError.message}`);
      } else if (selections && selections.length > 0) {
        console.log(`   ✅ Found ${selections.length} selection(s)`);
        selections.forEach((sel, i) => {
          console.log(`      Selection ${i + 1}:`);
          console.log(`         ID: ${sel.id}`);
          console.log(`         Status: ${sel.status}`);
          console.log(`         Package: ${sel.package_selected}`);
          console.log(`         Submitted: ${sel.submitted_at}`);
        });
      } else {
        console.log(`   ℹ️  No selections yet`);
      }
    }

    console.log('\n' + '='.repeat(70));

    // Return diagnostic data
    res.status(200).json({
      token: token.substring(0, 10) + '...',
      now: now.toISOString(),
      diagnostic: {
        tokenRecord: tokenData || null,
        tokenError: tokenError?.message || null,
        contactRecord: contactData || null,
        contactError: contactError?.message || null
      }
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message
    });
  }
}

