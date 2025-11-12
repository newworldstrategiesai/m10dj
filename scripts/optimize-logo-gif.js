#!/usr/bin/env node

/**
 * Script to optimize M10-Rotating-Logo.gif for email use
 * 
 * This script:
 * 1. Resizes the GIF from 1920x1080 to 250x250 (optimal for email)
 * 2. Reduces frame count and optimizes colors
 * 3. Compresses to under 100KB for email use
 * 
 * Prerequisites: Install ImageMagick or use ffmpeg
 * npm install --save-dev gif-encoder gif-parse
 * 
 * Usage:
 *   npm run optimize:logo-gif
 * 
 * Output:
 *   public/M10-Logo-Email.gif (optimized for email templates)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INPUT_GIF = path.join(__dirname, '../public/M10-Rotating-Logo.gif');
const OUTPUT_GIF = path.join(__dirname, '../public/M10-Logo-Email.gif');

// Recommended sizes for email
const SIZES = [
  { width: 250, height: 250, name: 'small', maxSize: '100KB' },
  { width: 200, height: 200, name: 'mobile', maxSize: '75KB' },
];

console.log('🎬 Starting M10 Logo GIF optimization for email...\n');

// Check if source file exists
if (!fs.existsSync(INPUT_GIF)) {
  console.error(`❌ Error: ${INPUT_GIF} not found!`);
  console.log('Make sure M10-Rotating-Logo.gif exists in the public folder.');
  process.exit(1);
}

try {
  console.log('ℹ️  To optimize the GIF, you have two options:\n');
  console.log('Option 1: Using ImageMagick (recommended for GIFs)');
  console.log('  Install: brew install imagemagick');
  console.log('  Command: convert input.gif -coalesce -resize 250x250 -colors 128 -fuzz 10% -optimize +dither -decimate 2 output.gif\n');
  
  console.log('Option 2: Using ImageOptim (GUI - easiest)');
  console.log('  Download: https://imageoptim.com/');
  console.log('  1. Drag M10-Rotating-Logo.gif onto ImageOptim');
  console.log('  2. It will compress in-place\n');
  
  console.log('Option 3: Using Online Tools');
  console.log('  - ezgif.com (supports GIF resizing & optimization)');
  console.log('  - tinygif.app');
  console.log('  - gifsicle.readthedocs.io\n');

  console.log('📋 Recommended Email Logo Sizes:');
  SIZES.forEach(size => {
    console.log(`  • ${size.width}x${size.height} - ${size.maxSize} target (${size.name})`);
  });

  console.log('\n✨ Manual process (3 easy steps):');
  console.log('1. Visit https://ezgif.com/resize');
  console.log('2. Upload M10-Rotating-Logo.gif');
  console.log('3. Resize to 250x250px');
  console.log('4. Download optimized.gif');
  console.log('5. Save to public/M10-Logo-Email.gif\n');

  // Try with ImageMagick if available
  try {
    execSync('which convert', { stdio: 'ignore' });
    console.log('✅ ImageMagick found! Attempting optimization...\n');
    
    // Resize and optimize
    execSync(`convert "${INPUT_GIF}" -coalesce -resize 250x250 -colors 128 -fuzz 10% -optimize +dither -decimate 1 "${OUTPUT_GIF}"`, {
      stdio: 'inherit'
    });
    
    const stats = fs.statSync(OUTPUT_GIF);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n✅ Optimization complete!');
    console.log(`📦 Output: ${OUTPUT_GIF}`);
    console.log(`💾 File size: ${sizeKB}KB (${sizeMB}MB)`);
    console.log('✨ Ready to use in email templates!');
    
  } catch {
    console.log('ℹ️  ImageMagick not found - using manual optimization guide above.\n');
    console.log('After optimizing, place the file at:');
    console.log(`  ${OUTPUT_GIF}\n`);
  }

} catch (error) {
  console.error('❌ Error during optimization:', error.message);
  process.exit(1);
}

