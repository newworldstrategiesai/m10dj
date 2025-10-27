/**
 * Import HoneyBook Payments to Supabase
 * 
 * Imports detailed financial transaction data including:
 * - Payment amounts and dates
 * - Processing fees
 * - Tax information
 * - Payment methods
 * - Links to contacts
 * 
 * Usage:
 * node scripts/import-honeybook-payments.js
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

// Simple CSV parser
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Skip summary rows (empty project name or totals)
    if (!row.PROJECT_NAME || row.PROJECT_NAME === '0' || !row.CLIENT_INFO) {
      continue;
    }
    
    data.push(row);
  }
  
  return data;
}

// Parse email from "Name (email@example.com)" format
function parseEmail(clientInfo) {
  const match = clientInfo.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

// Parse date from HoneyBook format
function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// Parse dollar amount
function parseAmount(amountString) {
  if (!amountString || amountString.trim() === '') return null;
  const cleaned = amountString.replace(/[^0-9.-]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

// Parse percentage
function parsePercentage(percentString) {
  if (!percentString) return null;
  const cleaned = percentString.replace(/%/g, '');
  const percent = parseFloat(cleaned);
  return isNaN(percent) ? null : percent;
}

// Find contact by email
async function findContactByEmail(email) {
  if (!email) return null;
  
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address')
    .eq('email_address', email)
    .is('deleted_at', null)
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error finding contact by email ${email}:`, error.message);
  }
  
  return data;
}

// Import a single payment
async function importPayment(paymentData, index) {
  try {
    const clientEmail = parseEmail(paymentData.CLIENT_INFO);
    
    if (!clientEmail) {
      console.log(`⏭️  Row ${index + 2}: No client email found, skipping`);
      return { skipped: true };
    }
    
    // Find contact
    const contact = await findContactByEmail(clientEmail);
    
    if (!contact) {
      console.log(`⚠️  Row ${index + 2}: No contact found for ${clientEmail}, creating payment without link`);
    }
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('invoice_number', paymentData.INVOICE)
      .eq('payment_name', paymentData.PAYMENT_NAME)
      .single();
    
    if (existing) {
      console.log(`⏭️  Row ${index + 2}: Payment already exists (${paymentData.INVOICE} - ${paymentData.PAYMENT_NAME})`);
      return { skipped: true, duplicate: true };
    }
    
    // Parse all amounts
    const totalAmount = parseAmount(paymentData.TOTAL_AMOUNT);
    const netAmount = parseAmount(paymentData.NET_AMOUNT);
    
    // Build payment record
    const payment = {
      contact_id: contact?.id || null,
      invoice_number: paymentData.INVOICE || null,
      payment_name: paymentData.PAYMENT_NAME || null,
      payment_status: paymentData.PAYMENT_STATUS === 'Paid' ? 'Paid' : 'Pending',
      payment_method: paymentData.PAYMENT_METHOD || null,
      charge_notes: paymentData.CHARGE_NOTES || null,
      
      // Dates
      due_date: parseDate(paymentData.DUE_DATE),
      transaction_date: parseDate(paymentData.TRANSACTION_DATE),
      
      // Amounts
      payment_before_discount: parseAmount(paymentData.PAYMENT_BEFORE_DISCOUNT),
      discount_amount: parseAmount(paymentData.DISCOUNT_PAYMENT),
      non_taxable_amount: parseAmount(paymentData.NON_TAXABLE_AMOUNT),
      taxable_amount: parseAmount(paymentData.TAXABLE_AMOUNT_1) || 0,
      tax_amount: parseAmount(paymentData.TAX_1) || 0,
      tax_rate: parsePercentage(paymentData.TAX_RATE_1),
      late_fee: parseAmount(paymentData.LATE_FEE),
      gratuity: parseAmount(paymentData.GRATUITY),
      total_amount: totalAmount,
      
      // Fees
      transaction_fee: parseAmount(paymentData.TRANSACTION_FEE),
      fee_rate: paymentData.FEE_RATE || null,
      instant_deposit_fee: parseAmount(paymentData.INSTANT_DEPOSIT_FEE),
      instant_deposit_fee_rate: parsePercentage(paymentData.INSTANT_DEPOSIT_FEE_RATE),
      loan_repayment: parseAmount(paymentData.LOAN_REPAYMENT),
      loan_fee: parseAmount(paymentData.LOAN_FEE),
      loan_principal: parseAmount(paymentData.LOAN_PRINCIPAL),
      payment_service_fee: parseAmount(paymentData.PAYMENT_SVC),
      service_fee_rate: parsePercentage(paymentData.SVC_RATE),
      net_amount: netAmount,
      
      // Refunds/Disputes
      refunded_amount: parseAmount(paymentData.REFUNDED_AMOUNT),
      disputed_date: parseDate(paymentData.DISPUTED_DATE),
      dispute_cover: parseAmount(paymentData.DISPUTE_COVER),
      dispute_fee: parseAmount(paymentData.DISPUTE_FEE),
      disputed_net_amount: parseAmount(paymentData.DISPUTED_NET_AMOUNT),
      
      // Metadata
      honeybook_imported: true,
      honeybook_project_name: paymentData.PROJECT_NAME
    };
    
    // Insert payment
    const { data: inserted, error: insertError } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    
    if (insertError) {
      console.error(`❌ Error inserting payment:`, insertError.message);
      return { error: true };
    }
    
    const clientName = contact ? `${contact.first_name} ${contact.last_name}` : clientEmail;
    console.log(`✅ Imported: ${clientName} - $${totalAmount} (${paymentData.PAYMENT_NAME})`);
    
    return { created: true, payment: inserted };
  } catch (error) {
    console.error(`❌ Error processing payment ${index + 2}:`, error.message);
    return { error: true };
  }
}

// Main import function
async function main() {
  console.log('💰 Starting HoneyBook Payments Import\n');
  
  // Check if file exists
  const csvPath = path.join(__dirname, '..', 'data', 'honeybook-payments.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ File not found: data/honeybook-payments.csv');
    console.error('\nPlease ensure the HoneyBook payments CSV is in the data folder.');
    process.exit(1);
  }
  
  console.log('📂 Reading CSV file...');
  const payments = parseCSV(csvPath);
  console.log(`📊 Found ${payments.length} payments to import\n`);
  
  const stats = {
    created: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0,
    totalGross: 0,
    totalNet: 0,
    totalFees: 0
  };
  
  // Import payments one by one
  for (let i = 0; i < payments.length; i++) {
    const result = await importPayment(payments[i], i);
    
    if (result.created) {
      stats.created++;
      const total = parseAmount(payments[i].TOTAL_AMOUNT);
      const net = parseAmount(payments[i].NET_AMOUNT);
      if (total) stats.totalGross += total;
      if (net) stats.totalNet += net;
    }
    if (result.skipped) {
      stats.skipped++;
      if (result.duplicate) stats.duplicates++;
    }
    if (result.error) stats.errors++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  stats.totalFees = stats.totalGross - stats.totalNet;
  const feePercentage = stats.totalGross > 0 ? (stats.totalFees / stats.totalGross * 100).toFixed(2) : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${stats.created}`);
  console.log(`⏭️  Skipped: ${stats.skipped} (${stats.duplicates} duplicates)`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`📊 Total Processed: ${payments.length}`);
  console.log('');
  console.log('💰 FINANCIAL SUMMARY:');
  console.log(`   Gross Revenue: $${stats.totalGross.toFixed(2)}`);
  console.log(`   Processing Fees: $${stats.totalFees.toFixed(2)} (${feePercentage}%)`);
  console.log(`   Net Revenue: $${stats.totalNet.toFixed(2)}`);
  console.log('='.repeat(60) + '\n');
  
  console.log('🎉 All done! Check your admin panel for payment data.');
  console.log('');
  console.log('📊 Financial reports available at:');
  console.log('   - /admin/contacts/[id] - Payment history per contact');
  console.log('   - /admin/financial - Revenue dashboard (coming soon)');
}

// Run import
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

