#!/usr/bin/env node

/**
 * HTML 封面生成器 — 知己FC 战报
 * 
 * 根据战报 frontmatter 生成暗色风格 HTML 封面，用 Playwright 截图。
 * 输出 2.35:1 (1800×766) 封面图。
 * 
 * CLI 用法:
 *   node scripts/generate-html-cover.js <match-file> [--output <path>] [--open]
 * 
 * API 用法 (被 upload-to-wechat.js require):
 *   const { generateHTMLCover } = require('./generate-html-cover');
 *   const coverPath = await generateHTMLCover(matchFilePath, frontmatterData);
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

// ============================================================
// CLI 入口
// ============================================================

const args = process.argv.slice(2);
const matchFile = args.find(a => !a.startsWith('--'));
const outputArg = getOptionValue(args, ['--output', '-o']);
const shouldOpen = args.includes('--open');

if (matchFile && require.main === module) {
  const matchFilePath = resolveMatchFile(matchFile);
  if (!matchFilePath) {
    console.error(`❌ 未找到文件: ${matchFile}`);
    process.exit(1);
  }
  const content = fs.readFileSync(matchFilePath, 'utf-8');
  const { data, content: body } = matter(content);
  const coverData = buildCoverData(data, body);

  const outputPath = outputArg || getDefaultOutputPath(matchFilePath);
  generateAndScreenshot(coverData, outputPath, { verbose: true });

  console.log(`✅ 封面已生成: ${outputPath}`);
  if (shouldOpen) {
    execSync(`open "${outputPath}"`, { stdio: 'inherit' });
  }
}

// ============================================================
// 导出的 API
// ============================================================

/**
 * 生成 HTML 封面并截图
 * @param {string} matchFilePath - 战报 .md 文件路径
 * @param {object} data - frontmatter 数据（可选，如果不传则从文件读取）
 * @returns {string} 生成的封面 PNG 路径
 */
async function generateHTMLCover(matchFilePath, data) {
  if (!data) {
    const content = fs.readFileSync(matchFilePath, 'utf-8');
    const parsed = matter(content);
    data = parsed.data;
  }

  const outputPath = getDefaultOutputPath(matchFilePath);
  generateAndScreenshot(buildCoverData(data, ''), outputPath, { verbose: false });
  return outputPath;
}

// ============================================================
// 核心函数
// ============================================================

function buildCoverData(data, body) {
  return {
    title: data.title || '知己FC',
    subtitle: data.opponent || '',
    date: data.date || '',
    location: data.location || '',
    summary: data.summary || '',
    mvp: extractMVP(body),
    score: data.score || '',
    showScore: data.showScore !== false
  };
}

function getDefaultOutputPath(matchFilePath) {
  const outputDir = path.join(__dirname, '../output/posters');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const baseName = path.basename(matchFilePath, '.md');
  return path.join(outputDir, `cover-${baseName}.png`);
}

function generateAndScreenshot(coverData, outputPath, { verbose = false } = {}) {
  const htmlPath = outputPath.replace(/\.png$/, '.html');
  const html = generateCoverHTML(coverData);
  fs.writeFileSync(htmlPath, html);
  if (verbose) console.log(`📝 HTML 已生成: ${htmlPath}`);

  screenshotHTML(htmlPath, outputPath, { verbose });
}

function extractMVP(body) {
  if (!body) return '';
  const mvpMatch = body.match(/全场最佳[射手]*(?:[，,]?\s*[是]?)([^。，,\n]{1,10})/);
  if (mvpMatch) return mvpMatch[1].trim();
  const disputeMatch = body.match(/争议MVP[^。，,\n]*?就是([^。，,\n]{1,10})/);
  if (disputeMatch) return disputeMatch[1].trim();
  return '';
}

