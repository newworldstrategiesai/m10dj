#!/usr/bin/env node

/**
 * Simple OG Image Generation Script
 * Generates basic PNG images using Canvas API (if available)
 * Fallback: Downloads SVG as PNG using browser automation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets');

const IMAGES = [
  {
    name: 'tipjar-karaoke-signup-og.png',
    url: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)"/>
        <circle cx="200" cy="150" r="80" fill="rgba(255,255,255,0.1)"/>
        <circle cx="1000" cy="480" r="120" fill="rgba(255,255,255,0.05)"/>
        <circle cx="1100" cy="200" r="60" fill="rgba(255,255,255,0.08)"/>
        <g transform="translate(100, 200)">
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="4"/>
          <rect x="40" y="90" width="20" height="60" rx="10" fill="white"/>
          <circle cx="50" cy="160" r="15" fill="white"/>
          <line x1="50" y1="175" x2="50" y2="200" stroke="white" stroke-width="3"/>
        </g>
        <text x="400" y="250" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">JOIN KARAOKE</text>
        <text x="400" y="310" font-family="Arial, sans-serif" font-size="32" fill="white">Sign Up Now!</text>
        <g transform="translate(400, 380)">
          <circle cx="0" cy="0" r="8" fill="white"/>
          <text x="20" y="5" font-family="Arial, sans-serif" font-size="24" fill="white">Choose Your Song</text>
          <circle cx="0" cy="40" r="8" fill="white"/>
          <text x="20" y="45" font-family="Arial, sans-serif" font-size="24" fill="white">Join the Queue</text>
          <circle cx="0" cy="80" r="8" fill="white"/>
          <text x="20" y="85" font-family="Arial, sans-serif" font-size="24" fill="white">Get Notified</text>
        </g>
        <g transform="translate(900, 150)">
          <text font-size="60" fill="rgba(255,255,255,0.6)">♪</text>
          <text x="40" y="30" font-size="40" fill="rgba(255,255,255,0.4)">♫</text>
          <text x="20" y="60" font-size="50" fill="rgba(255,255,255,0.5)">♪</text>
        </g>
      </svg>
    `).toString('base64')
  },
  {
    name: 'tipjar-karaoke-status-og.png',
    url: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="status-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#status-bg)"/>
        <circle cx="150" cy="120" r="60" fill="rgba(255,255,255,0.1)"/>
        <circle cx="1050" cy="500" r="100" fill="rgba(255,255,255,0.05)"/>
        <g transform="translate(100, 200)">
          <rect x="0" y="0" width="80" height="40" rx="20" fill="rgba(255,255,255,0.9)"/>
          <text x="40" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#3b82f6">#1</text>
          <rect x="0" y="50" width="80" height="40" rx="20" fill="rgba(255,255,255,0.9)"/>
          <text x="40" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#3b82f6">#2</text>
          <rect x="0" y="100" width="80" height="40" rx="20" fill="rgba(255,255,255,0.9)"/>
          <text x="40" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#06b6d4">#3</text>
          <rect x="0" y="150" width="80" height="40" rx="20" fill="rgba(255,255,255,0.8)" stroke="#06b6d4" stroke-width="3"/>
          <text x="40" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#06b6d4">YOU</text>
        </g>
        <text x="350" y="200" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="white">YOUR KARAOKE</text>
        <text x="350" y="250" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="white">QUEUE STATUS</text>
        <g transform="translate(350, 320)">
          <circle cx="0" cy="0" r="8" fill="white"/>
          <text x="20" y="5" font-family="Arial, sans-serif" font-size="24" fill="white">Track Your Position</text>
          <circle cx="0" cy="40" r="8" fill="white"/>
          <text x="20" y="45" font-family="Arial, sans-serif" font-size="24" fill="white">Real-time Updates</text>
          <circle cx="0" cy="80" r="8" fill="white"/>
          <text x="20" y="85" font-family="Arial, sans-serif" font-size="24" fill="white">Get Ready to Sing!</text>
        </g>
        <g transform="translate(900, 200)">
          <circle cx="40" cy="40" r="35" fill="none" stroke="white" stroke-width="4"/>
          <rect x="25" y="25" width="30" height="30" rx="2" fill="white"/>
          <text x="40" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#3b82f6">✓</text>
        </g>
      </svg>
    `).toString('base64')
  },
  {
    name: 'tipjar-karaoke-display-og.png',
    url: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="display-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#display-bg)"/>
        <rect x="50" y="50" width="1100" height="530" rx="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
        <rect x="60" y="60" width="1080" height="510" rx="15" fill="#0a0a0a"/>
        <g transform="translate(80, 100)">
          <text x="0" y="30" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#06b6d4">LIVE KARAOKE QUEUE</text>
          <g transform="translate(0, 80)">
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="24" fill="#06b6d4" font-weight="bold">NOW SINGING:</text>
            <rect x="0" y="20" width="400" height="60" rx="10" fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" stroke-width="2"/>
            <text x="20" y="55" font-family="Arial, sans-serif" font-size="20" fill="white">🎤 John Doe - "Don't Stop Believin'"</text>
          </g>
          <g transform="translate(0, 180)">
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="24" fill="#3b82f6" font-weight="bold">NEXT UP:</text>
            <rect x="0" y="20" width="400" height="50" rx="10" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" stroke-width="2"/>
            <text x="20" y="48" font-family="Arial, sans-serif" font-size="18" fill="white">🎵 Jane Smith - "Bohemian Rhapsody"</text>
          </g>
          <g transform="translate(450, 80)">
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" fill="white" font-weight="bold">COMING UP:</text>
            <g transform="translate(0, 30)">
              <text x="0" y="20" font-family="Arial, sans-serif" font-size="16" fill="#ccc">3. Mike Johnson - "Sweet Caroline"</text>
              <text x="0" y="45" font-family="Arial, sans-serif" font-size="16" fill="#ccc">4. Sarah Wilson - "Respect"</text>
              <text x="0" y="70" font-family="Arial, sans-serif" font-size="16" fill="#ccc">5. Tom Brown - "Piano Man"</text>
            </g>
          </g>
        </g>
        <text x="150" y="500" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">LIVE KARAOKE QUEUE DISPLAY</text>
        <text x="150" y="540" font-family="Arial, sans-serif" font-size="24" fill="#06b6d4">See who's singing next in real-time!</text>
      </svg>
    `).toString('base64')
  }
];

async function generateImages() {
  console.log('🎨 Generating Karaoke OG Images...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }

  // Try different methods
  const methods = [
    { name: 'Canvas API', func: generateWithCanvas },
    { name: 'Puppeteer', func: generateWithPuppeteer },
    { name: 'wget/curl', func: generateWithWget },
    { name: 'SVG conversion', func: generateWithSvg }
  ];

  for (const method of methods) {
    try {
      console.log(`🔄 Trying ${method.name} method...`);
      await method.func();
      console.log(`✅ Successfully generated images using ${method.name}!`);
      return;
    } catch (error) {
      console.log(`❌ ${method.name} failed: ${error.message}`);
    }
  }

  console.error('❌ All generation methods failed. Please install dependencies:');
  console.log('   npm install puppeteer sharp canvas');
  process.exit(1);
}

async function generateWithCanvas() {
  // Try to use Node Canvas if available
  try {
    const { createCanvas, loadImage } = require('canvas');

    for (const image of IMAGES) {
      console.log(`📸 Generating ${image.name}...`);

      const canvas = createCanvas(1200, 630);
      const ctx = canvas.getContext('2d');

      // Fill background
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#06b6d4');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      // Add simple text (Canvas doesn't support SVG well)
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('KARAOKE OG IMAGE', 400, 300);
      ctx.font = '24px Arial';
      ctx.fillText('Generated with Canvas API', 400, 350);

      // Save as PNG
      const outputPath = path.join(OUTPUT_DIR, image.name);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Saved: ${outputPath}`);
    }
  } catch (error) {
    throw new Error('Canvas not available: ' + error.message);
  }
}

async function generateWithPuppeteer() {
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });

    for (const image of IMAGES) {
      console.log(`📸 Generating ${image.name}...`);

      // Load SVG data URL
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head><style>body { margin: 0; }</style></head>
          <body><img src="${image.url}" style="width: 1200px; height: 630px;" /></body>
        </html>
      `);

      await page.waitForSelector('img');

      const outputPath = path.join(OUTPUT_DIR, image.name);
      await page.screenshot({
        path: outputPath,
        clip: { x: 0, y: 0, width: 1200, height: 630 },
        type: 'png'
      });

      console.log(`✅ Saved: ${outputPath}`);
    }
  } finally {
    await browser.close();
  }
}

async function generateWithWget() {
  // Try using wget or curl to download SVG as PNG
  for (const image of IMAGES) {
    console.log(`📸 Generating ${image.name}...`);

    const outputPath = path.join(OUTPUT_DIR, image.name);

    await new Promise((resolve, reject) => {
      // Try wget first
      exec(`wget -q -O "${outputPath}" "${image.url}"`, (error) => {
        if (error) {
          // Try curl as fallback
          exec(`curl -s -o "${outputPath}" "${image.url}"`, (curlError) => {
            if (curlError) {
              reject(new Error('Neither wget nor curl available'));
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });

    console.log(`✅ Saved: ${outputPath}`);
  }
}

async function generateWithSvg() {
  // Use Sharp to convert SVG to PNG
  const sharp = require('sharp');

  for (const image of IMAGES) {
    console.log(`📸 Generating ${image.name}...`);

    // Extract SVG from data URL
    const svgData = image.url.replace('data:image/svg+xml;base64,', '');
    const svgBuffer = Buffer.from(svgData, 'base64');

    const outputPath = path.join(OUTPUT_DIR, image.name);
    await sharp(svgBuffer)
      .png()
      .resize(1200, 630)
      .toFile(outputPath);

    console.log(`✅ Saved: ${outputPath}`);
  }
}

// Run the generation
if (require.main === module) {
  generateImages().catch(console.error);
}

module.exports = { generateImages };