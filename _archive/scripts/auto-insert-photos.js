#!/usr/bin/env node

/**
 * 自动生成战报并插入照片
 * 从纯文本生成Markdown，随机插入照片，排版活泼
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const matter = require('gray-matter');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

/**
 * 将纯文本转换为Markdown格式
 */
function textToMarkdown(text) {
  let markdown = text;

  // 章节标题转换（## 标题）
  markdown = markdown.replace(/^(\s*)(第[一二三四五六七八九十]+节|第一节|第二节|第三节|第四节|第五节|第六节|第七节|第八节|第九节|第十节)/gm, '$1## $2');
  markdown = markdown.replace(/^(\s*)(精彩进球|本场亮点|数据统计|赛后花絮|首发阵容|比赛回顾|比赛进程)/gm, '$1## $2');

  // 子标题转换（### 子标题）
  markdown = markdown.replace(/^(\s*)([^#\n]{3,20}：)/gm, '$1### $2');

  // 粗体处理（**加粗**）
  markdown = markdown.replace(/\*([^*]+)\*/g, '**$1**');

  // 比分处理（**1-0**）
  markdown = markdown.replace(/\b(\d+)-(\d+)\b/g, '**$1-$2**');

  // 处理空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown;
}

/**
 * 从文本中判断比赛类型和推荐风格
 */
function detectMatchTypeAndStyle(text, opponent) {
  const matchType = {
    isInternal: false,
    isExternal: false,
    style: 'fresh',
    styleName: '清新日常风 (fresh)'
  };

  // 判断是否为内战
  const internalKeywords = ['内战', '队内', '自己队', '内部', '友谊赛'];
  const externalKeywords = ['迎战', '对阵', '客队', '客场', '挑战'];

  for (const keyword of internalKeywords) {
    if (text.includes(keyword)) {
      matchType.isInternal = true;
      break;
    }
  }

  for (const keyword of externalKeywords) {
    if (text.includes(keyword)) {
      matchType.isExternal = true;
      break;
    }
  }

  // 如果对手名称包含"联队"、"FC"、"俱乐部"等，倾向于外战
  if (opponent.match(/联队|FC|俱乐部|校/)) {
    matchType.isExternal = true;
  }

  // 根据类型推荐风格
  if (matchType.isInternal && !matchType.isExternal) {
    matchType.style = 'ins';
    matchType.styleName = '简约 INS 风';
  } else if (matchType.isExternal) {
    matchType.style = 'battle';
    matchType.styleName = '热血外战风';
  } else {
    matchType.style = 'fresh';
    matchType.styleName = '清新日常风 (fresh)';
  }

  return matchType;
}

/**
 * 根据风格生成主题色配置
 */
function getStyleConfig(style) {
  const configs = {
    ins: {
      primary: '#a0aec0',
      secondary: '#718096',
      accent: '#667eea',
      bgGradient: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
      boxGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '15px',
      shadow: '0 4px 15px rgba(102, 126, 234, 0.15)',
      logoSize: '80px'
    },
    battle: {
      primary: '#ff6b6b',
      secondary: '#ee5a24',
      accent: '#ffd93d',
      bgGradient: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
      boxGradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      borderRadius: '12px',
      shadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
      logoSize: '100px'
    },
    fresh: {
      primary: '#48bb78',
      secondary: '#38a169',
      accent: '#68d391',
      bgGradient: 'linear-gradient(135deg, #f0fff4 0%, #ffffff 100%)',
      boxGradient: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      borderRadius: '16px',
      shadow: '0 6px 20px rgba(72, 187, 120, 0.2)',
      logoSize: '90px'
    }
  };

  return configs[style] || configs.fresh;
}

/**
 * 获取照片列表
 */
function getPhotos(date) {
  const photosDir = path.join(__dirname, '..', 'photos', date);

  if (!fs.existsSync(photosDir)) {
    return [];
  }

  return fs.readdirSync(photosDir)
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .sort()
    .map(file => ({
      path: path.join('photos', date, file).replace(/\\/g, '/'),
      filename: file
    }));
}

/**
 * 在Markdown中随机插入照片
 */
function insertPhotosRandomly(markdown, photos) {
  if (photos.length === 0) {
    return { markdown, inserted: 0 };
  }

  // 按段落分割
  const paragraphs = markdown.split(/\n\n+/);
  const validParagraphs = paragraphs.filter(p => p.trim().length > 20); // 过滤掉太短的段落

  if (validParagraphs.length === 0) {
    return { markdown, inserted: 0 };
  }

  // 计算可插入的位置数量
  const insertCount = Math.min(photos.length, Math.floor(validParagraphs.length / 1.5));

  // 随机选择插入位置
  const insertPositions = [];
  while (insertPositions.length < insertCount) {
    const pos = Math.floor(Math.random() * validParagraphs.length);
    if (!insertPositions.includes(pos)) {
      insertPositions.push(pos);
    }
  }
  insertPositions.sort((a, b) => a - b);

  // 按位置排序后插入照片
  let photoIndex = 0;
  let inserted = 0;

  for (let i = insertPositions.length - 1; i >= 0; i--) {
    if (photoIndex >= photos.length) break;

    const pos = insertPositions[i];

    // 随机决定：单张 还是 两张并列
    const useTwoPhotos = Math.random() > 0.6 && photoIndex + 1 < photos.length;
    const photoCount = useTwoPhotos ? 2 : 1;

    // 构建图片Markdown
    let photoMarkdown = '\n\n';

    if (useTwoPhotos) {
      // 两张并列
      const photo1 = photos[photoIndex];
      const photo2 = photos[photoIndex + 1];
      
      photoMarkdown += `<div style="display: flex; gap: 10px; margin: 20px 0;">
        <div style="flex: 1;">
          <img src="${photo1.path}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);" />
        </div>
        <div style="flex: 1;">
          <img src="${photo2.path}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);" />
        </div>
      </div>\n\n`;

      photoIndex += 2;
    } else {
      // 单张图片
      const photo = photos[photoIndex];
      
      // 随机样式：普通、大图、小圆角
      const styleVariants = [
        { style: 'width: 100%; max-width: 600px; border-radius: 12px;', wrapper: '' },
        { style: 'width: 100%; max-width: 650px; border-radius: 15px;', wrapper: '' },
        { style: 'width: 100%; max-width: 550px; border-radius: 20px;', wrapper: '' },
      ];
      const variant = styleVariants[Math.floor(Math.random() * styleVariants.length)];

      photoMarkdown += `<div style="margin: 25px 0;">
        <img src="${photo.path}" style="${variant.style}" />
      </div>\n\n`;

      photoIndex++;
    }

    // 在选定段落后面插入
    validParagraphs[pos] = validParagraphs[pos] + photoMarkdown;
    inserted++;
  }

  // 重新组装
  let result = '';
  let validIdx = 0;
  for (const para of paragraphs) {
    if (para.trim().length > 20) {
      result += validParagraphs[validIdx] + '\n\n';
      validIdx++;
    } else {
      result += para + '\n\n';
    }
  }

  return { markdown: result, inserted };
}

/**
 * 从文本中自动提取比赛信息
 */
function extractMatchInfo(text) {
  const info = {
    date: '',
    opponent: '',
    score: '',
    location: ''
  };

  // 提取日期（支持多种格式）
  const datePatterns = [
    /(\d{4})-(\d{2})-(\d{2})/,  // 2026-02-21
    /(\d+)月(\d+)日/,              // 2月14日
    /(\d{4})年(\d+)月(\d+)日/,     // 2026年2月14日
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && match[2] && match[3]) {
        // YYYY-MM-DD
        info.date = `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
      } else if (match[1] && match[2]) {
        // MM-DD，需要年份
        const year = new Date().getFullYear();
        info.date = `${year}-${String(match[1]).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
      }
      break;
    }
  }

  // 提取对手名称
  const opponentPatterns = [
    /(?:迎战|对阵|战)([^\s，。!\n]{2,10})(?:队|FC|俱乐部)?/,
    /(?:对手|客队)([^\s，。!\n]{2,10})(?:队|FC|俱乐部)?/,
  ];
  
  for (const pattern of opponentPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.opponent = match[1].trim();
      break;
    }
  }

  // 提取比分
  const scorePatterns = [
    /(\d+)-(\d+)\s*(?:握手言和|最终|战成|定格)/,
    /(?:比分|最终)(?:为|是|：)[\s]*(\d+)-(\d+)/,
  ];
  
  for (const pattern of scorePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.score = `${match[1]}-${match[2]}`;
      break;
    }
  }

  // 提取地点
  const locationPatterns = [
    /(?:地点|场地|球馆|球场)[\s：:]*([^\s，。!\n]+)/,
    /(?:在)([^，。\n]{2,15})(?:球场|体育馆|球馆)/,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.location = match[1].trim();
      break;
    }
  }

  return info;
}

