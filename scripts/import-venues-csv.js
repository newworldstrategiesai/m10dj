/**
 * CSV Venue Import Script
 * Imports venues from CSV file into preferred_venues table
 * 
 * Usage: node scripts/import-venues-csv.js <path-to-csv-file>
 * Example: node scripts/import-venues-csv.js data/top-100-venues.csv
 * 
 * Expected CSV format:
 * venue_name,address,city,state,zip_code,venue_type,website,description
 * 
 * Optional columns (will use defaults if missing):
 * - venue_type (default: 'wedding')
 * - website
 * - description
 * - capacity_min, capacity_max
 * - amenities (comma-separated string)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse CSV line (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  return result;
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }
  
  return { headers, rows };
}

// Determine venue type from name or description
function determineVenueType(venueName, description = '') {
  const name = (venueName || '').toLowerCase();
  const desc = (description || '').toLowerCase();
  
  if (name.includes('hotel') || desc.includes('hotel')) return 'hotel';
  if (name.includes('museum') || name.includes('gallery') || desc.includes('museum') || desc.includes('gallery') || desc.includes('art')) return 'historic';
  if (name.includes('mansion') || desc.includes('mansion') || desc.includes('historic') || desc.includes('victorian')) return 'historic';
  if (name.includes('garden') || desc.includes('garden') || desc.includes('outdoor') || desc.includes('acres') || desc.includes('farm')) return 'outdoor';
  if (name.includes('ballroom') || name.includes('banquet') || desc.includes('ballroom') || desc.includes('banquet')) return 'banquet_hall';
  if (name.includes('country club') || name.includes('club') || desc.includes('country club')) return 'country_club';
  if (name.includes('restaurant') || name.includes('distillery') || desc.includes('restaurant') || desc.includes('distillery')) return 'restaurant';
  return 'wedding'; // Default
}

// Extract amenities from description
function extractAmenities(description) {
  if (!description) return [];
  
  const amenities = [];
  const desc = description.toLowerCase();
  
  if (desc.includes('parking')) amenities.push('parking');
  if (desc.includes('garden') || desc.includes('outdoor')) amenities.push('outdoor space');
  if (desc.includes('ballroom')) amenities.push('ballroom');
  if (desc.includes('catering') || desc.includes('restaurant')) amenities.push('catering available');
  if (desc.includes('hotel') || desc.includes('accommodation')) amenities.push('accommodations');
  if (desc.includes('chapel') || desc.includes('ceremony')) amenities.push('ceremony space');
  if (desc.includes('historic') || desc.includes('mansion')) amenities.push('historic architecture');
  if (desc.includes('art') || desc.includes('museum')) amenities.push('art collection');
  if (desc.includes('view') || desc.includes('vista')) amenities.push('scenic views');
  if (desc.includes('pool')) amenities.push('pool');
  if (desc.includes('barn')) amenities.push('rustic barn');
  if (desc.includes('chandelier') || desc.includes('elegant')) amenities.push('elegant decor');
  
  return amenities;
}

// Process venue row from CSV
function processVenueRow(row) {
  const venue_name = (row.venue_name || row.name || row['venue name'] || '').trim();
  const address = (row.address || '').trim();
  const city = (row.city || 'Memphis').trim();
  const state = (row.state || 'TN').trim();
  const zip_code = (row.zip_code || row.zip || row['zip_code'] || '').trim();
  const phone = (row.phone || row['contact phone'] || '').trim() || null;
  const email = (row.email || row.contact_email || row['contact email'] || '').trim() || null;
  const venue_type = (row.venue_type || determineVenueType(venue_name, row.description || '')).trim();
  const website = (row.website || row.url || '').trim() || null;
  const description = (row.description || row.desc || '').trim() || null;
  
  // Parse amenities (can be comma-separated string or already an array notation)
  let amenities = [];
  if (row.amenities) {
    if (typeof row.amenities === 'string') {
      amenities = row.amenities.split(',').map(a => a.trim()).filter(Boolean);
    }
  } else if (description) {
    amenities = extractAmenities(description);
  }
  
  // Capacity parsing
  let capacity_min = row.capacity_min ? parseInt(row.capacity_min) : null;
  let capacity_max = row.capacity_max ? parseInt(row.capacity_max) : null;
  
  // If no capacity specified, use defaults based on description
  if (!capacity_min && !capacity_max && description) {
    const capacityMatch = description.match(/(\d+)\s+guests?/i);
    if (capacityMatch) {
      const capacity = parseInt(capacityMatch[1]);
      capacity_min = Math.max(50, Math.floor(capacity * 0.5));
      capacity_max = capacity;
    }
  }
  
  // Default capacities if still missing
  if (!capacity_min) capacity_min = 50;
  if (!capacity_max) capacity_max = 250;
  
  // Ensure full address is stored
  const fullAddress = address || `${city}, ${state}`;
  
  return {
    venue_name,
    address: fullAddress,
    city,
    state,
    zip_code: zip_code || null,
    phone,
    email,
    venue_type,
    website,
    description,
    capacity_min,
    capacity_max,
    amenities: amenities.length > 0 ? amenities : null,
    is_featured: false,
    is_active: true
  };
}

// Import venues from CSV
async function importVenuesCSV(filePath) {
  try {
    console.log('📂 Reading CSV file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const { headers, rows } = parseCSV(filePath);
    console.log(`✅ Parsed CSV: ${rows.length} venues found`);
    console.log(`📋 Columns: ${headers.join(', ')}`);
    
    // Process rows
    const processedVenues = rows.map((row, index) => {
      try {
        return processVenueRow(row);
      } catch (error) {
        console.warn(`⚠️  Error processing row ${index + 2}:`, error.message);
        return null;
      }
    }).filter(Boolean);
    
    console.log(`✅ Processed ${processedVenues.length} venues`);
    
    // Check for duplicates before inserting
    console.log('🔍 Checking for existing venues...');
    const existingVenues = await supabase
      .from('preferred_venues')
      .select('venue_name, address, city');
    
    const existingMap = new Map();
    if (existingVenues.data) {
      existingVenues.data.forEach(v => {
        const key = `${v.venue_name.toLowerCase()}-${v.city?.toLowerCase() || ''}`;
        existingMap.set(key, true);
      });
    }
    
    // Filter out duplicates
    const newVenues = processedVenues.filter(venue => {
      const key = `${venue.venue_name.toLowerCase()}-${venue.city?.toLowerCase() || ''}`;
      return !existingMap.has(key);
    });
    
    if (newVenues.length < processedVenues.length) {
      const duplicates = processedVenues.length - newVenues.length;
      console.log(`⚠️  Skipping ${duplicates} duplicate venue(s)`);
    }
    
    if (newVenues.length === 0) {
      console.log('ℹ️  No new venues to import');
      return { imported: 0, duplicates: processedVenues.length };
    }
    
    // Insert in batches
    const batchSize = 10;
    let imported = 0;
    const errors = [];
    
    console.log(`📤 Importing ${newVenues.length} venues in batches of ${batchSize}...`);
    
    for (let i = 0; i < newVenues.length; i += batchSize) {
      const batch = newVenues.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(newVenues.length / batchSize);
      
      try {
        const { data, error } = await supabase
          .from('preferred_venues')
          .insert(batch)
          .select('venue_name, city');
        
        if (error) {
          console.error(`❌ Error inserting batch ${batchNum}/${totalBatches}:`, error.message);
          errors.push({ batch: batchNum, error: error.message, venues: batch.map(v => v.venue_name) });
        } else {
          imported += data.length;
          console.log(`✅ Batch ${batchNum}/${totalBatches}: Imported ${data.length} venues`);
        }
      } catch (error) {
        console.error(`❌ Error inserting batch ${batchNum}/${totalBatches}:`, error.message);
        errors.push({ batch: batchNum, error: error.message, venues: batch.map(v => v.venue_name) });
      }
    }
    
    // Summary
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${imported} venues`);
    console.log(`   ⚠️  Duplicates skipped: ${processedVenues.length - newVenues.length} venues`);
    console.log(`   ❌ Errors: ${errors.length} batch(es)`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors occurred:');
      errors.forEach(e => {
        console.log(`   Batch ${e.batch}: ${e.error}`);
        console.log(`   Venues: ${e.venues.join(', ')}`);
      });
    }
    
    return {
      total: processedVenues.length,
      imported,
      duplicates: processedVenues.length - newVenues.length,
      errors: errors.length
    };
    
  } catch (error) {
    console.error('❌ Import error:', error.message);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.error('❌ Error: CSV file path required');
    console.error('Usage: node scripts/import-venues-csv.js <path-to-csv-file>');
    console.error('Example: node scripts/import-venues-csv.js data/top-100-venues.csv');
    process.exit(1);
  }
  
  const absolutePath = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
  
  importVenuesCSV(absolutePath)
    .then(result => {
      console.log('\n✅ Import complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { importVenuesCSV, parseCSV, processVenueRow };

