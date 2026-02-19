import opentype from "opentype.js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load both fonts
const lightFont = opentype.loadSync(resolve(__dirname, "Oswald-Light.ttf"));
const mediumFont = opentype.loadSync(resolve(__dirname, "Oswald-Medium.ttf"));

const fontSize = 28;
const y = 28;

// Generate "IHAVENO" with Light font
const text1 = "IHAVENO";
const path1 = lightFont.getPath(text1, 0, y, fontSize);
const pathData1 = path1.toPathData(2);
const width1 = lightFont.getAdvanceWidth(text1, fontSize);

// Generate "MENU" with Medium font
const text2 = "MENU";
const path2 = mediumFont.getPath(text2, width1, y, fontSize);
const pathData2 = path2.toPathData(2);
const width2 = mediumFont.getAdvanceWidth(text2, fontSize);

const totalWidth = width1 + width2;

// Strikethrough line over MENU
const strikeX1 = width1 - 2;
const strikeX2 = totalWidth + 2;
const strikeY = 17;

// Create the full SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(totalWidth + 10)} 40" fill="none">
  <!-- IHAVENO (Light) -->
  <path d="${pathData1}" fill="#111827"/>
  <!-- MENU (Medium) -->
  <path d="${pathData2}" fill="#111827"/>
  <!-- Strikethrough line over MENU -->
  <line x1="${strikeX1}" y1="${strikeY}" x2="${strikeX2}" y2="${strikeY}" stroke="#111827" stroke-width="2.5"/>
</svg>`;

// Write SVG file
const outputPath = resolve(__dirname, "../web/public/logo.svg");
writeFileSync(outputPath, svgContent);

console.log(`✅ Logo SVG generated: ${outputPath}`);
console.log(`   IHAVENO (Light): ${width1}px`);
console.log(`   MENU (Medium): ${width2}px`);
console.log(`   Total width: ${totalWidth}px`);
console.log(`   Strikethrough: x1=${strikeX1}, x2=${strikeX2}`);

// Generate favicon (M with strikethrough)
const faviconSize = 32;
const faviconFontSize = 24;
const faviconPath = mediumFont.getPath("M", 7, 26, faviconFontSize);
const faviconPathData = faviconPath.toPathData(2);

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faviconSize} ${faviconSize}" fill="none">
  <rect width="${faviconSize}" height="${faviconSize}" rx="6" fill="white"/>
  <path d="${faviconPathData}" fill="#111827"/>
  <line x1="4" y1="16" x2="26" y2="16" stroke="#111827" stroke-width="2.5"/>
</svg>`;

const faviconOutputPath = resolve(__dirname, "../web/public/favicon.svg");
writeFileSync(faviconOutputPath, faviconSvg);
console.log(`✅ Favicon SVG generated: ${faviconOutputPath}`);

// Generate logo-symbol (64x64)
const symbolSize = 64;
const symbolFontSize = 48;
const symbolPath = mediumFont.getPath("M", 12, 52, symbolFontSize);
const symbolPathData = symbolPath.toPathData(2);

const symbolSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${symbolSize} ${symbolSize}" fill="none">
  <rect width="${symbolSize}" height="${symbolSize}" rx="12" fill="white"/>
  <path d="${symbolPathData}" fill="#111827"/>
  <line x1="8" y1="32" x2="56" y2="32" stroke="#111827" stroke-width="4"/>
</svg>`;

const symbolOutputPath = resolve(__dirname, "../web/public/logo-symbol.svg");
writeFileSync(symbolOutputPath, symbolSvg);
console.log(`✅ Logo symbol SVG generated: ${symbolOutputPath}`);

// Generate apple-touch-icon (180x180)
const appleSize = 180;
const appleFontSize = 120;
const applePath = mediumFont.getPath("M", 30, 135, appleFontSize);
const applePathData = applePath.toPathData(2);

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${appleSize} ${appleSize}" fill="none">
  <rect width="${appleSize}" height="${appleSize}" rx="36" fill="white"/>
  <path d="${applePathData}" fill="#111827"/>
  <line x1="20" y1="90" x2="160" y2="90" stroke="#111827" stroke-width="10"/>
</svg>`;

const appleOutputPath = resolve(
  __dirname,
  "../web/public/apple-touch-icon.svg",
);
writeFileSync(appleOutputPath, appleSvg);
console.log(`✅ Apple touch icon SVG generated: ${appleOutputPath}`);

// Generate og-image (1200x630)
const ogWidth = 1200;
const ogHeight = 630;
const ogFontSize = 72;

// Calculate text widths for centering
const ogWidth1 = lightFont.getAdvanceWidth("IHAVENO", ogFontSize);
const ogWidth2 = mediumFont.getAdvanceWidth("MENU", ogFontSize);
const ogTotalTextWidth = ogWidth1 + ogWidth2;
const ogStartX = (ogWidth - ogTotalTextWidth) / 2;
const ogTextY = ogHeight / 2 + ogFontSize / 3;

const ogPath1 = lightFont.getPath("IHAVENO", ogStartX, ogTextY, ogFontSize);
const ogPathData1 = ogPath1.toPathData(2);
const ogPath2 = mediumFont.getPath("MENU", ogStartX + ogWidth1, ogTextY, ogFontSize);
const ogPathData2 = ogPath2.toPathData(2);

const ogStrikeX1 = ogStartX + ogWidth1 - 5;
const ogStrikeX2 = ogStartX + ogTotalTextWidth + 5;
const ogStrikeY = ogHeight / 2;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ogWidth} ${ogHeight}" fill="none">
  <!-- Background -->
  <rect width="${ogWidth}" height="${ogHeight}" fill="#FAFAFA"/>

  <!-- Decorative food icons -->
  <text x="100" y="150" font-size="80" opacity="0.15">🥕</text>
  <text x="1000" y="200" font-size="80" opacity="0.15">🍳</text>
  <text x="150" y="500" font-size="80" opacity="0.15">🥗</text>
  <text x="950" y="520" font-size="80" opacity="0.15">🍲</text>

  <!-- IHAVENO (Light) -->
  <path d="${ogPathData1}" fill="#111827"/>
  <!-- MENU (Medium) -->
  <path d="${ogPathData2}" fill="#111827"/>
  <!-- Strikethrough -->
  <line x1="${ogStrikeX1}" y1="${ogStrikeY}" x2="${ogStrikeX2}" y2="${ogStrikeY}" stroke="#111827" stroke-width="6"/>

  <!-- Tagline -->
  <text x="${ogWidth / 2}" y="${ogTextY + 60}" text-anchor="middle" style="font-family: system-ui, sans-serif; font-size: 28px; fill: #6B7280;">Find recipes with what you have</text>

  <!-- Border -->
  <rect x="20" y="20" width="${ogWidth - 40}" height="${ogHeight - 40}" rx="20" stroke="#E5E7EB" stroke-width="2" fill="none"/>
</svg>`;

const ogOutputPath = resolve(__dirname, "../web/public/og-image.svg");
writeFileSync(ogOutputPath, ogSvg);
console.log(`✅ OG image SVG generated: ${ogOutputPath}`);
