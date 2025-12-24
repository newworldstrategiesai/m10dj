/**
 * Headless browser search utilities for music services
 * Uses Puppeteer to render JavaScript-heavy pages
 * 
 * Note: For serverless environments (Vercel), Puppeteer may not work due to:
 * - Size limits (Puppeteer + Chromium is ~300MB)
 * - Memory constraints
 * - Cold start times
 * 
 * Alternatives for production:
 * - Browserless.io service (recommended for Vercel)
 * - Playwright with @playwright/browser-chromium (lighter)
 * - External API services
 * - Self-hosted browser service
 */

let puppeteer = null;

/**
 * Check if we're in a serverless environment
 */
function isServerless() {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.GOOGLE_CLOUD_FUNCTION ||
    process.env.AZURE_FUNCTIONS_ENVIRONMENT
  );
}

/**
 * Lazy load Puppeteer only when needed
 * This prevents loading it in serverless environments where it might not work
 */
async function getPuppeteer() {
  if (puppeteer) {
    return puppeteer;
  }

  // Warn if in serverless environment
  if (isServerless()) {
    console.warn('[Browser] Running in serverless environment. Puppeteer may not work. Consider using Browserless.io or similar service.');
  }

  try {
    // Use dynamic import to avoid bundling issues
    puppeteer = await import('puppeteer');
    return puppeteer;
  } catch (error) {
    console.warn('Failed to load Puppeteer:', error.message);
    if (isServerless()) {
      console.warn('[Browser] For serverless, consider using puppeteer-core with external Chrome or a browser service.');
    }
    return null;
  }
}

/**
 * Get optimized launch options for Puppeteer
 */
function getLaunchOptions() {
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process', // Important for serverless (reduces memory)
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  };

  // If in serverless and Chrome path is provided via env, use it
  if (isServerless() && process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH;
  }

  return launchOptions;
}

/**
 * Search Spotify using headless browser
 */
export async function searchSpotifyWithBrowser(songTitle, artist) {
  console.log(`[Browser] Starting Spotify search for: "${songTitle}" by "${artist}"`);
  
  const pptr = await getPuppeteer();
  if (!pptr) {
    console.warn('[Browser] ❌ Puppeteer not available, cannot use headless browser');
    return null;
  }
  
  console.log('[Browser] ✅ Puppeteer loaded successfully');

  let browser = null;
  try {
    console.log('[Browser] Launching browser...');
    
    // Launch browser with optimized options
    browser = await pptr.default.launch(getLaunchOptions());
    console.log('[Browser] ✅ Browser launched');

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://open.spotify.com/search/${searchQuery}`;
    
    // Navigate and wait for content to load
    console.log(`[Browser] Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    console.log('[Browser] ✅ Page loaded');

    // Wait for search results to appear (Spotify uses specific selectors)
    console.log('[Browser] Waiting for track links to appear...');
    try {
      await page.waitForSelector('a[href*="/track/"]', { timeout: 10000 });
      console.log('[Browser] ✅ Track links found in DOM');
    } catch (e) {
      console.log('[Browser] ⚠️ No track links found in results (timeout or not present)');
      console.log('[Browser] Checking page content...');
      
      // Try to get page content for debugging
      const pageContent = await page.content();
      console.log(`[Browser] Page content length: ${pageContent.length} chars`);
      
      // Check if page has any links at all
      const allLinks = await page.$$eval('a', links => links.map(l => l.href));
      console.log(`[Browser] Found ${allLinks.length} total links on page`);
      if (allLinks.length > 0) {
        console.log('[Browser] Sample links:', allLinks.slice(0, 5));
      }
      
      return null;
    }

    // Extract the first track link
    const trackUrl = await page.evaluate(() => {
      // Find first track link
      const trackLink = document.querySelector('a[href*="/track/"]');
      if (trackLink) {
        const href = trackLink.getAttribute('href');
        if (href) {
          // Ensure it's a full URL
          return href.startsWith('http') ? href : `https://open.spotify.com${href}`;
        }
      }
      return null;
    });

    if (trackUrl) {
      console.log(`[Browser] ✅ Spotify link found: ${trackUrl}`);
      return trackUrl;
    }

    return null;
  } catch (error) {
    console.error('[Browser] ❌ Spotify search error:', error.message);
    console.error('[Browser] Error stack:', error.stack);
    return null;
  } finally {
    if (browser) {
      console.log('[Browser] Closing browser...');
      await browser.close();
      console.log('[Browser] ✅ Browser closed');
    }
  }
}

