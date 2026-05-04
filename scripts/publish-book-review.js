#!/usr/bin/env node
/**
 * 发布书评推文到知己足球公众号草稿箱
 * 专用阅读模板：简洁留白、适合长文阅读
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 微信配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'wechat-config.json'), 'utf-8'));
const account = config.accounts.zhiji;
const APPID = account.appId;
const APPSECRET = account.appSecret;
const API_BASE = 'https://api.weixin.qq.com/cgi-bin';

// 图片路径
const COVER_PATH = '/Users/yesu/.openclaw/workspace/drafts/images/title_composite.jpg';
const POSTER_PATH = '/Users/yesu/.openclaw/workspace/drafts/images/poster.jpg';
const BOOK_PATH = '/Users/yesu/.openclaw/workspace/drafts/images/book_screen.jpg';

const TITLE = '《挽救计划》：一本书和一个电影，你该先选哪个？';
const DIGEST = '如果你还没看过原著，先读完书，再去看电影。不是书比电影好，而是这本书的反套路程度，会让你的观影体验完全不同。';
const AUTHOR = 'sonic';

// 阅读型模板
function buildHTML() {
  const bodyContent = `
<p>上周《挽救计划》上映了，瑞恩·高斯林主演，豆瓣 8.2，朋友圈刷了一波。</p>

<p>但我有个建议：如果你还没看过原著，先读完书，再去看电影。</p>

<p>不是书比电影好——而是这本书的反套路程度，会让你的观影体验从"看懂了"变成"卧槽原来是这样"。至少我的体验是这样。</p>

<section style="margin:32px 0; padding:24px 20px; background:#f0f4ff; border-left:3px solid #4a6fa5; border-radius:0 12px 12px 0;">
<p style="margin:0; font-size:15px; color:#3a5a8c; font-weight:600;">📖 外星人来了，但没有战争</p>
</section>

<p>科幻片里的外星人，大概就这么几种：黑暗森林式的发现即消灭，三体式的智子锁死科技，异形式的贴脸寄生。</p>

<p>《挽救计划》呢？外星人确实来了。但目的不是征服，不是奴役，甚至不是来交流的。</p>

<p><strong>他们是来帮忙的。</strong></p>

<p>太阳在变暗，人类还有几十年就要冻死。另一个文明也面临同样的危机。没有权衡利弊，没有搞星际政治——他们直接就来了。</p>

<p>再往下我不好说，剧透了就没意思了。但可以讲一句：每次你以为剧情要往"文明冲突"走，安迪·威尔都轻轻一拐，拐到一个完全想不到的方向。</p>

<!-- 书封插图 -->
<section style="text-align:center; margin:36px 0;">
<img src="BOOK_IMG_PLACEHOLDER" style="max-width:65%; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15);" />
<p style="margin:8px 0 0; font-size:12px; color:#999;">《挽救计划》中文版封面</p>
</section>

<section style="margin:32px 0; padding:24px 20px; background:#f0f4ff; border-left:3px solid #4a6fa5; border-radius:0 12px 12px 0;">
<p style="margin:0; font-size:15px; color:#3a5a8c; font-weight:600;">🧑‍🚀 主角不是超级英雄</p>
</section>

<p>科幻片拯救世界的通常是天才科学家、退役特种兵、天选之子，至少也得是个宇航员。</p>

<p>莱伦·格雷斯呢？一个高中理科老师。</p>

<p>醒过来的时候连自己是谁都不记得。旁边是陌生的飞船，两条人命指着他能不能搞清楚状况——脑子里一片空白。</p>

<p>没有超能力，没有特殊训练，没有什么主角光环。就靠科学常识、动手能力，和一种"我不想死"的执念。</p>

<p>这个角色让我很喜欢。格雷斯满嘴吐槽，害怕的时候碎碎念，遇到困难会抱怨但从不放弃。不是那种最厉害的人，但确实是最认真的人——你在末日里大概也想身边有这么一个。</p>

<section style="margin:32px 0; padding:24px 20px; background:#f0f4ff; border-left:3px solid #4a6fa5; border-radius:0 12px 12px 0;">
<p style="margin:0; font-size:15px; color:#3a5a8c; font-weight:600;">🌍 没有末日军阀，没有"人性经不起考验"</p>
</section>

<p>很多末世故事往黑暗里写：资源抢夺，军阀割据，人性在灾难面前不堪一击。</p>

<p>《挽救计划》不玩这套。</p>

<p>地球这边，各国当然有分歧，有猜疑，有各自的小算盘。但当生存倒计时真的开始，科学家们放下了一切，默默合作。</p>

<p>没有阴谋论，没有"谁在背后操控一切"。最打动人的反而是：真正的拯救计划，是一群无名的工程师和研究员，一个数据一个数据算出来的。</p>

<p>不煽情，但很真实。</p>

<section style="margin:32px 0; padding:24px 20px; background:#f0f4ff; border-left:3px solid #4a6fa5; border-radius:0 12px 12px 0;">
<p style="margin:0; font-size:15px; color:#3a5a8c; font-weight:600;">🔬 硬科幻，但不硬核</p>
</section>

<p>"硬科幻"三个字劝退了不少人。</p>

<p>但《挽救计划》是一本少见的硬科幻入门书。安迪·威尔当了二十年软件工程师，物理化学生物确实懂，但他讲故事的方式很朴素。</p>

<p>格雷斯在书里就是一个给你解释科学的人——用类比，用吐槽，用"我试了一下发现不行然后换了个思路"的过程。你不用学过物理就能跟上，甚至在不知不觉中搞懂了波义耳定律、搞懂了天狼星A的亮度为什么重要。</p>

<p>读这本书的感觉不是"学到了知识"，更像是"卧槽还能这样操作"。</p>

<section style="margin:32px 0; padding:24px 20px; background:#f0f4ff; border-left:3px solid #4a6fa5; border-radius:0 12px 12px 0;">
<p style="margin:0; font-size:15px; color:#3a5a8c; font-weight:600;">😢 最反套路的是——笑着笑着就哭了</p>
</section>

<p>大多数科幻的重头戏在设定，在悬念，在宏大叙事。</p>

<p>《挽救计划》的重头戏在友谊。</p>

<p>这句话说出来有点矫情，但确实是这样。书里最重要的关系，发生在一个人类和一个——算了，真不能剧透。</p>

<p>他们的交流方式笨拙得可爱，误解不断，但每一次突破都让人眼眶热。安迪·威尔用整本书讲了一个道理：宇宙中最大的奇迹不是光速飞行，而是一个生命愿意为另一个生命付出一切。</p>

<p>放在这个故事里，这句话一点都不鸡汤。</p>

<!-- 电影海报插图 -->
<section style="text-align:center; margin:36px 0;">
<img src="POSTER_IMG_PLACEHOLDER" style="max-width:55%; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15);" />
<p style="margin:8px 0 0; font-size:12px; color:#999;">电影《挽救计划》海报</p>
</section>

<section style="margin:32px 0; padding:24px 20px; background:#f0f4ff; border-left:3px solid #4a6fa5; border-radius:0 12px 12px 0;">
<p style="margin:0; font-size:15px; color:#3a5a8c; font-weight:600;">🎬 那电影呢？</p>
</section>

<p>电影值不值得看？值得。</p>

<p>高斯林演的格雷斯很对味，视觉效果出色，节奏也紧凑。安迪·威尔亲自参与了编剧，核心情节都在。</p>

<p>但电影两个小时，书 493 页。很多让这本书了不起的细节——主角的内心吐槽、科学的推理过程、情感一点一点堆起来的温度——电影只能点到为止。</p>

<p>所以我建议：</p>

<p>📖 <strong>先读书</strong>。让那些惊喜和感动以最完整的方式砸到你身上。</p>
<p>🎬 <strong>再看电影</strong>。看高斯林怎么演你脑子里那个又怂又勇的高中老师，看太空从想象变成画面。</p>

<p>顺序真的重要。我先看的书再去电影院，那段直接没绷住。</p>

<p>一个朋友先看的电影，觉得"还行"，后来补了书，又专门买了张票二刷。</p>

<section style="margin:40px 0 0; padding-top:24px; border-top:1px solid #e5e5e5;">
<p>读这本书的时候我想了挺久：科幻到底迷人在哪里？大概就是它能用完全不同的方式，讲出同样打动人的故事。可以是黑暗森林的冷酷推演，也可以是一个高中老师和外星朋友笨拙又真诚的冒险。</p>

<p><strong>《挽救计划》是后者</strong>。它让我读完之后抬头看了看窗外，觉得这个宇宙好像也没那么冷。</p>

<p>如果你最近恰好需要这样一本书——相信我，你会需要的。</p>
</section>
`;

  return `
<section style="max-width:100%; color:#333; font-size:16px; line-height:1.9; word-wrap:break-word;">
  <style>
    p { margin:16px 0; }
    strong { color:#1a1a1a; }
  </style>
  ${bodyContent}
</section>`;
}

// 确保图片不超过2MB
function ensureImageSize(filePath) {
  const maxBytes = 2 * 1024 * 1024;
  const stat = fs.statSync(filePath);
  if (stat.size <= maxBytes) return filePath;
  
  const outPath = filePath.replace(/(\.\w+)$$/, '_resized$1');
  execSync(`sips -Z 1600 "${filePath}" --out "${outPath}"`, { stdio: 'pipe' });
  return outPath;
}

async function getAccessToken() {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) throw new Error(`获取token失败: ${data.errmsg}`);
  console.log('✅ 获取access_token成功');
  return data.access_token;
}

async function uploadImage(accessToken, filePath) {
  const finalPath = ensureImageSize(filePath);
  const url = `${API_BASE}/media/uploadimg?access_token=${accessToken}`;
  const cmd = `curl -s -X POST -F "media=@${finalPath}" "${url}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);
  if (data.errcode) throw new Error(`上传图片失败: ${data.errmsg}`);
  console.log(`✅ 图片上传成功: ${path.basename(filePath)}`);
  return data.url;
}

async function uploadCover(accessToken, filePath) {
  const finalPath = ensureImageSize(filePath);
  const url = `${API_BASE}/material/add_material?access_token=${accessToken}&type=image`;
  const cmd = `curl -s -X POST -F "media=@${finalPath}" "${url}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);
  if (data.errcode) throw new Error(`上传封面失败: ${data.errmsg}`);
  console.log(`✅ 封面上传成功: media_id=${data.media_id}`);
  return data.media_id;
}

async function createDraft(accessToken, article) {
  const url = `${API_BASE}/draft/add?access_token=${accessToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles: [article] })
  });
  const data = await res.json();
  if (data.errcode) throw new Error(`创建草稿失败: ${data.errmsg}`);
  return data;
}

async function main() {
  console.log('📝 准备发布书评推文...\n');
  
  // 1. 获取token
  const token = await getAccessToken();
  
  // 2. 上传图片
  const bookUrl = await uploadImage(token, BOOK_PATH);
  const posterUrl = await uploadImage(token, POSTER_PATH);
  const coverMediaId = await uploadCover(token, COVER_PATH);
  
  // 3. 构建HTML，替换图片占位符
  let html = buildHTML();
  html = html.replace('BOOK_IMG_PLACEHOLDER', bookUrl);
  html = html.replace('POSTER_IMG_PLACEHOLDER', posterUrl);
  
  // 4. 创建草稿
  const result = await createDraft(token, {
    title: TITLE,
    author: AUTHOR,
    digest: DIGEST,
    content: html,
    thumb_media_id: coverMediaId,
    need_open_comment: 1,
    only_fans_can_comment: 0
  });
  
  console.log(`\n🎉 草稿创建成功！`);
  console.log(`📄 Media ID: ${result.media_id}`);
}

main().catch(err => {
  console.error('❌ 发布失败:', err.message);
  process.exit(1);
});
