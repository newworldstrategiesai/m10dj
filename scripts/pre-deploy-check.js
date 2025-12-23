#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * 
 * This script runs before deployment to catch runtime errors that
 * the build process might miss. It:
 * 1. Builds the application
 * 2. Starts a local server
 * 3. Tests critical pages for runtime errors
 * 4. Fails the deployment if any errors are found
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CRITICAL_PAGES = [
  '/bid',
  '/requests',
  '/',
];

const MAX_WAIT_TIME = 60000; // 60 seconds
const SERVER_START_TIMEOUT = 30000; // 30 seconds
const PORT = 3001; // Use different port to avoid conflicts

let serverProcess = null;

function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} ${message}`);
}

function cleanup() {
  if (serverProcess) {
    log('Stopping test server...', 'info');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

async function waitForServer(url, timeout = SERVER_START_TIMEOUT) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Server did not start within ${timeout}ms`);
}

async function checkPage(url, pagePath) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${url}${pagePath}`;
    log(`Testing ${pagePath}...`, 'info');
    
    const req = http.get(fullUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check for common error indicators
        const errorIndicators = [
          'Application Error',
          'Something went wrong',
          'ErrorBoundary',
          'Minified React error',
          'ReferenceError',
          'TypeError',
          'Cannot read property',
          'is not defined',
          'is not a function'
        ];
        
        const hasError = errorIndicators.some(indicator => 
          data.includes(indicator)
        );
        
        if (hasError) {
          // Extract error details
          const errorMatch = data.match(/Error[^<]*/i);
          const errorSnippet = errorMatch ? errorMatch[0].substring(0, 200) : 'Unknown error';
          
          reject(new Error(`Page ${pagePath} has runtime error: ${errorSnippet}`));
        } else if (res.statusCode >= 500) {
          reject(new Error(`Page ${pagePath} returned ${res.statusCode}`));
        } else {
          log(`${pagePath} - OK (${res.statusCode})`, 'success');
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Failed to fetch ${pagePath}: ${error.message}`));
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Request timeout for ${pagePath}`));
    });
  });
}

async function main() {
  try {
    log('Starting pre-deployment validation...', 'info');
    
    // Step 1: Build the application
    log('Building application...', 'info');
    try {
      execSync('npm run build', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      log('Build completed successfully', 'success');
    } catch (error) {
      log('Build failed!', 'error');
      process.exit(1);
    }
    
    // Step 2: Start the production server
    log(`Starting test server on port ${PORT}...`, 'info');
    serverProcess = spawn('npm', ['start'], {
      env: { ...process.env, PORT: PORT.toString() },
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    // Capture server output for debugging
    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });
    serverProcess.stderr.on('data', (data) => {
      serverOutput += data.toString();
    });
    
    // Wait for server to start
    const serverUrl = `http://localhost:${PORT}`;
    try {
      await waitForServer(serverUrl);
      log('Server started successfully', 'success');
    } catch (error) {
      log(`Server failed to start: ${error.message}`, 'error');
      log('Server output:', 'error');
      console.log(serverOutput);
      process.exit(1);
    }
    
    // Step 3: Test critical pages
    log('Testing critical pages...', 'info');
    const errors = [];
    
    for (const page of CRITICAL_PAGES) {
      try {
        await checkPage(serverUrl, page);
      } catch (error) {
        errors.push(error.message);
        log(error.message, 'error');
      }
    }
    
    // Step 4: Report results
    if (errors.length > 0) {
      log('\n❌ Pre-deployment validation FAILED!', 'error');
      log('The following pages have errors:', 'error');
      errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error}`, 'error');
      });
      log('\n⚠️  Deployment blocked to prevent breaking production.', 'warn');
      log('Please fix the errors and try again.', 'info');
      process.exit(1);
    } else {
      log('\n✅ Pre-deployment validation PASSED!', 'success');
      log('All critical pages are working correctly.', 'success');
      process.exit(0);
    }
    
  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    cleanup();
  }
}

main();

