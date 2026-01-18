# 微信自动生成战报方案

## 📱 方案概述

通过微信接收聊天记录（文本+照片），自动生成结构化战报并保存到系统。

---

## 🎯 实现方案对比

### 方案1：微信个人号机器人（推荐）⭐⭐⭐⭐⭐

**优点**：
- ✅ 用户最方便，直接转发聊天记录即可
- ✅ 可以接收文本、图片混合内容
- ✅ 实时处理，即时反馈
- ✅ 无需额外操作

**缺点**：
- ⚠️ 需要使用第三方库（有封号风险）
- ⚠️ 需要一台服务器或常驻运行的电脑
- ⚠️ 微信可能限制接口

**实现库**：
- **wechaty**（推荐）- 开源，社区活跃
- **wechat4u** - 轻量级
- **padlocal** - 商业方案，稳定

---

### 方案2：微信公众号/小程序 ⭐⭐⭐

**优点**：
- ✅ 官方支持，稳定可靠
- ✅ 不会被封号
- ✅ 可以上传文件

**缺点**：
- ❌ 需要认证（300元/年）
- ❌ 开发复杂度高
- ❌ 用户需要手动操作

---

### 方案3：网页版+文件上传 ⭐⭐⭐⭐

**优点**：
- ✅ 简单可靠，无需微信API
- ✅ 可以部署到Netlify等免费平台
- ✅ 支持批量上传

**缺点**：
- ❌ 需要手动导出聊天记录
- ❌ 不够自动化

---

## 🚀 推荐方案：Wechaty个人号机器人

### 架构设计

```
┌─────────────┐
│  用户微信    │ 转发聊天记录
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 战报机器人   │ 接收消息
│ (微信号)    │ ↓
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│  消息处理服务    │ 解析内容
│  (Node.js)      │ ↓
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│  AI战报生成器    │ 生成结构化战报
│  (可选)         │ ↓
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│  保存到系统      │ 创建MD文件
│  matches/       │ 保存照片
└─────────────────┘
```

---

## 📝 详细实现步骤

### 第一步：搭建Wechaty机器人

#### 1.1 安装依赖

```bash
npm install wechaty
npm install wechaty-puppet-wechat
npm install file-box  # 处理文件
```

#### 1.2 创建机器人脚本

```javascript
// scripts/wechat-bot.js
const { Wechaty } = require('wechaty');
const { FileBox } = require('file-box');
const PuppetWechat = require('wechaty-puppet-wechat');
const fs = require('fs');
const path = require('path');

// 初始化机器人
const bot = new Wechaty({
  name: '战报机器人',
  puppet: new PuppetWechat(),
});

// 消息处理状态
let currentMatch = null;
let photoBuffer = [];

bot.on('message', async function (msg) {
  const contact = msg.talker(); // 发送者
  const text = msg.text();       // 文本内容
  const room = msg.room();       // 群聊

  // 只处理指定联系人
  if (!isAuthorized(contact)) {
    return;
  }

  console.log(`收到消息: ${text}`);

  // 处理不同类型消息
  if (msg.type() === bot.Message.Type.Text) {
    await handleTextMessage(text, contact);
  } else if (msg.type() === bot.Message.Type.Image) {
    await handleImageMessage(msg, contact);
  }
});

// 判断是否授权用户
function isAuthorized(contact) {
  const authorizedUsers = [
    '您的微信昵称',
    // 添加其他授权用户
  ];
  return authorizedUsers.includes(contact.name());
}

// 处理文本消息
async function handleTextMessage(text, contact) {
  // 命令模式
  if (text.startsWith('/')) {
    await handleCommand(text, contact);
    return;
  }

  // 普通文本，追加到当前战报
  if (currentMatch) {
    currentMatch.description += '\n' + text;
    await contact.say('✅ 已记录内容');
  } else {
    await contact.say('❌ 请先使用 /new 创建新战报');
  }
}

// 处理命令
async function handleCommand(text, contact) {
  const [command, ...args] = text.split(' ');

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

    case '/help':
      await showHelp(contact);
      break;

    default:
      await contact.say('❓ 未知命令，发送 /help 查看帮助');
  }
}

// 创建新战报
async function createNewMatch(args, contact) {
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

请继续发送：
- 文本：比赛描述
- 图片：比赛照片
- /info 地点 比分 MVP：设置比赛信息
- /finish：完成并生成战报
  `);
}

