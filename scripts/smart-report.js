#!/usr/bin/env node

/**
 * 智能粘帖解析器
 * 从粘帖文字中自动提取比赛信息并生成战报
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 正则表达式模式
const DATE_PATTERNS = [
  /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/gi,  // 2025年1月12日
  /(\d{4})\s*-\s*(\d{1,2})\s*-\s*(\d{1,2})/g,  // 2025-01-12
  /(\d{4})\/(\d{2})\/(\d{2})/g,  // 2025/01/12
];

const SCORE_PATTERNS = [
  /(\d+)\s*[:：-]\s*(\d+)/g,  // 3:2
  /(\d+)\s*[-—]\s*(\d+)/g,  // 3-2
  /比分\s*[:：-]\s*(\d+)\s*[:：-]\s*(\d+)/g,  // 比分：3:2
];

const TEAM_NAMES = [
  '河伯FC', '知己队', '星光联队', '绿茵FC', '红焰队'
];

// 智能提取器
class PasteParser {
  constructor(text) {
    this.text = text;
    this.matchDate = null;
    this.homeTeam = null;
    this.awayTeam = null;
    this.homeScore = null;
    this.awayScore = null;
    this.photosDir = null;
  }

  parse() {
    console.log('🔍 开始解析粘帖内容...\n');

    // 1. 提取日期
    this.extractDate();

    // 2. 提取对手
    this.extractOpponent();

    // 3. 提取比分
    this.extractScore();

    // 4. 查找照片目录
    this.findPhotosDirectory();

    // 5. 智能推断主队
    this.inferHomeTeam();

    console.log('\n✅ 解析完成！\n');
    this.displaySummary();
  }

  extractDate() {
    for (const pattern of DATE_PATTERNS) {
      const match = this.text.match(pattern);
      if (match) {
        // 标准化日期格式
        const [, year, month, day] = match;
        this.matchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log(`📅 日期: ${this.matchDate}`);
        return;
      }
    }

    // 如果没有找到日期，尝试查找最近日期
    const today = new Date();
    this.matchDate = today.toISOString().split('T')[0];
    console.log(`📅 日期: ${this.matchDate} (默认今天)`);
  }

  extractOpponent() {
    // 查找球队名称
    for (const team of TEAM_NAMES) {
      if (this.text.includes(team) && team !== this.homeTeam) {
        this.awayTeam = team;
        console.log(`⚽️ 对手: ${this.awayTeam}`);
        return;
      }
    }

    // 如果没找到，使用默认
    this.awayTeam = '对手队';
    console.log(`⚽️ 对手: ${this.awayTeam} (默认)`);
  }

  extractScore() {
    for (const pattern of SCORE_PATTERNS) {
      const match = this.text.match(pattern);
      if (match) {
        const [, home, away] = match;
        this.homeScore = parseInt(home);
        this.awayScore = parseInt(away);
        console.log(`⚽️ 比分: ${this.homeScore}-${this.awayScore}`);
        return;
      }
    }

    // 默认比分
    this.homeScore = 0;
    this.awayScore = 0;
    console.log(`⚽️ 比分: 0-0 (默认)`);
  }

  inferHomeTeam() {
    // 从文件路径或环境推断主队
    this.homeTeam = '河伯FC';
    console.log(`🏠 主队: ${this.homeTeam}`);
  }

  findPhotosDirectory() {
    const projectRoot = process.cwd();
    const photosBase = path.join(projectRoot, 'photos');

    if (fs.existsSync(photosBase)) {
      // 查找最近的照片目录
      const dirs = fs.readdirSync(photosBase)
        .filter(dir => fs.statSync(path.join(photosBase, dir)).isDirectory())
        .sort()
        .reverse();

      if (dirs.length > 0) {
        this.photosDir = path.join(photosBase, dirs[0]);
        console.log(`📸 照片目录: ${this.photosDir}`);

        // 统计照片数量
        const photos = fs.readdirSync(this.photosDir)
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        this.photoCount = photos.length;
      }
    }

    // 默认目录
    if (!this.photosDir) {
      this.photosDir = path.join(projectRoot, 'photos', 'latest');
      console.log(`📸 照片目录: ${this.photosDir} (默认)`);
      this.photoCount = 0;
    }
  }

  generateMarkdown() {
    const date = new Date(this.matchDate);
    const dateStr = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 扫描照片
    const photos = this.scanPhotos();

    const photosSection = photos.length > 0 ? `\n## 📸 精彩瞬间\n\n${photos.map(p => `![${p.name}](${path.relative(process.cwd(), path.join(this.photosDir, p.name))})\n`).join('\n')}` : '';

    const markdown = `---
title: "${this.homeTeam} ${this.homeScore}-${this.awayScore} ${this.awayTeam}"
date: ${this.matchDate}
opponent: ${this.awayTeam}
score: "${this.homeScore}-${this.awayScore}"
homeTeam: ${this.homeTeam}
---

# ${this.homeTeam} ${this.homeScore}-${this.awayScore} ${this.awayTeam}

**日期:** ${dateStr}

${this.text}

${photosSection}

## 📊 比赛统计

| 项目 | 数据 |
|------|------|
| 主队 | ${this.homeTeam} |
| 客队 | ${this.awayTeam} |
| 比分 | ${this.homeScore}-${this.awayScore} |
| 照片数量 | ${this.photoCount} 张 |

---

**生成时间:** ${new Date().toLocaleString('zh-CN')}
**生成工具:** 智能粘帖解析器 v1.0
`;

    return markdown;
  }

  scanPhotos() {
    if (!this.photosDir || !fs.existsSync(this.photosDir)) {
      return [];
    }

    const files = fs.readdirSync(this.photosDir);
    return files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .sort((a, b) => {
        // 提取数字并排序
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      })
      .map((file, index) => ({
        name: file,
        index: index + 1
      }));
  }

  displaySummary() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 提取信息汇总');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📅 比赛日期: ${this.matchDate}`);
    console.log(`🏠 主     队: ${this.homeTeam}`);
    console.log(`⚽️ 客     队: ${this.awayTeam}`);
    console.log(`⚽️ 比     分: ${this.homeScore}-${this.awayScore}`);
    console.log(`📸 照片目录: ${path.relative(process.cwd(), this.photosDir) || '未找到'}`);
    console.log(`📸 照片数量: ${this.photoCount || 0} 张`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

async function main() {
  console.log('╔════════════════════════════════╗');
  console.log('║    🤖 智能粘帖解析器 v1.0      ║');
  console.log('╚══════════════════════════════════╝\n');

  // 读取粘帖内容
  const pasteContent = await question('📝 请粘贴朋友发来的战报文字粘帖 (Ctrl+D结束输入):\n\n');

  if (!pasteContent || pasteContent.trim().length === 0) {
    console.error('❌ 粘帖内容不能为空！');
    process.exit(1);
  }

  // 保存粘帖到文件（方便再次使用）
  const pasteDir = path.join(process.cwd(), 'paste');
  if (!fs.existsSync(pasteDir)) {
    fs.mkdirSync(pasteDir, { recursive: true });
  }

  const pasteFile = path.join(pasteDir, `match-${Date.now().toISOString().split('T')[0]}.txt`);
  fs.writeFileSync(pasteFile, pasteContent, 'utf8');
  console.log(`\n✓ 粘帖已保存到: ${pasteFile}\n`);

  // 解析粘帖
  const parser = new PasteParser(pasteContent);
  parser.parse();

  // 生成战报
  const matchesDir = path.join(process.cwd(), 'matches');
  if (!fs.existsSync(matchesDir)) {
    fs.mkdirSync(matchesDir, { recursive: true });
  }

  const fileName = `match-${parser.matchDate}-${parser.awayTeam.replace(/\s+/g, '')}.md`;
  const filePath = path.join(matchesDir, fileName);

  const markdown = parser.generateMarkdown();
  fs.writeFileSync(filePath, markdown, 'utf8');

  console.log(`\n🎉 战报已生成！\n`);
  console.log(`📄 文件路径: ${filePath}\n`);
  console.log(`💡 提示: 可以用编辑器打开查看和修改\n`);
  console.log(`💡 下次使用: npm run smart-report\n`);

  rl.close();
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer);
    });
  });
}

main().catch(error => {
  console.error('\n❌ 发生错误:', error);
  rl.close();
  process.exit(1);
});
