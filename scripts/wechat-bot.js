#!/usr/bin/env node

/**
 * 微信战报机器人
 * 接收聊天记录自动生成战报
 *
 * 使用方法：
 * 1. npm install wechaty wechaty-puppet-wechat file-box
 * 2. npm run bot
 * 3. 扫码登录
 * 4. 在微信中发送命令
 */

const { Wechaty } = require('wechaty');
const { FileBox } = require('file-box');
const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const CONFIG = {
  AUTHORIZED_USERS: [
    '河伯', // 替换为您的微信昵称
    // 添加其他授权用户
  ],
  DATA_DIR: path.join(__dirname, '..'),
};

// ========== 状态管理 ==========
let currentMatch = null;
let photoBuffer = [];

// ========== 初始化机器人 ==========
const bot = new Wechaty({
  name: '河伯战报机器人',
  puppet: require('wechaty-puppet-wechat'),
});

// ========== 消息处理 ==========
bot.on('message', async function (msg) {
  try {
    const contact = msg.talker();
    const text = msg.text();
    const room = msg.room();

    // 只处理私聊
    if (room) return;

    // 验证授权
    if (!isAuthorized(contact)) {
      console.log(`未授权用户: ${contact.name()}`);
      return;
    }

    console.log(`\n📨 收到消息: ${text}`);
    console.log(`   发送者: ${contact.name()}`);
    console.log(`   类型: ${msg.type()}`);

    // 处理不同类型消息
    if (msg.type() === bot.Message.Type.Text) {
      await handleTextMessage(text, contact);
    } else if (msg.type() === bot.Message.Type.Image) {
      await handleImageMessage(msg, contact);
    } else {
      console.log(`忽略消息类型: ${msg.type()}`);
    }

  } catch (error) {
    console.error('处理消息失败:', error);
  }
});

// ========== 授权验证 ==========
function isAuthorized(contact) {
  return CONFIG.AUTHORIZED_USERS.includes(contact.name());
}

// ========== 文本消息处理 ==========
async function handleTextMessage(text, contact) {
  // 命令模式
  if (text.startsWith('/')) {
    await handleCommand(text, contact);
    return;
  }

  // 普通文本
  if (currentMatch) {
    currentMatch.description += (currentMatch.description ? '\n' : '') + text;
    await contact.say('✅ 已记录内容，继续发送或使用 /finish 完成');
  } else {
    await contact.say('❌ 请先使用 /new <对手名称> 创建新战报');
    await sendHelp(contact);
  }
}

// ========== 命令处理 ==========
async function handleCommand(text, contact) {
  const parts = text.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  console.log(`🔧 执行命令: ${command}`);
  console.log(`   参数: ${args.join(', ')}`);

  switch (command) {
    case '/new':
      await createNewMatch(args, contact);
      break;

    case '/info':
      await setMatchInfo(args, contact);
      break;

    case '/finish':
      await finishMatch(contact);
      break;

    case '/cancel':
      await cancelMatch(contact);
      break;

    case '/status':
      await showStatus(contact);
      break;

    case '/help':
      await sendHelp(contact);
      break;

    case '/publish':
      await publishMatch(contact);
      break;

    default:
      await contact.say(`❓ 未知命令: ${command}\n发送 /help 查看帮助`);
  }
}

