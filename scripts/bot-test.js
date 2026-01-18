#!/usr/bin/env node

/**
 * 微信战报机器人 - 测试版本（无需wechaty）
 * 模拟机器人功能，用于测试战报生成逻辑
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ========== 状态管理 ==========
let currentMatch = null;
let photoBuffer = [];

// ========== 配置 ==========
const CONFIG = {
  DATA_DIR: path.join(__dirname, '..'),
};

// ========== 创建 readline 接口 ==========
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ========== 主循环 ==========
async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║     🤖 河伯战报机器人 - 测试版本              ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  await showHelp();
  await processLoop();
}

// ========== 命令处理循环 ==========
async function processLoop() {
  rl.question('\n> ', async (input) => {
    const text = input.trim();

    if (!text) {
      await processLoop();
      return;
    }

    // 处理命令
    if (text.startsWith('/')) {
      await handleCommand(text);
    } else {
      await handleText(text);
    }

    await processLoop();
  });
}

// ========== 命令处理 ==========
async function handleCommand(text) {
  const parts = text.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  console.log(`\n🔧 执行命令: ${command}\n`);

  switch (command) {
    case '/new':
      await createNewMatch(args);
      break;
    case '/info':
      await setMatchInfo(args);
      break;
    case '/finish':
      await finishMatch();
      break;
    case '/cancel':
      await cancelMatch();
      break;
    case '/status':
      await showStatus();
      break;
    case '/help':
      await showHelp();
      break;
    case '/exit':
      console.log('\n👋 再见！\n');
      process.exit(0);
    default:
      console.log(`❓ 未知命令: ${command}`);
      console.log('发送 /help 查看帮助\n');
  }
}

// ========== 文本处理 ==========
async function handleText(text) {
  if (currentMatch) {
    currentMatch.description += (currentMatch.description ? '\n' : '') + text;
    console.log('✅ 已记录内容，继续发送或使用 /finish 完成\n');
  } else {
    console.log('❌ 请先使用 /new <对手名称> 创建新战报\n');
    await showHelp();
  }
}

// ========== 创建新战报 ==========
async function createNewMatch(args) {
  if (currentMatch) {
    console.log('⚠️  当前有未完成的战报，请先 /finish 或 /cancel\n');
    return;
  }

  const opponent = args[0] || '未知对手';
  const date = new Date().toISOString().split('T')[0];

  currentMatch = {
    date,
    opponent,
    title: `${date} vs ${opponent}`,
    description: '',
    photos: [],
    info: {
      location: '',
      score: '',
      mvp: ''
    }
  };

  photoBuffer = [];

  console.log(`✅ 已创建新战报\n`);
  console.log(`📅 日期: ${date}`);
  console.log(`⚽ 对手: ${opponent}\n`);
  console.log('接下来请：');
  console.log('📝 输入文本 - 比赛描述');
  console.log('📷 输入 /photo <文件名> - 添加照片');
  console.log('⚙️  输入 /info <地点> <比分> <MVP> - 设置信息');
  console.log('✅  输入 /finish - 完成并生成战报\n');
}

// ========== 设置比赛信息 ==========
async function setMatchInfo(args) {
  if (!currentMatch) {
    console.log('❌ 请先使用 /new 创建战报\n');
    return;
  }

  const [location, score, mvp] = args;

  if (location) currentMatch.info.location = location;
  if (score) currentMatch.info.score = score;
  if (mvp) currentMatch.info.mvp = mvp;

  console.log('✅ 已更新比赛信息:\n');
  console.log(`📍 地点: ${currentMatch.info.location || '未设置'}`);
  console.log(`🎯 比分: ${currentMatch.info.score || '未设置'}`);
  console.log(`⭐ MVP: ${currentMatch.info.mvp || '未设置'}\n`);
  console.log(`当前已记录:`);
  console.log(`📝 ${currentMatch.description.split('\n').length} 段文字`);
  console.log(`📸 ${photoBuffer.length} 张照片\n`);
}

// ========== 完成战报 ==========
async function finishMatch() {
  if (!currentMatch) {
    console.log('❌ 没有进行中的战报\n');
    return;
  }

  try {
    console.log('🔄 开始生成战报...\n');

    // 生成Markdown文件
    const markdown = generateMarkdown(currentMatch, photoBuffer);

    // 保存到matches目录
    const matchesDir = path.join(CONFIG.DATA_DIR, 'matches');
    if (!fs.existsSync(matchesDir)) {
      fs.mkdirSync(matchesDir, { recursive: true });
    }

    const filename = `${currentMatch.date}-${currentMatch.opponent}.md`;
    const filepath = path.join(matchesDir, filename);

    fs.writeFileSync(filepath, markdown, 'utf-8');

    console.log('🎉 战报生成成功！\n');
    console.log(`📁 文件名: ${filename}`);
    console.log(`📝 标题: ${currentMatch.title}`);
    console.log(`📸 照片: ${photoBuffer.length}张`);
    console.log(`📍 地点: ${currentMatch.info.location || '未设置'}`);
    console.log(`🎯 比分: ${currentMatch.info.score || '未设置'}`);
    console.log(`⭐ MVP: ${currentMatch.info.mvp || '未设置'}\n`);

    console.log('下一步：');
    console.log('  npm run publish:ins    # Ins风格（内战推荐）');
    console.log('  npm run publish:battle # 热血风格（外战推荐）\n');

    // 重置状态
    currentMatch = null;
    photoBuffer = [];

  } catch (error) {
    console.error('❌ 生成战报失败:', error.message, '\n');
  }
}

// ========== 取消战报 ==========
async function cancelMatch() {
  if (!currentMatch) {
    console.log('❌ 没有进行中的战报\n');
    return;
  }

  currentMatch = null;
  photoBuffer = [];

  console.log('❌ 已取消当前战报\n');
}

// ========== 显示状态 ==========
async function showStatus() {
  if (!currentMatch) {
    console.log('当前没有进行中的战报\n');
    console.log('使用 /new <对手名称> 创建新战报\n');
    return;
  }

  console.log('📊 当前战报状态：\n');
  console.log(`📅 日期: ${currentMatch.date}`);
  console.log(`⚽ 对手: ${currentMatch.opponent}`);
  console.log(`📍 地点: ${currentMatch.info.location || '未设置'}`);
  console.log(`🎯 比分: ${currentMatch.info.score || '未设置'}`);
  console.log(`⭐ MVP: ${currentMatch.info.mvp || '未设置'}`);
  console.log(`\n📝 已记录: ${currentMatch.description.split('\n').length} 段文字`);
  console.log(`📸 已保存: ${photoBuffer.length} 张照片\n`);
}

// ========== 显示帮助 ==========
async function showHelp() {
  console.log('📖 命令列表：\n');
  console.log('/new <对手名称>     - 创建新战报');
  console.log('/info <地点> <比分> <MVP> - 设置比赛信息');
  console.log('/photo <文件名>     - 添加照片（模拟）');
  console.log('/finish             - 完成并生成战报');
  console.log('/status             - 查看当前状态');
  console.log('/cancel             - 取消当前战报');
  console.log('/help               - 显示帮助');
  console.log('/exit               - 退出程序\n');
  console.log('示例：');
  console.log('  /new 党校队');
  console.log('  元旦假期福沁大对决,知己VS党校');
  console.log('  /photo photo-001.jpg');
  console.log('  /info 福沁球场 20-26 高主席');
  console.log('  /finish\n');
}

// ========== 生成Markdown ==========
function generateMarkdown(match, photos) {
  const frontmatter = {
    title: match.title,
    date: match.date,
    opponent: match.opponent,
    score: match.info.score || '',
    location: match.info.location || '',
    mvp: match.info.mvp || '',
    photos: photos.map(p => `photos/${match.date}/${p}`),
    attendance: []
  };

  const frontmatterStr = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}:\n  - ${value.join('\n  - ')}`;
      }
      return `${key}: ${value || '""'}`;
    })
    .join('\n');

  return `---
${frontmatterStr}
---

${match.description || '比赛详情待补充...'}

---

**莫愁前路无知己，长风破浪会有时！**
`;
}

// ========== 启动 ==========
main().catch(console.error);
