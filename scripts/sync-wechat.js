#!/usr/bin/env node

/**
 * 微信公众号格式转换脚本
 * 将Markdown战报转换为适合公众号发布的富文本格式
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 列出所有比赛文件
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
    // 提取相对路径中的图片文件名
    const imgPath = path.join(__dirname, '..', src);
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

  // MVP展示
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 10px 25px rgba(240, 147, 251, 0.4); text-align: center;">
        <h3 style="margin: 0 0 12px 0; color: white; font-size: 18px; font-weight: 700;">⭐ 本场MVP</h3>
        <div style="font-size: 24px; font-weight: 800; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${data.mvp}</div>
      </section>
    `;
  }

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
 * 生成图片清单
 */
function generatePhotoList(data) {
  if (!data.photos || data.photos.length === 0) {
    return [];
  }

  return data.photos.map(photo => {
    const photoPath = path.join(__dirname, '..', 'photos', data.date, path.basename(photo.path || photo));
    return {
      original: photoPath,
      filename: path.basename(photo.path || photo),
      caption: photo.caption || ''
    };
  });
}

/**
 * 保存转换结果
 */
function saveConversion(filename, html, photos) {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存HTML文件
  const htmlFile = path.join(outputDir, `${filename}.html`);
  fs.writeFileSync(htmlFile, html, 'utf-8');
  console.log(`✅ HTML文件已保存: ${htmlFile}`);

  // 保存图片清单
  if (photos.length > 0) {
    const photoListFile = path.join(outputDir, `${filename}-photos.json`);
    const photoListData = photos.map(photo => {
      const photoPath = typeof photo === 'string' ? photo : (photo.path || '');
      return {
        original: path.resolve(__dirname, '..', photoPath),
        filename: path.basename(photoPath),
        caption: photo.caption || ''
      };
    });
    fs.writeFileSync(photoListFile, JSON.stringify(photoListData, null, 2));
    console.log(`✅ 图片清单已保存: ${photoListFile}`);
    console.log(`\n📸 已包含 ${photos.length} 张图片:`);
    photos.forEach((photo, index) => {
      const photoName = typeof photo === 'string' ? photo : path.basename(photo.path || '');
      const caption = photo.caption || '';
      console.log(`   ${index + 1}. ${photoName}${caption ? ` (${caption})` : ''}`);
    });
  }
}

/**
 * 交互式选择比赛
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== 微信公众号格式转换工具 ===\n');

  try {
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

    // 选择比赛
    const choice = await question('请选择要转换的比赛 (输入序号): ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= matches.length) {
      console.log('❌ 无效的选择');
      process.exit(1);
    }

    // 读取比赛数据
    const filename = matches[index];
    console.log(`\n📖 正在读取: ${filename}`);
    const matchData = readMatch(filename);

    // 生成公众号文章
    console.log('🔄 正在转换格式...');
    const article = generateWechatArticle(matchData);

    // 自动加载照片
    let photos = matchData.data.photos || [];
    if (photos.length === 0 && matchData.data.date) {
      photos = loadPhotosFromDirectory(matchData.data);
    }

    // 保存结果
    console.log('💾 正在保存文件...');
    saveConversion(filename.replace('.md', ''), article, photos);

    console.log('\n✨ 转换完成!\n');
    console.log('📝 使用说明:');
    console.log('   1. 在 output/ 目录中找到生成的 HTML 文件');
    console.log('   2. 在浏览器中打开预览效果');
    console.log('   3. 复制 HTML 内容到公众号编辑器');
    console.log('   4. 上传对应的图片到公众号素材库');
    console.log('   5. 替换图片链接为公众号图片地址\n');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { generateWechatArticle, markdownToWechatHTML };
