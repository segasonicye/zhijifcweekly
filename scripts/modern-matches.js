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
  if (!fs.existsSync(matchesDir)) {
    return [];
  }

  const files = fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();

  return files.map(file => {
    const filePath = path.join(matchesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    const cleanBody = body.replace(/[#*`\-\n]/g, ' ').replace(/\s+/g, ' ').trim();
    const summary = cleanBody.substring(0, 80) + '...';
    const previewFile = file.replace('.md', '.html');
    const previewPath = path.join(__dirname, '..', 'output', previewFile);

    return {
      file,
      previewPath,
      ...data,
      summary,
      body: body.substring(0, 500)
    };
  });
}

/**
 * 计算MVP统计
 */
function calculateMVPStats(matches) {
  const mvpStats = {};

  matches.forEach(match => {
    if (match.mvp) {
      if (!mvpStats[match.mvp]) {
        mvpStats[match.mvp] = {
          name: match.mvp,
          count: 0,
          matches: []
        };
      }
      mvpStats[match.mvp].count++;
      mvpStats[match.mvp].matches.push({
        date: match.date,
        opponent: match.opponent,
        score: match.score
      });
    }
  });

  return Object.values(mvpStats).sort((a, b) => b.count - a.count);
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
      margin-bottom: 18px;
    }

    .read-more {
      color: #667eea;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
    }

    .read-more:hover {
      color: #f093fb;
      transform: translateX(5px);
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
              ${match.mvp ? `<span class="meta-item mvp">⭐ ${match.mvp}</span>` : ''}
            </div>
          </div>
          <div class="match-summary">${match.summary}</div>
          <a href="${match.file.replace('.md', '.html')}" class="read-more">
            阅读全文
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
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
