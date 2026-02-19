/**
 * Favicon Generator Script
 *
 * Usage:
 *   cd web && npx tsx ../scripts/generate-favicons.ts
 *
 * Prerequisites:
 *   npm install sharp --save-dev
 *
 * This script generates PNG favicons from the SVG source files.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../web/public')

// SVG to PNG conversion requires sharp
// If not installed, manual conversion instructions are provided

console.log(`
===========================================
Favicon Generation Instructions
===========================================

Since sharp requires native compilation,
you can use online tools to convert SVGs to PNGs:

1. favicon.svg (32x32) → favicon-32x32.png
2. favicon.svg (16x16) → favicon-16x16.png
3. apple-touch-icon.svg (180x180) → apple-touch-icon.png
4. logo-symbol.svg (192x192) → android-chrome-192x192.png
5. logo-symbol.svg (512x512) → android-chrome-512x512.png

Recommended tools:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/
- https://convertio.co/svg-png/

Or use ImageMagick locally:
  convert -background white -resize 32x32 favicon.svg favicon-32x32.png
  convert -background white -resize 16x16 favicon.svg favicon-16x16.png
  convert -background white -resize 180x180 apple-touch-icon.svg apple-touch-icon.png
  convert -background white -resize 192x192 logo-symbol.svg android-chrome-192x192.png
  convert -background white -resize 512x512 logo-symbol.svg android-chrome-512x512.png

For favicon.ico (multi-size), use:
  convert favicon-16x16.png favicon-32x32.png favicon.ico

===========================================
`)

// Check if SVG files exist
const files = ['logo.svg', 'logo-symbol.svg', 'favicon.svg', 'apple-touch-icon.svg']
for (const file of files) {
  try {
    readFileSync(resolve(publicDir, file))
    console.log(`✓ ${file} exists`)
  } catch {
    console.log(`✗ ${file} not found`)
  }
}
