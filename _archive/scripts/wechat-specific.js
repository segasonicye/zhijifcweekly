#!/usr/bin/env node

/**
 * 快速生成指定比赛的微信公众号文章
 * 用法: npm run wechat:date <日期> [--style <风格>]
 * 示例: node scripts/wechat-specific.js 2026-01-01 --style cny
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

// 获取样式参数
const styleIndex = process.argv.indexOf('--style');
const style = styleIndex !== -1 ? process.argv[styleIndex + 1] : 'default';

// 动态加载模板
let getArticleTemplate;
try {
  if (style === 'default') {
    getArticleTemplate = require('./wechat-template').getArticleTemplate;
  } else {
    getArticleTemplate = require(`./wechat-template-${style}`).getArticleTemplate;
  }
} catch (e) {
  console.log(`⚠️ 找不到样式模板 "${style}"，将使用默认模板。`);
  getArticleTemplate = require('./wechat-template').getArticleTemplate;
}

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
 * 根据日期查找比赛文件
 */
function findMatchByDate(dateStr) {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) {
    return null;
  }

  const files = fs.readdirSync(matchesDir)
    .filter(file => file.startsWith(dateStr) && file.endsWith('.md'));

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
 * 生成微信公众号文章
 */
function generateWechatArticle(matchData) {
  const { data, body } = matchData;

  // 转换正文
  const contentHTML = markdownToWechatHTML(body, data);

  // 自动加载照片
  let photos = data.photos || [];
  if (photos.length === 0 && data.date) {
    photos = loadPhotosFromDirectory(data);
  }

  // 使用模板生成文章
  const article = getArticleTemplate(data, contentHTML, photos);

  return { article, photos };
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
  // 获取日期参数
  const dateArg = process.argv[2];

  if (!dateArg) {
    log('\n❌ 缺少日期参数\n', 'red');
    log('用法:', 'cyan');
    log('  node scripts/wechat-specific.js <日期>\n', 'yellow');
    log('示例:', 'cyan');
    log('  node scripts/wechat-specific.js 2026-01-01', 'yellow');
    log('  npm run wechat:date 2026-01-01\n', 'yellow');
    log('可用的日期格式: YYYY-MM-DD\n', 'blue');
    process.exit(1);
  }

  log('\n=== 微信公众号文章生成 ===\n', 'cyan');

  try {
    // 查找比赛文件
    log(`🔍 正在查找 ${dateArg} 的比赛...`, 'yellow');
    const matchFile = findMatchByDate(dateArg);

    if (!matchFile) {
      log(`❌ 未找到 ${dateArg} 的比赛记录`, 'red');
      log('\n💡 提示: 运行 npm run matches 查看所有可用比赛\n', 'yellow');
      process.exit(1);
    }

    log(`✅ 找到比赛: ${matchFile}\n`, 'green');

    // 读取比赛数据
    log('📋 正在读取比赛内容...', 'yellow');
    const matchData = readMatch(matchFile);

    log(`   标题: ${matchData.data.title || '未设置'}`, 'blue');
    log(`   日期: ${matchData.data.date || '未设置'}`, 'blue');
    log(`   对手: ${matchData.data.opponent || '未设置'}`, 'blue');
    log(`   比分: ${matchData.data.score || '未设置'}`, 'blue');
    if (matchData.data.mvp) {
      log(`   MVP: ${matchData.data.mvp}`, 'blue');
    }
    console.log('');

    // 生成公众号文章
    log('🔄 正在生成微信公众号格式...', 'yellow');
    const { article, photos } = generateWechatArticle(matchData);
    log('✅ 文章生成完成!\n', 'green');

    // 显示照片信息
    if (photos.length > 0) {
      log(`📸 已包含 ${photos.length} 张照片`, 'green');
    } else {
      log('⚠️  未找到照片', 'yellow');
      log(`   提示: 将照片放入 photos/${matchData.data.date}/ 目录`, 'blue');
    }
    console.log('');

    // 保存HTML文件
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlFile = path.join(outputDir, `wechat-${matchFile.replace('.md', '')}.html`);
    fs.writeFileSync(htmlFile, article, 'utf-8');
    log(`💾 HTML文件已保存: ${htmlFile}\n`, 'green');

    // 打开浏览器预览
    log('🌐 正在打开浏览器预览...', 'yellow');
    const openSuccess = openInBrowser(htmlFile);

    if (openSuccess) {
      log('✅ 已在浏览器中打开\n', 'green');
    } else {
      log(`⚠️  请手动打开: ${htmlFile}\n`, 'yellow');
    }

    // 显示使用说明
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

    // 显示需要上传的照片
    log(`📸 需要上传 ${photos.length + 1} 张图片到公众号:`, 'yellow');
    log(`   1. logo.png - 俱乐部Logo`, 'blue');
    photos.forEach((photo, index) => {
      const photoName = typeof photo === 'string' ? photo : path.basename(photo.path || '');
      const caption = photo.caption || '';
      log(`   ${index + 2}. ${photoName} ${caption ? `- ${caption}` : ''}`, 'blue');
    });
    log('', 'reset');
    log('💡 Logo插入步骤:', 'yellow');
    log('   1. 粘贴文章到公众号编辑器', 'blue');
    log('   2. 找到顶部的 [在此处插入Logo图片]', 'blue');
    log('   3. 删除这行文字', 'blue');
    log('   4. 点击工具栏"图片"按钮', 'blue');
    log('   5. 上传并插入 logo.png', 'blue');
    log('', 'reset');

    log('✨ 完成!\n', 'green');

  } catch (error) {
    log(`\n❌ 发生错误: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行
main();
