#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - 热血外战风格版本
 * 专为外战设计，突出对抗性和战斗氛围
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');
const { getArticleTemplate } = require('./wechat-template-battle');

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

  // 标题 - 热血风格
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 19px; font-weight: 700; margin: 30px 0 15px; color: #ff6b6b; letter-spacing: 1px; border-left: 4px solid #ff6b6b; padding-left: 12px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 22px; font-weight: 800; margin: 35px 0 20px; color: #2d3436; letter-spacing: 1px; border-bottom: 3px solid #ff6b6b; padding-bottom: 12px;">$1</h2>');

  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ff6b6b; font-weight: 700;">$1</strong>');

  // 图片
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const imgName = path.basename(src);
    return `<img src="${imgName}" alt="${alt}" style="width: 100%; max-width: 600px; display: block; margin: 20px auto; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);" />`;
  });

  // 链接
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #ff6b6b; text-decoration: none; border-bottom: 2px solid #ff6b6b; font-weight: 600;">$1</a>');

  // 段落
  html = html.replace(/\n\n/g, '</p><p style="line-height: 1.9; margin: 15px 0; color: #2d3436; text-align: justify;">');
  html = '<p style="line-height: 1.9; margin: 15px 0; color: #2d3436; text-align: justify;">' + html + '</p>';

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
 * 主函数
 */
function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                    ║', 'cyan');
  log('║   🔥 微信公众号一键发布工具 - 热血外战风格 🔥          ║', 'cyan');
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
  log(`   ⚔️ ${data.opponent} vs 知己`, 'blue');
  log(`   🎯 ${data.score}`, 'blue');
  if (data.mvp) log(`   ⭐ MVP: ${data.mvp}`, 'magenta');

  // 2. 生成文章
  log('\n🔄 正在生成文章 (热血外战风格)...', 'yellow');
  const contentHTML = markdownToHTML(body);
  const photos = data.photos || loadPhotos(data);
  const article = getArticleTemplate(data, contentHTML, photos);

  // 保存文件
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlFile = path.join(outputDir, `wechat-${matchFile.replace('.md', '')}-battle.html`);
  fs.writeFileSync(htmlFile, article, 'utf-8');
  log('✅ 文章已生成', 'green');

  // 3. 复制HTML到剪贴板
  log('\n📋 正在复制HTML到剪贴板...', 'yellow');
  try {
    execSync(`echo "${article.replace(/"/g, '\\\"')}" | clip`, { windowsHide: true });
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

  // 5. 显示设计说明
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║              🔥 热血外战风格设计特点                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log('\n' + ' '.repeat(54), 'white');
  log('  🔥 激情热血', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  • 强烈的视觉冲击力', 'white');
  log('  • 红色为主色调，象征激情和战斗', 'white');
  log('  • 对比鲜明，层次分明', 'white');
  log('  • 动感十足的设计元素', 'white');
  log('', 'reset');

  log('  🎨 配色方案', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  • 主色: 红色 #ff6b6b, #ee5a24', 'white');
  log('  • 辅助色: 金色 #ffd93d, #ff9500', 'white');
  log('  • 背景: 深色 #2d3436, #000000', 'white');
  log('  • 强调: 高对比度，视觉冲击', 'white');
  log('', 'reset');

  log('  ⚔️ 战斗元素', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  • 剑和盾牌等战斗符号', 'white');
  log('  • 金色MVP奖杯设计', 'white');
  log('  • 照片编号标记', 'white');
  log('  • 动感分隔线和装饰', 'white');
  log('', 'reset');

  log('  📱 适用场景', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  • 外战对抗赛', 'white');
  log('  • 重要比赛', 'white');
  log('  • 激烈对抗', 'white');
  log('  • 需要营造战斗氛围', 'white');
  log('', 'reset');

  // 6. 发布步骤
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║              📝 微信公众号发布步骤                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  log('\n' + ' '.repeat(54), 'white');
  log('  第1步: 浏览器中检查文章预览', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  ✅ 确认热血激情的样式', 'green');
  log('  ✅ 检查红色主题色调', 'green');
  log('  ✅ 查看战斗元素效果', 'green');
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
  log('  ⚠️  找到顶部蓝色战斗框 "⚔️ 上传 Logo 后删除此框"', 'yellow');
  log('  🖱️  点击选中整个蓝色区域', 'blue');
  log('  ❌ 删除占位框', 'blue');
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
      log('     - 上传照片（自动编号）', 'blue');
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

  // 7. 完成提示
  log('╔════════════════════════════════════════════════════════╗', 'green');
  log('║                                                    ║', 'green');
  log('║              ✨ 准备完成，祝发布顺利！ ✨              ║', 'green');
  log('║                                                    ║', 'green');
  log('╚════════════════════════════════════════════════════════╝', 'green');
  log('', 'reset');

  log('💡 提示:', 'yellow');
  log('   - 热血风格专为外战设计', 'white');
  log('   - 红色主题营造激情战斗氛围', 'white');
  log('   - 预览文件名: *-battle.html', 'white');
  log('   - 内战推荐使用: npm run publish:ins', 'white');
  log('   - 外战推荐使用: npm run publish:battle', 'white');
  log('', 'reset');
}

// 运行
main();
