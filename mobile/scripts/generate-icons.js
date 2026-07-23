// Generate PWA icons from source SVG
// Usage: node scripts/generate-icons.js
// Requires: sharp (available as transitive dep of vite-plugin-pwa)

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'public', 'icons');
const svgPath = resolve(iconsDir, 'icon.svg');

mkdirSync(iconsDir, { recursive: true });

const sizes = [
  { name: 'icon-192-v2.png', size: 192 },
  { name: 'icon-512-v2.png', size: 512 },
  { name: 'apple-touch-icon-v2.png', size: 180 },
];

const svg = readFileSync(svgPath);

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp not available. Install it: npm install -D sharp');
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(resolve(iconsDir, name));
    const stat = readFileSync(resolve(iconsDir, name)).length;
    console.log(`✓ ${name} (${size}x${size}) — ${(stat / 1024).toFixed(1)} KB`);
  }
  console.log('All icons generated.');
}

main().catch(console.error);
