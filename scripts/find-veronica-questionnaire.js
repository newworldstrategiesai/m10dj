/**
 * Script to find Veronica Gomez's contact and questionnaire data
 * Run with: node scripts/find-veronica-questionnaire.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findVeronicaQuestionnaire() {
  console.log('🔍 Searching for Veronica Gomez...\n');

  try {
    // Search for Veronica Gomez by name
    const { data: contactsByName, error: nameError } = await supabase
      .from('contacts')
      .select('*')
      .or('first_name.ilike.%veronica%,last_name.ilike.%gomez%')
      .is('deleted_at', null);

    if (nameError) {
      console.error('Error searching by name:', nameError);
    }

    // Search by email
    const { data: contactsByEmail, error: emailError } = await supabase
      .from('contacts')
      .select('*')
      .ilike('email_address', '%gogo.gallagher901%')
      .is('deleted_at', null);

    if (emailError) {
      console.error('Error searching by email:', emailError);
    }

    // Search by phone
    const { data: contactsByPhone, error: phoneError } = await supabase
      .from('contacts')
      .select('*')
      .or('phone.ilike.%9014961528%,phone.ilike.%901-496-1528%')
      .is('deleted_at', null);

    if (phoneError) {
      console.error('Error searching by phone:', phoneError);
    }

    // Combine all results and remove duplicates
    const allContacts = [
      ...(contactsByName || []),
      ...(contactsByEmail || []),
      ...(contactsByPhone || [])
    ];

    const uniqueContacts = Array.from(
      new Map(allContacts.map(contact => [contact.id, contact])).values()
    );

    console.log(`Found ${uniqueContacts.length} contact(s):\n`);

    for (const contact of uniqueContacts) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📇 Contact ID: ${contact.id}`);
      console.log(`   Name: ${contact.first_name || ''} ${contact.last_name || ''}`.trim());
      console.log(`   Email: ${contact.email_address || 'N/A'}`);
      console.log(`   Phone: ${contact.phone || 'N/A'}`);
      console.log(`   Event Type: ${contact.event_type || 'N/A'}`);
      console.log(`   Event Date: ${contact.event_date || 'N/A'}`);
      console.log(`   Created: ${contact.created_at || 'N/A'}`);

      // Now check for questionnaire
      const { data: questionnaire, error: qError } = await supabase
        .from('music_questionnaires')
        .select('*')
        .eq('lead_id', contact.id)
        .single();

      if (qError && qError.code !== 'PGRST116') {
        console.error(`   ❌ Error fetching questionnaire:`, qError.message);
      } else if (questionnaire) {
        console.log(`\n   ✅ QUESTIONNAIRE FOUND!`);
        console.log(`   ──────────────────────────────────────────────`);
        console.log(`   Started: ${questionnaire.started_at || 'N/A'}`);
        console.log(`   Last Updated: ${questionnaire.updated_at || 'N/A'}`);
        console.log(`   Reviewed: ${questionnaire.reviewed_at || 'Never'}`);
        console.log(`   Completed: ${questionnaire.completed_at || 'Not completed'}`);
        
        if (questionnaire.completed_at) {
          console.log(`\n   🎉 STATUS: COMPLETED!`);
        } else if (questionnaire.started_at) {
          console.log(`\n   ⏳ STATUS: IN PROGRESS`);
        } else {
          console.log(`\n   📝 STATUS: NOT STARTED`);
        }

        console.log(`\n   📋 Questionnaire Data:`);
        console.log(`   ──────────────────────────────────────────────`);
        
        if (questionnaire.big_no_songs) {
          console.log(`   ❌ Do Not Play Songs:`);
          console.log(`      ${questionnaire.big_no_songs}`);
        }
        
        if (questionnaire.special_dances && questionnaire.special_dances.length > 0) {
          console.log(`   💃 Special Dances: ${questionnaire.special_dances.join(', ')}`);
        }
        
        if (questionnaire.special_dance_songs && Object.keys(questionnaire.special_dance_songs).length > 0) {
          console.log(`   🎵 Special Dance Songs:`);
          Object.entries(questionnaire.special_dance_songs).forEach(([dance, song]) => {
            console.log(`      ${dance}: ${song}`);
          });
        }
        
        if (questionnaire.playlist_links && Object.keys(questionnaire.playlist_links).length > 0) {
          console.log(`   🎧 Playlist Links:`);
          Object.entries(questionnaire.playlist_links).forEach(([type, link]) => {
            if (link) {
              console.log(`      ${type}: ${link}`);
            }
          });
        }
        
        if (questionnaire.ceremony_music_type) {
          console.log(`   🎼 Ceremony Music Type: ${questionnaire.ceremony_music_type}`);
        }
        
        if (questionnaire.ceremony_music && Object.keys(questionnaire.ceremony_music).length > 0) {
          console.log(`   🎹 Ceremony Music:`);
          Object.entries(questionnaire.ceremony_music).forEach(([key, value]) => {
            if (value) {
              console.log(`      ${key}: ${value}`);
            }
          });
        }
        
        if (questionnaire.mc_introduction !== null && questionnaire.mc_introduction !== undefined) {
          if (questionnaire.mc_introduction === '') {
            console.log(`   🎤 MC Introduction: Declined`);
          } else {
            console.log(`   🎤 MC Introduction: ${questionnaire.mc_introduction}`);
          }
        }

        console.log(`\n   🔗 Questionnaire URL:`);
        console.log(`      ${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/quote/${contact.id}/questionnaire`);
      } else {
        console.log(`\n   ❌ No questionnaire found for this contact`);
      }
      
      console.log('');
    }

    if (uniqueContacts.length === 0) {
      console.log('❌ No contacts found matching Veronica Gomez');
      console.log('\nTrying alternative searches...\n');
      
      // Try broader search
      const { data: allRecentContacts, error: allError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, phone, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!allError && allRecentContacts) {
        console.log('Recent contacts (last 50):');
        allRecentContacts.forEach(contact => {
          const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
          if (name.toLowerCase().includes('veronica') || name.toLowerCase().includes('gomez')) {
            console.log(`  - ${name} (${contact.email_address || contact.phone || 'no contact info'}) - ID: ${contact.id}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findVeronicaQuestionnaire();

