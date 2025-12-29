#!/usr/bin/env node
/**
 * Product Sync Audit Script (JavaScript version)
 * 
 * Compares TipJar.live and M10DJCompany.com (flagship) pages/components
 * to identify differences, missing features, and sync opportunities.
 * 
 * Usage:
 *   node scripts/sync-audit.js
 *   node scripts/sync-audit.js --json
 *   npm run audit:sync
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');

const PRODUCTS = {
  flagship: {
    name: 'M10DJCompany (Flagship)',
    domain: 'm10djcompany.com',
    pages: [
      'pages/requests.js',
      'pages/index.js',
      'pages/services.js',
      'pages/contact.js',
      'pages/private-parties.js',
    ],
    components: 'components/company',
    marketing: 'pages',
    requestsPage: 'pages/requests.js',
  },
  tipjar: {
    name: 'TipJar.live',
    domain: 'tipjar.live',
    pages: [
      'app/(marketing)/tipjar/page.tsx',
      'app/(marketing)/tipjar/pricing/page.tsx',
      'app/(marketing)/tipjar/features/page.tsx',
      'app/(marketing)/tipjar/how-it-works/page.tsx',
      'app/live/[username]/page.tsx',
    ],
    components: 'components/tipjar',
    marketing: 'app/(marketing)/tipjar',
    requestsPage: 'app/live/[username]/page.tsx',
  },
  djdash: {
    name: 'DJDash.net',
    domain: 'djdash.net',
    pages: [
      'app/(marketing)/djdash/page.tsx',
      'app/(marketing)/djdash/pricing/page.tsx',
      'app/(marketing)/djdash/features/page.tsx',
      'app/(marketing)/djdash/how-it-works/page.tsx',
    ],
    components: 'components/djdash',
    marketing: 'app/(marketing)/djdash',
    requestsPage: null,
  },
};

// Feature patterns to search for in code
const FEATURE_PATTERNS = {
  // UI Features
  heroSection: /hero|Hero|<section[^>]*class[^>]*hero/gi,
  featureCards: /FeatureCard|feature-card|features.*grid/gi,
  testimonials: /testimonial|Testimonial|reviews?.*slider/gi,
  pricingCards: /PricingCard|pricing.*card|price.*tier/gi,
  ctaSection: /cta|CTA|call.*action|Start.*Free/gi,
  faqSection: /faq|FAQ|frequently.*asked/gi,
  socialProof: /social.*proof|trusted.*by|companies.*use|\d+\+?\s*(DJs?|users?|customers?)/gi,
  
  // Functional Features
  songSearch: /song.*search|searchSongs|spotify.*search|useSongSearch/gi,
  paymentFlow: /payment|stripe|checkout|PaymentMethod|Stripe/gi,
  tipSubmission: /tip|Tip|sendTip|createTip|TipJarInStream/gi,
  requestQueue: /queue|Queue|requests.*list|requestQueue/gi,
  qrCode: /qr.*code|QRCode|QrCode/gi,
  realtime: /realtime|Realtime|supabase.*channel|broadcast|useEffect.*subscribe/gi,
  bidding: /bidding|Bidding|auction|bid.*amount/gi,
  shoutouts: /shoutout|Shoutout/gi,
  
  // Auth & User Features
  authentication: /signin|SignIn|login|auth|createClient.*supabase/gi,
  userDashboard: /dashboard|Dashboard|account/gi,
  
  // Branding
  whiteLabelBranding: /white.*label|branding|customBranding|organization.*logo/gi,
  darkMode: /dark:.*|dark.*mode|theme-dark/gi,
  
  // Mobile/UX
  mobileOptimized: /sm:|md:|lg:|responsive|mobile.*menu|hamburger/gi,
  animations: /animate-|transition-|motion|framer/gi,
  
  // Analytics & SEO
  analytics: /analytics|tracking|gtag|mixpanel|useAnalytics/gi,
  seoOptimized: /metadata|Metadata|Head>|title>|description/gi,
  structuredData: /ld\+json|schema\.org|jsonLd|ProductStructuredData|OrganizationSchema/gi,
};

// Component mapping between products
const COMPONENT_MAPPING = {
  'Header': {
    flagship: 'components/company/Header.js',
    tipjar: 'components/tipjar/Header.tsx',
    djdash: 'components/djdash/Header.tsx',
  },
  'Footer': {
    flagship: 'components/company/Footer.js',
    tipjar: 'components/tipjar/Footer.tsx',
    djdash: 'components/djdash/Footer.tsx',
  },
  'FeatureCard': {
    flagship: null,
    tipjar: 'components/tipjar/FeatureCard.tsx',
    djdash: null,
  },
  'TestimonialCard': {
    flagship: 'components/company/TestimonialSlider.js',
    tipjar: 'components/tipjar/TestimonialCard.tsx',
    djdash: null,
  },
  'PricingCard': {
    flagship: null,
    tipjar: 'components/tipjar/PricingCard.tsx',
    djdash: null,
  },
  'FAQ': {
    flagship: 'components/company/FAQSection.js',
    tipjar: 'components/tipjar/FAQ.tsx',
    djdash: null,
  },
  'ContactForm': {
    flagship: 'components/company/ContactForm.js',
    tipjar: null,
    djdash: 'components/djdash/DJInquiryForm.tsx',
  },
  'PaymentAmountSelector': {
    flagship: 'components/crowd-request/PaymentAmountSelector.js',
    tipjar: null,
    djdash: null,
    shared: true,
  },
  'PaymentMethodSelection': {
    flagship: 'components/crowd-request/PaymentMethodSelection.js',
    tipjar: null,
    djdash: null,
    shared: true,
  },
  'PaymentSuccessScreen': {
    flagship: 'components/crowd-request/PaymentSuccessScreen.js',
    tipjar: null,
    djdash: null,
    shared: true,
  },
  'StickyCTA': {
    flagship: null,
    tipjar: 'components/tipjar/StickyCTA.tsx',
    djdash: null,
  },
  'TipJarInStream': {
    flagship: null,
    tipjar: 'components/TipJarInStream.tsx',
    djdash: null,
  },
  'LiveVideoPlayer': {
    flagship: null,
    tipjar: 'components/LiveVideoPlayer.tsx',
    djdash: null,
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

function fileExists(filePath) {
  return fs.existsSync(path.join(PROJECT_ROOT, filePath));
}

function readFile(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf-8');
  }
  return null;
}

function getFileStats(filePath) {
  const content = readFile(filePath);
  if (content) {
    return {
      lines: content.split('\n').length,
      size: Buffer.byteLength(content, 'utf-8'),
    };
  }
  return null;
}

function findFeatures(content) {
  const features = {};
  for (const [feature, pattern] of Object.entries(FEATURE_PATTERNS)) {
    // Create a new regex instance for each test to avoid lastIndex issues
    const regex = new RegExp(pattern.source, pattern.flags);
    features[feature] = regex.test(content);
  }
  return features;
}

function extractImports(content) {
  const importRegex = /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function extractComponents(content) {
  const componentRegex = /<([A-Z][a-zA-Z0-9]+)/g;
  const components = new Set();
  let match;
  while ((match = componentRegex.exec(content)) !== null) {
    components.add(match[1]);
  }
  return Array.from(components);
}

function listDirectory(dirPath) {
  const fullPath = path.join(PROJECT_ROOT, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    return fs.readdirSync(fullPath);
  }
  return [];
}

// =============================================================================
// Audit Functions
// =============================================================================

function auditPage(filePath) {
  const content = readFile(filePath);
  return {
    path: filePath,
    exists: content !== null,
    stats: getFileStats(filePath),
    features: content ? findFeatures(content) : {},
    imports: content ? extractImports(content) : [],
    components: content ? extractComponents(content) : [],
  };
}

function auditComponents() {
  const audits = [];
  
  for (const [name, paths] of Object.entries(COMPONENT_MAPPING)) {
    const flagshipExists = paths.flagship ? fileExists(paths.flagship) : false;
    const tipjarExists = paths.tipjar ? fileExists(paths.tipjar) : false;
    const djdashExists = paths.djdash ? fileExists(paths.djdash) : false;
    
    let recommendation = '';
    let priority = 'low';
    
    if (flagshipExists && !tipjarExists && !paths.shared) {
      recommendation = 'Consider creating TipJar version or extracting to shared/';
      priority = 'medium';
    } else if (tipjarExists && !flagshipExists) {
      recommendation = 'TipJar has this, flagship could benefit';
      priority = 'low';
    } else if (!flagshipExists && !tipjarExists && !paths.shared) {
      recommendation = 'Component mapped but not implemented';
      priority = 'low';
    } else if (paths.shared) {
      recommendation = 'Shared component - TipJar should import from crowd-request/';
      priority = 'high';
    } else {
      recommendation = 'Both products have this component - verify they are in sync';
      priority = 'medium';
    }
    
    audits.push({
      name,
      flagship: paths.flagship,
      tipjar: paths.tipjar,
      djdash: paths.djdash,
      flagshipExists,
      tipjarExists,
      djdashExists,
      isShared: paths.shared || false,
      recommendation,
      priority,
    });
  }
  
  return audits;
}

function compareFeatures() {
  // Read main pages from each product
  const flagshipContent = readFile(PRODUCTS.flagship.requestsPage) || '';
  const tipjarContent = readFile(PRODUCTS.tipjar.requestsPage) || '';
  
  // Also check marketing pages
  const flagshipMarketingContent = readFile('pages/index.js') || '';
  const tipjarMarketingContent = readFile('app/(marketing)/tipjar/page.tsx') || '';
  
  const combinedFlagship = flagshipContent + flagshipMarketingContent;
  const combinedTipjar = tipjarContent + tipjarMarketingContent;
  
  const flagshipFeatures = findFeatures(combinedFlagship);
  const tipjarFeatures = findFeatures(combinedTipjar);
  const djdashContent = readFile('app/(marketing)/djdash/page.tsx') || '';
  const djdashFeatures = findFeatures(djdashContent);
  
  const comparisons = [];
  
  for (const feature of Object.keys(FEATURE_PATTERNS)) {
    const inFlagship = flagshipFeatures[feature];
    const inTipjar = tipjarFeatures[feature];
    const inDjdash = djdashFeatures[feature];
    
    let status = 'synced';
    let priority = 'low';
    
    if (inFlagship && !inTipjar) {
      status = 'missing-tipjar';
      priority = 'high';
    } else if (!inFlagship && inTipjar) {
      status = 'tipjar-only';
      priority = 'low';
    } else if (inFlagship && inTipjar) {
      status = 'synced';
      priority = 'none';
    } else {
      status = 'neither';
      priority = 'low';
    }
    
    comparisons.push({
      feature,
      flagship: inFlagship,
      tipjar: inTipjar,
      djdash: inDjdash,
      status,
      priority,
    });
  }
  
  return comparisons;
}

function findSharedComponents() {
  const sharedDir = listDirectory('components/ui');
  const crowdRequestDir = listDirectory('components/crowd-request');
  const flagshipDir = listDirectory('components/company');
  const tipjarDir = listDirectory('components/tipjar');
  const djdashDir = listDirectory('components/djdash');
  
  const flagshipComponents = new Set(flagshipDir.map(f => f.replace(/\.(js|jsx|ts|tsx)$/, '')));
  const tipjarComponents = new Set(tipjarDir.map(f => f.replace(/\.(js|jsx|ts|tsx)$/, '')));
  const djdashComponents = new Set(djdashDir.map(f => f.replace(/\.(js|jsx|ts|tsx)$/, '')));
  
  const shared = [];
  const flagshipOnly = [];
  const tipjarOnly = [];
  const djdashOnly = [];
  
  for (const comp of flagshipComponents) {
    if (tipjarComponents.has(comp) || djdashComponents.has(comp)) {
      shared.push(comp);
    } else {
      flagshipOnly.push(comp);
    }
  }
  
  for (const comp of tipjarComponents) {
    if (!flagshipComponents.has(comp) && !djdashComponents.has(comp)) {
      tipjarOnly.push(comp);
    }
  }
  
  for (const comp of djdashComponents) {
    if (!flagshipComponents.has(comp) && !tipjarComponents.has(comp)) {
      djdashOnly.push(comp);
    }
  }
  
  return { 
    shared, 
    flagshipOnly, 
    tipjarOnly, 
    djdashOnly,
    crowdRequest: crowdRequestDir.map(f => f.replace(/\.(js|jsx|ts|tsx)$/, '')),
    uiComponents: sharedDir.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')).length,
  };
}

function analyzeRequestsPage() {
  const content = readFile(PRODUCTS.flagship.requestsPage);
  if (!content) return null;
  
  const stats = getFileStats(PRODUCTS.flagship.requestsPage);
  const imports = extractImports(content);
  const components = extractComponents(content);
  
  // Find major sections in the requests page
  const sections = {
    hasHeader: /Header/i.test(content),
    hasCoverPhoto: /coverPhoto|cover.*photo|background.*image/i.test(content),
    hasSongSearch: /searchSongs|song.*search|spotify/i.test(content),
    hasShoutouts: /shoutout/i.test(content),
    hasPayment: /payment|stripe|checkout/i.test(content),
    hasBidding: /bidding|Bidding/i.test(content),
    hasTipping: /tip|Tip/i.test(content),
    hasQRCode: /qr|QR/i.test(content),
    hasBranding: /branding|white.*label|customLogo/i.test(content),
  };
  
  return {
    stats,
    imports: imports.length,
    components: components.length,
    uniqueComponents: components,
    sections,
    needsRefactor: stats.lines > 500,
    refactorSuggestions: stats.lines > 500 ? [
      'Extract SongSearchSection component',
      'Extract PaymentSection component',
      'Extract BiddingSection component',
      'Extract ShoutoutSection component',
      'Create RequestsPageHeader component',
      'Move payment logic to custom hooks',
    ] : [],
  };
}

// =============================================================================
// Report Generation
// =============================================================================

function generateReport() {
  console.log('\n🔍 Running Product Sync Audit...\n');
  
  // Audit pages
  const flagshipPages = PRODUCTS.flagship.pages.map(auditPage);
  const tipjarPages = PRODUCTS.tipjar.pages.map(auditPage);
  
  // Audit components
  const componentAudits = auditComponents();
  
  // Compare features
  const featureComparisons = compareFeatures();
  
  // Find shared components
  const sharedComponents = findSharedComponents();
  
  // Analyze requests page
  const requestsPageAnalysis = analyzeRequestsPage();
  
  // Calculate summary
  const syncedFeatures = featureComparisons.filter(f => f.status === 'synced').length;
  const missingInTipjar = featureComparisons.filter(f => f.status === 'missing-tipjar').length;
  const tipjarOnlyFeatures = featureComparisons.filter(f => f.status === 'tipjar-only').length;
  
  // Generate recommendations
  const recommendations = [];
  
  // High priority: Missing features
  const highPriorityFeatures = featureComparisons.filter(f => f.priority === 'high');
  if (highPriorityFeatures.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      type: 'feature-sync',
      title: `${highPriorityFeatures.length} critical features missing in TipJar`,
      items: highPriorityFeatures.map(f => f.feature),
      action: 'Add these features to TipJar pages or extract shared components',
    });
  }
  
  // High priority: Shared components not being used
  const sharedNotUsed = componentAudits.filter(c => c.isShared && !c.tipjarExists);
  if (sharedNotUsed.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      type: 'component-reuse',
      title: `${sharedNotUsed.length} shared payment components not used in TipJar`,
      items: sharedNotUsed.map(c => `${c.name} (${c.flagship})`),
      action: 'Import and use these in TipJar for consistency',
    });
  }
  
  // Medium priority: Component sync
  const needsSync = componentAudits.filter(c => c.flagshipExists && c.tipjarExists);
  if (needsSync.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'component-sync',
      title: `${needsSync.length} components exist in both products`,
      items: needsSync.map(c => c.name),
      action: 'Verify these are in sync or consider extracting to shared/',
    });
  }
  
  // Refactoring recommendation
  if (requestsPageAnalysis && requestsPageAnalysis.needsRefactor) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'refactor',
      title: `Flagship requests page is ${requestsPageAnalysis.stats.lines} lines`,
      items: requestsPageAnalysis.refactorSuggestions,
      action: 'Break into smaller components that can be shared across products',
    });
  }
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalFeatures: featureComparisons.length,
      syncedFeatures,
      missingInTipjar,
      tipjarOnlyFeatures,
      flagshipRequestsLines: requestsPageAnalysis?.stats?.lines || 0,
    },
    pages: {
      flagship: flagshipPages,
      tipjar: tipjarPages,
    },
    components: componentAudits,
    features: featureComparisons,
    sharedComponents,
    requestsPageAnalysis,
    recommendations,
  };
}

function printReport(report) {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  };
  
  const c = (color, text) => `${colors[color]}${text}${colors.reset}`;
  
  console.log(c('bright', '═══════════════════════════════════════════════════════════════════'));
  console.log(c('bright', '                    PRODUCT SYNC AUDIT REPORT'));
  console.log(c('bright', '═══════════════════════════════════════════════════════════════════'));
  console.log(`Generated: ${report.timestamp}\n`);
  
  // Summary
  console.log(c('cyan', '📊 SUMMARY'));
  console.log('───────────────────────────────────────────────────────────────────');
  console.log(`Total Features Checked:       ${report.summary.totalFeatures}`);
  console.log(`${c('green', '✅')} Synced Features:            ${report.summary.syncedFeatures}`);
  console.log(`${c('red', '🔴')} Missing in TipJar:          ${report.summary.missingInTipjar}`);
  console.log(`${c('blue', '🔵')} TipJar-Only Features:       ${report.summary.tipjarOnlyFeatures}`);
  console.log(`📄 Flagship Requests Page:    ${report.summary.flagshipRequestsLines} lines`);
  console.log('');
  
  // Feature Comparison
  console.log(c('cyan', '🔧 FEATURE COMPARISON'));
  console.log('───────────────────────────────────────────────────────────────────');
  console.log('Feature                  │ Flagship │ TipJar │ Status');
  console.log('─────────────────────────┼──────────┼────────┼─────────────────');
  
  report.features.forEach(f => {
    const featureName = f.feature.padEnd(24);
    const flagship = f.flagship ? c('green', '   ✅   ') : c('red', '   ❌   ');
    const tipjar = f.tipjar ? c('green', '  ✅  ') : c('red', '  ❌  ');
    
    let statusText = '';
    switch (f.status) {
      case 'synced': statusText = c('green', '✅ Synced'); break;
      case 'missing-tipjar': statusText = c('red', '🔴 MISSING IN TIPJAR'); break;
      case 'tipjar-only': statusText = c('blue', '🔵 TipJar Only'); break;
      default: statusText = '⚪ N/A';
    }
    
    console.log(`${featureName}│${flagship}│${tipjar}│ ${statusText}`);
  });
  console.log('');
  
  // Requests Page Analysis
  if (report.requestsPageAnalysis) {
    console.log(c('cyan', '📄 FLAGSHIP REQUESTS PAGE ANALYSIS'));
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`File: pages/requests.js`);
    console.log(`Lines: ${report.requestsPageAnalysis.stats.lines}`);
    console.log(`Components Used: ${report.requestsPageAnalysis.components}`);
    console.log(`Imports: ${report.requestsPageAnalysis.imports}`);
    console.log('\nSections Found:');
    for (const [section, exists] of Object.entries(report.requestsPageAnalysis.sections)) {
      console.log(`  ${exists ? c('green', '✅') : c('red', '❌')} ${section.replace('has', '')}`);
    }
    console.log('');
  }
  
  // Component Comparison
  console.log(c('cyan', '🧩 COMPONENT MAPPING'));
  console.log('───────────────────────────────────────────────────────────────────');
  
  const highPriorityComponents = report.components.filter(c => c.priority === 'high');
  const mediumPriorityComponents = report.components.filter(c => c.priority === 'medium');
  
  if (highPriorityComponents.length > 0) {
    console.log(c('red', '\n🔴 HIGH PRIORITY:'));
    highPriorityComponents.forEach(comp => {
      console.log(`  ${comp.name}:`);
      console.log(`    ${comp.recommendation}`);
      if (comp.flagship) console.log(`    Flagship: ${comp.flagship}`);
    });
  }
  
  if (mediumPriorityComponents.length > 0) {
    console.log(c('yellow', '\n🟡 MEDIUM PRIORITY:'));
    mediumPriorityComponents.forEach(comp => {
      const f = comp.flagshipExists ? c('green', '✅') : c('red', '❌');
      const t = comp.tipjarExists ? c('green', '✅') : c('red', '❌');
      console.log(`  ${comp.name}: Flagship ${f} | TipJar ${t}`);
    });
  }
  console.log('');
  
  // Shared Components
  console.log(c('cyan', '📦 SHARED COMPONENT ANALYSIS'));
  console.log('───────────────────────────────────────────────────────────────────');
  console.log(`Shared UI Components:          ${report.sharedComponents.uiComponents}`);
  console.log(`Crowd Request Components:      ${report.sharedComponents.crowdRequest.length}`);
  console.log(`  → ${report.sharedComponents.crowdRequest.join(', ')}`);
  console.log(`\nFlagship-Only Components:      ${report.sharedComponents.flagshipOnly.length}`);
  if (report.sharedComponents.flagshipOnly.length > 0) {
    console.log(`  → ${report.sharedComponents.flagshipOnly.slice(0, 5).join(', ')}${report.sharedComponents.flagshipOnly.length > 5 ? '...' : ''}`);
  }
  console.log(`TipJar-Only Components:        ${report.sharedComponents.tipjarOnly.length}`);
  if (report.sharedComponents.tipjarOnly.length > 0) {
    console.log(`  → ${report.sharedComponents.tipjarOnly.join(', ')}`);
  }
  console.log('');
  
  // Recommendations
  console.log(c('cyan', '💡 RECOMMENDATIONS'));
  console.log('───────────────────────────────────────────────────────────────────');
  
  report.recommendations.forEach((rec, idx) => {
    const priorityColor = rec.priority === 'HIGH' ? 'red' : 'yellow';
    console.log(`\n${c(priorityColor, `[${rec.priority}]`)} ${c('bright', rec.title)}`);
    console.log(`Type: ${rec.type}`);
    console.log(`Action: ${rec.action}`);
    if (rec.items.length > 0) {
      console.log('Items:');
      rec.items.slice(0, 6).forEach(item => {
        console.log(`  • ${item}`);
      });
      if (rec.items.length > 6) {
        console.log(`  ... and ${rec.items.length - 6} more`);
      }
    }
  });
  console.log('');
  
  // Quick Action Items
  console.log(c('cyan', '📋 QUICK ACTION ITEMS'));
  console.log('───────────────────────────────────────────────────────────────────');
  console.log('1. Import PaymentAmountSelector in TipJar for consistent payment UI');
  console.log('2. Extract SongSearch from pages/requests.js to shared component');
  console.log('3. Create components/shared/ directory for cross-product components');
  console.log('4. Add bidding/shoutout features to TipJar if needed');
  console.log('5. Unify Header/Footer base styles via marketing/themes.ts');
  console.log('');
  
  console.log(c('bright', '═══════════════════════════════════════════════════════════════════'));
  console.log(c('bright', '                        END OF AUDIT REPORT'));
  console.log(c('bright', '═══════════════════════════════════════════════════════════════════'));
}

function generateMarkdownReport(report) {
  let md = `# Product Sync Audit Report

**Generated:** ${report.timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Total Features Checked | ${report.summary.totalFeatures} |
| ✅ Synced Features | ${report.summary.syncedFeatures} |
| 🔴 Missing in TipJar | ${report.summary.missingInTipjar} |
| 🔵 TipJar-Only Features | ${report.summary.tipjarOnlyFeatures} |
| Flagship Requests Page | ${report.summary.flagshipRequestsLines} lines |

## Feature Comparison

| Feature | Flagship | TipJar | Status |
|---------|----------|--------|--------|
`;

  report.features.forEach(f => {
    const flagship = f.flagship ? '✅' : '❌';
    const tipjar = f.tipjar ? '✅' : '❌';
    let status = '';
    switch (f.status) {
      case 'synced': status = '✅ Synced'; break;
      case 'missing-tipjar': status = '🔴 Missing in TipJar'; break;
      case 'tipjar-only': status = '🔵 TipJar Only'; break;
      default: status = '⚪ N/A';
    }
    md += `| ${f.feature} | ${flagship} | ${tipjar} | ${status} |\n`;
  });

  md += `
## Component Mapping

### High Priority (Should Sync)

`;

  report.components.filter(c => c.priority === 'high').forEach(c => {
    md += `- **${c.name}**: ${c.recommendation}\n`;
    if (c.flagship) md += `  - Flagship: \`${c.flagship}\`\n`;
    if (c.tipjar) md += `  - TipJar: \`${c.tipjar}\`\n`;
  });

  md += `
### Medium Priority

`;

  report.components.filter(c => c.priority === 'medium').forEach(c => {
    const f = c.flagshipExists ? '✅' : '❌';
    const t = c.tipjarExists ? '✅' : '❌';
    md += `- **${c.name}**: Flagship ${f} | TipJar ${t}\n`;
  });

  md += `
## Recommendations

`;

  report.recommendations.forEach((rec, idx) => {
    md += `### ${idx + 1}. [${rec.priority}] ${rec.title}

- **Type:** ${rec.type}
- **Action:** ${rec.action}
`;
    if (rec.items.length > 0) {
      md += '- **Items:**\n';
      rec.items.forEach(item => {
        md += `  - ${item}\n`;
      });
    }
    md += '\n';
  });

  md += `
## Action Checklist

- [ ] Import PaymentAmountSelector in TipJar
- [ ] Extract SongSearch from pages/requests.js to shared component
- [ ] Create \`components/shared/\` directory
- [ ] Add missing features to TipJar if needed
- [ ] Unify Header/Footer styles via marketing/themes.ts
- [ ] Review and sync components marked as "both exist"

---

*This report was auto-generated by the Product Sync Audit script.*
`;

  return md;
}

// =============================================================================
// Main Execution
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const markdownOutput = args.includes('--markdown') || args.includes('--md');
  
  const report = generateReport();
  
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else if (markdownOutput) {
    console.log(generateMarkdownReport(report));
  } else {
    printReport(report);
  }
  
  // Save reports to file
  const reportPath = path.join(PROJECT_ROOT, 'audit-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Save JSON report
  const jsonFile = path.join(reportPath, `sync-audit-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
  
  // Save Markdown report
  const mdFile = path.join(reportPath, `sync-audit-${timestamp}.md`);
  fs.writeFileSync(mdFile, generateMarkdownReport(report));
  
  console.log(`\n📁 Reports saved to:`);
  console.log(`   JSON: ${jsonFile}`);
  console.log(`   Markdown: ${mdFile}`);
}

main();