/**
 * 生成完整的战报Markdown文件
 */
async function generateMatchReport() {
  console.log('\n=== 自动生成战报（插入照片） ===\n');

  // 读取纯文本战报
  console.log('请粘贴纯文本战报内容 (输入完成后按回车, 然后输入 ===END=== 结束):');
  let reportText = '';
  while (true) {
    const line = await question('> ');
    if (line.trim() === '===END===') break;
    reportText += line + '\n';
  }

  // 自动提取比赛信息
  console.log('\n自动提取比赛信息...');
  const matchInfo = extractMatchInfo(reportText);

  console.log('\n--- 提取的信息 ---');
  console.log(`日期: ${matchInfo.date || '未提取到'}`);
  console.log(`对手: ${matchInfo.opponent || '未提取到'}`);
  console.log(`比分: ${matchInfo.score || '未提取到'}`);
  console.log(`地点: ${matchInfo.location || '未提取到'}`);

  // 自动判断比赛类型和推荐风格
  console.log('\n自动判断比赛类型...');
  const matchType = detectMatchTypeAndStyle(reportText, matchInfo.opponent || '');

  console.log('\n--- 风格推荐 ---');
  console.log(`比赛类型: ${matchType.isInternal ? '内战' : (matchType.isExternal ? '外战' : '日常友谊赛')}`);
  console.log(`推荐风格: ${matchType.styleName} (${matchType.style})`);

  // 确认或修改信息
  const confirmInfo = await question('\n信息是否正确？(直接回车确认，或输入修正的日期)');
  if (confirmInfo.trim()) {
    matchInfo.date = confirmInfo.trim();
  }

  if (!matchInfo.opponent) {
    matchInfo.opponent = await question('对手名称未提取到，请输入: ');
  }

  const confirmScore = await question('比分是否正确？(直接回车确认，或输入修正的比分，如 4-4)');
  if (confirmScore.trim()) {
    matchInfo.score = confirmScore.trim();
  }

  if (!matchInfo.location) {
    matchInfo.location = await question('地点未提取到，请输入: ');
  }

  // 确认风格
  console.log(`\n🎨 推荐风格: ${matchType.styleName}`);
  const styleConfirm = await question('使用推荐风格？(直接回车确认，或输入 ins/battle/fresh)');

  const finalStyle = styleConfirm.trim() || matchType.style;

  // 显示选择的风格
  const styleConfig = getStyleConfig(finalStyle);
  console.log(`\n✅ 使用风格: ${finalStyle === 'ins' ? '简约 INS 风' : (finalStyle === 'battle' ? '热血外战风' : '清新日常风 (fresh)')}`);

  // 转换为Markdown
  console.log('\n转换Markdown格式...');
  const markdownContent = textToMarkdown(reportText);

  // 获取照片
  console.log('加载照片...');
  const photos = getPhotos(matchInfo.date);

  if (photos.length === 0) {
    console.log(`⚠️  未找到 ${matchInfo.date} 的照片`);
    console.log(`   请将照片放在 photos/${matchInfo.date}/ 目录下\n`);
  } else {
    console.log(`找到 ${photos.length} 张照片`);

    // 随机插入照片
    console.log('随机插入照片...');
    const { markdown: contentWithPhotos, inserted: insertedCount } = insertPhotosRandomly(markdownContent, photos);
    
    // 创建完整的Markdown文件
    const filename = `${matchInfo.date}-${matchInfo.opponent}.md`;
    const matchesDir = path.join(__dirname, '..', 'matches');
    
    if (!fs.existsSync(matchesDir)) {
      fs.mkdirSync(matchesDir, { recursive: true });
    }

    const filePath = path.join(matchesDir, filename);

    // 检查是否已存在
    if (fs.existsSync(filePath)) {
      console.log(`\n⚠️  文件已存在: ${filename}`);
      console.log('   将覆盖旧文件...\n');
    }

    // 构建frontmatter
    const frontmatter = {
      title: `${matchInfo.opponent}${matchInfo.score ? ' ' + matchInfo.score : ''}`,
      date: matchInfo.date,
      opponent: matchInfo.opponent,
      score: matchInfo.score || '',
      location: matchInfo.location,
      style: finalStyle,  // 保存风格
      styleName: finalStyle === 'ins' ? '简约 INS 风' : (finalStyle === 'battle' ? '热血外战风' : '清新日常风')
    };

    const fullContent = matter.stringify(contentWithPhotos, frontmatter);

    // 写入文件
    fs.writeFileSync(filePath, fullContent, 'utf-8');

    console.log(`\n✅ 战报已生成: ${filename}`);
    console.log(`📂 路径: ${filePath}`);
    console.log(`📸 已插入 ${insertedCount} 张照片\n`);

    console.log('💡 下一步:');
    console.log('   1. 查看生成的文件，微调内容和照片位置');
    console.log('   2. 运行推送脚本: node scripts/wechat-auto.js\n');
  }

  rl.close();
}

// 运行
generateMatchReport().catch(error => {
  console.error('❌ 错误:', error.message);
  rl.close();
  process.exit(1);
});