// 设置比赛信息
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
✅ 已更新信息：
📍 地点: ${currentMatch.info.location || '未设置'}
🎯 比分: ${currentMatch.info.score || '未设置'}
⭐ MVP: ${currentMatch.info.mvp || '未设置'}
  `);
}

// 处理图片消息
async function handleImageMessage(msg, contact) {
  if (!currentMatch) {
    await contact.say('❌ 请先使用 /new 创建战报');
    return;
  }

  try {
    // 下载图片
    const fileBox = await msg.toFileBox();
    const date = currentMatch.date;

    // 创建照片目录
    const photosDir = path.join(__dirname, '..', 'photos', date);
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // 保存图片
    const filename = `photo-${String(photoBuffer.length + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(photosDir, filename);
    await fileBox.toFile(filepath);

    // 添加到缓冲区
    photoBuffer.push(filename);

    await contact.say(`📸 已保存照片 ${photoBuffer.length}: ${filename}`);

  } catch (error) {
    console.error('保存照片失败:', error);
    await contact.say('❌ 保存照片失败');
  }
}

// 完成战报
async function finishMatch(contact) {
  if (!currentMatch) {
    await contact.say('❌ 没有进行中的战报');
    return;
  }

  try {
    // 生成Markdown文件
    const markdown = generateMarkdown(currentMatch, photoBuffer);

    // 保存到matches目录
    const matchesDir = path.join(__dirname, '..', 'matches');
    const filename = `${currentMatch.date}-${currentMatch.opponent}.md`;
    const filepath = path.join(matchesDir, filename);

    fs.writeFileSync(filepath, markdown, 'utf-8');

    await contact.say(`
✅ 战报生成成功！

📁 文件: ${filename}
📝 标题: ${currentMatch.title}
📸 照片: ${photoBuffer.length}张

使用以下命令发布：
npm run publish:ins    # Ins风格
npm run publish:battle # 热血风格

或使用 /publish 命令直接发布
    `);

    // 重置状态
    currentMatch = null;
    photoBuffer = [];

  } catch (error) {
    console.error('生成战报失败:', error);
    await contact.say('❌ 生成战报失败: ' + error.message);
  }
}

// 生成Markdown
function generateMarkdown(match, photos) {
  const frontmatter = {
    title: match.title,
    date: match.date,
    opponent: match.opponent,
    score: match.info.score || '',
    location: match.info.location || '',
    mvp: match.info.mvp || '',
    photos: photos.map(p => `photos/${match.date}/${p}`)
  };

  return `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n  - ${value.join('\n  - ')}`;
    }
    return `${key}: ${value}`;
  })
  .join('\n')}
---

${match.description || '比赛详情待补充...'}
---
`;
}

// 显示帮助
async function showHelp(contact) {
  await contact.say(`
📖 战报机器人使用指南

🎯 基本命令：
/new <对手名称> - 创建新战报
/info <地点> <比分> <MVP> - 设置比赛信息
/finish - 完成并生成战报
/help - 显示帮助

📸 使用方法：
1. 发送 /new 对手名称
2. 发送文本描述（可分多条）
3. 发送比赛照片
4. 发送 /info 福沁球场 3-2 张三
5. 发送 /finish

💡 提示：
- 可以随时发送内容和照片
- 照片会自动编号保存
- 完成后自动生成Markdown文件
  `);
}

// 启动机器人
bot.start()
  .then(() => console.log('🤖 战报机器人已启动'))
  .catch((e) => console.error('启动失败:', e));

module.exports = { bot };
```

---

### 第二步：添加到package.json

```json
{
  "scripts": {
    "bot": "node scripts/wechat-bot.js"
  },
  "dependencies": {
    "wechaty": "^1.20.2",
    "wechaty-puppet-wechat": "^1.18.4",
    "file-box": "^1.4.5"
  }
}
```

---

### 第三步：使用流程

#### 3.1 启动机器人

```bash
npm run bot
```

首次运行会显示二维码：
```
┌────────────────────────────────────┐
│  1. Save the QRCode image          │
│  2. Scan with WeChat               │
│  3. Log in                         │
└────────────────────────────────────┘
[QR CODE]
```

