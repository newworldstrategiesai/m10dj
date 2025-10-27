/**
 * Import Leads/Projects from CSV to Supabase
 * 
 * Usage:
 * node scripts/import-leads-from-csv.js path/to/your-leads.csv
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

// Parse CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
}

// Parse full name into first and last name
function parseName(fullName) {
  if (!fullName) return { first_name: '', last_name: '' };
  
  const parts = fullName.trim().split(' ');
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || ''
  };
}

// Parse phone number
function parsePhone(phone) {
  if (!phone) return null;
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

// Parse date
function parseDate(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

// Determine event type from project name
function determineEventType(projectName) {
  const name = (projectName || '').toLowerCase();
  if (name.includes('wedding')) return 'wedding';
  if (name.includes('corporate')) return 'corporate';
  if (name.includes('birthday') || name.includes('party')) return 'private_party';
  if (name.includes('school')) return 'school_dance';
  if (name.includes('holiday')) return 'holiday_party';
  return 'other';
}

// Determine lead status
function determineLeadStatus(bookedDate, projectDate) {
  if (bookedDate) return 'Booked';
  if (projectDate && new Date(projectDate) < new Date()) return 'Lost';
  return 'Qualified';
}

// Convert CSV row to contact object
function csvRowToContact(row) {
  const { first_name, last_name } = parseName(row['Full Name']);
  const projectDate = parseDate(row['Project Date']);
  const bookedDate = parseDate(row['Booked Date']);
  const leadCreatedDate = parseDate(row['Lead Created Date']);
  
  return {
    // Personal Information
    first_name,
    last_name,
    phone: parsePhone(row['Phone Number']),
    email_address: row['Email Address'] || null,
    
    // Event Information
    event_type: determineEventType(row['Project Name']),
    event_date: projectDate,
    
    // Budget and Pricing
    quoted_price: row['Total Project Value'] ? parseFloat(row['Total Project Value']) : null,
    final_price: bookedDate && row['Total Project Value'] ? parseFloat(row['Total Project Value']) : null,
    payment_status: bookedDate ? 'pending' : 'pending',
    
    // Lead Management
    lead_status: determineLeadStatus(bookedDate, projectDate),
    lead_source: row['Lead Source'] || 'Unknown',
    how_heard_about_us: row['Lead Source Open Text'] || null,
    
    // Communication
    last_contacted_date: leadCreatedDate,
    
    // Business Tracking
    priority_level: bookedDate ? 'High' : 'Medium',
    expected_close_date: projectDate,
    
    // Contract
    contract_signed_date: bookedDate,
    
    // Notes
    notes: [
      row['Project Name'] ? `Project: ${row['Project Name']}` : null,
      row['Lead Source Open Text'] ? `Source Details: ${row['Lead Source Open Text']}` : null
    ].filter(Boolean).join('\n') || null,
    
    // System Fields
    created_at: leadCreatedDate || new Date().toISOString(),
  };
}

// Main import function
async function importLeads(csvFilePath) {
  console.log('📂 Reading CSV file...');
  const rows = parseCSV(csvFilePath);
  console.log(`✅ Found ${rows.length} leads to import\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  const errors = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because CSV row 1 is headers, and we're 0-indexed
    
    try {
      // Skip if no name or contact info
      if (!row['Full Name'] && !row['Email Address'] && !row['Phone Number']) {
        console.log(`⏭️  Row ${rowNum}: Skipping empty row`);
        skipCount++;
        continue;
      }
      
      const contact = csvRowToContact(row);
      
      // Check if contact already exists (by email or phone)
      let existingContact = null;
      if (contact.email_address) {
        const { data } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .eq('email_address', contact.email_address)
          .is('deleted_at', null)
          .maybeSingle();
        existingContact = data;
      }
      
      if (!existingContact && contact.phone) {
        const { data } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .eq('phone', contact.phone)
          .is('deleted_at', null)
          .maybeSingle();
        existingContact = data;
      }
      
      if (existingContact) {
        console.log(`⚠️  Row ${rowNum}: ${contact.first_name} ${contact.last_name} already exists (${existingContact.id})`);
        skipCount++;
        continue;
      }
      
      // Insert the contact
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Row ${rowNum}: Error importing ${contact.first_name} ${contact.last_name}`);
        console.error(`   Error: ${error.message}`);
        errors.push({ row: rowNum, contact, error: error.message });
        errorCount++;
      } else {
        console.log(`✅ Row ${rowNum}: Imported ${contact.first_name} ${contact.last_name} (${data.id})`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ Row ${rowNum}: Unexpected error`);
      console.error(`   Error: ${error.message}`);
      errors.push({ row: rowNum, error: error.message });
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`⏭️  Skipped (duplicates/empty): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total rows processed: ${rows.length}`);
  console.log('='.repeat(60));
  
  if (errors.length > 0) {
    console.log('\n⚠️  ERRORS DETAILS:');
    errors.forEach((err, idx) => {
      console.log(`${idx + 1}. Row ${err.row}: ${err.error}`);
    });
  }
  
  if (successCount > 0) {
    console.log('\n🎉 Import completed! You can now view your leads in the admin dashboard.');
  }
}

// CLI execution
if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.error('❌ Usage: node scripts/import-leads-from-csv.js <path-to-csv>');
    console.error('Example: node scripts/import-leads-from-csv.js data/leads.csv');
    process.exit(1);
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log('🚀 Starting lead import...\n');
  importLeads(csvPath)
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importLeads, csvRowToContact };

