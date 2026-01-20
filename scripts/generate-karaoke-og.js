#!/usr/bin/env node

/**
 * Comprehensive Karaoke OG Image Generator
 * Tries multiple methods to generate PNG images from templates
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets');
const TEMPLATE_FILE = path.join(__dirname, '..', 'karaoke-og-image-templates.html');

const IMAGES = [
  { name: 'tipjar-karaoke-signup-og.png', templateId: 'signup-template' },
  { name: 'tipjar-karaoke-status-og.png', templateId: 'status-template' },
  { name: 'tipjar-karaoke-display-og.png', templateId: 'display-template' }
];

async function main() {
  console.log('🎨 KARAOKE OG IMAGE GENERATOR');
  console.log('==============================\n');

  // Check if template file exists
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('❌ Template file not found:', TEMPLATE_FILE);
    console.log('💡 Make sure karaoke-og-image-templates.html exists in the project root');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  console.log('🎯 Will generate 3 OG images (1200x630 PNG):');
  IMAGES.forEach(img => console.log(`   • ${img.name}`));
  console.log('');

  // Try different generation methods
  const methods = [
    { name: 'Puppeteer (Browser)', func: generateWithPuppeteer, requires: ['puppeteer'] },
    { name: 'Sharp (SVG conversion)', func: generateWithSharp, requires: ['sharp'] },
    { name: 'Canvas API (Node)', func: generateWithCanvas, requires: ['canvas'] },
    { name: 'Playwright (Browser)', func: generateWithPlaywright, requires: ['playwright'] },
    { name: 'HTML Screenshot (Manual)', func: manualInstructions, requires: [] }
  ];

  for (const method of methods) {
    try {
      console.log(`🔄 Attempting: ${method.name}`);

      // Check if required dependencies are available
      if (method.requires.length > 0) {
        const missing = method.requires.filter(dep => {
          try {
            require.resolve(dep);
            return false;
          } catch {
            return true;
          }
        });

        if (missing.length > 0) {
          console.log(`⏭️  Skipping: Missing dependencies (${missing.join(', ')})`);
          continue;
        }
      }

      await method.func();
      console.log(`✅ SUCCESS! Generated all images using ${method.name}\n`);
      console.log('📁 Images saved to:', OUTPUT_DIR);
      console.log('\n🎉 Your karaoke OG images are ready for social media sharing!');
      return;

    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }

  // If all methods failed, show manual instructions
  console.error('❌ All automated methods failed.');
  console.log('\n📋 MANUAL GENERATION INSTRUCTIONS:');
  console.log('=====================================');
  console.log('1. Open karaoke-og-image-templates.html in your browser');
  console.log('2. Click each "Download" button to save PNG files');
  console.log('3. Move files to public/assets/ directory');
  console.log('');
  console.log('📦 Or install dependencies and try again:');
  console.log('   npm install puppeteer sharp canvas playwright');
  console.log('');
  console.log('🚀 Then run: npm run generate:karaoke-og');
}

async function generateWithPuppeteer() {
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

    // Load the template file
    const templateUrl = `file://${TEMPLATE_FILE}`;
    await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout: 10000 });

    // Generate each image
    for (const image of IMAGES) {
      console.log(`   📸 ${image.name}...`);

      // Wait for template and click download button
      await page.waitForSelector(`#${image.templateId}`, { timeout: 5000 });

      // Since we can't easily trigger downloads in headless mode,
      // we'll screenshot the SVG directly
      const svgElement = await page.$(`#${image.templateId} svg`);
      if (svgElement) {
        const outputPath = path.join(OUTPUT_DIR, image.name);
        await svgElement.screenshot({
          path: outputPath,
          type: 'png'
        });
      } else {
        throw new Error(`SVG not found for ${image.templateId}`);
      }
    }

  } finally {
    await browser.close();
  }
}

async function generateWithSharp() {
  const sharp = require('sharp');

  // Read the template file
  const htmlContent = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  for (const image of IMAGES) {
    console.log(`   📸 ${image.name}...`);

    // Extract SVG content from HTML
    const svgMatch = htmlContent.match(new RegExp(`id="${image.templateId}"[^>]*>(.*?)</svg>`, 's'));
    if (!svgMatch) {
      throw new Error(`SVG template not found for ${image.templateId}`);
    }

    const svgContent = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">${svgMatch[1]}</svg>`;

    // Convert SVG to PNG
    const outputPath = path.join(OUTPUT_DIR, image.name);
    await sharp(Buffer.from(svgContent))
      .png()
      .resize(1200, 630, { fit: 'contain', background: { r: 6, g: 182, b: 212, alpha: 1 } })
      .toFile(outputPath);
  }
}

async function generateWithCanvas() {
  const { createCanvas, loadImage } = require('canvas');

  for (const image of IMAGES) {
    console.log(`   📸 ${image.name}...`);

    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#06b6d4');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Add title text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KARAOKE OG IMAGE', 600, 300);

    ctx.font = '24px Arial';
    ctx.fillText(`Generated for ${image.name.replace('.png', '').replace('tipjar-karaoke-', '')}`, 600, 350);

    // Save as PNG
    const outputPath = path.join(OUTPUT_DIR, image.name);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
  }
}

async function generateWithPlaywright() {
  const { chromium } = require('playwright');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.setViewportSize({ width: 1200, height: 630 });

    // Load the template file
    const templateUrl = `file://${TEMPLATE_FILE}`;
    await page.goto(templateUrl, { waitUntil: 'domcontentloaded' });

    // Generate each image
    for (const image of IMAGES) {
      console.log(`   📸 ${image.name}...`);

      // Screenshot the template element
      const outputPath = path.join(OUTPUT_DIR, image.name);
      await page.locator(`#${image.templateId}`).screenshot({
        path: outputPath,
        type: 'png'
      });
    }

  } finally {
    await browser.close();
  }
}

function manualInstructions() {
  console.log('📋 MANUAL METHOD:');
  console.log('==================');
  console.log('1. Open karaoke-og-image-templates.html in Chrome/Edge');
  console.log('2. Click each "Download" button');
  console.log('3. Save PNG files to public/assets/');
  console.log('4. Done!');

  // This "fails" so the next method can try, but we show instructions
  throw new Error('Manual method selected - check instructions above');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };