#!/usr/bin/env node

/**
 * 生成战报回看页面
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
    .reverse(); // 最新的在前

  return files.map(file => {
    const filePath = path.join(matchesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    // 截取文章摘要(前80字)
    const cleanBody = body.replace(/[#*`\-\n]/g, ' ').replace(/\s+/g, ' ').trim();
    const summary = cleanBody.substring(0, 80) + '...';

    // 生成对应的预览HTML文件路径
    const previewFile = file.replace('.md', '.html');
    const previewPath = path.join(__dirname, '..', 'output', previewFile);

    return {
      file,
      previewPath,
      ...data,
      summary,
      body: body.substring(0, 500) // 只保留前500字用于预览
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
 * 生成HTML页面
 */
function generateHTML(matches, mvpStats) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>知己足球俱乐部 - 战报回看</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 30px;
      text-align: center;
    }

    .logo {
      width: 150px;
      height: 150px;
      margin: 0 auto 30px auto;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header h1 {
      font-size: 42px;
      color: #667eea;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header .subtitle {
      font-size: 18px;
      color: #7f8c8d;
      margin-bottom: 30px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: block;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    }

    .stat-card .number {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .stat-card .label {
      font-size: 16px;
      opacity: 0.9;
    }

    .mvp-section {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 32px;
      color: #667eea;
      margin-bottom: 30px;
      font-weight: 700;
      text-align: center;
    }

    .mvp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .mvp-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .mvp-card:hover {
      transform: translateY(-5px);
    }

    .mvp-name {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .mvp-count {
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 15px;
    }

    .mvp-matches {
      font-size: 14px;
      color: #7f8c8d;
      line-height: 1.8;
    }

    .matches-section {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .match-card {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 15px;
      margin-bottom: 25px;
      border-left: 5px solid #667eea;
      transition: all 0.3s ease;
    }

    .match-card:hover {
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transform: translateX(5px);
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
    }

    .match-title {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
    }

    .match-meta {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .meta-item {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .meta-item.mvp {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .match-summary {
      color: #555;
      line-height: 1.8;
      font-size: 16px;
      margin-bottom: 15px;
    }

    .read-more {
      color: #667eea;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .read-more:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      body {
        padding: 0;
        background: #f5f7fa;
      }

      .header {
        padding: 35px 20px 30px 20px;
        border-radius: 0;
      }

      .logo {
        width: 100px;
        height: 100px;
        margin-bottom: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      }

      .header h1 {
        font-size: 26px;
        margin-bottom: 10px;
        letter-spacing: 1px;
      }

      .header .subtitle {
        font-size: 15px;
        margin-bottom: 25px;
        line-height: 1.6;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 25px;
        max-width: 100%;
      }

      .stat-card {
        padding: 20px 15px;
      }

      .stat-card .number {
        font-size: 36px;
        margin-bottom: 8px;
      }

      .stat-card .label {
        font-size: 14px;
      }

      .mvp-section,
      .matches-section {
        padding: 30px 18px 35px 18px;
        border-radius: 0;
      }

      .section-title {
        font-size: 22px;
        margin-bottom: 22px;
        letter-spacing: 1px;
      }

      .mvp-grid {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .mvp-card {
        padding: 18px;
      }

      .mvp-name {
        font-size: 19px;
        margin-bottom: 10px;
      }

      .mvp-count {
        font-size: 32px;
        margin-bottom: 12px;
      }

      .mvp-matches {
        font-size: 13px;
        line-height: 1.7;
      }

      .match-card {
        padding: 18px;
        margin-bottom: 18px;
        border-radius: 12px;
      }

      .match-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 15px;
      }

      .match-title {
        font-size: 17px;
        line-height: 1.5;
      }

      .match-meta {
        gap: 8px;
        flex-wrap: wrap;
      }

      .meta-item {
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 15px;
      }

      .match-summary {
        font-size: 14px;
        line-height: 1.8;
        margin-bottom: 12px;
        text-align: justify;
      }

      .read-more {
        font-size: 14px;
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 30px 18px 25px 18px;
      }

      .logo {
        width: 90px;
        height: 90px;
        margin-bottom: 18px;
      }

      .header h1 {
        font-size: 22px;
      }

      .header .subtitle {
        font-size: 14px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .stat-card {
        padding: 22px 18px;
      }

      .stat-card .number {
        font-size: 32px;
      }

      .stat-card .label {
        font-size: 13px;
      }

      .mvp-section,
      .matches-section {
        padding: 25px 15px 30px 15px;
      }

      .section-title {
        font-size: 20px;
        margin-bottom: 18px;
      }

      .mvp-card {
        padding: 16px;
      }

      .mvp-name {
        font-size: 18px;
      }

      .mvp-count {
        font-size: 28px;
      }

      .mvp-matches {
        font-size: 12px;
      }

      .match-card {
        padding: 16px;
        margin-bottom: 16px;
      }

      .match-title {
        font-size: 16px;
        line-height: 1.6;
      }

      .match-summary {
        font-size: 13px;
        line-height: 1.7;
      }

      .read-more {
        font-size: 13px;
      }

      .meta-item {
        font-size: 11px;
        padding: 5px 10px;
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
      <div class="subtitle">记录每一场精彩比赛</div>

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
          <a href="${match.file.replace('.md', '.html')}" class="read-more">阅读全文 →</a>
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
            <div class="mvp-name">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''} ${mvp.name}</div>
            <div class="mvp-count">${mvp.count}次</div>
            <div class="mvp-matches">
              获奖比赛:<br>
              ${mvp.matches.map(m => `${m.date} ${m.opponent}`).join('<br>')}
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
  console.log('\n=== 生成战报回看页面 ===\n');

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

    // 同时生成index.html作为重定向页面
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
  <p style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
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
