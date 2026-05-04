#!/usr/bin/env node

/**
 * Direct AI cover generator for WeChat battle reports.
 *
 * Strategy:
 * 1) Call Hermes `image_generate` through `hermes chat -q`
 * 2) Parse returned absolute image path
 * 3) Copy generated image into output/posters/cover-<match>.png
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const matter = require('gray-matter');

function getDefaultOutputPath(matchFilePath) {
  const outputDir = path.join(__dirname, '../output/posters');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const baseName = path.basename(matchFilePath, '.md');
  return path.join(outputDir, `cover-${baseName}.png`);
}

function buildAICoverPrompt(data = {}) {
  const title = String(data.title || '知己FC 战报').trim();
  const opponent = String(data.opponent || '周末比赛').trim();
  const date = String(data.date || '').trim();
  const location = String(data.location || '').trim();
  const score = String(data.score || '').trim();

  const context = [
    `标题：${title}`,
    `对手：${opponent}`,
    date ? `日期：${date}` : null,
    location ? `地点：${location}` : null,
    score ? `比分：${score}` : null
  ].filter(Boolean).join('；');

  return [
    '调用 image_generate 生成公众号封面图。',
    '视觉要求：奶白暖金亮色方案，绝不黑底；足球战报氛围；简洁高级，适合微信封面。',
    '画幅：16:9 横版；主体居中；留出标题安全区；不要出现可读文字、logo、水印。',
    `内容上下文：${context}`,
    '完成后只返回生成文件的绝对路径，不要解释。'
  ].join(' ');
}

function extractImagePath(text) {
  if (!text) return null;
  const matches = text.match(/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)/gi);
  if (!matches || matches.length === 0) return null;

  // Prefer existing file paths and the latest one in output.
  for (let i = matches.length - 1; i >= 0; i--) {
    const candidate = matches[i];
    if (fs.existsSync(candidate)) return candidate;
  }
  return matches[matches.length - 1] || null;
}

function runHermesImageGenerate(prompt, timeoutMs = 240000) {
  const result = spawnSync('hermes', ['chat', '-q', prompt], {
    encoding: 'utf-8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024
  });

  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;

  if (result.error) {
    throw new Error(`Hermes 调用失败: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const preview = combined.trim().split('\n').slice(-20).join('\n');
    throw new Error(`Hermes 返回非零状态 (${result.status})\n${preview}`);
  }

  const sourcePath = extractImagePath(combined);
  if (!sourcePath) {
    throw new Error('未从 Hermes 输出中解析到图片路径');
  }

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`图片路径不存在: ${sourcePath}`);
  }

  return sourcePath;
}

async function generateAICover(matchFilePath, data) {
  if (!matchFilePath || !fs.existsSync(matchFilePath)) {
    throw new Error(`比赛文件不存在: ${matchFilePath}`);
  }

  if (!data) {
    const raw = fs.readFileSync(matchFilePath, 'utf-8');
    const parsed = matter(raw);
    data = parsed.data;
  }

  const outputPath = getDefaultOutputPath(matchFilePath);
  const prompt = buildAICoverPrompt(data);
  const sourcePath = runHermesImageGenerate(prompt);
  fs.copyFileSync(sourcePath, outputPath);
  return outputPath;
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
    if (fs.existsSync(`${p}.md`)) return `${p}.md`;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const matchFile = args.find(a => !a.startsWith('-'));
  if (!matchFile) {
    console.error('用法: node scripts/generate-ai-cover.js <match-file>');
    process.exit(1);
  }

  const matchFilePath = resolveMatchFile(matchFile);
  if (!matchFilePath) {
    console.error(`❌ 未找到比赛文件: ${matchFile}`);
    process.exit(1);
  }

  try {
    const outputPath = await generateAICover(matchFilePath);
    console.log(`✅ AI 封面已生成: ${outputPath}`);
  } catch (error) {
    console.error(`❌ AI 封面生成失败: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateAICover,
  buildAICoverPrompt,
  extractImagePath,
  getDefaultOutputPath
};
