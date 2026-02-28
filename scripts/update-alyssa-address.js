/**
 * Update Aly's Surprise Party with venue address
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADDRESS = '275 Cloister Dr, Memphis, TN';
const CONTACT_ID = '533941ec-fbb5-4720-a230-8e19f132bd6e';
const PROJECT_ID = '6817e059-3d4c-4f8c-8ba2-b106606055db';

async function main() {
  const { error: contactErr } = await supabase
    .from('contacts')
    .update({
      venue_address: ADDRESS,
      venue_name: '275 Cloister Dr',
      updated_at: new Date().toISOString()
    })
    .eq('id', CONTACT_ID);

  if (contactErr) throw contactErr;
  console.log('✅ Contact updated with address');

  const { error: projectErr } = await supabase
    .from('events')
    .update({
      venue_address: ADDRESS,
      venue_name: '275 Cloister Dr',
      updated_at: new Date().toISOString()
    })
    .eq('id', PROJECT_ID);

  if (projectErr) throw projectErr;
  console.log('✅ Project updated with address');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
