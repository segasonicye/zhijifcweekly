#!/usr/bin/env node

/**
 * 战报预览脚本
 * 生成HTML并在浏览器中预览
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

/**
 * 列出所有比赛
 */
function listMatches() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) {
    return [];
  }

  return fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();
}

/**
 * 读取比赛
 */
function readMatch(filename) {
  const filePath = path.join(__dirname, '..', 'matches', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  return { data, body, filename };
}

/**
 * Markdown转HTML
 */
function markdownToHTML(markdown) {
  let html = markdown;

  // 处理标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');

  // 处理图片 - 将Markdown图片转换为HTML img标签
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    // 使用相对路径
    return `<img src="${src}" alt="${alt}" style="width: 100%; border-radius: 10px; margin: 20px 0;">`;
  });

  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 处理段落
  html = html.replace(/\n\n/g, '</p><p style="line-height: 1.8; margin: 10px 0;">');
  html = '<p style="line-height: 1.8; margin: 10px 0;">' + html + '</p>';

  // 处理换行
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * 生成预览HTML
 */
function generatePreviewHTML(match) {
  const { data, body } = match;

  // 找出进球最多的球员
  let topScorer = null;
  let maxGoals = 0;

  if (data.scorers && data.scorers.length > 0) {
    data.scorers.forEach(scorer => {
      const goals = scorer.goals || 1; // 如果有goals字段就用,否则默认为1
      const name = scorer.name;
      if (goals > maxGoals) {
        maxGoals = goals;
        topScorer = name;
      }
    });
  }

  // 使用frontmatter中的mvp字段,如果没有则从正文提取
  let mvp = data.mvp || null;
  if (!mvp) {
    const mvpMatch = body.match(/(?:MVP|最佳球员|本场之星|全场最佳)[：:、\s]*([^\n\r，,。.]{2,4})/);
    if (mvpMatch) {
      mvp = mvpMatch[1].trim();
    }
  }

  const contentHTML = markdownToHTML(body);

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.8;
      color: #2c3e50;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
      position: relative;
    }

    /* 阅读进度条 */
    .progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      z-index: 9999;
      transition: width 0.1s ease;
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
    }

    /* 返回顶部按钮 */
    .back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .back-to-top.show {
      opacity: 1;
      visibility: visible;
    }

    .back-to-top:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
    }

    .back-to-top:active {
      transform: translateY(-2px);
    }

    /* 返回首页按钮 */
    .back-to-home {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.95);
      color: #667eea;
      padding: 12px 24px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      z-index: 9997;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 2px solid rgba(102, 126, 234, 0.2);
    }

    .back-to-home:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
      border-color: #667eea;
    }

    .back-to-home:active {
      transform: translateY(0);
    }

    .back-to-home .icon {
      font-size: 18px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 0;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 40px 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .team-logo {
      width: 180px;
      height: 180px;
      margin: 0 auto 40px auto;
      border-radius: 50%;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
      overflow: hidden;
    }

    .team-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header::before {
      content: '⚽';
      position: absolute;
      font-size: 150px;
      opacity: 0.1;
      top: -30px;
      right: -30px;
      transform: rotate(15deg);
    }

    .header h1 {
      font-size: 36px;
      margin-bottom: 20px;
      font-weight: 700;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }

    .info-box {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 25px;
      position: relative;
      z-index: 1;
    }

    .info-item {
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 15px;
      font-weight: 500;
      border: 1px solid rgba(255,255,255,0.3);
      transition: all 0.3s ease;
    }

    .info-item:hover {
      background: rgba(255,255,255,0.35);
      transform: translateY(-2px);
    }

    .star-section {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 25px;
      position: relative;
      z-index: 1;
    }

    .star-badge {
      background: rgba(255,255,255,0.95);
      color: #667eea;
      padding: 15px 30px;
      border-radius: 15px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .star-badge .icon {
      font-size: 24px;
    }

    .content {
      padding: 50px 40px;
      background: white;
    }

    .content p {
      margin-bottom: 20px;
      font-size: 17px;
      line-height: 2;
      color: #34495e;
    }

    .content h2 {
      font-size: 28px;
      color: #667eea;
      margin: 40px 0 25px 0;
      padding-bottom: 15px;
      border-bottom: 3px solid #667eea;
      font-weight: 600;
    }

    .content h3 {
      font-size: 24px;
      color: #764ba2;
      margin: 35px 0 20px 0;
      font-weight: 600;
    }

    .content strong {
      color: #e74c3c;
      font-weight: 600;
    }

    .photos-section {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 40px;
      margin: 0;
    }

    .photos-section h3 {
      text-align: center;
      font-size: 26px;
      color: #667eea;
      margin-bottom: 30px;
      font-weight: 600;
    }

    .photo-item {
      background: white;
      padding: 15px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin-bottom: 25px;
      transition: transform 0.3s ease;
    }

    .photo-item:hover {
      transform: translateY(-5px);
    }

    .photo-item img {
      width: 100%;
      height: auto;
      border-radius: 10px;
      display: block;
    }

    .photo-caption {
      text-align: center;
      color: #7f8c8d;
      font-size: 15px;
      margin-top: 12px;
      font-style: italic;
    }

    .footer {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 40px 20px;
      font-size: 16px;
    }

    .footer p {
      margin: 8px 0;
      opacity: 0.95;
    }

    .footer-emoji {
      font-size: 24px;
      margin-top: 15px;
    }

    @media (max-width: 768px) {
      body {
        padding: 0;
        background: #f5f7fa;
      }

      .progress-bar {
        height: 3px;
      }

      .back-to-top {
        bottom: 20px;
        right: 20px;
        width: 45px;
        height: 45px;
        font-size: 20px;
      }

      .back-to-home {
        top: 15px;
        left: 15px;
        padding: 10px 18px;
        font-size: 14px;
      }

      .back-to-home .icon {
        font-size: 16px;
      }

      .container {
        border-radius: 0;
        box-shadow: none;
        max-width: 100%;
      }

      .header {
        padding: 35px 20px 30px 20px;
      }

      .team-logo {
        width: 100px;
        height: 100px;
        margin-bottom: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
      }

      .header::before {
        font-size: 80px;
        top: -15px;
        right: -15px;
      }

      .header h1 {
        font-size: 22px;
        line-height: 1.5;
        margin-bottom: 18px;
        padding: 0 10px;
      }

      .info-box {
        gap: 8px 10px;
        margin-top: 18px;
      }

      .info-item {
        font-size: 13px;
        padding: 7px 13px;
        border-radius: 20px;
      }

      .star-section {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 18px;
      }

      .star-badge {
        font-size: 14px;
        padding: 10px 18px;
        border-radius: 20px;
      }

      .star-badge .icon {
        font-size: 18px;
      }

      .content {
        padding: 30px 20px 30px 20px;
      }

      .content p {
        font-size: 16px;
        line-height: 2;
        margin-bottom: 20px;
        text-align: justify;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      .content h2 {
        font-size: 21px;
        margin: 35px 0 18px 0;
        padding-bottom: 10px;
        border-bottom-width: 2px;
        letter-spacing: 0.5px;
      }

      .content h3 {
        font-size: 19px;
        margin: 28px 0 16px 0;
        letter-spacing: 0.3px;
      }

      .content strong {
        font-size: 16px;
        letter-spacing: 0.2px;
      }

      .photos-section {
        padding: 30px 18px 35px 18px;
      }

      .photos-section h3 {
        font-size: 21px;
        margin-bottom: 22px;
        letter-spacing: 0.5px;
      }

      .photo-item {
        padding: 10px;
        margin-bottom: 18px;
        border-radius: 12px;
      }

      .photo-item img {
        border-radius: 8px;
      }

      .photo-caption {
        font-size: 14px;
        margin-top: 10px;
        line-height: 1.6;
      }

      .footer {
        padding: 35px 20px;
        font-size: 15px;
      }

      .footer p {
        line-height: 1.8;
      }

      .footer-emoji {
        font-size: 22px;
        margin-top: 15px;
        letter-spacing: 3px;
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 30px 18px 25px 18px;
      }

      .team-logo {
        width: 90px;
        height: 90px;
        margin-bottom: 18px;
      }

      .header h1 {
        font-size: 20px;
        padding: 0 5px;
      }

      .info-box {
        gap: 7px 8px;
      }

      .info-item {
        font-size: 12px;
        padding: 6px 12px;
      }

      .star-badge {
        font-size: 13px;
        padding: 9px 15px;
      }

      .content {
        padding: 25px 18px 30px 18px;
      }

      .content p {
        font-size: 15px;
        line-height: 2;
        margin-bottom: 18px;
      }

      .content h2 {
        font-size: 19px;
        margin: 30px 0 15px 0;
      }

      .content h3 {
        font-size: 17px;
        margin: 25px 0 14px 0;
      }

      .content strong {
        font-size: 15px;
      }

      .photos-section {
        padding: 25px 15px 30px 15px;
      }

      .photos-section h3 {
        font-size: 19px;
        margin-bottom: 18px;
      }

      .photo-item {
        padding: 8px;
        margin-bottom: 15px;
      }

      .footer {
        padding: 30px 18px;
        font-size: 14px;
      }

      .footer-emoji {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <!-- 阅读进度条 -->
  <div class="progress-bar" id="progressBar"></div>

  <!-- 返回首页按钮 -->
  <a href="matches.html" class="back-to-home" title="返回首页">
    <span class="icon">←</span>
    <span>首页</span>
  </a>

  <!-- 返回顶部按钮 -->
  <button class="back-to-top" id="backToTop" title="返回顶部">↑</button>

  <div class="container">
    <div class="header">
      <div class="team-logo">
        <img src="../logo.png" alt="河伯FC Logo">
      </div>
      <h1>${data.title || '⚽ 比赛战报'}</h1>
      <div class="info-box">
        ${data.date ? `<div class="info-item">📅 ${data.date}</div>` : ''}
        ${data.opponent ? `<div class="info-item">⚔️ ${data.opponent}</div>` : ''}
        ${data.score ? `<div class="info-item" style="font-size: 18px;">${data.score}</div>` : ''}
        ${data.location ? `<div class="info-item">📍 ${data.location}</div>` : ''}
      </div>
      ${mvp ? `
      <div class="star-section">
        <div class="star-badge"><span class="icon">⭐</span><span>MVP: <strong>${mvp}</strong></span></div>
      </div>
      ` : ''}
    </div>

    <div class="content">
      ${contentHTML}
    </div>

    ${data.photos && data.photos.length > 0 ? `
    <div class="photos-section">
      <h3>📸 精彩瞬间</h3>
      ${data.photos.map(photo => {
        return `
          <div class="photo-item">
            <img src="${photo.path}" alt="${photo.caption || ''}">
            ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}


    <div class="footer">
      <p>— 感谢阅读 —</p>
      <p>知己足球俱乐部 · 每周末与你相约</p>
      <div class="footer-emoji">⚽ 💪 🎉</div>
    </div>
  </div>

  <script>
    // 阅读进度条
    function updateProgressBar() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      document.getElementById('progressBar').style.width = progress + '%';
    }

    // 返回顶部按钮
    const backToTopButton = document.getElementById('backToTop');

    function toggleBackToTopButton() {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }
    }

    backToTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // 监听滚动事件
    window.addEventListener('scroll', function() {
      updateProgressBar();
      toggleBackToTopButton();
    });

    // 初始化
    updateProgressBar();
  </script>
</body>
</html>
  `;

  return html;
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== 战报预览 ===\n');

  // 列出所有比赛
  const matches = listMatches();
  if (matches.length === 0) {
    console.log('❌ 没有找到比赛记录');
    process.exit(1);
  }

  console.log('📋 可用的比赛记录:\n');
  matches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match.replace('.md', '')}`);
  });
  console.log('');

  // 如果有参数,使用参数指定的比赛;否则使用最新的比赛
  const matchFile = process.argv[2] || matches[0];

  // 确保文件名以.md结尾
  const filename = matchFile.endsWith('.md') ? matchFile : matchFile + '.md';

  // 验证文件是否存在
  if (!matches.includes(filename)) {
    console.log(`❌ 找不到比赛记录: ${filename}`);
    console.log('\n可用的比赛记录:');
    matches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.replace('.md', '')}`);
    });
    process.exit(1);
  }

  const match = readMatch(filename);
  console.log(`📖 正在预览: ${filename}\n`);

  // 生成HTML
  const html = generatePreviewHTML(match);

  // 保存到文件,使用比赛文件名
  const previewDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  // 使用对应的HTML文件名
  const previewFile = path.join(previewDir, filename.replace('.md', '.html'));
  fs.writeFileSync(previewFile, html, 'utf-8');
  console.log(`✅ 预览文件已生成: ${previewFile}`);

  // 在浏览器中打开
  const filePath = path.resolve(previewFile);
  console.log(`\n🌐 正在打开浏览器预览...\n`);

  try {
    if (process.platform === 'win32') {
      execSync(`start "" "${filePath}"`);
    } else if (process.platform === 'darwin') {
      execSync(`open "${filePath}"`);
    } else {
      execSync(`xdg-open "${filePath}"`);
    }
  } catch (error) {
    console.log(`\n💡 请在浏览器中打开: file://${filePath}\n`);
  }
}

main().catch(error => {
  console.error('❌ 发生错误:', error.message);
  process.exit(1);
});
