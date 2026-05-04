const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 配置
const REPORT_TEXT = `河伯战报来啦。日出江花红胜火，春来江水绿如蓝，正月初六，知己马年首战在福沁球场隆重开启，红队首发叉弟、小卢、辉哥、小王、王书记、内马尔白；蓝队首发张航、王峰、大小叶、金日卢、潘书记。红队率先发力，叉弟底线横传，小卢后点包抄打入知己队马年首球，小马开新年，喜乐永相连；蓝队迅速还以颜色，小叶底线射门被挡，张航转身扫射1-1；红队内马尔白送出助攻，小卢左路包抄梅开二度2-1；蓝队王峰直塞，小叶左脚劲射破门2-2；红队内马尔白精彩突破横传，叉弟中路包抄推射空门3-2；蓝队利用角球机会，张航、王峰传射建功，开局快节奏强对抗，蓝队4-3先下一城。进入首次轮换，蓝队大鼻涕防守闪光，右边路抢前卡位，漂亮拦截内马尔白突破；蓝队金日卢打入标志性进球:马达开启一马当先，左路长驱直入一脚劲射击中远门柱入网1-0；蓝队打出流畅配合，潘书记后场发起进攻，张航拿球转边，王峰左路横敲，金日卢中路一漏，小叶后点推射近角破门2-0；红队懂王老骥伏枥展现实力，左边路带球强突，连过数人后打入空门1-2。第三局，红队爆发，小王、内马尔白联手制造威胁，相继助攻叉弟进球；随后比赛进入内马尔白个人表演，高速突破加抢断上演帽子戏法，带领红队5-0碾压取胜。第四局，蓝队攻势回升，但运气站在红队一边，红队守门虚空手抛球造对手乌龙1-0；蓝队前场逼抢，小叶带球射门被挡，带炮后卫潘书记后插上一蹴而就1-1；红队迅速做出反应，小卢右路起球，辉哥后点头球破门2-1。第五局，红队内马尔白传射，先助攻叉弟进球，再抢断单刀破门，红队2-0再度获胜。第六局，红队先发制人，叉弟送出助攻，叶老师打入远射世界波；蓝队奋起直追，小叶左边路突破射门1-1；蓝队随后打进全场最佳进球，左路大范围转移，陈韬右路高速前插，小角度世界波打入近角，弓开如满月，一矢定乾坤，蓝队凭借此球2-1反超比分。第七局，蓝队率先提速，小叶右路底线横敲，托蒂后点包抄1-0；红队发起反攻，蓝队守门张航以一挡十，封出对手潮水攻势后，蓝队抓住机会，小叶前场拦截单刀破门2-0；红队也抓住对手失误，内马尔白断球后送出助攻，小王推射破门1-2；机会是留给有准备的人，内马尔白再次断球得手打入空门2-2；本局尾声，红队小王右路横传，不争气的辉哥争气破门，3-2惊天大逆转。第八局，红队继续提速，内马尔白高速冲击势如破竹，断球助叉弟梅开二度；再助王书记锦上添花，3-0完胜。随后比赛进入终极大战，蓝队先拔头筹:小叶直塞，金日卢机警前插单刀捅射1-0；红队叉弟中路带球突破后送出助攻，内马尔白经典内切，抽射上角1-1；最终两队握手言和愉快收工。本场比赛红队叉弟、内马尔白联手制造速度与激情，完美诠释天下武功无坚不摧唯快不破，叉弟7球荣膺最佳射手，内马尔白6球6助拿下MVP，快攻组合破局攻坚，风驰电掣大杀四方。本场知己队马年首战展现龙马精神，球星们驽马十驾策马扬鞭，马不停蹄再踏新程，马上有福马到功成。赛后球星们转战山海一号，劝君今夕不须眠，大家沉醉对芳筵，王氏气功经久不息，平行相交辩证统一，球星们直抒胸臆日月相应天人合一。心有山海快乐出发，球星们假期愉快。`;

const DATE = '2026-02-22';
const STYLE = 'ins';
const STYLE_NAME = '简约 INS 风';

// ----------------------------------------------------------------
// 核心逻辑 (从 auto-insert-photos.js 移植)
// ----------------------------------------------------------------

