const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePaymentOGImage() {
  console.log('🚀 Starting Payment OG image generation...');
  
  const htmlPath = path.join(__dirname, '../public/assets/generate-og-images.html');
  const outputPath = path.join(__dirname, '../public/assets/payment-og-image.png');
  
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
    
    // Hide other OG images and show only payment
    await page.evaluate(() => {
      document.getElementById('djdash').classList.add('hidden');
      document.getElementById('tipjar').classList.add('hidden');
      document.getElementById('payment').classList.remove('hidden');
      
      // Hide download buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.display = 'none';
      });
    });
    
    // Wait for the Payment element to be visible
    console.log('⏳ Waiting for content to render...');
    await page.waitForSelector('#payment', { visible: true, timeout: 10000 });
    
    // Wait a bit more for animations to settle
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Take screenshot of the Payment OG image
    console.log('📸 Capturing screenshot...');
    const element = await page.$('#payment');
    
    if (!element) {
      throw new Error('Payment element not found');
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
    
    console.log('✅ Payment OG image generated successfully!');
    console.log('📁 Saved to:', outputPath);
    
    // Verify file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log('✨ Ready to use in payment pages!');
    } else {
      throw new Error('File was not created');
    }
    
  } catch (error) {
    console.error('❌ Error generating Payment OG image:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the script
generatePaymentOGImage().catch(console.error);
