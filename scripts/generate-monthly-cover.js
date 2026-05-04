#!/usr/bin/env node
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT = process.argv[2] || path.join(__dirname, '../output/posters/monthly-cover-2026-03.png');
const LOGO = path.join(__dirname, '../logo-200.png');
const W = 900, H = 500;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const svg = `<svg width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d1b2a"/>
      <stop offset="50%" style="stop-color:#1b2838"/>
      <stop offset="100%" style="stop-color:#0d1b2a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="100%" style="stop-color:#DAA520"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- 居中布局：Logo在上，标题在下 -->
  <text x="${W/2}" y="${H/2 - 60}" font-family="sans-serif" font-size="36" font-weight="800" fill="url(#gold)" text-anchor="middle">2026年3月</text>
  <text x="${W/2}" y="${H/2 - 15}" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="middle" letter-spacing="6">赛事月报</text>
</svg>`;

const LOGO_S = 80;

// 1. 裁圆形logo
sharp(LOGO)
  .resize(LOGO_S, LOGO_S)
  .composite([{
    input: Buffer.from(`<svg width="${LOGO_S}" height="${LOGO_S}"><circle cx="${LOGO_S/2}" cy="${LOGO_S/2}" r="${LOGO_S/2}" fill="white"/></svg>`),
    blend: 'dest-in',
  }])
  .png()
  .toBuffer()
  .then(circularLogo => {
    // 2. 合成到背景上，Logo居中在文字上方
    return sharp(Buffer.from(svg))
      .composite([{
        input: circularLogo,
        left: (W - LOGO_S) / 2,
        top: H/2 + 20,
      }])
      .png()
      .toFile(OUTPUT);
  })
  .then(() => console.log('✅ 封面已生成:', OUTPUT))
  .catch(e => console.error('❌', e));
