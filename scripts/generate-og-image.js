const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateOGImage(imageId, outputFilename) {
  console.log(`🚀 Starting OG image generation for ${imageId}...`);
  
  const htmlPath = path.join(__dirname, '../public/assets/generate-og-images.html');
  const outputPath = path.join(__dirname, '../public/assets', outputFilename);
  
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
    
    // Wait for page to load
    console.log('⏳ Waiting for content to render...');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Show the target element and hide others
    await page.evaluate((targetId) => {
      // Show target element
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.classList.remove('hidden');
        targetElement.style.display = 'block';
      }
      
      // Hide other OG images
      const allContainers = document.querySelectorAll('.og-container');
      allContainers.forEach(container => {
        if (container.id !== targetId) {
          container.style.display = 'none';
        }
      });
      
      // Hide download buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.display = 'none';
      });
    }, imageId);
    
    // Wait for the target element to be visible
    await page.waitForSelector(`#${imageId}`, { visible: true, timeout: 10000 });
    
    // Wait a bit more for animations to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of the target OG image
    console.log('📸 Capturing screenshot...');
    const element = await page.$(`#${imageId}`);
    
    if (!element) {
      throw new Error(`${imageId} element not found`);
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

// Generate all OG images
async function generateAllOGImages() {
  const images = [
    // TipJar OG Images
    { id: 'tipjar', filename: 'tipjar-og-image.png' },
    { id: 'tipjar', filename: 'tipjar-open-graph-new.png' }, // Same design, different filename
    { id: 'tipjar-dashboard', filename: 'tipjar-dashboard-og.png' },
    { id: 'tipjar-crowd-requests', filename: 'tipjar-crowd-requests-og.png' },
    { id: 'tipjar-public-requests', filename: 'tipjar-public-requests-og.png' },
    { id: 'tipjar-pricing', filename: 'tipjar-pricing-og.png' },
    { id: 'tipjar-features', filename: 'tipjar-features-og.png' },
    { id: 'tipjar-how-it-works', filename: 'tipjar-how-it-works-og.png' },
    { id: 'tipjar-embed', filename: 'tipjar-embed-og.png' },
    
    // DJ Dash OG Images
    { id: 'djdash', filename: 'djdash-og-image.png' },
    { id: 'djdash-pricing', filename: 'djdash-pricing-og.png' },
    { id: 'djdash-features', filename: 'djdash-features-og.png' },
    { id: 'djdash-business', filename: 'djdash-business-og.png' },
    { id: 'djdash-how-it-works', filename: 'djdash-how-it-works-og.png' },
    
    // M10 DJ Company / General OG Images
    { id: 'quote-booking', filename: 'quote-booking-og.png' },
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const image of images) {
    try {
      await generateOGImage(image.id, image.filename);
      console.log(`✅ Successfully generated ${image.filename}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to generate ${image.filename}:`, error.message);
      failCount++;
      // Continue with next image even if one fails
    }
  }
  
  console.log('\n🎉 Finished generating all OG images!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${images.length}`);
}

// Run the script
if (require.main === module) {
  generateAllOGImages().catch(console.error);
}

module.exports = { generateOGImage, generateAllOGImages };

