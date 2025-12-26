/**
 * Palette audit (non-blocking utility)
 *
 * Goal: help enforce the "mostly #fcba00 + white/black + grays" policy site-wide.
 * This scans key source folders for:
 * - hex colors
 * - Tailwind color utility families (purple/blue/etc)
 *
 * Usage:
 *   node scripts/palette-audit.mjs
 *
 * Notes:
 * - This is intentionally simple and conservative.
 * - It ignores docs/data/public assets and focuses on runtime code.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'pages', 'components', 'styles', 'utils'].map((p) => path.join(ROOT, p));

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const TW_COLOR_RE =
  /\b(?:text|bg|border|ring|outline|from|via|to)-(purple|pink|blue|red|green|emerald|teal|indigo|violet|cyan|amber|yellow|orange|lime|rose|fuchsia|sky)-\d{2,3}\b/gi;

// Allowed: brand + neutral grays (and transparent/white/black variants are fine)
const ALLOWED_HEX = new Set([
  '#fcba00',
  '#FCBA00',
  '#000',
  '#000000',
  '#fff',
  '#ffffff',
  '#FFF',
  '#FFFFFF',
]);

// We allow Tailwind's gray + brand tokens. Everything else is flagged.
const ALLOWED_TW_FAMILIES = new Set(['gray']);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // ignore build/cache dirs if present
      if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist') continue;
      out.push(...walk(full));
    } else if (e.isFile()) {
      // focus on code-ish files
      if (!/\.(js|jsx|ts|tsx|css)$/.test(e.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p);
}

const files = TARGET_DIRS.flatMap(walk);
const findings = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');

  // hex colors
  const hexMatches = src.match(HEX_RE) || [];
  for (const m of hexMatches) {
    if (ALLOWED_HEX.has(m)) continue;
    findings.push({ file: rel(file), kind: 'hex', value: m });
  }

  // tailwind families
  let tw;
  while ((tw = TW_COLOR_RE.exec(src)) !== null) {
    const family = (tw[1] || '').toLowerCase();
    if (ALLOWED_TW_FAMILIES.has(family)) continue;
    findings.push({ file: rel(file), kind: 'tailwind', value: tw[0] });
  }
}

const byFile = new Map();
for (const f of findings) {
  const arr = byFile.get(f.file) || [];
  arr.push(f);
  byFile.set(f.file, arr);
}

if (findings.length === 0) {
  console.log('✅ Palette audit: no violations found in app/pages/components/styles/utils.');
  process.exit(0);
}

console.log(`⚠️  Palette audit: found ${findings.length} potential violations across ${byFile.size} files.\n`);

// Print top files first
const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [file, items] of sorted.slice(0, 50)) {
  const counts = items.reduce(
    (acc, it) => {
      acc[it.kind] = (acc[it.kind] || 0) + 1;
      return acc;
    },
    /** @type {Record<string, number>} */ ({})
  );
  console.log(`- ${file} (hex: ${counts.hex || 0}, tailwind: ${counts.tailwind || 0})`);
}

console.log('\nTip: start with shared components (Header/Button) and high-traffic pages (/, /requests, TipJar flows).');
process.exit(1);


