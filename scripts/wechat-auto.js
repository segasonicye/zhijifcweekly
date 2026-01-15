#!/usr/bin/env node

/**
 * 一键同步最新战报到微信公众号
 * 自动选择最新战报 → 生成公众号HTML → 复制到剪贴板 → 打开预览
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 获取最新的战报文件
 */
function getLatestMatch() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) {
    return null;
  }

  const files = fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();

  return files.length > 0 ? files[0] : null;
}

/**
 * 读取并解析比赛文件
 */
function readMatch(filename) {
  const filePath = path.join(__dirname, '..', 'matches', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  return { data, body, filename };
}

/**
 * 转换Markdown为微信公众号HTML格式
 */
function markdownToWechatHTML(markdown, data) {
  let html = markdown;

  // 处理标题
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">$1</h2>');

  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 处理图片
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const imgName = path.basename(src);
    return `<img src="${imgName}" alt="${alt}" style="width: 100%; max-width: 600px; display: block; margin: 15px auto; border-radius: 8px;" />`;
  });

  // 处理链接
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #1890ff; text-decoration: none;">$1</a>');

  // 处理段落
  html = html.replace(/\n\n/g, '</p><p style="line-height: 1.8; margin: 10px 0; color: #555;">');
  html = '<p style="line-height: 1.8; margin: 10px 0; color: #555;">' + html + '</p>';

  // 处理换行
  html = html.replace(/\n/g, '<br/>');

  return html;
}

/**
 * 从照片目录自动加载照片
 */
function loadPhotosFromDirectory(data) {
  const photosDir = path.join(__dirname, '..', 'photos', data.date);

  if (!fs.existsSync(photosDir)) {
    return [];
  }

  const files = fs.readdirSync(photosDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .sort();

  return files.map(filename => ({
    path: path.join('photos', data.date, filename).replace(/\\/g, '/'),
    caption: ''
  }));
}

/**
 * 生成微信公众号文章模板
 */
function generateWechatArticle(matchData, matchBody) {
  const { data, body } = matchData;

  // 转换正文
  const contentHTML = markdownToWechatHTML(body, data);

  // 自动加载照片
  let photos = data.photos || [];
  if (photos.length === 0 && data.date) {
    photos = loadPhotosFromDirectory(data);
  }

  // 构建照片展示区
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map(photo => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      const imgName = path.basename(imgPath);

      // 构建绝对路径用于预览
      const absoluteImgPath = path.resolve(__dirname, '..', imgPath).replace(/\\/g, '/');

      return `
        <div style="margin: 25px 0;">
          <img src="file:///${absoluteImgPath}" alt="${caption}" style="width: 100%; max-width: 600px; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);" />
          ${caption ? `<p style="text-align: center; color: #667eea; font-size: 15px; margin: 10px 0 0 0; font-weight: 600;">${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 35px 0; padding: 25px; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); border-radius: 15px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);">
        <h3 style="font-size: 22px; font-weight: 800; margin: 0 0 25px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-align: center;">📸 精彩瞬间</h3>
        ${photosHTML}
      </section>
    `;
  }

  // Logo部分
  const logoPath = path.resolve(__dirname, '..', 'logo.png').replace(/\\/g, '/');
  const logoSection = `
    <div style="text-align: center; margin: 0 0 20px 0;">
      <img src="file:///${logoPath}" alt="知己足球俱乐部 Logo" style="width: 120px; height: 120px; display: block; margin: 0 auto; border-radius: 50%; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);" />
    </div>
  `;

  // 构建比赛信息框
  const infoBox = `
    <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin: 25px 0; color: white; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
      <h1 style="text-align: center; font-size: 26px; margin: 0 0 20px 0; font-weight: 800;">${data.title || '⚽ 比赛战报'}</h1>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 12px;">
        ${data.date ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">📅 ${data.date}</div>` : ''}
        ${data.opponent ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">⚔️ ${data.opponent}</div>` : ''}
        ${data.score ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">${data.score}</div>` : ''}
        ${data.location ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">📍 ${data.location}</div>` : ''}
      </div>
    </section>
  `;

  // 构建出勤名单
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%); border-left: 5px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);">
        <h3 style="margin: 0 0 12px 0; color: #667eea; font-size: 18px; font-weight: 700;">📋 出勤名单 (${data.attendance.length}人)</h3>
        <div style="line-height: 2; color: #4a4a6a; font-size: 15px;">${data.attendance.join('、')}</div>
      </section>
    `;
  }

  // MVP展示 - 使用粉色渐变
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 10px 25px rgba(240, 147, 251, 0.4); text-align: center;">
        <h3 style="margin: 0 0 12px 0; color: white; font-size: 18px; font-weight: 700;">⭐ 本场MVP</h3>
        <div style="font-size: 24px; font-weight: 800; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${data.mvp}</div>
      </section>
    `;
  }

  // 构建完整文章
  const article = `
    <div style="max-width: 650px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); padding: 20px; border-radius: 20px;">
      ${logoSection}
      ${infoBox}
      ${mvpSection}
      <section style="padding: 15px 0; line-height: 1.9; color: #4a4a6a;">
        ${contentHTML}
      </section>
      ${attendanceSection}
      ${photosSection}
      <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; margin: 35px 0 0 0; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.25);">
        <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">— 感谢阅读 —</p>
        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
          知己足球俱乐部 · 每周末与你相约 ⚽
        </p>
      </section>
    </div>
  `;

  return article;
}

/**
 * 复制到剪贴板 (跨平台)
 */
function copyToClipboard(text) {
  try {
    if (process.platform === 'win32') {
      // Windows: 使用 clip
      execSync(`echo "${text.replace(/"/g, '\\"')}" | clip`, { windowsHide: true });
      return true;
    } else if (process.platform === 'darwin') {
      // macOS: 使用 pbcopy
      execSync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
      return true;
    } else {
      // Linux: 尝试使用 xclip 或 xsel
      try {
        execSync(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
        return true;
      } catch (error) {
        try {
          execSync(`echo "${text.replace(/"/g, '\\"')}" | xsel --clipboard --input`);
          return true;
        } catch (error2) {
          return false;
        }
      }
    }
  } catch (error) {
    return false;
  }
}

