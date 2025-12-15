const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateOGImage() {
  console.log('🚀 Starting OG image generation...');
  
  const htmlPath = path.join(__dirname, '../public/assets/generate-og-images.html');
  const outputPath = path.join(__dirname, '../public/assets/tipjar-og-image.png');
  
  // Check if HTML file exists
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ HTML file not found at:', htmlPath);
    process.exit(1);
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport to OG image size
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2 // Higher quality
    });
    
    // Load the HTML file
    const fileUrl = `file://${htmlPath}`;
    console.log('📄 Loading HTML file:', fileUrl);
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for the TipJar element to be visible
    console.log('⏳ Waiting for content to render...');
    await page.waitForSelector('#tipjar', { visible: true, timeout: 10000 });
    
    // Wait a bit more for animations to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Hide the download buttons before screenshot
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.display = 'none';
      });
    });
    
    // Take screenshot of the TipJar OG image
    console.log('📸 Capturing screenshot...');
    const element = await page.$('#tipjar');
    
    if (!element) {
      throw new Error('TipJar element not found');
    }
    
    await element.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 630
      }
    });
    
    console.log('✅ OG image generated successfully!');
    console.log('📁 Saved to:', outputPath);
    
    // Verify file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
  } catch (error) {
    console.error('❌ Error generating OG image:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the script
generateOGImage().catch(console.error);

