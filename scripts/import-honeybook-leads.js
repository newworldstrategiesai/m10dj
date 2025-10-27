/**
 * Import HoneyBook Leads to Supabase Contacts
 * 
 * Matches exact Google Sheets format from HoneyBook export
 * 
 * Usage:
 * 1. Export Google Sheet as CSV (File > Download > CSV)
 * 2. Save as data/honeybook-leads.csv
 * 3. Run: node scripts/import-honeybook-leads.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple CSV parser (handles commas in quotes)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Simple CSV parsing (works for most cases)
    const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cleanValues[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

// Parse name into first/last
function parseName(fullName) {
  if (!fullName || fullName === 'TBD') return { first_name: null, last_name: null };
  
  const parts = fullName.trim().split(' ');
  return {
    first_name: parts[0] || null,
    last_name: parts.slice(1).join(' ') || null
  };
}

// Parse date from HoneyBook format
function parseDate(dateString) {
  if (!dateString || dateString === 'TBD') return null;
  try {
    // Format: "Jan 14, 2025" or "Dec 22, 2025"
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// Parse phone number
function parsePhone(phoneString) {
  if (!phoneString || phoneString === 'TBD' || phoneString.includes('ERROR')) return null;
  // Remove any formatting, keep just digits
  const digits = phoneString.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.substr(0,3)}) ${digits.substr(3,3)}-${digits.substr(6)}`;
  return phoneString;
}

// Parse dollar amount
function parseAmount(amountString) {
  if (!amountString || amountString === 'TBD') return null;
  const cleaned = amountString.replace(/[^0-9.-]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) || amount === 0 ? null : amount;
}

// Determine event type from project name
function determineEventType(projectName) {
  const name = (projectName || '').toLowerCase();
  if (name.includes('wedding')) return 'wedding';
  if (name.includes('corporate') || name.includes('company')) return 'corporate';
  if (name.includes('christmas') || name.includes('holiday')) return 'holiday_party';
  if (name.includes('prom') || name.includes('school') || name.includes('reunion')) return 'school_dance';
  if (name.includes('birthday') || name.includes('party') || name.includes('anniversary')) return 'private_party';
  return 'other';
}

// Map lead source
function mapLeadSource(source) {
  const sourceMap = {
    'Friend Referral': 'Referral',
    'Client Referral': 'Referral',
    'Personal Website': 'Website',
    'Instagram': 'Social Media',
    'Facebook': 'Social Media',
    'Google': 'Google',
    'Unknown': 'Other'
  };
  return sourceMap[source] || source || 'Other';
}

// Import a single lead
async function importLead(leadData, index) {
  try {
    const { first_name, last_name } = parseName(leadData['Full Name']);
    
    // Skip if no name or email
    if (!first_name && !leadData['Email Address']) {
      console.log(`⏭️  Skipping row ${index + 2}: No name or email`);
      return { skipped: true };
    }
    
    const email = leadData['Email Address']?.trim() || null;
    const phone = parsePhone(leadData['Phone Number']);
    
    // Check for duplicate by email or phone
    let existingContact = null;
    if (email || phone) {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, phone')
        .or(email ? `email_address.eq.${email}` : `phone.eq.${phone}`)
        .is('deleted_at', null)
        .limit(1)
        .single();
      
      if (!error && data) {
        existingContact = data;
      }
    }
    
    const projectValue = parseAmount(leadData['Total Project Value']);
    const bookedDate = parseDate(leadData['Booked Date']);
    const hasBooked = bookedDate !== null;
    
    // Determine lead status
    let leadStatus = 'New';
    if (hasBooked) {
      leadStatus = 'Booked';
    } else if (leadData['Lead Created Date']) {
      const createdDate = new Date(leadData['Lead Created Date']);
      const daysSince = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 60) {
        leadStatus = 'Lost';
      } else if (daysSince > 14) {
        leadStatus = 'Contacted';
      }
    }
    
    const contactData = {
      first_name,
      last_name,
      email_address: email,
      phone,
      event_type: determineEventType(leadData['Project Name']),
      event_date: parseDate(leadData['Project Date']),
      lead_status: leadStatus,
      lead_source: mapLeadSource(leadData['Lead Source']),
      quoted_price: projectValue,
      final_price: hasBooked ? projectValue : null,
      notes: `HoneyBook Import:\nProject: ${leadData['Project Name']}\nLead Created: ${leadData['Lead Created Date']}${bookedDate ? `\nBooked: ${bookedDate}` : ''}${leadData['Lead Source Open Text'] ? `\nSource Details: ${leadData['Lead Source Open Text']}` : ''}`,
      custom_fields: {
        honeybook_import: true,
        honeybook_project_name: leadData['Project Name'],
        honeybook_lead_created: leadData['Lead Created Date'],
        honeybook_booked_date: bookedDate,
        honeybook_project_value: projectValue
      },
      created_at: parseDate(leadData['Lead Created Date']) || new Date().toISOString()
    };
    
    if (existingContact) {
      // Update existing contact
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...contactData,
          notes: `${existingContact.notes || ''}\n\n${contactData.notes}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error updating contact ${existingContact.id}:`, error.message);
        return { error: true };
      }
      
      console.log(`✅ Updated: ${first_name} ${last_name} (${email || phone})`);
      return { updated: true, contact: data };
    } else {
      // Insert new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error inserting contact:`, error.message);
        return { error: true };
      }
      
      console.log(`✅ Created: ${first_name} ${last_name} (${email || phone})`);
      return { created: true, contact: data };
    }
  } catch (error) {
    console.error(`❌ Error processing lead ${index + 2}:`, error.message);
    return { error: true };
  }
}

// Main import function
async function main() {
  console.log('🚀 Starting HoneyBook Leads Import\n');
  
  // Check if file exists - try all-leads first, fallback to honeybook-leads
  let csvPath = path.join(__dirname, '..', 'data', 'all-leads-from-honeybook.csv');
  if (!fs.existsSync(csvPath)) {
    csvPath = path.join(__dirname, '..', 'data', 'honeybook-leads.csv');
  }
  if (!fs.existsSync(csvPath)) {
    console.error('❌ File not found: data/all-leads-from-honeybook.csv or data/honeybook-leads.csv');
    console.error('\nPlease:');
    console.error('1. Open your Google Sheet');
    console.error('2. File > Download > Comma Separated Values (.csv)');
    console.error('3. Save as data/honeybook-leads.csv');
    console.error('4. Run this script again');
    process.exit(1);
  }
  
  console.log('📂 Reading CSV file...');
  const leads = parseCSV(csvPath);
  console.log(`📊 Found ${leads.length} leads to import\n`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  // Import leads one by one
  for (let i = 0; i < leads.length; i++) {
    const result = await importLead(leads[i], i);
    if (result.created) stats.created++;
    if (result.updated) stats.updated++;
    if (result.skipped) stats.skipped++;
    if (result.error) stats.errors++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Import Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${stats.created}`);
  console.log(`🔄 Updated: ${stats.updated}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`📊 Total Processed: ${leads.length}`);
  console.log('='.repeat(50) + '\n');
  
  console.log('🎉 All done! Check your admin contacts page.');
}

// Run import
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

