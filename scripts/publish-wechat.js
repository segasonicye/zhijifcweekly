#!/usr/bin/env node

/**
 * 一键发布到微信公众号
 * 自动完成：生成 → 复制到剪贴板 → 打开浏览器 → 显示步骤
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');
const { getArticleTemplate } = require('./wechat-template');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[97m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 获取最新比赛
 */
function getLatestMatch() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) return null;

  const files = fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();

  return files.length > 0 ? files[0] : null;
}

/**
 * Markdown转HTML
 */
function markdownToHTML(markdown) {
  let html = markdown;

  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const imgName = path.basename(src);
    return `<img src="${imgName}" alt="${alt}" style="width: 100%; max-width: 600px; display: block; margin: 15px auto; border-radius: 8px;" />`;
  });
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #1890ff; text-decoration: none;">$1</a>');
  html = html.replace(/\n\n/g, '</p><p style="line-height: 1.8; margin: 10px 0; color: #555;">');
  html = '<p style="line-height: 1.8; margin: 10px 0; color: #555;">' + html + '</p>';
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
 * 主函数
 */
function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                    ║', 'cyan');
  log('║        📱 微信公众号一键发布工具 📱                  ║', 'cyan');
  log('║                                                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  // 1. 获取最新比赛
  log('\n📖 正在查找最新比赛...', 'yellow');
  const matchFile = getLatestMatch();

  if (!matchFile) {
    log('\n❌ 没有找到比赛记录', 'red');
    log('\n💡 请先运行: npm run new', 'yellow');
    process.exit(1);
  }

  // 读取比赛数据
  const filePath = path.join(__dirname, '..', 'matches', matchFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  log(`✅ 找到: ${data.title}`, 'green');
  log(`   📅 ${data.date}`, 'blue');
  log(`   ⚽ ${data.opponent} vs 知己`, 'blue');
  log(`   🎯 ${data.score}`, 'blue');
  if (data.mvp) log(`   ⭐ MVP: ${data.mvp}`, 'magenta');

  // 2. 生成文章
  log('\n🔄 正在生成文章...', 'yellow');
  const contentHTML = markdownToHTML(body);
  const photos = data.photos || loadPhotos(data);
  const article = getArticleTemplate(data, contentHTML, photos);

  // 保存文件
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlFile = path.join(outputDir, `wechat-${matchFile.replace('.md', '')}.html`);
  fs.writeFileSync(htmlFile, article, 'utf-8');
  log('✅ 文章已生成', 'green');

  // 3. 复制HTML到剪贴板
  log('\n📋 正在复制HTML到剪贴板...', 'yellow');
  try {
    execSync(`echo "${article.replace(/"/g, '\\"')}" | clip`, { windowsHide: true });
    log('✅ HTML已复制到剪贴板', 'green');
  } catch (error) {
    log('⚠️  自动复制失败，请手动复制', 'yellow');
  }

  // 4. 打开浏览器
  log('\n🌐 正在打开浏览器预览...', 'yellow');
  try {
    const absolutePath = path.resolve(htmlFile);
    execSync(`start "" "${absolutePath}"`, { windowsHide: true });
    log('✅ 预览已打开', 'green');
  } catch (error) {
    log(`⚠️  请手动打开: ${htmlFile}`, 'yellow');
  }

  // 5. 显示发布步骤
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║              📝 微信公众号发布步骤                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  log('\n' + ' '.repeat(54), 'white');
  log('  第1步: 浏览器中检查文章预览', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  ✅ 确认样式正确', 'green');
  log('  ✅ 检查照片数量', 'green');
  log('  ✅ 查看MVP信息', 'green');
  log('', 'reset');

  log('  第2步: 复制文章内容', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  📋 在浏览器中按 Ctrl+A 全选', 'blue');
  log('  📋 按 Ctrl+C 复制', 'blue');
  log('', 'reset');

  log('  第3步: 粘贴到公众号', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  🔗 打开: https://mp.weixin.qq.com/', 'blue');
  log('  📝 点击"新建图文"', 'blue');
  log('  📋 按 Ctrl+V 粘贴', 'blue');
  log('', 'reset');

  log('  第4步: 插入Logo', 'magenta');
  log('  ' + '─'.repeat(50), 'white');
  log('  ⚠️  找到顶部黄色警告框 "⚠️ 请插入Logo图片"', 'yellow');
  log('  🖱️  点击选中整个黄色区域', 'blue');
  log('  ❌ 删除警告框', 'blue');
  log('  📷 点击工具栏"图片"按钮', 'blue');
  log('  ⬆️  上传 logo-150.png', 'blue');
  log('  ✅ Logo已插入', 'green');
  log('', 'reset');

  log('  第5步: 插入比赛照片', 'cyan');
  log('  ' + '─'.repeat(50), 'white');

  if (photos.length > 0) {
    photos.forEach((photo, index) => {
      const photoName = path.basename(photo.path || '');
      log(`  📸 第${index + 1}张: 找到 "${photoName}"`, 'yellow');
      log('     - 点击"图片"按钮', 'blue');
      log('     - 上传照片', 'blue');
      log('', 'reset');
    });
  } else {
    log('  ℹ️  这场比赛没有照片', 'yellow');
    log('', 'reset');
  }

  log('  第6步: 预览和发布', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  👁️  点击"预览"查看效果', 'blue');
  log('  ✅ 确认无误后点击"保存"', 'blue');
  log('  🚀 点击"发布"', 'green');
  log('', 'reset');

  // 6. 需要上传的图片清单
  if (photos.length > 0) {
    log('╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║           📸 需要上传的图片清单                         ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝', 'cyan');
    log('', 'reset');
    log(`  共 ${photos.length + 1} 张图片:`, 'yellow');
    log(`  1️⃣  logo-150.png - 俱乐部Logo (150x150px圆形)`, 'magenta');
    photos.forEach((photo, index) => {
      const photoName = path.basename(photo.path || '');
      log(`  ${index + 2}️⃣  ${photoName}`, 'blue');
    });
    log('', 'reset');
  }

  // 7. 完成提示
  log('╔════════════════════════════════════════════════════════╗', 'green');
  log('║                                                    ║', 'green');
  log('║              ✨ 准备完成，祝发布顺利！ ✨              ║', 'green');
  log('║                                                    ║', 'green');
  log('╚════════════════════════════════════════════════════════╝', 'green');
  log('', 'reset');

  log('💡 提示:', 'yellow');
  log('   - 黄色警告框非常醒目，不会忘记删除', 'white');
  log('   - Logo使用 logo-150.png (150x150px)', 'white');
  log('   - 预览文件在: output/', 'white');
  log('   - 遇到问题查看: WECHAT_PUBLISH.md', 'white');
  log('', 'reset');
}

// 运行
main();
