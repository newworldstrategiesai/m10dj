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

// Generate all TipJar OG images
async function generateAllTipJarImages() {
  const images = [
    { id: 'tipjar', filename: 'tipjar-og-image.png' },
    { id: 'tipjar', filename: 'tipjar-open-graph-new.png' }, // Same design, different filename
    { id: 'tipjar-dashboard', filename: 'tipjar-dashboard-og.png' },
    { id: 'tipjar-crowd-requests', filename: 'tipjar-crowd-requests-og.png' },
    { id: 'tipjar-public-requests', filename: 'tipjar-public-requests-og.png' }
  ];
  
  for (const image of images) {
    try {
      await generateOGImage(image.id, image.filename);
      console.log(`✅ Successfully generated ${image.filename}\n`);
    } catch (error) {
      console.error(`❌ Failed to generate ${image.filename}:`, error.message);
      // Continue with next image even if one fails
    }
  }
  
  console.log('🎉 Finished generating all TipJar OG images!');
}

// Run the script
generateAllTipJarImages().catch(console.error);