function generateCoverHTML(data) {
  const fullTitle = data.title || '';
  const parts = fullTitle.split('·');
  const poem = parts.length > 1 ? parts[0].trim() : '';
  const mainTitle = parts.length > 1 ? parts.slice(1).join('·').trim() : fullTitle;

  let scoreHTML = '';
  if (data.score && data.showScore) {
    const [redScore, blueScore] = data.score.split('-').map(s => s.trim());
    scoreHTML = `
      <div class="score-box">
        <div class="team-score">
          <div class="team-label">红队</div>
          <div class="team-num score-red">${redScore || '0'}</div>
        </div>
        <div class="score-dash">:</div>
        <div class="team-score">
          <div class="team-label">蓝队</div>
          <div class="team-num score-blue">${blueScore || '0'}</div>
        </div>
      </div>`;
  }

  let mvpHTML = '';
  if (data.mvp) {
    mvpHTML = `<div class="mvp-tag">⚽ 全场最佳 ${data.mvp}</div>`;
  }

  const subParts = [];
  if (data.location) subParts.push(data.location);
  if (data.subtitle && data.subtitle !== '知己内战' && data.subtitle !== mainTitle) {
    subParts.push(data.subtitle);
  }
  const subtitle = subParts.join(' · ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1800px; height: 766px;
    display: flex; align-items: center; justify-content: center;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: radial-gradient(1200px 500px at 50% -10%, #fffdf7 0%, #fdf7eb 48%, #f8edd9 100%);
    overflow: hidden;
    position: relative;
  }
  .line-top {
    position: absolute; top: 60px; left: 517px; right: 517px;
    height: 1px; background: linear-gradient(90deg, transparent, rgba(184,134,11,0.38), transparent);
  }
  .line-bottom {
    position: absolute; bottom: 60px; left: 517px; right: 517px;
    height: 1px; background: linear-gradient(90deg, transparent, rgba(184,134,11,0.38), transparent);
  }
  .deco-left {
    position: absolute; left: 0; top: 0; width: 517px; height: 766px;
    background: linear-gradient(135deg, rgba(212,175,55,0.14) 0%, transparent 65%);
  }
  .deco-right {
    position: absolute; right: 0; top: 0; width: 517px; height: 766px;
    background: linear-gradient(225deg, rgba(255,215,130,0.16) 0%, transparent 65%);
  }
  .safe-zone {
    width: 766px; height: 766px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 60px 40px;
    position: relative; z-index: 1;
  }
  .poem {
    font-size: 22px; color: #8B6B2E;
    letter-spacing: 0.3em; margin-bottom: 24px;
    font-style: italic;
  }
  .title {
    font-size: 68px; font-weight: 900;
    color: #A36A00;
    line-height: 1.2; margin-bottom: 16px;
    letter-spacing: 0.05em;
    text-shadow: 0 2px 18px rgba(212,175,55,0.22);
  }
  .divider {
    width: 60px; height: 3px; background: #C58A19;
    margin: 18px 0; border-radius: 2px;
  }
  .subtitle {
    font-size: 24px; color: #7A5A22;
    letter-spacing: 0.15em; margin-bottom: 32px;
  }
  .score-box {
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 28px;
  }
  .team-score {
    display: flex; flex-direction: column; align-items: center;
  }
  .team-label {
    font-size: 16px; color: #8B6B2E;
    letter-spacing: 0.1em; margin-bottom: 8px;
  }
  .team-num { font-size: 72px; font-weight: 900; line-height: 1; }
  .score-red { color: #C2410C; }
  .score-blue { color: #9A6700; }
  .score-dash {
    font-size: 48px; color: #A18A62; padding-bottom: 24px;
  }
  .mvp-tag {
    padding: 8px 28px;
    border: 1px solid rgba(165,117,0,0.34);
    border-radius: 4px; font-size: 18px;
    color: #8C5A00; letter-spacing: 0.1em;
    background: rgba(255,255,255,0.58);
  }
  .footer-info {
    position: absolute; bottom: 80px;
    font-size: 16px; color: #8B6B2E;
    letter-spacing: 0.1em;
  }
</style>
</head>
<body>
  <div class="deco-left"></div>
  <div class="deco-right"></div>
  <div class="line-top"></div>
  <div class="line-bottom"></div>
  <div class="safe-zone">
    ${poem ? `<div class="poem">${escapeHTML(poem)}</div>` : ''}
    <div class="title">${escapeHTML(mainTitle)}</div>
    <div class="divider"></div>
    <div class="subtitle">${escapeHTML(subtitle)}</div>
    ${scoreHTML}
    ${mvpHTML}
    <div class="footer-info">知己足球俱乐部 · ${escapeHTML(data.date)}</div>
  </div>
</body>
</html>`;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function screenshotHTML(htmlPath, outputPath, { verbose = false } = {}) {
  const cmd = `npx playwright screenshot "file://${htmlPath}" "${outputPath}" --viewport-size=1800,766 --wait-for-timeout=1000`;
  if (verbose) console.log(`🖼️  正在截图...`);
  try {
    execSync(cmd, { stdio: verbose ? 'inherit' : 'pipe', timeout: 30000 });
  } catch (e) {
    console.error(`❌ Playwright 截图失败: ${e.message}`);
    console.log('💡 确保 Playwright 已安装: npm install -g playwright && npx playwright install chromium');
    throw e;
  }
}

function getOptionValue(args, flags) {
  for (const flag of flags) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  }
  return null;
}

function resolveMatchFile(file) {
  const candidates = [
    path.resolve(__dirname, '../matches', file),
    path.resolve(file)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  for (const p of candidates) {
    if (fs.existsSync(p + '.md')) return p + '.md';
  }
  return null;
}

module.exports = { generateHTMLCover, generateCoverHTML, buildCoverData, screenshotHTML };
