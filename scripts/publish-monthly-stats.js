#!/usr/bin/env node
/**
 * 将月度统计HTML发布到微信公众号草稿箱
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONFIG_FILE = path.join(__dirname, '../wechat-config.json');
const API_BASE = 'https://api.weixin.qq.com/cgi-bin';

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function uploadImage(accessToken, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileData, footer]);

    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/media/uploadimg?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.url) resolve(result.url);
        else reject(new Error(result.errmsg || 'Upload failed'));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function uploadThumb(accessToken, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileData, footer]);

    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.media_id) resolve(result.media_id);
        else reject(new Error(result.errmsg || 'Upload thumb failed'));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getAccessToken(appId, appSecret) {
  return new Promise((resolve, reject) => {
    https.get(`${API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.access_token) resolve(result.access_token);
        else reject(new Error(result.errmsg));
      });
    }).on('error', reject);
  });
}

function createDraft(accessToken, article) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ articles: [article] });
    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/draft/add?access_token=${accessToken}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.media_id) resolve(result.media_id);
        else reject(new Error(result.errmsg || 'Create draft failed'));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const htmlFile = args.find(a => !a.startsWith('-')) || 'output/monthly-stats-2026-03.html';
  const htmlPath = path.resolve(__dirname, '..', htmlFile);
  const accountName = 'zhiji';

  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ 文件不存在: ${htmlPath}`);
    process.exit(1);
  }

  const config = loadConfig();
  const account = config.accounts?.[accountName] || config;
  
  console.log('🔐 获取 Access Token...');
  const token = await getAccessToken(account.appId, account.appSecret);
  console.log('✅ Token 获取成功');

  // 上传Logo
  const logoPath = path.join(__dirname, '../logo-200.png');
  console.log('🖼️  上传 Logo...');
  const logoUrl = await uploadImage(token, logoPath);
  console.log(`✅ Logo: ${logoUrl}`);
  
  // 替换Logo占位
  let html = fs.readFileSync(htmlPath, 'utf-8');
  html = html.replace('LOGO_URL', logoUrl);
  
  // 生成月度封面
  const coverPath = path.join(__dirname, '../output/posters/monthly-cover-2026-03.png');
  if (fs.existsSync(coverPath)) {
    console.log('🖼️  上传AI封面...');
    thumbMediaId = await uploadThumb(token, coverPath);
    console.log(`✅ 封面: ${thumbMediaId}`);
  } else {
    // fallback to logo
    const thumbPath = path.join(__dirname, '../logo-200.png');
    console.log('🖼️  上传Logo封面...');
    thumbMediaId = await uploadThumb(token, thumbPath);
    console.log(`✅ 封面: ${thumbMediaId}`);
  }
  
  // 提取body内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;
  
  console.log('📝 创建草稿...');
  const mediaId = await createDraft(token, {
    title: '知己FC · 2026年3月赛事月报',
    author: '知己足球俱乐部',
    digest: '超仕12球荣膺金靴，德国小弟8球封神，4场知己内战精彩纷呈',
    content: content.trim(),
    thumb_media_id: thumbMediaId,
    need_open_comment: 0,
    only_fans_can_comment: 0,
  });

  console.log(`✅ 草稿创建成功! Media ID: ${mediaId}`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
