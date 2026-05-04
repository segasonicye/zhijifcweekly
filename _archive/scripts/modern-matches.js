#!/usr/bin/env node

/**
 * 生成现代化战报回看页面
 * 采用最新的设计趋势: 玻璃态、渐变、动画
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * 读取所有比赛
 */
function readMatches() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  const outputDir = path.join(__dirname, '..', 'output');

  if (!fs.existsSync(matchesDir)) {
    return [];
  }

  // 获取所有已生成的HTML文件
  const generatedFiles = fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : [];

  const matchFiles = fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();

  const files = matchFiles.map(file => {
    const filePath = path.join(matchesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    const cleanBody = body.replace(/[#*`\-\n]/g, ' ').replace(/\s+/g, ' ').trim();
    const summary = cleanBody.substring(0, 80) + '...';

    // 查找该比赛的所有已生成样式
    const baseName = file.replace('.md', '');
    const styles = [];

    // 检查各种样式的文件是否存在
    // 格式: wechat-{baseName}-{style}.html 或 wechat-{baseName}.html

    // Fresh
    if (generatedFiles.includes(`wechat-${baseName}-fresh.html`)) {
      styles.push({ name: 'Fresh (清新)', type: 'fresh', file: `wechat-${baseName}-fresh.html` });
    }
    // Cyber
    if (generatedFiles.includes(`wechat-${baseName}-cyber.html`)) {
      styles.push({ name: 'Cyber (赛博)', type: 'cyber', file: `wechat-${baseName}-cyber.html` });
    }
    // Field
    if (generatedFiles.includes(`wechat-${baseName}-field.html`)) {
      styles.push({ name: 'Field (绿茵)', type: 'field', file: `wechat-${baseName}-field.html` });
    }
    // Ins
    if (generatedFiles.includes(`wechat-${baseName}-ins.html`)) {
      styles.push({ name: 'Ins (极简)', type: 'ins', file: `wechat-${baseName}-ins.html` });
    }
    // Battle
    if (generatedFiles.includes(`wechat-${baseName}-battle.html`)) {
      styles.push({ name: 'Battle (热血)', type: 'battle', file: `wechat-${baseName}-battle.html` });
    }
    // Default/Original
    if (generatedFiles.includes(`wechat-${baseName}.html`)) {
      styles.push({ name: 'Classic (经典)', type: 'default', file: `wechat-${baseName}.html` });
    }

    // 兼容旧版命名
    if (generatedFiles.includes(`${baseName}.html`)) {
      styles.push({ name: 'Preview', type: 'default', file: `${baseName}.html` });
    }

    return {
      file,
      ...data,
      summary,
      styles,
      body: body.substring(0, 500)
    };
  });

  // 查找月度总结报告
  const summaryFiles = generatedFiles.filter(f => f.match(/^\d{4}-\d{2}-monthly-summary-wechat\.html$/));

  const summaries = summaryFiles.map(file => {
    const match = file.match(/^(\d{4})-(\d{2})-monthly-summary-wechat\.html$/);
    const year = match[1];
    const month = match[2];

    return {
      file: `summary-${year}-${month}`, // Fake ID
      date: `${year}-${month}-31`, // Sort at end of month
      title: `${year}年${month}月赛事总结`,
      opponent: '月度报告',
      score: '📊',
      summary: `${year}年${month}月全队数据统计分析，包含MVP榜、射手榜和出勤率统计。`,
      mvp: '全队',
      styles: [
        { name: 'WeChat Report', type: 'fresh', file: file }
      ],
      body: '',
      isReport: true // Flag to style differently if needed
    };
  });

  // 合并并按日期排序
  return [...files, ...summaries].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
}

/**
 * 计算MVP统计
 */
function calculateMVPStats(matches) {
  const mvpStats = {};

  matches.forEach(match => {
    if (match.mvp) {
      // 支持多人MVP (数组或分隔符字符串)
      let mvpNames = [];
      
      if (Array.isArray(match.mvp)) {
        mvpNames = match.mvp;
      } else {
        // 支持顿号、逗号、中文逗号分隔
        mvpNames = String(match.mvp).split(/[,，、]/).map(name => name.trim()).filter(name => name);
      }

      mvpNames.forEach(name => {
        if (!mvpStats[name]) {
          mvpStats[name] = {
            name: name,
            count: 0,
            matches: []
          };
        }
        mvpStats[name].count++;
        mvpStats[name].matches.push({
          date: match.date,
          opponent: match.opponent,
          score: match.score
        });
      });
    }
  });

  return Object.values(mvpStats).sort((a, b) => b.count - a.count);
}

/**
 * 获取样式颜色
 */
function getStyleColor(type) {
  const styles = {
    'fresh': 'background: #e8f8f5; color: #2ecc71; border-color: #2ecc71;',
    'cyber': 'background: #1a1a2e; color: #00f3ff; border-color: #00f3ff;',
    'field': 'background: #134e5e; color: #fff; border-color: #71b280;',
    'ins': 'background: #fafafa; color: #333; border-color: #333;',
    'battle': 'background: #fff0f0; color: #ff6b6b; border-color: #ff6b6b;',
    'default': 'background: #f0f4ff; color: #667eea; border-color: #667eea;'
  };
  return styles[type] || styles['default'];
}

/**
 * 生成现代化HTML页面
 */
function generateHTML(matches, mvpStats) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>知己足球俱乐部 - 战报回看</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --card-bg: rgba(255, 255, 255, 0.95);
      --text-primary: #1a1a2e;
      --text-secondary: #4a4a6a;
      --shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 20px 60px rgba(102, 126, 234, 0.3);
      --shadow-xl: 0 30px 90px rgba(0, 0, 0, 0.15);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      background-attachment: fixed;
      min-height: 100vh;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* 头部 - 玻璃态效果 */
    .header {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 50px 40px;
      border-radius: 30px;
      box-shadow: var(--shadow-lg);
      margin-bottom: 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
      animation: fadeInUp 0.6s ease;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
      animation: rotate 20s linear infinite;
      pointer-events: none;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo {
      width: 160px;
      height: 160px;
      margin: 0 auto 35px auto;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
      position: relative;
      z-index: 1;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .logo:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 20px 50px rgba(102, 126, 234, 0.6);
    }

    .logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header h1 {
      font-size: 48px;
      font-weight: 800;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 15px;
      position: relative;
      z-index: 1;
      letter-spacing: -1px;
    }

    .header .subtitle {
      font-size: 20px;
      color: var(--text-secondary);
      margin-bottom: 35px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    /* 统计卡片 - 现代设计 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 25px;
      max-width: 500px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .stat-card {
      background: var(--primary-gradient);
      color: white;
      padding: 35px 30px;
      border-radius: 25px;
      text-align: center;
      box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-decoration: none;
      display: block;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-card:hover {
      transform: translateY(-10px) scale(1.05);
      box-shadow: 0 25px 50px rgba(102, 126, 234, 0.5);
    }

    .stat-card .number {
      font-size: 56px;
      font-weight: 800;
      margin-bottom: 10px;
      line-height: 1;
      text-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    .stat-card .label {
      font-size: 17px;
      font-weight: 600;
      opacity: 0.95;
      letter-spacing: 0.5px;
    }

    /* 战报卡片区域 */
    .matches-section {
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 45px;
      border-radius: 30px;
      box-shadow: var(--shadow-xl);
      margin-bottom: 30px;
      animation: fadeInUp 0.6s ease 0.2s both;
    }

    .section-title {
      font-size: 36px;
      font-weight: 800;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 40px;
      text-align: center;
      letter-spacing: -1px;
    }

    /* 战报卡片 - 现代设计 */
    .match-card {
      text-decoration: none;
      color: inherit;
      display: block;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      padding: 35px;
      border-radius: 25px;
      margin-bottom: 25px;
      border-left: 6px solid #667eea;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .match-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .match-card:hover::before {
      opacity: 1;
    }

    .match-card:hover {
      transform: translateX(8px) translateY(-3px);
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.2);
      border-left-color: #f093fb;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 18px;
      margin-bottom: 22px;
    }

    .match-title {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .match-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .meta-item {
      background: var(--primary-gradient);
      color: white;
      padding: 10px 18px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .meta-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .meta-item.mvp {
      background: var(--secondary-gradient);
      box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
    }

    .meta-item.mvp:hover {
      box-shadow: 0 6px 20px rgba(240, 147, 251, 0.5);
    }

    .match-summary {
      color: var(--text-secondary);
      line-height: 1.8;
      font-size: 16px;
      margin-bottom: 0;
    }

    .match-card-hint {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #667eea;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }

    .match-card:hover .match-card-hint {
      opacity: 1;
    }

    /* MVP榜单 */
    .mvp-section {
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 45px;
      border-radius: 30px;
      box-shadow: var(--shadow-xl);
      animation: fadeInUp 0.6s ease 0.3s both;
    }

    .mvp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 25px;
    }

    .mvp-card {
      background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
      padding: 30px;
      border-radius: 25px;
      box-shadow: var(--shadow-md);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;
      border: 2px solid transparent;
    }

    .mvp-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--primary-gradient);
      transform: scaleX(0);
      transition: transform 0.3s ease;
      pointer-events: none;
    }

    .mvp-card:hover::before {
      transform: scaleX(1);
    }

    .mvp-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 50px rgba(102, 126, 234, 0.2);
      border-color: rgba(102, 126, 234, 0.2);
    }

    .mvp-name {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 15px;
      letter-spacing: -0.5px;
    }

    .mvp-count {
      font-size: 52px;
      font-weight: 800;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 18px;
      line-height: 1;
    }

    .mvp-matches {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.9;
      font-weight: 500;
    }

    /* 移动端优化 */
    @media (max-width: 768px) {
      body {
        padding: 0;
        background: #f8f9ff;
      }

      .header {
        padding: 40px 25px 35px 25px;
        border-radius: 0;
        border-top: none;
        border-left: none;
        border-right: none;
      }

      .logo {
        width: 110px;
        height: 110px;
        margin-bottom: 25px;
      }

      .header h1 {
        font-size: 32px;
        margin-bottom: 12px;
      }

      .header .subtitle {
        font-size: 17px;
        margin-bottom: 30px;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }

      .stat-card {
        padding: 28px 20px;
      }

      .stat-card .number {
        font-size: 42px;
      }

      .stat-card .label {
        font-size: 15px;
      }

      .matches-section,
      .mvp-section {
        padding: 35px 20px 40px 20px;
        border-radius: 0;
        border-top: none;
        border-left: none;
        border-right: none;
      }

      .section-title {
        font-size: 28px;
        margin-bottom: 30px;
      }

      .match-card {
        padding: 25px;
        margin-bottom: 20px;
        border-radius: 20px;
      }

      .match-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .match-title {
        font-size: 20px;
      }

      .meta-item {
        font-size: 13px;
        padding: 8px 14px;
      }

      .match-summary {
        font-size: 15px;
      }

      .mvp-grid {
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .mvp-card {
        padding: 25px;
      }

      .mvp-name {
        font-size: 22px;
      }

      .mvp-count {
        font-size: 44px;
      }

      .mvp-matches {
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .header h1 {
        font-size: 28px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .section-title {
        font-size: 26px;
      }

      .match-title {
        font-size: 18px;
      }

      .mvp-count {
        font-size: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <div class="logo">
        <img src="logo.png" alt="知己足球俱乐部 Logo">
      </div>
      <h1>知己足球俱乐部</h1>
      <div class="subtitle">记录每一场精彩比赛 ⚽</div>

      <div class="stats-grid">
        <a href="#matches" class="stat-card">
          <div class="number">${matches.length}</div>
          <div class="label">总比赛场次</div>
        </a>
        <a href="#mvp" class="stat-card">
          <div class="number">${mvpStats.length}</div>
          <div class="label">MVP球员</div>
        </a>
      </div>
    </div>

    <!-- 战报列表 -->
    <div id="matches" class="matches-section">
      <div class="section-title">📝 战报回看</div>
      ${matches.map(match => `
        <div class="match-card">
          <div class="match-header">
            <div class="match-title">${match.title || match.date}</div>
            <div class="match-meta">
              <span class="meta-item">📅 ${match.date}</span>
              <span class="meta-item">⚔️ ${match.opponent}</span>
              <span class="meta-item">${match.score}</span>
              ${match.mvp ? `<span class="meta-item mvp">⭐ MVP: ${match.mvp}</span>` : ''}
            </div>
          </div>
          <div class="match-summary">${match.summary}</div>
          
          <div class="style-links" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
            ${match.styles && match.styles.length > 0 ?
      match.styles.map(style => `
                <a href="${style.file}" class="style-badge ${style.type}" style="
                  text-decoration: none;
                  padding: 6px 12px;
                  border-radius: 15px;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.2s;
                  border: 1px solid rgba(0,0,0,0.1);
                  ${getStyleColor(style.type)}
                ">${style.name}</a>
              `).join('')
      : '<span style="color: #999; font-size: 13px;">暂无已生成战报 (请运行 npm run p/pi/pb/pf/pc/pg)</span>'
    }
          </div>
        </div>
      `).join('')}
    </div>

    <!-- MVP排行榜 -->
    ${mvpStats.length > 0 ? `
    <div id="mvp" class="mvp-section">
      <div class="section-title">⭐ MVP 榜单</div>
      <div class="mvp-grid">
        ${mvpStats.map((mvp, index) => `
          <div class="mvp-card">
            <div class="mvp-name">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'} ${mvp.name}</div>
            <div class="mvp-count">${mvp.count}</div>
            <div class="mvp-matches">
              获奖比赛:<br>
              ${mvp.matches.map(m => `• ${m.date} ${m.opponent}`).join('<br>')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;

  return html;
}

/**
 * 主函数
 */
function main() {
  console.log('\n=== 生成现代化战报页面 ===\n');

  try {
    const matches = readMatches();
    console.log(`✅ 找到 ${matches.length} 场比赛`);

    const mvpStats = calculateMVPStats(matches);
    console.log(`✅ 统计到 ${mvpStats.length} 位MVP`);

    const html = generateHTML(matches, mvpStats);

    // 保存文件
    const outputFile = path.join(__dirname, '..', 'output', 'matches.html');
    const outputDir = path.dirname(outputFile);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, html, 'utf-8');
    console.log(`\n✅ 页面已生成: ${outputFile}`);

    // 生成index.html
    const indexFile = path.join(__dirname, '..', 'output', 'index.html');
    const indexHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=matches.html">
  <title>知己足球俱乐部</title>
  <script>
    window.location.href = 'matches.html';
  </script>
</head>
<body>
  <p style="text-align: center; padding: 50px; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
    正在跳转到战报页面...
  </p>
</body>
</html>`;
    fs.writeFileSync(indexFile, indexHTML, 'utf-8');
    console.log(`✅ 索引页面已生成: ${indexFile}`);

    // 在浏览器中打开
    const filePath = path.resolve(outputFile);
    console.log(`\n🌐 正在打开浏览器...`);

    const { execSync } = require('child_process');
    try {
      if (process.platform === 'win32') {
        execSync(`start "" "${filePath}"`);
      } else if (process.platform === 'darwin') {
        execSync(`open "${filePath}"`);
      } else {
        execSync(`xdg-open "${filePath}"`);
      }
    } catch (error) {
      console.log(`\n💡 请在浏览器中打开: file://${filePath}`);
    }

    console.log('\n✨ 完成!\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
