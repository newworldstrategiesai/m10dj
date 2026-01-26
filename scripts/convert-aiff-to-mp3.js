#!/usr/bin/env node

/**
 * Convert AIFF/AIF files to MP3 to save disk space
 * 
 * Usage: node scripts/convert-aiff-to-mp3.js [options]
 * 
 * Options:
 *   --bitrate <rate>    MP3 bitrate (default: 192)
 *   --delete-originals  Delete original AIFF files after successful conversion
 *   --dry-run          Show what would be converted without actually converting
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deleteOriginals = args.includes('--delete-originals');
const bitrateIndex = args.indexOf('--bitrate');
const bitrate = bitrateIndex !== -1 && args[bitrateIndex + 1] 
  ? args[bitrateIndex + 1] 
  : '192';

// Find all AIFF/AIF files
console.log('🔍 Finding AIFF/AIF files...');
let files = [];
try {
  // Search in Music directory and project directory
  const searchPaths = [
    '/Users/benmurray/Music',
    '/Users/benmurray/m10dj'
  ];
  
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    
    const result1 = spawnSync('find', [searchPath, '-name', '*.aiff', '-type', 'f'], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    const result2 = spawnSync('find', [searchPath, '-name', '*.aif', '-type', 'f'], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    if (result1.stdout) files = files.concat(result1.stdout.trim().split('\n').filter(f => f.trim()));
    if (result2.stdout) files = files.concat(result2.stdout.trim().split('\n').filter(f => f.trim()));
  }
  
  // Remove duplicates
  files = [...new Set(files)];
} catch (error) {
  console.error('❌ Error finding files:', error.message);
  process.exit(1);
}

console.log(`📊 Found ${files.length} files to convert\n`);

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be converted\n');
}

let converted = 0;
let failed = 0;
let skipped = 0;
let totalOriginalSize = 0;
let totalNewSize = 0;

for (const file of files) {
  if (!file.trim()) continue;
  
  const filePath = file.trim();
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath, path.extname(filePath));
  const mp3Path = path.join(dir, `${basename}.mp3`);
  
  // Skip if MP3 already exists
  if (fs.existsSync(mp3Path)) {
    console.log(`⏭️  Skipping (MP3 exists): ${path.basename(filePath)}`);
    skipped++;
    continue;
  }
  
  try {
    // Get original file size
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;
    totalOriginalSize += originalSize;
    
    console.log(`🔄 Converting: ${path.basename(filePath)} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);
    
    if (!dryRun) {
      // Convert using ffmpeg
      // -i: input file
      // -codec:a libmp3lame: use MP3 encoder
      // -b:a: audio bitrate
      // -q:a 2: high quality (alternative to bitrate)
      const ffmpegCommand = `ffmpeg -i "${filePath}" -codec:a libmp3lame -b:a ${bitrate}k -q:a 2 "${mp3Path}" -y -loglevel error`;
      
      execSync(ffmpegCommand, { stdio: 'inherit' });
      
      // Verify MP3 was created
      if (fs.existsSync(mp3Path)) {
        const mp3Stats = fs.statSync(mp3Path);
        const newSize = mp3Stats.size;
        totalNewSize += newSize;
        
        const saved = originalSize - newSize;
        const savedPercent = ((saved / originalSize) * 100).toFixed(1);
        
        console.log(`✅ Converted: ${path.basename(mp3Path)} (${(newSize / 1024 / 1024).toFixed(2)} MB) - Saved ${(saved / 1024 / 1024).toFixed(2)} MB (${savedPercent}%)\n`);
        
        // Delete original if requested
        if (deleteOriginals) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted original: ${path.basename(filePath)}\n`);
        }
        
        converted++;
      } else {
        throw new Error('MP3 file was not created');
      }
    } else {
      console.log(`   Would convert to: ${path.basename(mp3Path)}\n`);
      converted++;
    }
  } catch (error) {
    console.error(`❌ Failed to convert ${path.basename(filePath)}: ${error.message}\n`);
    failed++;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 CONVERSION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Converted: ${converted}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📁 Total files: ${files.length}`);

if (!dryRun && converted > 0) {
  const totalSaved = totalOriginalSize - totalNewSize;
  console.log(`\n💾 Space saved: ${(totalSaved / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`📦 Original size: ${(totalOriginalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`📦 New size: ${(totalNewSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
}

if (dryRun) {
  console.log('\n💡 Run without --dry-run to actually convert files');
}

if (!deleteOriginals && converted > 0) {
  console.log('\n💡 Add --delete-originals to remove original AIFF files after conversion');
}

console.log('');
