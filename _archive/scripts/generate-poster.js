#!/usr/bin/env node

/**
 * 🎨 生成精美海报 (月度总结 / MVP)
 *
 * 功能：
 * 1. 加载背景图 (summary / mvp)
 * 2. 加载 Logo
 * 3. 绘制文字 (月份、数据、MVP名字)
 * 4. 合成并保存
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 默认路径
const LOGO_PATH = path.join(__dirname, '../logo-200.png');
const TEMPLATE_DIR = path.join(__dirname, '../assets/templates');
const OUTPUT_DIR = path.join(__dirname, '../output/posters');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 绘制总结海报 (Summary Poster - 16:9 横版封面)
 * 包含: Logo (左), 通用标题 (右 - 金色欧冠风)
 */
async function generateSummaryPoster(data, outputFile) {
  const templatePath = path.join(TEMPLATE_DIR, 'bg-summary-16-9.png');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 未找到背景图模板: ${templatePath}`);
    return;
  }

  // 获取背景尺寸
  const bg = sharp(templatePath);
  const metadata = await bg.metadata();
  const W = metadata.width;
  const H = metadata.height;

  // 布局: 左图右字
  // Logo 位置: 左侧 10%
  const logoSize = Math.floor(H * 0.65); 
  const logoTop = Math.floor((H - logoSize) / 2);
  const logoLeft = Math.floor(W * 0.08); // Logo 稍微往左挪一点 (8%)

  // 文字区域: 右侧 (从40%开始，留出更多空间)
  const textX = W * 0.40;

  // SVG文字层
  const svgText = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FDB931;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DAA520;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="black" flood-opacity="0.8"/>
        </filter>
      </defs>
      <style>
        .main-title { fill: url(#goldGradient); font-size: ${Math.floor(H * 0.20)}px; font-weight: 900; font-family: sans-serif; text-anchor: start; dominant-baseline: middle; letter-spacing: 2px; filter: url(#shadow); }
        .sub-title { fill: #fff; font-size: ${Math.floor(H * 0.07)}px; font-weight: 700; font-family: sans-serif; text-anchor: start; letter-spacing: 4px; text-transform: uppercase; opacity: 0.9; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        .club-name { fill: #2ecc71; font-size: ${Math.floor(H * 0.05)}px; font-weight: bold; font-family: sans-serif; text-anchor: start; letter-spacing: 2px; opacity: 0.9; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
      </style>
      
      <!-- 俱乐部名称 -->
      <text x="${textX}" y="${H * 0.28}" class="club-name">ZHIJI FOOTBALL CLUB</text>
      
      <!-- 主标题: MONTHLY REPORT -->
      <text x="${textX}" y="${H * 0.5}" class="main-title">MONTHLY</text>
      <text x="${textX}" y="${H * 0.72}" class="main-title">REPORT</text>
    </svg>
  `;

  // 处理 Logo: 裁剪为圆形并添加阴影
  const logoBufferRaw = await sharp(LOGO_PATH).resize(logoSize, logoSize).toBuffer();
  
  const circleMask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}">
       <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize/2}" fill="black"/>
     </svg>`
  );

  const logoCircular = await sharp(logoBufferRaw)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .toBuffer();

  const shadowSize = Math.floor(logoSize * 1.05);
  const shadowBuffer = Buffer.from(
    `<svg width="${shadowSize}" height="${shadowSize}">
       <circle cx="${shadowSize/2}" cy="${shadowSize/2}" r="${logoSize/2}" fill="rgba(0,0,0,0.5)"/>
     </svg>`
  );
  
  const shadowLeft = logoLeft + (logoSize - shadowSize)/2;
  const shadowTop = logoTop + (logoSize - shadowSize)/2 + 5;

  await bg
    .composite([
      { input: shadowBuffer, top: Math.floor(shadowTop), left: Math.floor(shadowLeft) },
      { input: logoCircular, top: logoTop, left: logoLeft },
      { input: Buffer.from(svgText), top: 0, left: 0 }
    ])
    .toFile(outputFile);

  console.log(`✅ 通用月度战报封面(16:9)生成: ${outputFile}`);
  return outputFile;
}

/**
 * 绘制MVP海报 (MVP Header - 16:9 横版 - 金色欧冠风)
 * 包含: Logo (左), MVP 标题 (右)
 */
async function generateMvpPoster(data, outputFile) {
  const templatePath = path.join(TEMPLATE_DIR, 'bg-mvp-16-9.png');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 未找到背景图模板: ${templatePath}`);
    return;
  }

  const bg = sharp(templatePath);
  const metadata = await bg.metadata();
  const W = metadata.width;
  const H = metadata.height;

  // Logo 位置: 左侧 10%
  const logoSize = Math.floor(H * 0.65);
  const logoTop = Math.floor((H - logoSize) / 2);
  const logoLeft = Math.floor(W * 0.08); // 往左挪

  // 文字区域: 右侧 (从40%开始)
  const textX = W * 0.40;

  // SVG文字 (金色立体)
  const svgText = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="goldGradientMVP" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FDB931;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
        </linearGradient>
        <filter id="shadowMVP">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="black" flood-opacity="0.8"/>
        </filter>
      </defs>
      <style>
        .mvp-title { fill: url(#goldGradientMVP); font-size: ${Math.floor(H * 0.32)}px; font-weight: 900; font-family: sans-serif; text-anchor: start; dominant-baseline: middle; letter-spacing: 4px; filter: url(#shadowMVP); }
        .sub-text { fill: #fff; font-size: ${Math.floor(H * 0.07)}px; font-weight: 600; font-family: sans-serif; text-anchor: start; dominant-baseline: middle; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.8); opacity: 0.9; }
      </style>
      
      <!-- 大字: MVP -->
      <text x="${textX}" y="${H * 0.45}" class="mvp-title">MVP</text>
      
      <!-- 小字: PLAYER OF THE MONTH -->
      <text x="${textX}" y="${H * 0.75}" class="sub-text">PLAYER OF THE MONTH</text>
    </svg>
  `;

  // Logo 处理同上
  const logoBufferRaw = await sharp(LOGO_PATH).resize(logoSize, logoSize).toBuffer();
  
  const circleMask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}">
       <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize/2}" fill="black"/>
     </svg>`
  );

  const logoCircular = await sharp(logoBufferRaw)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .toBuffer();

  const shadowSize = Math.floor(logoSize * 1.05);
  const shadowBuffer = Buffer.from(
    `<svg width="${shadowSize}" height="${shadowSize}">
       <circle cx="${shadowSize/2}" cy="${shadowSize/2}" r="${logoSize/2}" fill="rgba(0,0,0,0.5)"/>
     </svg>`
  );
  
  const shadowLeft = logoLeft + (logoSize - shadowSize)/2;
  const shadowTop = logoTop + (logoSize - shadowSize)/2 + 5;

  await bg
    .composite([
      { input: shadowBuffer, top: Math.floor(shadowTop), left: Math.floor(shadowLeft) },
      { input: logoCircular, top: logoTop, left: logoLeft },
      { input: Buffer.from(svgText), top: 0, left: 0 }
    ])
    .toFile(outputFile);

  console.log(`✅ 通用MVP海报(16:9)生成: ${outputFile}`);
  return outputFile;
}

/**
 * 绘制单场战报封面 (Match Header - 16:9 - AI定制背景)
 * 包含: Logo (左), 对手/比分 (右)
 */
async function generateMatchPoster(data, bgPath, outputFile) {
  if (!fs.existsSync(bgPath)) {
    console.error(`❌ 未找到背景图: ${bgPath}`);
    return;
  }

  const bg = sharp(bgPath);
  const metadata = await bg.metadata();
  const W = metadata.width;
  const H = metadata.height;

  // 布局: 左图右字
  const logoSize = Math.floor(H * 0.55); // 稍微小一点
  const logoTop = Math.floor((H - logoSize) / 2);
  const logoLeft = Math.floor(W * 0.1); 

  const textX = W * 0.45;

  // SVG文字
  const svgText = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="matchGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DDD;stop-opacity:1" />
        </linearGradient>
        <filter id="matchShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="black" flood-opacity="0.8"/>
        </filter>
      </defs>
      <style>
        .vs-line { fill: #f1c40f; font-size: ${Math.floor(H * 0.1)}px; font-weight: 900; font-family: sans-serif; text-anchor: start; dominant-baseline: middle; letter-spacing: 2px; filter: url(#matchShadow); }
        .opponent { fill: url(#matchGold); font-size: ${Math.floor(H * 0.18)}px; font-weight: 800; font-family: sans-serif; text-anchor: start; dominant-baseline: middle; letter-spacing: 2px; filter: url(#matchShadow); }
        .score { fill: #2ecc71; font-size: ${Math.floor(H * 0.25)}px; font-weight: 900; font-family: sans-serif; text-anchor: start; dominant-baseline: middle; letter-spacing: 4px; filter: url(#matchShadow); }
        .date { fill: rgba(255,255,255,0.8); font-size: ${Math.floor(H * 0.06)}px; font-weight: 600; font-family: sans-serif; text-anchor: start; letter-spacing: 2px; }
      </style>
      
      <!-- 日期 -->
      <text x="${textX}" y="${H * 0.2}" class="date">${data.date}</text>
      
      <!-- VS -->
      <text x="${textX}" y="${H * 0.35}" class="vs-line">VS ${data.opponent}</text>
      
      <!-- 比分 (如果有) -->
      ${data.score ? `<text x="${textX}" y="${H * 0.65}" class="score">${data.score}</text>` : ''}
      
      <!-- 底部标语 -->
      <text x="${textX}" y="${H * 0.85}" class="date">ZHIJI FOOTBALL CLUB</text>
    </svg>
  `;

  // Logo 处理
  const logoBufferRaw = await sharp(LOGO_PATH).resize(logoSize, logoSize).toBuffer();
  
  const circleMask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}">
       <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize/2}" fill="black"/>
     </svg>`
  );

  const logoCircular = await sharp(logoBufferRaw)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .toBuffer();

  const shadowSize = Math.floor(logoSize * 1.05);
  const shadowBuffer = Buffer.from(
    `<svg width="${shadowSize}" height="${shadowSize}">
       <circle cx="${shadowSize/2}" cy="${shadowSize/2}" r="${logoSize/2}" fill="rgba(0,0,0,0.5)"/>
     </svg>`
  );
  
  const shadowLeft = logoLeft + (logoSize - shadowSize)/2;
  const shadowTop = logoTop + (logoSize - shadowSize)/2 + 5;

  await bg
    .composite([
      { input: shadowBuffer, top: Math.floor(shadowTop), left: Math.floor(shadowLeft) },
      { input: logoCircular, top: logoTop, left: logoLeft },
      { input: Buffer.from(svgText), top: 0, left: 0 }
    ])
    .toFile(outputFile);

  console.log(`✅ 单场战报封面生成: ${outputFile}`);
  return outputFile;
}

// 导出函数供其他脚本调用
module.exports = { generateSummaryPoster, generateMvpPoster, generateMatchPoster };

// 如果直接运行，生成测试图
if (require.main === module) {
  const args = process.argv.slice(2);
  const testData = {
    year: 2026,
    month: 2,
    matches: 4,
    goals: 12,
    mvpCount: 3,
    mvpName: '小王'
  };
  
  // 生成总结海报
  const summaryFile = path.join(OUTPUT_DIR, 'test-summary.jpg');
  generateSummaryPoster(testData, summaryFile)
    .then(() => console.log('Summary poster done'))
    .catch(console.error);

  // 生成MVP海报
  const mvpFile = path.join(OUTPUT_DIR, 'test-mvp.jpg');
  generateMvpPoster(testData, mvpFile)
    .then(() => console.log('MVP poster done'))
    .catch(console.error);
}
