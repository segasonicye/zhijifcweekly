#!/usr/bin/env node
/**
 * 通用文章推送脚本（科技风模板）
 * 用于非战报类文章推送到知己足球公众号草稿箱
 * 
 * 用法: node publish-article.js <markdown文件路径>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');
const API_BASE = 'https://api.weixin.qq.com/cgi-bin';

// ===== 科技风 HTML 模板 =====
function getSciFiTemplate(title, contentHTML, logoUrl) {
  return `
<div style="max-width:650px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#c8d6e5;background:#0a0e27;">

  <!-- 标题区 -->
  <section style="background:linear-gradient(135deg,#0a0e27 0%,#1a1a3e 40%,#0d1b3e 100%);padding:35px 25px 30px;border-bottom:2px solid rgba(0,255,200,0.15);">
    <div style="text-align:center;margin-bottom:18px;">
      <img src="${logoUrl}" style="width:50px;height:50px;opacity:0.7;filter:brightness(1.2);" />
    </div>
    <h1 style="text-align:center;font-size:24px;font-weight:800;color:#ffffff;margin:0;letter-spacing:1px;line-height:1.4;text-shadow:0 0 20px rgba(0,255,200,0.3);">${title}</h1>
    <div style="width:80px;height:2px;background:linear-gradient(90deg,transparent,#00ffc8,transparent);margin:18px auto 0;"></div>
  </section>

  <!-- 正文区 -->
  <section style="padding:25px 22px;line-height:2;font-size:15.5px;color:#b8c5d6;">
    ${contentHTML}
  </section>

  <!-- 页脚 -->
  <section style="background:linear-gradient(135deg,#1a1a3e 0%,#0a0e27 100%);padding:25px;margin-top:10px;border-top:1px solid rgba(0,255,200,0.1);text-align:center;">
    <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,200,0.4),transparent);margin:0 auto 15px;"></div>
    <p style="margin:0;color:rgba(200,214,229,0.6);font-size:13px;">知己足球俱乐部 · 书影推荐</p>
    <p style="margin:8px 0 0;color:rgba(0,255,200,0.4);font-size:12px;">⚽ 每周末与你相约</p>
  </section>

</div>`;
}

// ===== Markdown → HTML（简易转换） =====
function markdownToHTML(md) {
  let html = md;
  
  // 图片（保留）
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    return `<p style="text-align:center;margin:25px 0;"><img src="${src}" style="max-width:100%;border-radius:8px;border:1px solid rgba(0,255,200,0.15);box-shadow:0 4px 20px rgba(0,0,0,0.4);" /></p>`;
  });

  // 标题
  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size:16px;color:#00ffc8;margin:25px 0 12px;font-weight:700;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:18px;color:#00ffc8;margin:28px 0 14px;font-weight:700;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:20px;color:#ffffff;margin:32px 0 16px;font-weight:800;border-left:3px solid #00ffc8;padding-left:12px;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:24px;color:#ffffff;margin:20px 0;">$1</h1>');

  // 分隔线
  html = html.replace(/^---$/gm, '<hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,200,0.2),transparent);margin:30px 0;" />');

  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#ffffff;font-weight:700;">$1</strong>');

  // 斜体
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 代码
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,255,200,0.1);color:#00ffc8;padding:2px 6px;border-radius:3px;font-size:14px;">$1</code>');

  // 段落（把连续非空行包成 <p>）
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    // 跳过已经是 HTML 块的
    if (block.startsWith('<h') || block.startsWith('<p') || block.startsWith('<hr') || block.startsWith('<img')) return block;
    return `<p style="margin:12px 0;text-align:justify;">${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

// ===== 核心功能 =====
async function getAccessToken(appId, appSecret) {
  const url = `${API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) throw new Error(`获取Token失败: ${data.errmsg}`);
  return data.access_token;
}

async function uploadImage(accessToken, filePath) {
  const url = `${API_BASE}/media/uploadimg?access_token=${accessToken}`;
  const cmd = `curl -s -X POST -F "media=@${filePath}" "${url}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);
  if (data.errcode) throw new Error(`上传图片失败 (${path.basename(filePath)}): ${data.errmsg}`);
  console.log(`  ✅ 图片上传成功: ${path.basename(filePath)}`);
  return data.url;
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
  return data.media_id;
}

// ===== 主流程 =====
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('用法: node publish-article.js <markdown文件>');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`文件不存在: ${absPath}`);
    process.exit(1);
  }

  // 读取配置
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'wechat-config.json'), 'utf-8'));
  const account = config.accounts.zhiji;

  // 解析 markdown
  const { data, content } = matter(fs.readFileSync(absPath, 'utf-8'));
  const title = data.title || '未命名文章';
  const photos = data.photos || [];
  const summary = data.summary || '';
  const coverPath = photos[0] || null;

  console.log(`🚀 推送文章到草稿箱`);
  console.log(`   标题: ${title}`);
  console.log(`   图片: ${photos.length} 张`);

  // 获取 Token
  console.log('\n🔐 获取 Access Token...');
  const token = await getAccessToken(account.appId, account.appSecret);
  console.log('  ✅ Token 获取成功');

  // 上传 Logo
  console.log('\n🖼️  上传 Logo...');
  const logoPath = path.join(__dirname, '..', 'logo-200.png');
  const logoUrl = await uploadImage(token, logoPath);

  // 上传文中图片并替换路径
  let processedContent = content;
  console.log('\n🖼️  上传文中图片...');
  for (const photoPath of photos) {
    const absPhotoPath = photoPath.startsWith('/') ? photoPath : path.resolve(path.dirname(absPath), photoPath);
    if (fs.existsSync(absPhotoPath)) {
      const wechatUrl = await uploadImage(token, absPhotoPath);
      processedContent = processedContent.replace(new RegExp(photoPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), wechatUrl);
    } else {
      console.log(`  ⚠️  图片不存在，跳过: ${absPhotoPath}`);
    }
  }

  // 转换 HTML
  console.log('\n📝 转换 Markdown → HTML（科技风模板）...');
  const bodyHTML = markdownToHTML(processedContent);

  // 上传封面
  let coverMediaId = null;
  if (coverPath) {
    const absCoverPath = coverPath.startsWith('/') ? coverPath : path.resolve(path.dirname(absPath), coverPath);
    if (fs.existsSync(absCoverPath)) {
      console.log('\n🖼️  上传封面图...');
      const coverUrl = `${API_BASE}/material/add_material?access_token=${token}&type=image`;
      const cmd = `curl -s -X POST -F "media=@${absCoverPath}" "${coverUrl}"`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      const coverData = JSON.parse(output);
      if (!coverData.errcode) {
        coverMediaId = coverData.media_id;
        console.log('  ✅ 封面上传成功');
      }
    }
  }

  // 套模板
  const finalHTML = getSciFiTemplate(title, bodyHTML, logoUrl);

  // 创建草稿
  console.log('\n📦 创建草稿...');
  const draftArticle = {
    title,
    content: finalHTML,
    digest: summary,
    thumb_media_id: coverMediaId,
    author: '知己足球',
    content_source_url: '',
  };
  const draftId = await createDraft(token, draftArticle);

  console.log(`\n🎉 草稿创建成功！`);
  console.log(`   Draft ID: ${draftId}`);
  console.log(`   请到微信公众号后台 → 草稿箱 查看`);
}

main().catch(err => {
  console.error(`\n❌ 错误: ${err.message}`);
  process.exit(1);
});
