#!/usr/bin/env node

/**
 * 微信公众号完整工作流
 * 一键完成：生成 → 预览 → 提示
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { getArticleTemplate } = require('./wechat-template');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Markdown转HTML
 */
function markdownToHTML(markdown) {
  let html = markdown;

  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">$1</h2>');

  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 图片
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    return `<img src="${src}" alt="${alt}" style="width: 100%; max-width: 600px; display: block; margin: 15px auto; border-radius: 8px;" />`;
  });

  // 链接
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #1890ff; text-decoration: none;">$1</a>');

  // 段落
  html = html.replace(/\n\n/g, '</p><p style="line-height: 1.8; margin: 10px 0; color: #555;">');
  html = '<p style="line-height: 1.8; margin: 10px 0; color: #555;">' + html + '</p>';

  // 换行
  html = html.replace(/\n/g, '<br/>');

  return html;
}

/**
 * 加载照片
 */
function loadPhotos(data) {
  const photosDir = path.join(__dirname, '..', 'photos', data.date);
  if (!fs.existsSync(photosDir)) return [];

  const files = fs.readdirSync(photosDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .sort();

  return files.map(filename => ({
    path: path.join('photos', data.date, filename).replace(/\\/g, '/'),
    caption: ''
  }));
}

/**
 * 生成文章
 */
function generateArticle(matchFile) {
  const filePath = path.join(__dirname, '..', 'matches', matchFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  const contentHTML = markdownToHTML(body);
  const photos = data.photos || loadPhotos(data);
  const article = getArticleTemplate(data, contentHTML, photos);

  return { data, article, photos, matchFile };
}

/**
 * 打开浏览器
 */
function openBrowser(filePath) {
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
 * 列出所有比赛
 */
function listMatches() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) return [];

  return fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();
}

/**
 * 主函数
 */
function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   微信公众号发布工作流                ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  const matches = listMatches();
  if (matches.length === 0) {
    log('\n❌ 没有找到比赛记录\n', 'red');
    return;
  }

  log(`\n📚 找到 ${matches.length} 场比赛\n`, 'yellow');

  // 显示最近5场
  log('📋 最近比赛（最多显示5场）:', 'cyan');
  matches.slice(0, 5).forEach((match, index) => {
    const filePath = path.join(__dirname, '..', 'matches', match);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    log(`   ${index + 1}. ${data.date || ''} ${data.opponent || ''} (${data.score || '未设置'})`, 'blue');
  });

  log('\n💡 使用方法:', 'yellow');
  log('   npm run wechat:latest    # 最新比赛', 'blue');
  log('   npm run wechat:all       # 所有比赛', 'blue');
  log('   npm run wechat:date YYYY-MM-DD  # 指定日期', 'blue');
  log('', 'reset');
}

/**
 * 生成指定比赛
 */
function generateMatch(dateOrIndex) {
  const matches = listMatches();
  let matchFile;

  // 按日期查找
  if (dateOrIndex.match(/^\d{4}-\d{2}-\d{2}$/)) {
    matchFile = matches.find(f => f.startsWith(dateOrIndex));
  } else {
    // 按序号查找
    const index = parseInt(dateOrIndex) - 1;
    matchFile = matches[index];
  }

  if (!matchFile) {
    log(`❌ 未找到比赛: ${dateOrIndex}`, 'red');
    return null;
  }

  log(`\n📖 正在生成: ${matchFile.replace('.md', '')}`, 'yellow');

  // 生成文章
  const { data, article, photos } = generateArticle(matchFile);

  // 保存
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlFile = path.join(outputDir, `wechat-${matchFile.replace('.md', '')}.html`);
  fs.writeFileSync(htmlFile, article, 'utf-8');

  log(`✅ 文章已生成`, 'green');
  log(`   标题: ${data.title}`, 'blue');
  log(`   日期: ${data.date}`, 'blue');
  log(`   对手: ${data.opponent}`, 'blue');
  log(`   比分: ${data.score}`, 'blue');
  if (data.mvp) log(`   MVP: ${data.mvp}`, 'blue');
  log(`   照片: ${photos.length}张`, 'blue');

  // 打开预览
  log('\n🌐 正在打开预览...', 'yellow');
  openBrowser(htmlFile);
  log('✅ 预览已打开', 'green');

  // 显示提示
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   📝 微信公众号发布步骤               ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  log('\n1️⃣  在浏览器中预览效果', 'blue');
  log('2️⃣  Ctrl+A 全选，Ctrl+C 复制', 'blue');
  log('3️⃣  打开公众号编辑器', 'blue');
  log('4️⃣  Ctrl+V 粘贴', 'blue');
  log('5️⃣  插入Logo (logo-150.png)', 'magenta');
  log('6️⃣  上传并插入照片', 'magenta');
  log('7️⃣  预览并发布\n', 'blue');

  if (photos.length > 0) {
    log(`📸 需要上传 ${photos.length + 1} 张图片:`, 'yellow');
    log(`   1. logo-150.png - 俱乐部Logo (150x150px)`, 'magenta');
    photos.forEach((photo, index) => {
      const photoName = path.basename(photo.path || '');
      log(`   ${index + 2}. ${photoName}`, 'blue');
    });
    log('', 'reset');
  }

  log('✨ 准备完成！', 'green');
  log('', 'reset');

  return { htmlFile, data, photos };
}

// 如果直接运行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 显示列表
    main();
  } else {
    // 生成指定比赛
    generateMatch(args[0]);
  }
}

module.exports = { generateMatch, listMatches };