/**
 * 打开文件浏览器预览
 */
function openInBrowser(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (process.platform === 'win32') {
      execSync(`start "" "${absolutePath}"`, { windowsHide: true });
    } else if (process.platform === 'darwin') {
      execSync(`open "${absolutePath}"`);
    } else {
      execSync(`xdg-open "${absolutePath}"`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  log('\n=== 一键同步微信公众号 ===\n', 'cyan');

  try {
    // 1. 获取最新战报
    log('📖 正在查找最新战报...', 'yellow');
    const latestMatch = getLatestMatch();

    if (!latestMatch) {
      log('❌ 没有找到战报文件', 'red');
      log('\n💡 提示: 请先运行 npm run new 创建战报\n', 'yellow');
      process.exit(1);
    }

    log(`✅ 找到最新战报: ${latestMatch}\n`, 'green');

    // 2. 读取并解析
    log('📋 正在读取战报内容...', 'yellow');
    const matchData = readMatch(latestMatch);

    log(`   标题: ${matchData.data.title || '未设置'}`, 'blue');
    log(`   日期: ${matchData.data.date || '未设置'}`, 'blue');
    log(`   对手: ${matchData.data.opponent || '未设置'}`, 'blue');
    log(`   比分: ${matchData.data.score || '未设置'}`, 'blue');
    if (matchData.data.mvp) {
      log(`   MVP: ${matchData.data.mvp}`, 'blue');
    }
    console.log('');

    // 3. 生成公众号文章
    log('🔄 正在生成微信公众号格式...', 'yellow');
    const article = generateWechatArticle(matchData, matchData.body);
    log('✅ 文章生成完成!\n', 'green');

    // 显示照片信息
    let photos = matchData.data.photos || [];
    if (photos.length === 0 && matchData.data.date) {
      photos = loadPhotosFromDirectory(matchData.data);
    }

    if (photos.length > 0) {
      log(`📸 已包含 ${photos.length} 张照片`, 'green');
    } else {
      log('⚠️  未找到照片', 'yellow');
      log('   提示: 将照片放入 photos/' + matchData.data.date + '/ 目录', 'blue');
    }
    console.log('');

    // 4. 保存HTML文件
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlFile = path.join(outputDir, `wechat-${latestMatch.replace('.md', '')}.html`);
    fs.writeFileSync(htmlFile, article, 'utf-8');
    log(`💾 HTML文件已保存: ${htmlFile}\n`, 'green');

    // 5. 复制到剪贴板
    log('📋 正在复制到剪贴板...', 'yellow');

    // 注意：HTML内容可能太大，我们复制一个提示文本
    const clipboardText = `【知己足球俱乐部战报】${matchData.data.title || ''}\n\n` +
      `日期: ${matchData.data.date}\n` +
      `对手: ${matchData.data.opponent}\n` +
      `比分: ${matchData.data.score}\n\n` +
      `HTML文件路径: ${htmlFile}\n\n` +
      `请打开文件复制完整内容`;

    const copySuccess = copyToClipboard(clipboardText);

    if (copySuccess) {
      log('✅ 已复制到剪贴板!\n', 'green');
    } else {
      log('⚠️  自动复制失败，请手动复制HTML内容\n', 'yellow');
    }

    // 6. 打开浏览器预览
    log('🌐 正在打开浏览器预览...', 'yellow');
    const openSuccess = openInBrowser(htmlFile);

    if (openSuccess) {
      log('✅ 已在浏览器中打开\n', 'green');
    } else {
      log(`⚠️  请手动打开: ${htmlFile}\n`, 'yellow');
    }

    // 7. 显示使用说明
    log('═══════════════════════════════════════', 'cyan');
    log('📝 下一步操作:', 'cyan');
    log('═══════════════════════════════════════', 'cyan');
    log('', 'reset');
    log('1️⃣  在浏览器中查看预览效果', 'blue');
    log('2️⃣  全选并复制 (Ctrl+A, Ctrl+C)', 'blue');
    log('3️⃣  打开微信公众平台编辑器', 'blue');
    log('4️⃣  粘贴HTML内容 (Ctrl+V)', 'blue');
    log('5️⃣  上传图片到公众号素材库', 'blue');
    log('6️⃣  替换图片链接为公众号图片地址', 'blue');
    log('7️⃣  预览并发布文章', 'blue');
    log('', 'reset');

    // 显示需要上传的照片 (使用已存在的 photos 变量)
    if (photos.length > 0) {
      log(`📸 需要上传 ${photos.length} 张图片到公众号:`, 'yellow');
      photos.forEach((photo, index) => {
        const photoName = typeof photo === 'string' ? photo : path.basename(photo.path || '');
        const caption = photo.caption || '';
        log(`   ${index + 1}. ${photoName} ${caption ? `- ${caption}` : ''}`, 'blue');
      });
      log('', 'reset');
    }

    log('✨ 完成!\n', 'green');

  } catch (error) {
    log(`\n❌ 发生错误: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行
main();
