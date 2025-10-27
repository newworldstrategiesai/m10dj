/**
 * Import HoneyBook Projects/Payments Data to Supabase
 * 
 * This imports actual booked projects with payment information from HoneyBook
 * 
 * Usage:
 * node scripts/import-honeybook-data.js data/honeybook-export.csv
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
  const headers = lines[0].split('\t').map(h => h.trim()); // HoneyBook uses tabs
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split('\t');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    
    // Skip summary/total rows
    if (row.PROJECT_NAME === '0' || !row.PROJECT_NAME) continue;
    
    data.push(row);
  }
  
  return data;
}

// Parse client info to extract name and email
function parseClientInfo(clientInfo) {
  // Format: "Name (email@example.com)"
  const match = clientInfo.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    const fullName = match[1].trim();
    const email = match[2].trim();
    const nameParts = fullName.split(' ');
    return {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email_address: email
    };
  }
  
  // Fallback if format is different
  const nameParts = clientInfo.split(' ');
  return {
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    email_address: null
  };
}

// Parse date from HoneyBook format
function parseDate(dateString) {
  if (!dateString) return null;
  try {
    // HoneyBook format: "Dec 31, 2024" or "May 02, 2026"
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

// Parse dollar amount
function parseAmount(amountString) {
  if (!amountString) return null;
  const cleaned = amountString.replace(/[^0-9.-]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

// Determine event type from project name
function determineEventType(projectName) {
  const name = (projectName || '').toLowerCase();
  if (name.includes('wedding')) return 'wedding';
  if (name.includes('corporate') || name.includes('company')) return 'corporate';
  if (name.includes('christmas') || name.includes('holiday')) return 'holiday_party';
  if (name.includes('birthday') || name.includes('party')) return 'private_party';
  if (name.includes('school')) return 'school_dance';
  if (name.includes('kick off') || name.includes('kickoff') || name.includes('lake')) return 'private_party';
  return 'other';
}

// Convert HoneyBook row to contact object
function honeyBookRowToContact(row) {
  const clientInfo = parseClientInfo(row.CLIENT_INFO);
  const projectDate = parseDate(row.PROJECT_DATE);
  const transactionDate = parseDate(row.TRANSACTION_DATE);
  const dueDate = parseDate(row.DUE_DATE);
  
  const totalAmount = parseAmount(row.TOTAL_AMOUNT);
  const netAmount = parseAmount(row.NET_AMOUNT);
  const paymentBeforeDiscount = parseAmount(row.PAYMENT_BEFORE_DISCOUNT);
  
  // Determine if this is a deposit or full payment
  const isDeposit = row.PAYMENT_NAME && row.PAYMENT_NAME.toLowerCase().includes('retainer');
  const depositAmount = isDeposit ? netAmount : null;
  
  return {
    // Personal Information
    first_name: clientInfo.first_name,
    last_name: clientInfo.last_name,
    email_address: clientInfo.email_address,
    
    // Event Information
    event_type: determineEventType(row.PROJECT_NAME),
    event_date: projectDate,
    
    // Budget and Pricing
    quoted_price: paymentBeforeDiscount || totalAmount,
    final_price: totalAmount,
    deposit_amount: depositAmount,
    deposit_paid: row.PAYMENT_STATUS === 'Paid' && isDeposit,
    payment_status: row.PAYMENT_STATUS === 'Paid' ? 'paid' : 'pending',
    
    // Lead Management
    lead_status: 'Booked', // All HoneyBook projects are booked
    lead_source: 'HoneyBook Import',
    
    // Communication
    last_contacted_date: transactionDate,
    
    // Business Tracking
    priority_level: 'High',
    expected_close_date: projectDate,
    
    // Contract
    contract_signed_date: transactionDate,
    proposal_sent_date: dueDate,
    proposal_value: paymentBeforeDiscount || totalAmount,
    
    // Notes
    notes: [
      `Project: ${row.PROJECT_NAME}`,
      `Invoice: ${row.INVOICE}`,
      `Payment Method: ${row.PAYMENT_METHOD}`,
      row.CHARGE_NOTES ? `Notes: ${row.CHARGE_NOTES}` : null,
      row.GRATUITY && row.GRATUITY !== '0' ? `Gratuity: $${row.GRATUITY}` : null,
    ].filter(Boolean).join('\n'),
    
    internal_notes: [
      `Transaction Fee: $${row.TRANSACTION_FEE || 0}`,
      `Net Amount: $${netAmount || 0}`,
      row.DISCOUNT_PAYMENT && row.DISCOUNT_PAYMENT !== '0' ? `Discount: $${row.DISCOUNT_PAYMENT}` : null,
    ].filter(Boolean).join('\n'),
    
    // Custom fields for HoneyBook-specific data
    custom_fields: {
      honeybook_invoice: row.INVOICE,
      honeybook_project_name: row.PROJECT_NAME,
      payment_method: row.PAYMENT_METHOD,
      transaction_fee: parseAmount(row.TRANSACTION_FEE),
      net_amount: netAmount,
      gratuity: parseAmount(row.GRATUITY),
      tax_amount: parseAmount(row.TAX_1),
    },
    
    // System Fields
    created_at: transactionDate || new Date().toISOString(),
  };
}

// Main import function
async function importHoneyBookData(csvFilePath) {
  console.log('📂 Reading HoneyBook CSV file...');
  const rows = parseCSV(csvFilePath);
  console.log(`✅ Found ${rows.length} HoneyBook projects to import\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  let updatedCount = 0;
  const errors = [];
  
  // Group by project (same client + project name may have multiple payments)
  const projectGroups = {};
  rows.forEach(row => {
    const key = `${row.CLIENT_INFO}|${row.PROJECT_NAME}`;
    if (!projectGroups[key]) {
      projectGroups[key] = [];
    }
    projectGroups[key].push(row);
  });
  
  console.log(`📊 Found ${Object.keys(projectGroups).length} unique projects (some with multiple payments)\n`);
  
  let projectNum = 0;
  for (const [key, projectRows] of Object.entries(projectGroups)) {
    projectNum++;
    const firstRow = projectRows[0];
    
    try {
      // Skip if no client info
      if (!firstRow.CLIENT_INFO) {
        console.log(`⏭️  Project ${projectNum}: Skipping - no client info`);
        skipCount++;
        continue;
      }
      
      const contact = honeyBookRowToContact(firstRow);
      
      // Calculate total paid from all payments
      const totalPaid = projectRows.reduce((sum, row) => {
        return sum + (parseAmount(row.NET_AMOUNT) || 0);
      }, 0);
      
      const totalPayments = projectRows.length;
      const allPaymentsPaid = projectRows.every(row => row.PAYMENT_STATUS === 'Paid');
      
      // Update contact with total payment info
      contact.internal_notes += `\n\nTotal Payments: ${totalPayments}\nTotal Paid: $${totalPaid.toFixed(2)}`;
      contact.payment_status = allPaymentsPaid ? 'paid' : 'partial';
      
      // Check if contact already exists (by email)
      let existingContact = null;
      if (contact.email_address) {
        const { data } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, notes, custom_fields')
          .eq('email_address', contact.email_address)
          .is('deleted_at', null)
          .maybeSingle();
        existingContact = data;
      }
      
      if (existingContact) {
        // Check if this specific project already exists in notes
        const existingNotes = existingContact.notes || '';
        const existingCustomFields = existingContact.custom_fields || {};
        
        if (existingNotes.includes(firstRow.INVOICE) || 
            existingCustomFields.honeybook_invoice === firstRow.INVOICE) {
          console.log(`⚠️  Project ${projectNum}: ${contact.first_name} ${contact.last_name} - "${firstRow.PROJECT_NAME}" already exists`);
          skipCount++;
          continue;
        }
        
        // Update existing contact with new project
        const updatedNotes = [existingNotes, contact.notes].filter(Boolean).join('\n\n---\n\n');
        const updatedCustomFields = {
          ...existingCustomFields,
          additional_projects: [
            ...(existingCustomFields.additional_projects || []),
            {
              invoice: firstRow.INVOICE,
              project_name: firstRow.PROJECT_NAME,
              project_date: firstRow.PROJECT_DATE,
              amount: totalPaid
            }
          ]
        };
        
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            notes: updatedNotes,
            custom_fields: updatedCustomFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContact.id);
        
        if (updateError) {
          console.error(`❌ Project ${projectNum}: Error updating ${contact.first_name} ${contact.last_name}`);
          console.error(`   Error: ${updateError.message}`);
          errors.push({ project: projectNum, contact, error: updateError.message });
          errorCount++;
        } else {
          console.log(`🔄 Project ${projectNum}: Updated ${contact.first_name} ${contact.last_name} - added "${firstRow.PROJECT_NAME}" ($${totalPaid.toFixed(2)})`);
          updatedCount++;
        }
        continue;
      }
      
      // Insert new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Project ${projectNum}: Error importing ${contact.first_name} ${contact.last_name} - "${firstRow.PROJECT_NAME}"`);
        console.error(`   Error: ${error.message}`);
        errors.push({ project: projectNum, contact, error: error.message });
        errorCount++;
      } else {
        console.log(`✅ Project ${projectNum}: Imported ${contact.first_name} ${contact.last_name} - "${firstRow.PROJECT_NAME}" ($${totalPaid.toFixed(2)}) [${data.id}]`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ Project ${projectNum}: Unexpected error`);
      console.error(`   Error: ${error.message}`);
      errors.push({ project: projectNum, error: error.message });
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 HONEYBOOK IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ New projects imported: ${successCount}`);
  console.log(`🔄 Existing contacts updated: ${updatedCount}`);
  console.log(`⏭️  Skipped (duplicates/empty): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total projects processed: ${Object.keys(projectGroups).length}`);
  console.log('='.repeat(60));
  
  if (errors.length > 0) {
    console.log('\n⚠️  ERROR DETAILS:');
    errors.forEach((err, idx) => {
      console.log(`${idx + 1}. Project ${err.project}: ${err.error}`);
    });
  }
  
  if (successCount > 0 || updatedCount > 0) {
    console.log('\n🎉 Import completed! You can now view your projects in the admin dashboard.');
    console.log(`💰 Total revenue tracked: Look for booked contacts with payment details`);
  }
}

// CLI execution
if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.error('❌ Usage: node scripts/import-honeybook-data.js <path-to-honeybook-csv>');
    console.error('Example: node scripts/import-honeybook-data.js data/honeybook-2025.csv');
    process.exit(1);
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log('🚀 Starting HoneyBook data import...\n');
  importHoneyBookData(csvPath)
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importHoneyBookData, honeyBookRowToContact };

