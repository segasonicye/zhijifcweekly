#!/usr/bin/env node

/**
 * 当日战报生成器
 * 快速生成带照片的战报Markdown
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        🏆 当日战报生成器 v1.0                        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 第一步：获取比赛日期
  const dateInput = await question('📅 输入比赛日期 (格式: YYYY-MM-DD，默认今天): ') || new Date().toISOString().split('T')[0];

  // 第二步：获取对手名称
  const opponent = await question('⚽️ 输入对手名称: ');

  // 第三步：选择主队
  const homeTeamOptions = [
    '1. 河伯FC',
    '2. 知己队',
    '3. 星光联队'
  ];
  const homeTeamIndex = await question('🏠 选择主队:\n' + homeTeamOptions.join('\n') + '\n(输入数字): ') || '1';
  const homeTeam = homeTeamOptions[parseInt(homeTeamIndex) - 1];

  // 第四步：获取比分
  const scoreInput = await question('⚽️ 输入比分 (格式: 3-2，主队-客队): ');
  const [homeScore, awayScore] = scoreInput.split('-').map(s => s.trim());

  // 第五步：获取照片文件夹路径
  const photosDir = await question('📸 照片文件夹路径 (相对或绝对): ');

  // 第六步：获取文字内容（如果朋友已写好）
  const reportText = await question('📝 粘贴朋友的文字战报 (Ctrl+D结束，直接回跳过): ') || '';

  // 生成Markdown
  const matchDate = new Date(dateInput);
  const dateStr = matchDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const matchesDir = path.join(process.cwd(), 'matches');
  if (!fs.existsSync(matchesDir)) {
    fs.mkdirSync(matchesDir, { recursive: true });
  }

  const fileName = `match-${dateInput}-${opponent.replace(/\s+/g, '')}.md`;
  const filePath = path.join(matchesDir, fileName);

  // 扫描照片文件夹
  const photos = [];
  if (fs.existsSync(photosDir)) {
    const files = fs.readdirSync(photosDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f)).sort();

    imageFiles.forEach((file, index) => {
      const photoPath = path.join(photosDir, file);
      const stats = fs.statSync(photoPath);
      photos.push({
        name: file,
        path: photoPath,
        size: (stats.size / 1024).toFixed(2) + 'KB',
        index: index + 1
      });
    });
  }

  // 生成照片引用
  let photosSection = '';
  if (photos.length > 0) {
    photosSection = '\n## 📸 精彩瞬间\n\n';
    photos.forEach(photo => {
      photosSection += `\n![${photo.name}](${photosDir}/${photo.name})\n`;
    });
  }

  // 生成Markdown内容
  const markdown = `---
title: "${homeTeam} ${homeScore} - ${awayScore} ${opponent}"
date: ${dateInput}
opponent: ${opponent}
score: "${homeScore}-${awayScore}"
homeTeam: ${homeTeam}
---

# ${homeTeam} ${homeScore} - ${awayScore} ${opponent}

**日期:** ${dateStr}
**地点:** 比赛现场

## 📝 赛报回顾

${reportText ? reportText : '\n*（此处粘贴朋友的文字战报内容）*\n'}

${photosSection}

## 📊 比赛统计

| 项目 | 数据 |
|------|------|
| **主队** | ${homeTeam} |
| **客队** | ${opponent} |
| **比分** | ${homeScore} - ${awayScore} |
| **照片数量** | ${photos.length} 张 |

---

**生成时间:** ${new Date().toLocaleString('zh-CN')}
**生成工具:** 当日战报生成器 v1.0
`;

  // 写入文件
  fs.writeFileSync(filePath, markdown, 'utf8');

  console.log(`\n✅ 战报已生成！`);
  console.log(`📄 文件路径: ${filePath}`);
  console.log(`📊 照片数量: ${photos.length} 张`);
  console.log(`\n💡 提示: \n`);
  console.log(`1. 文件已保存到 matches/ 目录`);
  console.log(`2. 可以用编辑器查看和修改内容`);
  console.log(`3. 照片已自动引用，无需手动复制`);

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
  console.error('❌ 发生错误:', error);
  rl.close();
  process.exit(1);
});
