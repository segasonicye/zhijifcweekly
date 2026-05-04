#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BG_PATH = path.join(__dirname, '../assets/xhs/bg-xhs-mac.png');
const OUTPUT_PATH = path.join(__dirname, '../output/xhs-cover.jpg');

// 确保目录存在
if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

async function generateXHSCover() {
  if (!fs.existsSync(BG_PATH)) {
    console.error('❌ 背景图未找到，请等待 AI 生成完毕');
    return;
  }

  const bg = sharp(BG_PATH);
  const metadata = await bg.metadata();
  const W = metadata.width;
  const H = metadata.height;

  // 字体配置
  const titleSize = Math.floor(W * 0.12); // 主标题字号
  const subSize = Math.floor(W * 0.06);   // 副标题字号
  
  // 文字 SVG (黄色大字 + 黑色描边/阴影，醒目风格)
  const svgText = `
    <svg width="${W}" height="${H}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="black" flood-opacity="0.9"/>
        </filter>
      </defs>
      <style>
        .title { 
          fill: #FFD700; 
          font-family: sans-serif; 
          font-weight: 900; 
          text-anchor: middle; 
          dominant-baseline: middle; 
          stroke: #000; 
          stroke-width: 4px;
          filter: url(#shadow);
        }
        .subtitle { 
          fill: #FFF; 
          font-family: sans-serif; 
          font-weight: 700; 
          text-anchor: middle; 
          dominant-baseline: middle; 
          stroke: #000; 
          stroke-width: 2px;
          filter: url(#shadow);
          background: #000;
        }
        .tag-bg {
          fill: #FF4500;
          rx: 15;
        }
      </style>
      
      <!-- 顶部大标题 -->
      <text x="${W/2}" y="${H * 0.15}" font-size="${titleSize}" class="title">5分钟</text>
      <text x="${W/2}" y="${H * 0.25}" font-size="${titleSize}" class="title">装个AI秘书</text>
      
      <!-- 底部副标题/标签 -->
      <!-- 标签背景 -->
      <rect x="${W * 0.2}" y="${H * 0.8}" width="${W * 0.6}" height="${subSize * 1.8}" class="tag-bg" />
      <text x="${W/2}" y="${H * 0.8 + subSize * 0.9}" font-size="${subSize}" class="subtitle">OpenClaw 保姆级教程</text>
    </svg>
  `;

  await bg
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .toFile(OUTPUT_PATH);

  console.log(`✅ 小红书封面已生成: ${OUTPUT_PATH}`);
}

generateXHSCover().catch(console.error);