用微信扫描登录即可。

#### 3.2 使用机器人

**在微信中发送**：

```
1. /new 党校队

→ 机器人：✅ 已创建新战报
   📅 日期: 2026-01-15
   ⚽ 对手: 党校队

2. 元旦假期福沁大对决,知己VS党校,
   两队精锐尽出,展开一场跌宕起伏的
   友好交流赛。

→ 机器人：✅ 已记录内容

3. [发送照片]

→ 机器人：📸 已保存照片 1: photo-001.jpg

4. /info 福沁球场 20-26 高主席

→ 机器人：✅ 已更新信息
   📍 地点: 福沁球场
   🎯 比分: 20-26
   ⭐ MVP: 高主席

5. /finish

→ 机器人：✅ 战报生成成功！
   📁 文件: 2026-01-15-党校队.md
   📸 照片: 5张
```

---

## 🎨 增强功能

### 1. AI自动生成战报

```javascript
// 集成AI生成
async function generateWithAI(description) {
  const prompt = `
根据以下信息生成足球战报：
${description}

要求：生动有趣，300-500字
  `;

  const aiReport = await callAI(prompt);
  return aiReport;
}
```

### 2. 语音转文字

```javascript
// 处理语音消息
if (msg.type() === bot.Message.Type.Audio) {
  const text = await transcribeAudio(msg);
  await handleTextMessage(text, contact);
}
```

### 3. 自动发布

```javascript
// 完成后自动生成HTML
async function finishMatch(contact) {
  // ... 生成MD文件 ...

  // 自动调用发布脚本
  const { execSync } = require('child_process');
  execSync('npm run publish:ins');

  await contact.say('✅ 已自动生成微信公众号文章');
}
```

---

## ⚠️ 注意事项

### 1. 微信账号安全

- ✅ 使用小号专门做机器人
- ✅ 避免频繁操作
- ✅ 不要大规模营销

### 2. 服务器要求

- 可以用闲置电脑/笔记本
- 或使用云服务器（推荐：
  - 阿里云/腾讯云轻量服务器
  - 最低配置：1核2G
  - 成本：约50-100元/年

### 3. 稳定性

- 添加自动重连
- 错误日志记录
- 定期备份数据

---

## 🚀 部署方案

### 方案A：本地运行（开发测试）

```bash
npm run bot
```

### 方案B：服务器运行（推荐）

使用PM2保持进程运行：

```bash
# 安装PM2
npm install -g pm2

# 启动
pm2 start scripts/wechat-bot.js --name match-bot

# 查看日志
pm2 logs match-bot

# 开机自启
pm2 startup
pm2 save
```

### 方案C：Docker部署

```dockerfile
FROM node:18

WORKDIR /app
COPY . .
RUN npm install

CMD ["npm", "run", "bot"]
```

---

## 💡 替代简化方案

如果觉得Wechaty太复杂，可以用更简单的方式：

### 方案：网页+文件上传

创建一个简单的HTML页面：

```html
<!-- bot-upload.html -->
<form id="uploadForm">
  <input type="text" id="opponent" placeholder="对手名称">
  <input type="text" id="score" placeholder="比分">
  <textarea id="description" placeholder="比赛描述"></textarea>
  <input type="file" id="photos" multiple>
  <button type="submit">生成战报</button>
</form>

<script>
document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();

  const data = {
    opponent: document.getElementById('opponent').value,
    score: document.getElementById('score').value,
    description: document.getElementById('description').value,
    photos: document.getElementById('photos').files
  };

  const response = await fetch('/api/create-match', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  alert('战报生成成功！');
};
</script>
```

---

## 🎯 我的建议

### 快速开始（1小时内可用）：

1. **先实现基础版**
   - 使用Wechaty创建简单机器人
   - 支持文本+图片接收
   - 自动生成MD文件

2. **逐步增强**
   - 添加AI战报生成
   - 添加自动发布
   - 添加更多命令

3. **部署到服务器**
   - 购买轻量服务器
   - 用PM2保持运行
   - 设置定时备份

---

## 📞 需要帮助吗？

我可以帮您：
1. 编写完整的机器人代码
2. 搭建服务器环境
3. 调试遇到的问题
4. 添加自定义功能

**要开始实现吗？我可以立即为您创建完整可用的版本！** 🚀