// ========== 创建新战报 ==========
async function createNewMatch(args, contact) {
  if (currentMatch) {
    await contact.say('⚠️  当前有未完成的战报，请先 /finish 或 /cancel');
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

  await contact.say(`
✅ 已创建新战报

📅 日期: ${date}
⚽ 对手: ${opponent}

接下来请：
📝 发送文本 - 比赛描述
📸 发送图片 - 比赛照片
⚙️  /info <地点> <比分> <MVP> - 设置信息
✅  /finish - 完成并生成战报
❓  /help - 查看帮助
  `);

  console.log(`✅ 创建战报: ${currentMatch.title}`);
}

// ========== 设置比赛信息 ==========
async function setMatchInfo(args, contact) {
  if (!currentMatch) {
    await contact.say('❌ 请先使用 /new 创建战报');
    return;
  }

  const [location, score, mvp] = args;

  if (location) currentMatch.info.location = location;
  if (score) currentMatch.info.score = score;
  if (mvp) currentMatch.info.mvp = mvp;

  await contact.say(`
✅ 已更新比赛信息：

📍 地点: ${currentMatch.info.location || '未设置'}
🎯 比分: ${currentMatch.info.score || '未设置'}
⭐ MVP: ${currentMatch.info.mvp || '未设置'}

当前已记录:
📝 ${currentMatch.description.split('\n').length} 段文字
📸 ${photoBuffer.length} 张照片
  `);

  console.log('✅ 更新信息:', currentMatch.info);
}

// ========== 完成战报 ==========
async function finishMatch(contact) {
  if (!currentMatch) {
    await contact.say('❌ 没有进行中的战报');
    return;
  }

  try {
    console.log('🔄 开始生成战报...');

    // 1. 生成Markdown文件
    const markdown = generateMarkdown(currentMatch, photoBuffer);

    // 2. 保存到matches目录
    const matchesDir = path.join(CONFIG.DATA_DIR, 'matches');
    if (!fs.existsSync(matchesDir)) {
      fs.mkdirSync(matchesDir, { recursive: true });
    }

    const filename = `${currentMatch.date}-${currentMatch.opponent}.md`;
    const filepath = path.join(matchesDir, filename);

    fs.writeFileSync(filepath, markdown, 'utf-8');
    console.log(`✅ 已保存: ${filename}`);

    // 3. 发送确认消息
    await contact.say(`
🎉 战报生成成功！

📁 文件名: ${filename}
📝 标题: ${currentMatch.title}
📸 照片: ${photoBuffer.length}张
📍 地点: ${currentMatch.info.location || '未设置'}
🎯 比分: ${currentMatch.info.score || '未设置'}
⭐ MVP: ${currentMatch.info.mvp || '未设置'}

下一步：
npm run publish:ins    # Ins风格（内战推荐）
npm run publish:battle # 热血风格（外战推荐）

或使用 /publish 命令
    `);

    // 4. 重置状态
    currentMatch = null;
    photoBuffer = [];

    console.log('✅ 战报生成完成');

  } catch (error) {
    console.error('生成战报失败:', error);
    await contact.say(`❌ 生成战报失败: ${error.message}`);
  }
}

// ========== 取消战报 ==========
async function cancelMatch(contact) {
  if (!currentMatch) {
    await contact.say('❌ 没有进行中的战报');
    return;
  }

  currentMatch = null;
  photoBuffer = [];

  await contact.say('❌ 已取消当前战报');
  console.log('❌ 已取消战报');
}

// ========== 显示状态 ==========
async function showStatus(contact) {
  if (!currentMatch) {
    await contact.say('当前没有进行中的战报\n使用 /new <对手名称> 创建新战报');
    return;
  }

  await contact.say(`
📊 当前战报状态：

📅 日期: ${currentMatch.date}
⚽ 对手: ${currentMatch.opponent}
📍 地点: ${currentMatch.info.location || '未设置'}
🎯 比分: ${currentMatch.info.score || '未设置'}
⭐ MVP: ${currentMatch.info.mvp || '未设置'}

📝 已记录: ${currentMatch.description.split('\n').length} 段文字
📸 已保存: ${photoBuffer.length} 张照片
  `);
}

// ========== 发布战报 ==========
async function publishMatch(contact) {
  await contact.say('🔄 正在生成文章...');

  try {
    const { execSync } = require('child_process');

    // 智能选择风格
    const isInternal = currentMatch?.opponent.includes('内战');
    const command = isInternal ? 'npm run publish:ins' : 'npm run publish:battle';

    execSync(command, { cwd: CONFIG.DATA_DIR, stdio: 'inherit' });

    await contact.say('✅ 文章已生成并打开浏览器\n请复制到微信公众号');

  } catch (error) {
    console.error('发布失败:', error);
    await contact.say(`❌ 发布失败: ${error.message}`);
  }
}

// ========== 处理图片 ==========
async function handleImageMessage(msg, contact) {
  if (!currentMatch) {
    await contact.say('❌ 请先使用 /new 创建战报');
    return;
  }

  try {
    console.log('📸 处理图片...');

    // 1. 下载图片
    const fileBox = await msg.toFileBox();
    const date = currentMatch.date;

    // 2. 创建照片目录
    const photosDir = path.join(CONFIG.DATA_DIR, 'photos', date);
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // 3. 保存图片
    const photoNum = String(photoBuffer.length + 1).padStart(3, '0');
    const filename = `photo-${photoNum}.jpg`;
    const filepath = path.join(photosDir, filename);

    await fileBox.toFile(filepath);

    // 4. 添加到缓冲区
    photoBuffer.push(filename);

    console.log(`✅ 已保存: ${filename}`);

    await contact.say(`📸 已保存照片 ${photoBuffer.length}: ${filename}`);

  } catch (error) {
    console.error('保存照片失败:', error);
    await contact.say('❌ 保存照片失败: ' + error.message);
  }
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
    attendance: []  // 可以后续添加
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

// ========== 帮助信息 ==========
async function sendHelp(contact) {
  await contact.say(`
📖 河伯战报机器人使用指南

🎯 基本命令：
/new <对手名称> - 创建新战报
/info <地点> <比分> <MVP> - 设置比赛信息
/finish - 完成并生成战报
/status - 查看当前状态
/cancel - 取消当前战报
/publish - 自动生成微信文章
/help - 显示帮助

📸 使用流程：
1️⃣  /new 党校队
2️⃣  发送比赛描述（可分多条）
3️⃣  发送比赛照片
4️⃣  /info 福沁球场 3-2 张三
5️⃣  /finish

💡 提示：
- 照片会自动编号保存
- 支持多次发送内容
- 完成后自动生成Markdown文件
- 使用 /publish 可直接生成微信文章
  `);
}

// ========== 启动 ==========
bot.start()
  .then(() => {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   🤖 河伯战报机器人已启动            ║');
    console.log('╚══════════════════════════════════════╝\n');
    console.log('📱 请使用微信扫描二维码登录\n');
  })
  .catch((e) => {
    console.error('❌ 启动失败:', e);
    process.exit(1);
  });

module.exports = { bot };