/**
 * Search Tidal using headless browser
 */
export async function searchTidalWithBrowser(songTitle, artist) {
  console.log(`[Browser] Starting Tidal search for: "${songTitle}" by "${artist}"`);
  
  const pptr = await getPuppeteer();
  if (!pptr) {
    console.warn('[Browser] ❌ Puppeteer not available');
    return null;
  }
  
  console.log('[Browser] ✅ Puppeteer loaded');

  let browser = null;
  try {
    console.log('[Browser] Launching browser...');
    browser = await pptr.default.launch(getLaunchOptions());
    console.log('[Browser] ✅ Browser launched');

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://listen.tidal.com/search?q=${searchQuery}`;
    
    console.log(`[Browser] Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    console.log('[Browser] ✅ Page loaded');

    // Wait for Tidal search results
    console.log('[Browser] Waiting for track links...');
    try {
      await page.waitForSelector('a[href*="/track/"]', { timeout: 10000 });
      console.log('[Browser] ✅ Track links found');
    } catch (e) {
      console.log('[Browser] ⚠️ No track links found (timeout)');
      const pageContent = await page.content();
      console.log(`[Browser] Page content length: ${pageContent.length} chars`);
      return null;
    }

    const trackUrl = await page.evaluate(() => {
      const trackLink = document.querySelector('a[href*="/track/"]');
      if (trackLink) {
        const href = trackLink.getAttribute('href');
        if (href) {
          return href.startsWith('http') ? href : `https://listen.tidal.com${href}`;
        }
      }
      return null;
    });

    if (trackUrl) {
      console.log(`[Browser] ✅ Tidal link found: ${trackUrl}`);
      return trackUrl;
    }

    return null;
  } catch (error) {
    console.error('[Browser] ❌ Tidal search error:', error.message);
    console.error('[Browser] Error stack:', error.stack);
    return null;
  } finally {
    if (browser) {
      console.log('[Browser] Closing browser...');
      await browser.close();
    }
  }
}

/**
 * Search Apple Music using headless browser
 */
export async function searchAppleMusicWithBrowser(songTitle, artist) {
  console.log(`[Browser] Starting Apple Music search for: "${songTitle}" by "${artist}"`);
  
  const pptr = await getPuppeteer();
  if (!pptr) {
    console.warn('[Browser] ❌ Puppeteer not available');
    return null;
  }
  
  console.log('[Browser] ✅ Puppeteer loaded');

  let browser = null;
  try {
    console.log('[Browser] Launching browser...');
    browser = await pptr.default.launch(getLaunchOptions());
    console.log('[Browser] ✅ Browser launched');

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://music.apple.com/us/search?term=${searchQuery}`;
    
    console.log(`[Browser] Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    console.log('[Browser] ✅ Page loaded');

    // Wait for Apple Music search results
    console.log('[Browser] Waiting for song links...');
    try {
      await page.waitForSelector('a[href*="/song/"]', { timeout: 10000 });
      console.log('[Browser] ✅ Song links found');
    } catch (e) {
      console.log('[Browser] ⚠️ No song links found (timeout)');
      const pageContent = await page.content();
      console.log(`[Browser] Page content length: ${pageContent.length} chars`);
      return null;
    }

    const songUrl = await page.evaluate(() => {
      const songLink = document.querySelector('a[href*="/song/"]');
      if (songLink) {
        const href = songLink.getAttribute('href');
        if (href) {
          return href.startsWith('http') ? href : `https://music.apple.com${href}`;
        }
      }
      return null;
    });

    if (songUrl) {
      console.log(`[Browser] ✅ Apple Music link found: ${songUrl}`);
      return songUrl;
    }

    return null;
  } catch (error) {
    console.error('[Browser] ❌ Apple Music search error:', error.message);
    console.error('[Browser] Error stack:', error.stack);
    return null;
  } finally {
    if (browser) {
      console.log('[Browser] Closing browser...');
      await browser.close();
    }
  }
}

