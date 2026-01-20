#!/usr/bin/env node

/**
 * OG Image Generation Script
 * Generates PNG images from HTML templates using Puppeteer
 * Run with: node scripts/generate-og-images.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const IMAGES = [
  {
    name: 'tipjar-karaoke-signup-og.png',
    templateId: 'signup-template',
    title: 'Karaoke Signup OG Image'
  },
  {
    name: 'tipjar-karaoke-status-og.png',
    templateId: 'status-template',
    title: 'Karaoke Status OG Image'
  },
  {
    name: 'tipjar-karaoke-display-og.png',
    templateId: 'display-template',
    title: 'Karaoke Display OG Image'
  }
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets');

async function generateOGImages() {
  console.log('🎨 Starting OG Image Generation...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Create a new page
    const page = await browser.newPage();

    // Set viewport to exact OG image dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });

    // Load the HTML template
    const templatePath = path.join(__dirname, '..', 'karaoke-og-image-templates.html');
    const templateUrl = `file://${templatePath}`;
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });

    // Generate each image
    for (const image of IMAGES) {
      console.log(`📸 Generating ${image.title}...`);

      try {
        // Wait for the template to be visible
        await page.waitForSelector(`#${image.templateId}`, { visible: true });

        // Take screenshot of the specific template
        const outputPath = path.join(OUTPUT_DIR, image.name);
        await page.screenshot({
          path: outputPath,
          clip: {
            x: 0,
            y: 0,
            width: 1200,
            height: 630
          },
          type: 'png',
          omitBackground: false
        });

        console.log(`✅ Saved: ${outputPath}`);

      } catch (error) {
        console.error(`❌ Failed to generate ${image.name}:`, error.message);
      }
    }

    console.log('\n🎉 OG Image generation complete!');
    console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
    console.log('\n📋 Generated files:');
    IMAGES.forEach(img => {
      console.log(`   • ${img.name}`);
    });

  } catch (error) {
    console.error('❌ Error during OG image generation:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Alternative method using SVG conversion (no browser required)
async function generateFromSVG() {
  console.log('🎨 Generating OG Images from SVG templates...\n');

  const sharp = require('sharp');
  const { JSDOM } = require('jsdom');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, '..', 'karaoke-og-image-templates.html');
    const htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Parse HTML to extract SVGs
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    for (const image of IMAGES) {
      console.log(`📸 Generating ${image.title}...`);

      const templateElement = document.getElementById(image.templateId);
      if (!templateElement) {
        console.error(`❌ Template ${image.templateId} not found`);
        continue;
      }

      const svgElement = templateElement.querySelector('svg');
      if (!svgElement) {
        console.error(`❌ SVG not found in template ${image.templateId}`);
        continue;
      }

      // Get SVG content
      const svgContent = svgElement.outerHTML;

      // Convert SVG to PNG using Sharp
      const outputPath = path.join(OUTPUT_DIR, image.name);
      await sharp(Buffer.from(svgContent))
        .png()
        .resize(1200, 630)
        .toFile(outputPath);

      console.log(`✅ Saved: ${outputPath}`);
    }

    console.log('\n🎉 OG Image generation complete!');
    console.log(`📁 Images saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error during SVG conversion:', error);
    console.log('\n💡 Make sure Sharp is installed: npm install sharp');
    console.log('💡 Or use the Puppeteer method instead');
  }
}

// Check if Sharp is available, otherwise use Puppeteer
async function main() {
  const useSVG = process.argv.includes('--svg');

  if (useSVG) {
    // Check if Sharp is available
    try {
      require('sharp');
      await generateFromSVG();
    } catch (error) {
      console.log('⚠️  Sharp not available, falling back to Puppeteer...');
      await generateOGImages();
    }
  } else {
    // Check if Puppeteer is available
    try {
      require('puppeteer');
      await generateOGImages();
    } catch (error) {
      console.log('⚠️  Puppeteer not available, trying Sharp/SVG method...');
      try {
        require('sharp');
        require('jsdom');
        await generateFromSVG();
      } catch (svgError) {
        console.error('❌ Neither Puppeteer nor Sharp+jsdom are available.');
        console.log('\n📦 Install dependencies:');
        console.log('   npm install puppeteer sharp jsdom');
        console.log('\n💡 Or run with --svg flag to force SVG method');
        process.exit(1);
      }
    }
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateOGImages, generateFromSVG };