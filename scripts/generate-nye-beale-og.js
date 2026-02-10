/**
 * Generate only the NYE Beale Street 2026 blog OG image.
 * Uses the same Puppeteer flow as generate-og-image.js.
 * Run: node scripts/generate-nye-beale-og.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const IMAGE_ID = 'nye-beale-street-2026-og';
const OUTPUT_FILENAME = 'nye-beale-street-2026-og.png';

async function main() {
  const htmlPath = path.join(__dirname, '../public/assets/generate-og-images.html');
  const outputPath = path.join(__dirname, '../public/assets', OUTPUT_FILENAME);

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ HTML file not found at:', htmlPath);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

    const fileUrl = `file://${path.resolve(htmlPath)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 });

    await page.evaluate((targetId) => {
      const el = document.getElementById(targetId);
      if (el) {
        el.classList.remove('hidden');
        el.style.display = 'block';
      }
      document.querySelectorAll('.og-container').forEach((c) => {
        if (c.id !== targetId) c.style.display = 'none';
      });
      document.querySelectorAll('button').forEach((b) => (b.style.display = 'none'));
    }, IMAGE_ID);

    await page.waitForSelector(`#${IMAGE_ID}`, { visible: true, timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500));

    const element = await page.$(`#${IMAGE_ID}`);
    if (!element) throw new Error(`${IMAGE_ID} element not found`);

    await element.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    console.log('✅ NYE Beale Street OG image generated:', outputPath);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