function textToMarkdown(text) {
  let markdown = text;
  markdown = markdown.replace(/^(\s*)(第[一二三四五六七八九十]+节|第一节|第二节|第三节|第四节|第五节|第六节|第七节|第八节|第九节|第十节)/gm, '\n## $2');
  markdown = markdown.replace(/^(\s*)(精彩进球|本场亮点|数据统计|赛后花絮|首发阵容|比赛回顾|比赛进程)/gm, '\n## $2');
  markdown = markdown.replace(/^(\s*)([^#\n]{3,20}：)/gm, '\n### $2');
  markdown = markdown.replace(/\*([^*]+)\*/g, '**$1**');
  markdown = markdown.replace(/\b(\d+)-(\d+)\b/g, '**$1-$2**');
  
  // 额外优化：加粗人名
  const names = ['叉弟', '小卢', '辉哥', '小王', '王书记', '内马尔白', '张航', '王峰', '大小叶', '小叶', '金日卢', '潘书记', '大鼻涕', '陈韬', '托蒂', '叶老师', '懂王'];
  names.forEach(name => {
      markdown = markdown.replace(new RegExp(name, 'g'), `**${name}**`);
  });

  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  return markdown;
}

function getPhotos(date) {
  // 注意：这里需要指向正确的照片目录
  const photosDir = path.join(__dirname, '..', 'photos', date);
  if (!fs.existsSync(photosDir)) return [];
  return fs.readdirSync(photosDir)
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .sort()
    .map(file => ({
      path: path.join('photos', date, file).replace(/\\/g, '/'),
      filename: file
    }));
}

function insertPhotosRandomly(markdown, photos) {
  if (photos.length === 0) return { markdown, inserted: 0 };

  const paragraphs = markdown.split(/(?<=。)|(?<=！)|(?<=；)|\n\n+/).filter(p => p.trim());
  const validParagraphs = paragraphs; // 所有段落都算

  const insertCount = Math.min(photos.length, Math.floor(validParagraphs.length / 2));
  const insertPositions = [];
  
  // 均匀分布
  const step = Math.floor(validParagraphs.length / (insertCount + 1));
  for(let i=1; i<=insertCount; i++) {
      insertPositions.push(i * step);
  }

  let photoIndex = 0;
  let result = '';

  validParagraphs.forEach((para, index) => {
      result += para + '\n\n';

      if (insertPositions.includes(index) && photoIndex < photos.length) {
        const useTwoPhotos = Math.random() > 0.6 && photoIndex + 1 < photos.length;
        
        if (useTwoPhotos) {
            const p1 = photos[photoIndex];
            const p2 = photos[photoIndex+1];
            // INS 风格的双图并排
            result += `<div style="display: flex; gap: 10px; margin: 20px 0;">
            <div style="flex: 1;"><img src="${p1.path}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);" /></div>
            <div style="flex: 1;"><img src="${p2.path}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);" /></div>
            </div>\n\n`;
            photoIndex += 2;
        } else {
            const p = photos[photoIndex];
            // INS 风格的单图
            result += `<div style="margin: 25px 0;"><img src="${p.path}" style="width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" /></div>\n\n`;
            photoIndex++;
        }
      }
  });

  // 剩下的照片补在最后
  while(photoIndex < photos.length) {
      const p = photos[photoIndex];
      result += `<div style="margin: 25px 0;"><img src="${p.path}" style="width: 100%; max-width: 600px; border-radius: 12px;" /></div>\n\n`;
      photoIndex++;
  }

  return { markdown: result, inserted: photoIndex };
}

// ----------------------------------------------------------------
// 执行
// ----------------------------------------------------------------

async function run() {
    console.log(`正在生成 ${DATE} 的 INS 风战报...`);
    
    // 1. 转换 Markdown
    const markdownContent = textToMarkdown(REPORT_TEXT);
    
    // 2. 获取照片
    const photos = getPhotos(DATE);
    console.log(`找到 ${photos.length} 张照片`);

    // 3. 插入照片
    const { markdown: finalContent, inserted } = insertPhotosRandomly(markdownContent, photos);

    // 4. 生成 Frontmatter
    const frontmatter = {
        title: '知己队马年首战',
        date: DATE,
        opponent: '知己队内战',
        score: '3-3', // 假设
        location: '福沁球场',
        style: STYLE,
        styleName: STYLE_NAME
    };

    const fullContent = matter.stringify(finalContent, frontmatter);

    // 5. 写入文件
    const filename = `${DATE}-知己队内战.md`;
    const outputPath = path.join(__dirname, '..', 'matches', filename);
    
    fs.writeFileSync(outputPath, fullContent);
    console.log(`✅ 战报已生成: ${outputPath}`);
}

run();
