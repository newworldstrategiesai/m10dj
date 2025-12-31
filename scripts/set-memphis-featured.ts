/**
 * Set Memphis as featured city with high priority
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setMemphisFeatured() {
  console.log('🎯 Setting Memphis as featured city with high priority...\n');

  const { data, error } = await supabase
    .from('city_pages')
    .update({
      is_featured: true,
      priority: 95,
      meta_title: 'Best DJs in Memphis TN | Book Local DJs | DJ Dash',
      meta_description: 'Find 50+ verified professional DJs in Memphis, Tennessee. Wedding DJs, corporate event DJs, party DJs. Read reviews, compare pricing, book instantly. Trusted by 1,000+ Memphis events.',
    })
    .eq('city_slug', 'memphis-tn')
    .eq('product_context', 'djdash')
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating Memphis city page:', error);
    process.exit(1);
  }

  console.log('✅ Memphis city page updated:');
  console.log(`   - is_featured: ${data.is_featured}`);
  console.log(`   - priority: ${data.priority}`);
  console.log(`   - meta_title: ${data.meta_title}`);
  console.log('\n🎉 Memphis is now featured with high priority!');
}

setMemphisFeatured().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

